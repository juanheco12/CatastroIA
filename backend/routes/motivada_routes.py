from datetime import datetime
from pathlib import Path
import base64
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from database.db import get_db
from schemas.solicitud import SolicitudUnificada
from schemas.responses import MotivadaGeneradaResponse
from services import claude_service, history_service, soporte_service
from config import settings

router = APIRouter(prefix="/motivada", tags=["motivada"])

MAX_INFORME_SIZE = 50 * 1024 * 1024  # 50 MB
EXTENSIONES_INFORME = {"pdf", "docx", "txt"}


@router.post("/extraer-informe")
async def extraer_informe_tecnico(file: UploadFile = File(...)):
    """Extrae el texto de un informe técnico (PDF/DOCX/TXT) para que el usuario
    elija los párrafos que se incorporan a la motivada de cuarta clase. No se
    persiste en la base de datos: es un uso puntual, solo para esta solicitud."""
    if not file.filename or "." not in file.filename:
        raise HTTPException(status_code=400, detail="Nombre de archivo inválido")

    extension = file.filename.rsplit(".", 1)[-1].lower()
    if extension not in EXTENSIONES_INFORME:
        raise HTTPException(status_code=400, detail="Solo se aceptan archivos .pdf, .docx o .txt")

    file_bytes = await file.read()
    if len(file_bytes) > MAX_INFORME_SIZE:
        raise HTTPException(status_code=413, detail="El archivo supera el límite de 50 MB")

    try:
        texto = soporte_service.extraer_texto_archivo(file_bytes, file.filename)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"No se pudo extraer texto del documento: {exc}")

    if not texto.strip():
        raise HTTPException(status_code=400, detail="No se pudo extraer texto del documento")

    return {"texto": texto}


@router.post("/generar", response_model=MotivadaGeneradaResponse)
def generar_motivada(data: SolicitudUnificada, db: Session = Depends(get_db)):
    try:
        resultado = claude_service.generate_motivada(data, db)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    # Persist to history
    from models.motivada import HistorialMotivada, EstadoMotivada
    registro = HistorialMotivada(
        tipo_mutacion=data.tipo_mutacion,
        numero_expediente=data.numero_predial,
        numero_predio=data.numero_predial,
        propietario_nombre=data.nombre_propietario or data.nombre_solicitante or "SNR",
        propietario_documento=data.cedula_propietario or data.cedula_solicitante or "-",
        texto_motivada=resultado["texto_motivada"],
        datos_formulario=data.model_dump_json(),
        estado=EstadoMotivada.GENERADA,
    )
    db.add(registro)
    db.commit()

    return MotivadaGeneradaResponse(
        texto_motivada=resultado["texto_motivada"],
        numero_expediente=data.numero_predial,
        propietario=data.nombre_propietario or data.nombre_solicitante or "SNR",
        tipo_mutacion=f"{data.tipo_mutacion} / {data.tipo_origen}",
        tokens_usados=resultado.get("tokens_usados"),
        articulos_finales=resultado.get("articulos_finales"),
    )
