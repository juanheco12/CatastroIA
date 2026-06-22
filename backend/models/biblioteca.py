import enum
from datetime import datetime
from sqlalchemy import String, DateTime, Text, Integer, LargeBinary, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from pgvector.sqlalchemy import Vector
from database.db import Base

# Mismo modelo de embeddings de Gemini que soporte_chunks (models/soporte.py).
EMBEDDING_DIM = 768


class CategoriaMotivada(str, enum.Enum):
    MUTACION_PRIMERA_CLASE = "mutacion_primera_clase"
    MUTACION_SEGUNDA_CLASE = "mutacion_segunda_clase"
    MUTACION_TERCERA_CLASE = "mutacion_tercera_clase"
    MUTACION_CUARTA_CLASE = "mutacion_cuarta_clase"
    MUTACION_QUINTA_CLASE = "mutacion_quinta_clase"
    CAMBIO_REFERENCIA_CATASTRAL = "cambio_referencia_catastral"
    CANCELACION_INSCRIPCION_CATASTRAL = "cancelacion_inscripcion_catastral"
    RECTIFICACION_GENERAL_DATOS = "rectificacion_general_datos"
    COMPLEMENTACION = "complementacion"


class EstadoPlantilla(str, enum.Enum):
    PENDIENTE_REVISION = "pendiente_revision"
    ACTIVA = "activa"
    ARCHIVADA = "archivada"
    CASO_ATIPICO = "caso_atipico"


class TipoCampoVariable(str, enum.Enum):
    NOMBRE_PROPIETARIO = "nombre_propietario"
    DIRECCION = "direccion"
    IDENTIFICACION = "identificacion"
    NUMERO_PREDIAL = "numero_predial"
    MATRICULA_INMOBILIARIA = "matricula_inmobiliaria"
    NUMERO_RESOLUCION = "numero_resolucion"
    RADICADO = "radicado"
    ACTO_ADMINISTRATIVO = "acto_administrativo"
    ESCRITURA = "escritura"
    OFICINA_REGISTRO = "oficina_registro"
    AREA = "area"
    FECHA = "fecha"
    DOCUMENTOS_APORTADOS = "documentos_aportados"
    OTRO = "otro"


class PlantillaMotivada(Base):
    """Una motivada/resolucion real ya terminada, subida como plantilla
    reutilizable. El texto juridico nunca se reescribe ni se genera: solo se
    sustituyen los campos variables confirmados manualmente (modo estricto)."""

    __tablename__ = "plantillas_motivada"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    nombre_original: Mapped[str] = mapped_column(String(255))
    categoria: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)
    categorias_candidatas: Mapped[str] = mapped_column(String(300), default="")
    estado: Mapped[str] = mapped_column(String(30), default=EstadoPlantilla.PENDIENTE_REVISION.value, index=True)
    motivo_revision_pendiente: Mapped[str | None] = mapped_column(String(500), nullable=True)

    tipo_tramite_manual: Mapped[str | None] = mapped_column(String(50), nullable=True)

    contenido_docx: Mapped[bytes] = mapped_column(LargeBinary)
    tamano_bytes: Mapped[int] = mapped_column(Integer)
    contenido_texto: Mapped[str] = mapped_column(Text)
    embedding: Mapped[list[float] | None] = mapped_column(Vector(EMBEDDING_DIM), nullable=True)

    contador_uso: Mapped[int] = mapped_column(Integer, default=0)
    fecha_ultimo_uso: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    es_favorita: Mapped[bool] = mapped_column(Boolean, default=False)

    fecha_subida: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    fecha_revision: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    revisado_por: Mapped[str | None] = mapped_column(String(120), nullable=True)


class VersionPlantillaMotivada(Base):
    """Changelog juridico: snapshot de la version ANTERIOR cada vez que se
    reemplaza el texto de una plantilla (p. ej. por un cambio de norma).
    Nunca se borra una version, solo se archiva."""

    __tablename__ = "versiones_plantilla_motivada"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    plantilla_id: Mapped[int] = mapped_column(
        ForeignKey("plantillas_motivada.id", ondelete="CASCADE"), index=True
    )
    numero_version: Mapped[int] = mapped_column(Integer)
    contenido_docx_anterior: Mapped[bytes] = mapped_column(LargeBinary)
    contenido_texto_anterior: Mapped[str] = mapped_column(Text)
    motivo_cambio: Mapped[str] = mapped_column(String(1000))
    fecha_cambio: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    cambiado_por: Mapped[str | None] = mapped_column(String(120), nullable=True)


class CampoVariablePlantilla(Base):
    """Un campo variable candidato o confirmado dentro de una plantilla.
    origen_deteccion='regex' y confirmado=False hasta que un humano lo
    revise explicitamente — nunca se aplica un campo sin confirmar."""

    __tablename__ = "campos_variables_plantilla"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    plantilla_id: Mapped[int] = mapped_column(
        ForeignKey("plantillas_motivada.id", ondelete="CASCADE"), index=True
    )
    tipo_campo: Mapped[str] = mapped_column(String(40))
    texto_original: Mapped[str] = mapped_column(String(500))
    offset_inicio: Mapped[int] = mapped_column(Integer)
    offset_fin: Mapped[int] = mapped_column(Integer)
    tipo_identificacion: Mapped[str | None] = mapped_column(String(10), nullable=True)
    origen_deteccion: Mapped[str] = mapped_column(String(20), default="regex")
    confirmado: Mapped[bool] = mapped_column(Boolean, default=False)