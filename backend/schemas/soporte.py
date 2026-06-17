from datetime import datetime
from pydantic import BaseModel


class SoporteInfoResponse(BaseModel):
    id: int
    nombre_original: str
    tipo_archivo: str
    tamano_bytes: int
    longitud_texto: int
    fecha_subida: datetime
