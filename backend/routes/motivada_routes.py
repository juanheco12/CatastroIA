import json
from pathlib import Path
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from database.db import get_db
from schemas.tercera_clase import TerceraClaseInput
from schemas.responses import MotivadaGeneradaResponse, ExportacionResponse
from services import claude_service, docx_service, history_service
from config import settings

router = APIRouter(prefix="/motivada", tags=["motivada"])


@router.post("/generar", response_model=MotivadaGeneradaResponse)
def generar_motivada(data: TerceraClaseInput, db: Session = Depends(get_db)):
    """Sends form data to Claude Sonnet and returns a generated motivada."""
    try:
        resultado = claude_service.generate_motivada(data)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Error al conectar con Claude: {exc}",
        )

    history_service.crear_registro(
        db=db,
        data=data,
        texto_motivada=resultado["texto_motivada"],
    )

    return MotivadaGeneradaResponse(
        texto_motivada=resultado["texto_motivada"],
        numero_expediente=data.numero_expediente,
        propietario=data.propietario.nombre_completo,
        tipo_mutacion="Tercera Clase - Incorporación de Construcción",
        tokens_usados=resultado.get("tokens_usados"),
    )


@router.post("/exportar", response_class=FileResponse)
def exportar_word(
    data: TerceraClaseInput,
    texto_motivada: str,
    db: Session = Depends(get_db),
):
    """Generates a .docx file from form data + motivada text and returns it."""
    try:
        docx_bytes = docx_service.generate_docx(data, texto_motivada)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Error al generar Word: {exc}")

    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    filename = f"motivada_{data.numero_expediente}_{timestamp}.docx"
    export_path = Path(settings.exports_path) / filename
    export_path.write_bytes(docx_bytes)

    # Update history record if it exists
    registros = history_service.listar_historial(db=db, buscar=data.numero_expediente, limit=1)
    if registros:
        history_service.marcar_exportado(db, registros[0].id, filename)

    return FileResponse(
        path=str(export_path),
        filename=filename,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    )


@router.post("/exportar-json")
def exportar_word_from_json(payload: dict, db: Session = Depends(get_db)):
    """
    Accepts { form_data: {...}, texto_motivada: '...' } and returns the .docx
    as a base64-encoded response so the browser can trigger download directly.
    """
    import base64

    try:
        form_data = TerceraClaseInput(**payload["form_data"])
        texto_motivada = payload["texto_motivada"]
        docx_bytes = docx_service.generate_docx(form_data, texto_motivada)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Datos inválidos: {exc}")

    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    filename = f"motivada_{form_data.numero_expediente}_{timestamp}.docx"
    export_path = Path(settings.exports_path) / filename
    export_path.write_bytes(docx_bytes)

    # Update history
    registros = history_service.listar_historial(db=db, buscar=form_data.numero_expediente, limit=1)
    if registros:
        history_service.marcar_exportado(db, registros[0].id, filename)

    return {
        "filename": filename,
        "content_base64": base64.b64encode(docx_bytes).decode(),
        "size_bytes": len(docx_bytes),
    }
