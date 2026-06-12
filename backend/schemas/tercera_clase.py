from datetime import date
from pydantic import BaseModel, Field
from typing import Optional


class PropietarioSchema(BaseModel):
    nombre_completo: str = Field(..., min_length=3, max_length=200)
    tipo_documento: str = Field(..., description="CC, NIT, CE, etc.")
    numero_documento: str = Field(..., min_length=4, max_length=20)
    direccion: Optional[str] = None
    telefono: Optional[str] = None


class ConstruccionSchema(BaseModel):
    direccion: str = Field(..., min_length=5)
    municipio: str = Field(..., min_length=2)
    departamento: str = Field(default="Antioquia")
    area_construida_m2: float = Field(..., gt=0, description="Área en metros cuadrados")
    descripcion: str = Field(..., min_length=10)
    anio_construccion: int = Field(..., ge=1900, le=2025)
    numero_pisos: int = Field(default=1, ge=1)
    materiales_predominantes: str = Field(..., min_length=5)
    uso_construccion: str = Field(default="Residencial")
    destino_economico: str = Field(default="Habitacional")


class SolicitanteSchema(BaseModel):
    nombre_completo: str
    tipo_documento: str
    numero_documento: str
    calidad: str = Field(
        default="Propietario",
        description="Propietario, Poseedor, Representante Legal, etc.",
    )


class TerceraClaseInput(BaseModel):
    numero_expediente: str = Field(..., min_length=3)
    numero_predio: str = Field(..., description="Código catastral IGAC")
    matricula_inmobiliaria: Optional[str] = None
    propietario: PropietarioSchema
    construccion: ConstruccionSchema
    solicitante: Optional[SolicitanteSchema] = None
    fecha_solicitud: date
    fecha_visita_tecnica: Optional[date] = None
    inspector_responsable: str = Field(..., min_length=3)
    cargo_inspector: str = Field(default="Profesional Catastral")
    documentos_presentados: list[str] = Field(
        default_factory=lambda: [
            "Formulario de solicitud",
            "Copia del documento de identidad",
        ]
    )
    observaciones_tecnicas: Optional[str] = None
    observaciones_adicionales: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "numero_expediente": "EXP-2024-00342",
                "numero_predio": "05001000200000010001000",
                "matricula_inmobiliaria": "001-123456",
                "propietario": {
                    "nombre_completo": "María Fernanda Gómez Restrepo",
                    "tipo_documento": "CC",
                    "numero_documento": "43512876",
                    "direccion": "Cra 45 # 32-10, Medellín",
                    "telefono": "3104567890",
                },
                "construccion": {
                    "direccion": "Cra 45 # 32-10",
                    "municipio": "Medellín",
                    "departamento": "Antioquia",
                    "area_construida_m2": 95.5,
                    "descripcion": "Vivienda de dos plantas en concreto y mampostería, con tres habitaciones, dos baños, sala-comedor, cocina y garaje.",
                    "anio_construccion": 2019,
                    "numero_pisos": 2,
                    "materiales_predominantes": "Concreto reforzado y mampostería de ladrillo",
                    "uso_construccion": "Residencial",
                    "destino_economico": "Habitacional",
                },
                "fecha_solicitud": "2024-03-15",
                "fecha_visita_tecnica": "2024-03-22",
                "inspector_responsable": "Carlos Andrés Mejía Zapata",
                "cargo_inspector": "Profesional Catastral",
                "documentos_presentados": [
                    "Formulario de solicitud",
                    "Copia cédula de ciudadanía",
                    "Escritura pública de compraventa",
                    "Plano de construcción aprobado",
                    "Licencia de construcción",
                ],
                "observaciones_tecnicas": "La construcción se encuentra en excelentes condiciones estructurales y cumple con los parámetros técnicos establecidos.",
            }
        }
