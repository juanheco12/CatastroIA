from pydantic import BaseModel, Field
from typing import Optional


class TerceraClaseInput(BaseModel):
    nombre_propietario: str = Field(..., min_length=3)
    cedula: str = Field(..., min_length=4)
    numero_predial: str = Field(..., min_length=5)
    folio_matricula: str = Field(..., min_length=3)
    area_construida_m2: float = Field(..., gt=0)
    area_terreno_m2: float = Field(..., gt=0)
    documentos_aportados: list[str] = Field(
        default_factory=lambda: [
            "Formulario de solicitud",
            "Copia del documento de identidad",
        ]
    )

    class Config:
        json_schema_extra = {
            "example": {
                "nombre_propietario": "María Fernanda Gómez Restrepo",
                "cedula": "43512876",
                "numero_predial": "05001000200000010001000",
                "folio_matricula": "001-123456",
                "area_construida_m2": 95.5,
                "area_terreno_m2": 120.0,
                "documentos_aportados": [
                    "Formulario de solicitud",
                    "Copia cédula de ciudadanía",
                    "Escritura pública",
                    "Licencia de construcción",
                ],
            }
        }
