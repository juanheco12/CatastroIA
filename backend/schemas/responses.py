from datetime import datetime
from pydantic import BaseModel
from typing import Optional


class MotivadaGeneradaResponse(BaseModel):
    texto_motivada: str
    numero_expediente: str
    propietario: str
    tipo_mutacion: str
    tokens_usados: Optional[int] = None


class ExportacionResponse(BaseModel):
    archivo_nombre: str
    archivo_url: str
    historial_id: int
    mensaje: str


class HistorialItemResponse(BaseModel):
    id: int
    fecha_creacion: datetime
    tipo_mutacion: str
    numero_expediente: str
    numero_predio: str
    propietario_nombre: str
    propietario_documento: str
    estado: str
    archivo_exportado: Optional[str] = None

    class Config:
        from_attributes = True


class HistorialDetalleResponse(HistorialItemResponse):
    texto_motivada: str
    datos_formulario: str  # JSON string

    class Config:
        from_attributes = True


class TemplateInfoResponse(BaseModel):
    nombre: str
    campos_detectados: list[str]
    tamano_bytes: int
    fecha_subida: Optional[str] = None
    existe: bool


class ErrorResponse(BaseModel):
    error: str
    detalle: Optional[str] = None
    codigo: Optional[str] = None
