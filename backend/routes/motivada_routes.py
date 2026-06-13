import base64
from datetime import datetime
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.db import get_db
from schemas.tercera_clase import TerceraClaseInput
from schemas.responses import MotivadaGeneradaResponse
from services import claude_service, docx_service, history_service
from config import settings

router = APIRouter(prefix="/motivada", tags=["motivada"])


@router.post("/generar", response_model=MotivadaGeneradaResponse)
def generar_motivada(data: TerceraClaseInput, db: Session = Depends(get_db)):
    try:
        resultado = claude_service.generate_motivada(data)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Error al conectar con Claude: {exc}")

    history_service.crear_registro(
        db=db,
        data=data,
        texto_motivada=resultado["texto_motivada"],
    )

    return MotivadaGeneradaResponse(
        texto_motivada=resultado["texto_motivada"],
        numero_expediente=data.numero_predial,
        propietario=data.nombre_propietario,
        tipo_mutacion="Tercera Clase - Incorporación de Construcción",
        tokens_usados=resultado.get("tokens_usados"),
    )


@router.post("/exportar-json")
def exportar_word_from_json(payload: dict, db: Session = Depends(get_db)):
    try:
        form_data = TerceraClaseInput(**payload["form_data"])
        texto_motivada = payload["texto_motivada"]
        docx_bytes = docx_service.generate_docx(form_data, texto_motivada)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Datos inválidos: {exc}")

    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    filename = f"motivada_{form_data.numero_predial}_{timestamp}.docx"
    export_path = Path(settings.exports_path) / filename
    export_path.write_bytes(docx_bytes)

    registros = history_service.listar_historial(db=db, buscar=form_data.numero_predial, limit=1)
    if registros:
        history_service.marcar_exportado(db, registros[0].id, filename)

    return {
        "filename": filename,
        "content_base64": base64.b64encode(docx_bytes).decode(),
        "size_bytes": len(docx_bytes),
    }
