from pydantic import BaseModel
from typing import Optional


class MensajeChat(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class SolicitudChat(BaseModel):
    mensaje: str
    historial: list[MensajeChat] = []


class RespuestaChat(BaseModel):
    respuesta: str
    tokens_usados: Optional[int] = None
