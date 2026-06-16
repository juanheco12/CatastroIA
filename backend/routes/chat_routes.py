from fastapi import APIRouter, HTTPException
from schemas.chat import SolicitudChat, RespuestaChat
from services import chat_service

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/mensaje", response_model=RespuestaChat)
def chat_mensaje(data: SolicitudChat):
    try:
        return chat_service.respond(data)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
