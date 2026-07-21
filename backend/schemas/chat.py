from pydantic import BaseModel
from typing import Optional, Literal


class MensajeChat(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class SolicitudChat(BaseModel):
    mensaje: str
    historial: list[MensajeChat] = []


class SugerenciaMotivada(BaseModel):
    tipo_mutacion: Literal["primera_clase", "tercera_clase", "rectificacion", "complementacion"]
    tipo_origen: Literal["propietario", "autorizado", "poder", "snr", "oficio"]


class RespuestaChat(BaseModel):
    respuesta: str
    tokens_usados: Optional[int] = None
    sugerencia: Optional[SugerenciaMotivada] = None
    parrafos_motivada: Optional[str] = None
