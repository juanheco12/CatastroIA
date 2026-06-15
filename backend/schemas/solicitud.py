from pydantic import BaseModel, Field
from typing import Optional, Literal


TipoMutacion  = Literal["primera_clase", "tercera_clase"]
TipoOrigen    = Literal["propietario", "autorizado", "poder", "snr"]


class SolicitudUnificada(BaseModel):
    # ── Selección de flujo ───────────────────────────────────────
    tipo_mutacion:   TipoMutacion
    tipo_origen:     TipoOrigen

    # ── Campos comunes ───────────────────────────────────────────
    numero_predial:       str = Field(..., min_length=4)
    folio_matricula:      str = Field(..., min_length=3)
    documentos_aportados: list[str] = Field(default_factory=list)
    municipio:            Optional[str] = None  # auto-detectado si no se provee

    # ── Propietario (todos excepto SNR puro) ─────────────────────
    nombre_propietario: Optional[str] = None
    cedula_propietario: Optional[str] = None

    # ── Solicitante (autorizado / apoderado) ─────────────────────
    nombre_solicitante:    Optional[str] = None
    tipo_doc_solicitante:  Optional[str] = None   # CC, NIT, CE…
    cedula_solicitante:    Optional[str] = None
    tp_solicitante:        Optional[str] = None   # Tarjeta Profesional (poder)

    # ── SNR ──────────────────────────────────────────────────────
    numero_radicado: Optional[str] = None

    # ── Tercera Clase ────────────────────────────────────────────
    area_construida_m2: Optional[float] = None
    area_terreno_m2:    Optional[float] = None
