"""Orquestacion de la biblioteca de motivadas reutilizables: ingestion,
revision/aprobacion, versionado juridico, favoritos y registro de uso.

Modo estricto: este modulo nunca pasa el texto de una plantilla por un LLM
generativo. embed_texts() solo se usa para indexar/buscar por similitud — el
texto juridico en si nunca se reescribe ni se genera aqui.
"""
import io
import zipfile
from collections import Counter
from datetime import datetime

from sqlalchemy import select, delete, func
from sqlalchemy.orm import Session

from models.biblioteca import (
    PlantillaMotivada,
    VersionPlantillaMotivada,
    CampoVariablePlantilla,
    CategoriaMotivada,
    EstadoPlantilla,
)
from schemas.biblioteca import (
    PlantillaInfoResponse,
    PlantillaDetalleResponse,
    CampoVariableResponse,
    ItemIngestaResponse,
    IngestaResumenResponse,
    AprobarPlantillaRequest,
    MarcarAtipicoRequest,
    NuevaVersionResponse,
)
from services.biblioteca_clasificacion import clasificar_por_nombre
from services.biblioteca_extraccion import extraer_texto_plano
from services.biblioteca_deteccion_campos import detectar_campos
from services import ai_provider

MAX_CHARS_EMBED = 6000
RECORTE_EMBED = 3000
CATEGORIAS_VALIDAS = {c.value for c in CategoriaMotivada}


def _texto_para_embeddings(texto: str) -> str:
    """Los documentos reales son cortos (mediana ~2930 caracteres), asi que
    se embebe el documento completo. Para los pocos casos que excedan un
    limite seguro, se usa un recorte deterministico (inicio + fin) en vez de
    chunking real — limitacion aceptada documentada en el plan."""
    if len(texto) <= MAX_CHARS_EMBED:
        return texto
    return texto[:RECORTE_EMBED] + texto[-RECORTE_EMBED:]


def _intentar_embeber(texto: str) -> list[float] | None:
    try:
        return ai_provider.embed_texts([_texto_para_embeddings(texto)], task_type="retrieval_document")[0]
    except Exception:
        return None


def _guardar_campos_detectados(db: Session, plantilla_id: int, texto: str) -> None:
    for campo in detectar_campos(texto):
        db.add(CampoVariablePlantilla(
            plantilla_id=plantilla_id,
            tipo_campo=campo.tipo_campo,
            texto_original=campo.texto_original,
            offset_inicio=campo.offset_inicio,
            offset_fin=campo.offset_fin,
            tipo_identificacion=campo.tipo_identificacion,
            origen_deteccion="regex",
            confirmado=False,
        ))


def _a_info_response(p: PlantillaMotivada) -> PlantillaInfoResponse:
    return PlantillaInfoResponse.model_validate(p)


def _campos_de(db: Session, plantilla_id: int) -> list[CampoVariablePlantilla]:
    return list(db.scalars(
        select(CampoVariablePlantilla)
        .where(CampoVariablePlantilla.plantilla_id == plantilla_id)
        .order_by(CampoVariablePlantilla.offset_inicio)
    ).all())


def _a_detalle_response(db: Session, p: PlantillaMotivada) -> PlantillaDetalleResponse:
    campos = _campos_de(db, p.id)
    return PlantillaDetalleResponse(
        **_a_info_response(p).model_dump(),
        contenido_texto=p.contenido_texto,
        campos=[CampoVariableResponse.model_validate(c) for c in campos],
    )


DUPLICADO_MSG = "Ya existe una plantilla con este nombre en la biblioteca — se omitió para evitar duplicados"


def _nombres_existentes(db: Session) -> set[str]:
    return {n.lower() for n in db.scalars(select(PlantillaMotivada.nombre_original)).all()}


def _clasificar_y_construir(nombre_original: str, file_bytes: bytes) -> tuple[PlantillaMotivada, str] | None:
    """Fase sin red: extrae texto y clasifica. Devuelve la plantilla (sin
    embedding todavia) junto con el texto a embeber, o None si no se pudo
    extraer texto."""
    texto = extraer_texto_plano(file_bytes)
    if not texto.strip():
        return None

    categorias, motivo = clasificar_por_nombre(nombre_original)
    if len(categorias) == 1 and motivo is None:
        categoria = categorias[0].value
        estado = EstadoPlantilla.PENDIENTE_REVISION.value
    else:
        categoria = None
        estado = EstadoPlantilla.CASO_ATIPICO.value

    plantilla = PlantillaMotivada(
        nombre_original=nombre_original,
        categoria=categoria,
        categorias_candidatas=",".join(c.value for c in categorias),
        estado=estado,
        motivo_revision_pendiente=motivo,
        contenido_docx=file_bytes,
        tamano_bytes=len(file_bytes),
        contenido_texto=texto,
    )
    return plantilla, texto


def _guardar_plantilla(db: Session, plantilla: PlantillaMotivada) -> ItemIngestaResponse:
    db.add(plantilla)
    db.commit()
    db.refresh(plantilla)
    _guardar_campos_detectados(db, plantilla.id, plantilla.contenido_texto)
    db.commit()
    return ItemIngestaResponse(
        nombre_original=plantilla.nombre_original,
        estado=plantilla.estado,
        categoria=plantilla.categoria,
        categorias_candidatas=plantilla.categorias_candidatas.split(",") if plantilla.categorias_candidatas else [],
        motivo_revision_pendiente=plantilla.motivo_revision_pendiente,
        plantilla_id=plantilla.id,
    )


def ingestar_docx(db: Session, nombre_original: str, file_bytes: bytes) -> ItemIngestaResponse:
    """Ingesta un .docx suelto como una nueva plantilla (igual que un .zip de
    un solo archivo): nunca queda 'activa', cae en pendiente_revision o
    caso_atipico hasta aprobacion humana explicita."""
    if nombre_original.lower() in _nombres_existentes(db):
        return ItemIngestaResponse(nombre_original=nombre_original, estado="error", error=DUPLICADO_MSG)

    construido = _clasificar_y_construir(nombre_original, file_bytes)
    if construido is None:
        return ItemIngestaResponse(
            nombre_original=nombre_original, estado="error",
            error="No se pudo extraer texto del documento",
        )
    plantilla, texto = construido
    plantilla.embedding = _intentar_embeber(texto)
    return _guardar_plantilla(db, plantilla)


def ingestar_zip(db: Session, zip_bytes: bytes) -> IngestaResumenResponse:
    """Nunca crea plantillas en estado 'activa': todo cae en
    pendiente_revision o caso_atipico hasta aprobacion humana explicita.

    Los embeddings de todos los documentos del .zip se piden en un solo lote
    (batch) en vez de uno por archivo: con cientos de documentos reales, una
    llamada de red por archivo a la API de embeddings de Gemini puede tardar
    varios minutos en total. ai_provider.embed_texts() ya pagina
    internamente por encima del limite de la API, asi que un .zip grande
    termina haciendo unas pocas llamadas en vez de cientos. El costo de este
    atajo: si el lote completo falla (p.ej. API caida), ninguno de esos
    documentos queda con embedding — pero la ingestion y revision humana
    siguen funcionando igual, solo no apareceran en busqueda semantica hasta
    reintentar."""
    try:
        zf = zipfile.ZipFile(io.BytesIO(zip_bytes))
    except zipfile.BadZipFile:
        raise ValueError("El archivo no es un .zip valido")

    nombres = [
        n for n in zf.namelist()
        if n.lower().endswith(".docx") and not n.startswith("__MACOSX") and "/." not in n
    ]

    plantillas: list[PlantillaMotivada | None] = [None] * len(nombres)
    errores: dict[int, str] = {}
    textos_para_embeber: list[str] = []
    indices_con_texto: list[int] = []
    nombres_vistos = _nombres_existentes(db)

    for idx, nombre_en_zip in enumerate(nombres):
        nombre_original = nombre_en_zip.rsplit("/", 1)[-1]
        if nombre_original.lower() in nombres_vistos:
            errores[idx] = DUPLICADO_MSG
            continue
        try:
            file_bytes = zf.read(nombre_en_zip)
            construido = _clasificar_y_construir(nombre_original, file_bytes)
            if construido is None:
                errores[idx] = "No se pudo extraer texto del documento"
                continue
            plantilla, texto = construido
            plantillas[idx] = plantilla
            indices_con_texto.append(idx)
            textos_para_embeber.append(_texto_para_embeddings(texto))
            nombres_vistos.add(nombre_original.lower())
        except Exception as exc:
            errores[idx] = str(exc)

    if textos_para_embeber:
        try:
            embeddings = ai_provider.embed_texts(textos_para_embeber, task_type="retrieval_document")
            for idx, embedding in zip(indices_con_texto, embeddings):
                plantillas[idx].embedding = embedding
        except Exception:
            pass

    items: list[ItemIngestaResponse] = []
    for idx, nombre_en_zip in enumerate(nombres):
        nombre_original = nombre_en_zip.rsplit("/", 1)[-1]
        if idx in errores:
            items.append(ItemIngestaResponse(nombre_original=nombre_original, estado="error", error=errores[idx]))
            continue
        try:
            items.append(_guardar_plantilla(db, plantillas[idx]))
        except Exception as exc:
            db.rollback()
            items.append(ItemIngestaResponse(nombre_original=nombre_original, estado="error", error=str(exc)))

    distribucion = Counter(i.categoria for i in items if i.categoria)
    return IngestaResumenResponse(
        total_archivos=len(nombres),
        total_ingestados=sum(1 for i in items if i.estado != "error"),
        total_errores=sum(1 for i in items if i.estado == "error"),
        distribucion_categorias=dict(distribucion),
        total_casos_atipicos=sum(1 for i in items if i.estado == EstadoPlantilla.CASO_ATIPICO.value),
        items=items,
    )


def listar_plantillas(
    db: Session,
    categoria: str | None = None,
    estado: str | None = None,
    tipo_tramite: str | None = None,
    q: str | None = None,
) -> list[PlantillaInfoResponse]:
    stmt = select(PlantillaMotivada)
    if categoria:
        stmt = stmt.where(PlantillaMotivada.categoria == categoria)
    if estado:
        stmt = stmt.where(PlantillaMotivada.estado == estado)
    if tipo_tramite:
        stmt = stmt.where(PlantillaMotivada.tipo_tramite_manual == tipo_tramite)
    if q:
        patron = f"%{q.lower()}%"
        from sqlalchemy import func, or_
        stmt = stmt.where(or_(
            func.lower(PlantillaMotivada.nombre_original).like(patron),
            func.lower(PlantillaMotivada.contenido_texto).like(patron),
        ))
    stmt = stmt.order_by(PlantillaMotivada.fecha_subida.desc())
    return [_a_info_response(p) for p in db.scalars(stmt).all()]


def pendientes_revision(db: Session) -> list[PlantillaInfoResponse]:
    stmt = select(PlantillaMotivada).where(
        PlantillaMotivada.estado.in_([EstadoPlantilla.PENDIENTE_REVISION.value, EstadoPlantilla.CASO_ATIPICO.value])
    ).order_by(PlantillaMotivada.fecha_subida.asc())
    return [_a_info_response(p) for p in db.scalars(stmt).all()]


def obtener_plantilla(db: Session, plantilla_id: int) -> PlantillaMotivada | None:
    return db.get(PlantillaMotivada, plantilla_id)


def obtener_detalle(db: Session, plantilla_id: int) -> PlantillaDetalleResponse | None:
    p = obtener_plantilla(db, plantilla_id)
    if not p:
        return None
    return _a_detalle_response(db, p)


def eliminar_plantilla(db: Session, plantilla_id: int) -> bool:
    p = obtener_plantilla(db, plantilla_id)
    if not p:
        return False
    db.delete(p)
    db.commit()
    return True


def eliminar_todas(db: Session) -> int:
    """Vacia la biblioteca completa: borra campos y versiones primero en vez
    de depender del ON DELETE CASCADE de la FK, para no fallar si esa
    constraint no esta activa en la base en uso. Pensado para recuperarse de
    una ingestion duplicada o erronea y volver a subir desde cero."""
    cantidad = db.scalar(select(func.count()).select_from(PlantillaMotivada)) or 0
    db.execute(delete(CampoVariablePlantilla))
    db.execute(delete(VersionPlantillaMotivada))
    db.execute(delete(PlantillaMotivada))
    db.commit()
    return cantidad


def reemplazar_version(
    db: Session, plantilla_id: int, nuevo_docx_bytes: bytes, motivo_cambio: str, cambiado_por: str | None = None
) -> NuevaVersionResponse:
    p = obtener_plantilla(db, plantilla_id)
    if not p:
        raise ValueError("Plantilla no encontrada")
    if not motivo_cambio or not motivo_cambio.strip():
        raise ValueError("motivo_cambio es obligatorio para versionar una plantilla")

    nuevo_texto = extraer_texto_plano(nuevo_docx_bytes)
    if not nuevo_texto.strip():
        raise ValueError("No se pudo extraer texto del nuevo documento")

    total_versiones_previas = len(list(db.scalars(
        select(VersionPlantillaMotivada).where(VersionPlantillaMotivada.plantilla_id == plantilla_id)
    ).all()))
    numero_version = total_versiones_previas + 1

    db.add(VersionPlantillaMotivada(
        plantilla_id=plantilla_id,
        numero_version=numero_version,
        contenido_docx_anterior=p.contenido_docx,
        contenido_texto_anterior=p.contenido_texto,
        motivo_cambio=motivo_cambio,
        cambiado_por=cambiado_por,
    ))

    # Los offsets de los campos viejos ya no son validos sobre el texto
    # nuevo: se descartan y se vuelve a detectar desde cero (sugerencias,
    # nunca aplicadas sin nueva revision humana).
    for campo in _campos_de(db, plantilla_id):
        db.delete(campo)

    p.contenido_docx = nuevo_docx_bytes
    p.contenido_texto = nuevo_texto
    p.tamano_bytes = len(nuevo_docx_bytes)
    p.embedding = _intentar_embeber(nuevo_texto)
    p.estado = EstadoPlantilla.PENDIENTE_REVISION.value
    p.motivo_revision_pendiente = f"nueva_version: {motivo_cambio}"
    p.fecha_revision = None
    p.revisado_por = None
    db.commit()

    _guardar_campos_detectados(db, plantilla_id, nuevo_texto)
    db.commit()

    return NuevaVersionResponse(
        plantilla_id=plantilla_id,
        numero_version_anterior=numero_version - 1,
        estado=p.estado,
        mensaje="Version anterior archivada. La plantilla vuelve a pendiente_revision.",
    )


def _validar_rango_parrafo(texto: str, ini: int, fin: int) -> None:
    if ini < 0 or fin > len(texto) or ini >= fin:
        raise ValueError(f"Rango de campo invalido: [{ini}, {fin})")
    if "\n" in texto[ini:fin]:
        raise ValueError(
            f"El campo en [{ini}, {fin}) cruza un salto de parrafo — no se puede sustituir de forma segura"
        )


def aprobar_plantilla(db: Session, plantilla_id: int, req: AprobarPlantillaRequest) -> PlantillaDetalleResponse:
    p = obtener_plantilla(db, plantilla_id)
    if not p:
        raise ValueError("Plantilla no encontrada")

    if req.categoria:
        if req.categoria not in CATEGORIAS_VALIDAS:
            raise ValueError(f"Categoria invalida: {req.categoria}")
        p.categoria = req.categoria

    if not p.categoria:
        raise ValueError("No se puede aprobar una plantilla sin categoria asignada")

    campos_existentes = {c.id: c for c in _campos_de(db, plantilla_id)}
    for campo_id in req.campos_confirmados_ids:
        campo = campos_existentes.get(campo_id)
        if not campo:
            raise ValueError(f"Campo {campo_id} no pertenece a esta plantilla")
        _validar_rango_parrafo(p.contenido_texto, campo.offset_inicio, campo.offset_fin)
        campo.confirmado = True

    for manual in req.campos_manuales:
        _validar_rango_parrafo(p.contenido_texto, manual.offset_inicio, manual.offset_fin)
        db.add(CampoVariablePlantilla(
            plantilla_id=plantilla_id,
            tipo_campo=manual.tipo_campo,
            texto_original=manual.texto_original,
            offset_inicio=manual.offset_inicio,
            offset_fin=manual.offset_fin,
            tipo_identificacion=manual.tipo_identificacion,
            origen_deteccion="manual",
            confirmado=True,
        ))

    if req.tipo_tramite_manual:
        p.tipo_tramite_manual = req.tipo_tramite_manual

    p.estado = EstadoPlantilla.ACTIVA.value
    p.motivo_revision_pendiente = None
    p.fecha_revision = datetime.utcnow()
    p.revisado_por = req.revisado_por
    db.commit()
    db.refresh(p)

    return _a_detalle_response(db, p)


def marcar_atipico(db: Session, plantilla_id: int, req: MarcarAtipicoRequest) -> PlantillaInfoResponse:
    p = obtener_plantilla(db, plantilla_id)
    if not p:
        raise ValueError("Plantilla no encontrada")
    p.estado = EstadoPlantilla.CASO_ATIPICO.value
    p.motivo_revision_pendiente = req.motivo
    p.fecha_revision = datetime.utcnow()
    p.revisado_por = req.revisado_por
    db.commit()
    return _a_info_response(p)


def marcar_favorita(db: Session, plantilla_id: int, favorita: bool) -> PlantillaInfoResponse:
    p = obtener_plantilla(db, plantilla_id)
    if not p:
        raise ValueError("Plantilla no encontrada")
    p.es_favorita = favorita
    db.commit()
    return _a_info_response(p)


def registrar_uso(db: Session, plantilla_id: int) -> None:
    p = obtener_plantilla(db, plantilla_id)
    if not p:
        raise ValueError("Plantilla no encontrada")
    p.contador_uso += 1
    p.fecha_ultimo_uso = datetime.utcnow()
    db.commit()


def mas_usadas(db: Session, limite: int = 10) -> list[PlantillaInfoResponse]:
    stmt = (
        select(PlantillaMotivada)
        .where(PlantillaMotivada.estado == EstadoPlantilla.ACTIVA.value)
        .order_by(PlantillaMotivada.contador_uso.desc())
        .limit(limite)
    )
    return [_a_info_response(p) for p in db.scalars(stmt).all()]