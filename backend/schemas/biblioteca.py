from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class CampoVariableResponse(BaseModel):
    id: int
    tipo_campo: str
    texto_original: str
    offset_inicio: int
    offset_fin: int
    tipo_identificacion: Optional[str] = None
    origen_deteccion: str
    confirmado: bool

    class Config:
        from_attributes = True


class PlantillaInfoResponse(BaseModel):
    id: int
    nombre_original: str
    categoria: Optional[str] = None
    categorias_candidatas: str
    estado: str
    motivo_revision_pendiente: Optional[str] = None
    tipo_tramite_manual: Optional[str] = None
    tamano_bytes: int
    contador_uso: int
    fecha_ultimo_uso: Optional[datetime] = None
    es_favorita: bool
    fecha_subida: datetime
    fecha_revision: Optional[datetime] = None
    revisado_por: Optional[str] = None

    class Config:
        from_attributes = True


class PlantillaDetalleResponse(PlantillaInfoResponse):
    contenido_texto: str
    campos: list[CampoVariableResponse]


class ItemIngestaResponse(BaseModel):
    nombre_original: str
    estado: str
    categoria: Optional[str] = None
    categorias_candidatas: list[str] = []
    motivo_revision_pendiente: Optional[str] = None
    plantilla_id: Optional[int] = None
    error: Optional[str] = None


class IngestaResumenResponse(BaseModel):
    total_archivos: int
    total_ingestados: int
    total_errores: int
    distribucion_categorias: dict[str, int]
    total_casos_atipicos: int
    items: list[ItemIngestaResponse]


class CampoManualInput(BaseModel):
    tipo_campo: str
    texto_original: str
    offset_inicio: int
    offset_fin: int
    tipo_identificacion: Optional[str] = None


class AprobarPlantillaRequest(BaseModel):
    categoria: Optional[str] = None
    tipo_tramite_manual: Optional[str] = None
    campos_confirmados_ids: list[int] = []
    campos_manuales: list[CampoManualInput] = []
    revisado_por: Optional[str] = None


class MarcarAtipicoRequest(BaseModel):
    motivo: str
    revisado_por: Optional[str] = None


class NuevaVersionResponse(BaseModel):
    plantilla_id: int
    numero_version_anterior: int
    estado: str
    mensaje: str


class ResultadoBusqueda(BaseModel):
    plantilla: PlantillaInfoResponse
    score: float
    razon: Optional[str] = None


class BusquedaSemanticaRequest(BaseModel):
    descripcion_caso: str
    categoria: Optional[str] = None


class BusquedaSemanticaResponse(BaseModel):
    encontrado: bool
    mejor: Optional[ResultadoBusqueda] = None
    alternativas: list[ResultadoBusqueda] = []
    mensaje: Optional[str] = None


class CampoReemplazadoPreview(BaseModel):
    campo_id: int
    tipo_campo: str
    valor_anterior: str
    valor_nuevo: str


class GenerarRequest(BaseModel):
    valores: dict[int, str]
    tipo_tramite_manual: Optional[str] = None
    aprobado: bool = False


class PreviewGeneracionResponse(BaseModel):
    texto_previsto: str
    campos_reemplazados: list[CampoReemplazadoPreview]
    fundamento_legal: Optional[str] = None
    parte_resolutiva: Optional[str] = None


class GenerarFinalResponse(BaseModel):
    filename: str
    content_base64: str
    size_bytes: int