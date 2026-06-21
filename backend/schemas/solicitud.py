from pydantic import BaseModel, Field
from typing import Optional, Literal


TipoMutacion  = Literal["primera_clase", "segunda_clase", "tercera_clase", "cuarta_clase", "quinta_clase", "rectificacion", "complementacion", "cancelacion"]
TipoOrigen    = Literal["propietario", "autorizado", "poder", "snr", "oficio"]


class SolicitudUnificada(BaseModel):
    # ── Selección de flujo ───────────────────────────────────────
    tipo_mutacion:   TipoMutacion
    tipo_origen:     TipoOrigen

    # ── Campos comunes ───────────────────────────────────────────
    numero_predial:       str = Field(..., min_length=4)
    folio_matricula:      str = Field(..., min_length=3)
    documentos_aportados: list[str] = Field(default_factory=list)
    municipio:            Optional[str] = None

    # ── Propietario ───────────────────────────────────────────────
    nombre_propietario: Optional[str] = None
    cedula_propietario: Optional[str] = None

    # ── Solicitante (autorizado / apoderado) ─────────────────────
    nombre_solicitante:    Optional[str] = None
    tipo_doc_solicitante:  Optional[str] = None
    cedula_solicitante:    Optional[str] = None
    tp_solicitante:        Optional[str] = None

    # ── SNR / Complementación ─────────────────────────────────────
    numero_radicado: Optional[str] = None

    # ── Tercera Clase ────────────────────────────────────────────
    area_construida_m2: Optional[float] = None
    area_terreno_m2:    Optional[float] = None

    # ── Segunda Clase (desenglobe / agregación) ───────────────────
    folio_matriz:        Optional[str] = None
    folios_resultantes:  list[str] = Field(default_factory=list)
    numero_escritura:    Optional[str] = None
    fecha_escritura:     Optional[str] = None
    notaria:             Optional[str] = None

    # ── Rectificación / Complementación ──────────────────────────
    campo_rectificado:   Optional[str] = None
    campo_complementado: Optional[str] = None

    # ── Cancelación de inscripción catastral ──────────────────────
    numero_predial_nuevo: Optional[str] = None
    fecha_efectos:        Optional[str] = None

    # ── Cuarta Clase (revisión de avalúo catastral) ────────────────
    direccion_predio:         Optional[str] = None
    parrafos_informe_tecnico: list[str] = Field(default_factory=list)

    # ── Quinta Clase (incorporación de predios formales/informales) ─
    fecha_visita_tecnica: Optional[str] = None
    fecha_compraventa:    Optional[str] = None
    entidad_compraventa:  Optional[str] = None

    # ── Artículos finales ─────────────────────────────────────────
    tipo_notificacion: Optional[Literal["notificable", "no_notificable"]] = None

    # ── Análisis previo del Asistente Catastral (chat) ────────────
    contexto_adicional: Optional[str] = None
