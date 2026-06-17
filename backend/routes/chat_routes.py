from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.db import get_db
from schemas.chat import SolicitudChat, RespuestaChat
from services import chat_service

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/mensaje", response_model=RespuestaChat)
def chat_mensaje(data: SolicitudChat, db: Session = Depends(get_db)):
    try:
        return chat_service.respond(data, db)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
