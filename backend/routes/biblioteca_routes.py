import base64

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from sqlalchemy.orm import Session

from database.db import get_db
from schemas.biblioteca import (
    PlantillaInfoResponse,
    PlantillaDetalleResponse,
    IngestaResumenResponse,
    ItemIngestaResponse,
    EliminarTodasResponse,
    AprobarPlantillaRequest,
    MarcarAtipicoRequest,
    NuevaVersionResponse,
    BusquedaSemanticaRequest,
    BusquedaSemanticaResponse,
    GenerarRequest,
    PreviewGeneracionResponse,
    GenerarFinalResponse,
)
from services import biblioteca_service as service
from services import biblioteca_busqueda as busqueda
from services import biblioteca_generacion as generacion

router = APIRouter(prefix="/biblioteca", tags=["biblioteca"])

MAX_ZIP_SIZE = 50 * 1024 * 1024  # 50 MB
MAX_DOCX_SIZE = 10 * 1024 * 1024  # 10 MB


def _manejar_value_error(exc: ValueError):
    raise HTTPException(status_code=400, detail=str(exc))


@router.post("/ingestar-zip", response_model=IngestaResumenResponse)
async def ingestar_zip(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Sube un .zip con motivadas .docx ya redactadas. Ninguna queda
    'activa' automaticamente: todas caen en pendiente_revision o
    caso_atipico hasta aprobacion humana explicita."""
    if not file.filename or not file.filename.lower().endswith(".zip"):
        raise HTTPException(status_code=400, detail="Solo se aceptan archivos .zip")

    file_bytes = await file.read()
    if len(file_bytes) > MAX_ZIP_SIZE:
        raise HTTPException(status_code=413, detail="El archivo supera el limite de 50 MB")

    try:
        return service.ingestar_zip(db, file_bytes)
    except ValueError as exc:
        _manejar_value_error(exc)


@router.post("/ingestar-docx", response_model=ItemIngestaResponse)
async def ingestar_docx(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Sube un unico .docx ya redactado para crear una nueva plantilla. Igual
    que un .zip de un solo archivo: nunca queda 'activa' automaticamente,
    cae en pendiente_revision o caso_atipico hasta aprobacion humana
    explicita."""
    if not file.filename or not file.filename.lower().endswith(".docx"):
        raise HTTPException(status_code=400, detail="Solo se aceptan archivos .docx")

    file_bytes = await file.read()
    if len(file_bytes) > MAX_DOCX_SIZE:
        raise HTTPException(status_code=413, detail="El archivo supera el limite de 10 MB")

    return service.ingestar_docx(db, file.filename, file_bytes)


@router.post("/{plantilla_id}/nueva-version", response_model=NuevaVersionResponse)
async def nueva_version(
    plantilla_id: int,
    file: UploadFile = File(...),
    motivo_cambio: str = Form(...),
    cambiado_por: str | None = Form(None),
    db: Session = Depends(get_db),
):
    """Versiona juridicamente una plantilla: archiva la version actual
    (nunca se borra) y la plantilla vuelve a pendiente_revision."""
    if not file.filename or not file.filename.lower().endswith(".docx"):
        raise HTTPException(status_code=400, detail="Solo se aceptan archivos .docx")

    file_bytes = await file.read()
    if len(file_bytes) > MAX_DOCX_SIZE:
        raise HTTPException(status_code=413, detail="El archivo supera el limite de 10 MB")

    try:
        return service.reemplazar_version(db, plantilla_id, file_bytes, motivo_cambio, cambiado_por)
    except ValueError as exc:
        _manejar_value_error(exc)


@router.get("/", response_model=list[PlantillaInfoResponse])
def listar_plantillas(
    categoria: str | None = None,
    estado: str | None = None,
    tipo_tramite: str | None = None,
    q: str | None = None,
    db: Session = Depends(get_db),
):
    return service.listar_plantillas(db, categoria=categoria, estado=estado, tipo_tramite=tipo_tramite, q=q)


@router.get("/pendientes-revision", response_model=list[PlantillaInfoResponse])
def pendientes_revision(db: Session = Depends(get_db)):
    return service.pendientes_revision(db)


@router.get("/mas-usadas", response_model=list[PlantillaInfoResponse])
def mas_usadas(limite: int = 10, db: Session = Depends(get_db)):
    return service.mas_usadas(db, limite=limite)


@router.get("/buscar", response_model=list[PlantillaInfoResponse])
def buscar_por_filtros(
    categoria: str | None = None,
    tipo_tramite: str | None = None,
    keyword: str | None = None,
    db: Session = Depends(get_db),
):
    return busqueda.buscar_por_filtros(db, categoria=categoria, tipo_tramite=tipo_tramite, keyword=keyword)


@router.post("/buscar-semantica", response_model=BusquedaSemanticaResponse)
def buscar_semantica(req: BusquedaSemanticaRequest, db: Session = Depends(get_db)):
    return busqueda.buscar_semantica(db, req.descripcion_caso, categoria=req.categoria)


@router.get("/{plantilla_id}", response_model=PlantillaDetalleResponse)
def obtener_detalle(plantilla_id: int, db: Session = Depends(get_db)):
    detalle = service.obtener_detalle(db, plantilla_id)
    if not detalle:
        raise HTTPException(status_code=404, detail="Plantilla no encontrada")
    return detalle


@router.get("/{plantilla_id}/descargar", response_model=GenerarFinalResponse)
def descargar_original(plantilla_id: int, db: Session = Depends(get_db)):
    """Devuelve el .docx original almacenado, sin ninguna sustitucion."""
    p = service.obtener_plantilla(db, plantilla_id)
    if not p:
        raise HTTPException(status_code=404, detail="Plantilla no encontrada")
    return GenerarFinalResponse(
        filename=p.nombre_original,
        content_base64=base64.b64encode(p.contenido_docx).decode("ascii"),
        size_bytes=p.tamano_bytes,
    )


@router.delete("/todas", response_model=EliminarTodasResponse)
def eliminar_todas(db: Session = Depends(get_db)):
    """Vacia la biblioteca completa de forma irreversible: borra TODAS las
    plantillas (pendientes, activas, atipicas y archivadas). Pensado para
    recuperarse de una ingestion duplicada o erronea y volver a subir desde
    cero."""
    return EliminarTodasResponse(eliminadas=service.eliminar_todas(db))


@router.delete("/{plantilla_id}")
def eliminar_plantilla(plantilla_id: int, db: Session = Depends(get_db)):
    eliminado = service.eliminar_plantilla(db, plantilla_id)
    if not eliminado:
        raise HTTPException(status_code=404, detail="Plantilla no encontrada")
    return {"mensaje": "Plantilla eliminada correctamente"}


@router.post("/{plantilla_id}/aprobar", response_model=PlantillaDetalleResponse)
def aprobar_plantilla(plantilla_id: int, req: AprobarPlantillaRequest, db: Session = Depends(get_db)):
    try:
        return service.aprobar_plantilla(db, plantilla_id, req)
    except ValueError as exc:
        _manejar_value_error(exc)


@router.post("/{plantilla_id}/marcar-atipico", response_model=PlantillaInfoResponse)
def marcar_atipico(plantilla_id: int, req: MarcarAtipicoRequest, db: Session = Depends(get_db)):
    try:
        return service.marcar_atipico(db, plantilla_id, req)
    except ValueError as exc:
        _manejar_value_error(exc)


@router.post("/{plantilla_id}/favorito", response_model=PlantillaInfoResponse)
def marcar_favorita(plantilla_id: int, favorita: bool = True, db: Session = Depends(get_db)):
    try:
        return service.marcar_favorita(db, plantilla_id, favorita)
    except ValueError as exc:
        _manejar_value_error(exc)


@router.post("/{plantilla_id}/preview-generacion", response_model=PreviewGeneracionResponse)
def preview_generacion(plantilla_id: int, req: GenerarRequest, db: Session = Depends(get_db)):
    try:
        return generacion.generar_preview(db, plantilla_id, req)
    except ValueError as exc:
        _manejar_value_error(exc)


@router.post("/{plantilla_id}/generar-final", response_model=GenerarFinalResponse)
def generar_final(plantilla_id: int, req: GenerarRequest, db: Session = Depends(get_db)):
    try:
        return generacion.generar_docx_final(db, plantilla_id, req)
    except ValueError as exc:
        _manejar_value_error(exc)