from datetime import datetime
from pathlib import Path
import base64
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.db import get_db
from schemas.solicitud import SolicitudUnificada
from schemas.responses import MotivadaGeneradaResponse
from services import claude_service, history_service
from config import settings

router = APIRouter(prefix="/motivada", tags=["motivada"])


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
