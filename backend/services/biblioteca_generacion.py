"""Motor de sustitucion de campos variables a nivel de `run`, preservando
el formato del .docx original. Preview y generacion final comparten la
misma resolucion de campos confirmados; ningun paso de este modulo pasa el
texto por un LLM generativo (modo estricto) — solo sustituye, en bytes
originales, los valores que un humano confirmo en la revision."""
import base64
import io
import re
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from models.biblioteca import CampoVariablePlantilla, EstadoPlantilla
from schemas.biblioteca import (
    GenerarRequest,
    PreviewGeneracionResponse,
    CampoReemplazadoPreview,
    GenerarFinalResponse,
)
from services.biblioteca_extraccion import extraer_texto_plano, extraer_parrafos_con_runs, PARRAFO_SEPARATOR
from services.biblioteca_service import obtener_plantilla, registrar_uso

# Ancla heuristica para separar fundamento legal de parte resolutiva. Solo
# detecta el patron en ~46% de los documentos reales (no existe un
# encabezado literal "RESUELVE") — si no se encuentra, ambos campos quedan
# en None pero el texto completo previsto siempre se devuelve igual.
PAT_INICIO_PARTE_RESOLUTIVA = re.compile(r"art[ií]culo\s+primero|\b1[°º]\b", re.IGNORECASE)


def _campos_confirmados_por_id(db: Session, plantilla_id: int) -> dict[int, CampoVariablePlantilla]:
    campos = db.scalars(
        select(CampoVariablePlantilla).where(
            CampoVariablePlantilla.plantilla_id == plantilla_id,
            CampoVariablePlantilla.confirmado.is_(True),
        )
    ).all()
    return {c.id: c for c in campos}


def _resolver_campos_a_aplicar(
    db: Session, plantilla_id: int, valores: dict[int, str]
) -> list[tuple[CampoVariablePlantilla, str]]:
    disponibles = _campos_confirmados_por_id(db, plantilla_id)
    resueltos = []
    for campo_id, valor_nuevo in valores.items():
        campo = disponibles.get(campo_id)
        if not campo:
            raise ValueError(
                f"El campo {campo_id} no existe, no pertenece a esta plantilla o no esta confirmado"
            )
        resueltos.append((campo, valor_nuevo))
    resueltos.sort(key=lambda t: t[0].offset_inicio)
    return resueltos


def _dividir_fundamento_y_resolutiva(texto: str) -> tuple[str | None, str | None]:
    m = PAT_INICIO_PARTE_RESOLUTIVA.search(texto)
    if not m:
        return None, None
    return texto[: m.start()], texto[m.start():]


def generar_preview(db: Session, plantilla_id: int, req: GenerarRequest) -> PreviewGeneracionResponse:
    """Aplica los reemplazos sobre una copia en memoria del texto plano —
    no toca el .docx ni la base de datos."""
    p = obtener_plantilla(db, plantilla_id)
    if not p:
        raise ValueError("Plantilla no encontrada")
    if p.estado != EstadoPlantilla.ACTIVA.value:
        raise ValueError("Solo se puede generar a partir de una plantilla activa")

    campos_a_aplicar = _resolver_campos_a_aplicar(db, plantilla_id, req.valores)

    texto = p.contenido_texto
    reemplazados = []
    for campo, valor_nuevo in sorted(campos_a_aplicar, key=lambda t: t[0].offset_inicio, reverse=True):
        texto = texto[: campo.offset_inicio] + valor_nuevo + texto[campo.offset_fin:]
        reemplazados.append(CampoReemplazadoPreview(
            campo_id=campo.id, tipo_campo=campo.tipo_campo,
            valor_anterior=campo.texto_original, valor_nuevo=valor_nuevo,
        ))
    reemplazados.reverse()  # devolver en orden de aparicion en el documento

    fundamento_legal, parte_resolutiva = _dividir_fundamento_y_resolutiva(texto)
    return PreviewGeneracionResponse(
        texto_previsto=texto,
        campos_reemplazados=reemplazados,
        fundamento_legal=fundamento_legal,
        parte_resolutiva=parte_resolutiva,
    )


def _rangos_de_parrafos(parrafos) -> list[tuple[int, int]]:
    """Mismo orden y mismo separador que extraer_texto_plano(): el rango
    global de cada parrafo debe coincidir exactamente con los offsets ya
    guardados en CampoVariablePlantilla."""
    rangos = []
    cursor = 0
    for parrafo in parrafos:
        inicio = cursor
        fin = inicio + len(parrafo.text)
        rangos.append((inicio, fin))
        cursor = fin + len(PARRAFO_SEPARATOR)
    return rangos


def _localizar_parrafo(rangos: list[tuple[int, int]], ini: int, fin: int) -> int:
    for idx, (r_ini, r_fin) in enumerate(rangos):
        if r_ini <= ini and fin <= r_fin:
            return idx
    raise ValueError(
        f"El campo en [{ini}, {fin}) no cae dentro de ningun parrafo del documento actual "
        "— la plantilla pudo haber cambiado desde la ultima revision"
    )


def _reemplazar_en_parrafo(paragraph, ini_local: int, fin_local: int, valor_nuevo: str) -> None:
    runs = paragraph.runs
    longitud_runs = sum(len(r.text) for r in runs)
    if longitud_runs != len(paragraph.text):
        # Contenido fuera de <w:r> directos (p. ej. un hyperlink) que el
        # mapeo de runs no puede ubicar de forma fiable — no se detecto en
        # ninguno de los 69 documentos reales, pero se rechaza explicitamente
        # en vez de arriesgar una sustitucion en la posicion equivocada.
        raise ValueError(
            "El parrafo contiene contenido (p. ej. un hyperlink) que no se puede mapear "
            "de forma segura a nivel de run — no se realizo ninguna sustitucion"
        )

    cursor = 0
    afectados = []
    for idx, run in enumerate(runs):
        run_ini, run_fin = cursor, cursor + len(run.text)
        cursor = run_fin
        inter_ini, inter_fin = max(ini_local, run_ini), min(fin_local, run_fin)
        if inter_ini < inter_fin:
            afectados.append((idx, run_ini, run_fin))

    if not afectados:
        raise ValueError(
            f"No se encontro ningun run que cubra el rango [{ini_local}, {fin_local}) "
            "— la plantilla pudo haber cambiado desde la ultima revision"
        )

    primero_idx, primero_ini, _ = afectados[0]
    ultimo_idx, ultimo_ini, ultimo_fin = afectados[-1]

    run_primero = runs[primero_idx]
    run_ultimo = runs[ultimo_idx]
    prefijo = run_primero.text[: ini_local - primero_ini]
    sufijo = run_ultimo.text[fin_local - ultimo_ini:]

    if primero_idx == ultimo_idx:
        run_primero.text = prefijo + valor_nuevo + sufijo
    else:
        # El valor nuevo hereda el formato del primer run/fragmento
        # (limitacion documentada); los runs intermedios se vacian.
        run_primero.text = prefijo + valor_nuevo
        for idx in range(primero_idx + 1, ultimo_idx):
            runs[idx].text = ""
        run_ultimo.text = sufijo


def generar_docx_final(db: Session, plantilla_id: int, req: GenerarRequest) -> GenerarFinalResponse:
    if not req.aprobado:
        raise ValueError("La generacion final requiere aprobado=true explicito")

    p = obtener_plantilla(db, plantilla_id)
    if not p:
        raise ValueError("Plantilla no encontrada")
    if p.estado != EstadoPlantilla.ACTIVA.value:
        raise ValueError("Solo se puede generar a partir de una plantilla activa")

    texto_actual = extraer_texto_plano(p.contenido_docx)
    if texto_actual != p.contenido_texto:
        raise ValueError(
            "El contenido de la plantilla no coincide con la ultima revision registrada "
            "— vuelve a revisarla (sube una 'nueva version') antes de generar"
        )

    campos_a_aplicar = _resolver_campos_a_aplicar(db, plantilla_id, req.valores)

    doc, parrafos = extraer_parrafos_con_runs(p.contenido_docx)
    rangos = _rangos_de_parrafos(parrafos)

    for campo, valor_nuevo in sorted(campos_a_aplicar, key=lambda t: t[0].offset_inicio, reverse=True):
        idx_parrafo = _localizar_parrafo(rangos, campo.offset_inicio, campo.offset_fin)
        r_ini, _ = rangos[idx_parrafo]
        _reemplazar_en_parrafo(
            parrafos[idx_parrafo],
            campo.offset_inicio - r_ini,
            campo.offset_fin - r_ini,
            valor_nuevo,
        )

    if req.tipo_tramite_manual:
        p.tipo_tramite_manual = req.tipo_tramite_manual

    buffer = io.BytesIO()
    doc.save(buffer)
    docx_bytes = buffer.getvalue()

    registrar_uso(db, plantilla_id)  # incluye el commit de tipo_tramite_manual, si se asigno arriba

    nombre_base = p.nombre_original.rsplit(".", 1)[0]
    filename = f"{nombre_base}_generado_{datetime.utcnow():%Y%m%d%H%M%S}.docx"
    return GenerarFinalResponse(
        filename=filename,
        content_base64=base64.b64encode(docx_bytes).decode("ascii"),
        size_bytes=len(docx_bytes),
    )