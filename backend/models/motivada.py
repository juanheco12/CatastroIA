from datetime import datetime
from sqlalchemy import String, DateTime, Text, Integer, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column
from database.db import Base
import enum


class EstadoMotivada(str, enum.Enum):
    BORRADOR = "borrador"
    GENERADA = "generada"
    EXPORTADA = "exportada"


class TipoMutacion(str, enum.Enum):
    TERCERA_CLASE = "tercera_clase"


class HistorialMotivada(Base):
    __tablename__ = "historial_motivadas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    fecha_creacion: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    fecha_actualizacion: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    tipo_mutacion: Mapped[str] = mapped_column(
        SAEnum(TipoMutacion), default=TipoMutacion.TERCERA_CLASE
    )
    numero_expediente: Mapped[str] = mapped_column(String(100), index=True)
    numero_predio: Mapped[str] = mapped_column(String(50))
    propietario_nombre: Mapped[str] = mapped_column(String(200))
    propietario_documento: Mapped[str] = mapped_column(String(50))
    texto_motivada: Mapped[str] = mapped_column(Text)
    datos_formulario: Mapped[str] = mapped_column(Text)  # JSON serializado
    archivo_exportado: Mapped[str | None] = mapped_column(String(500), nullable=True)
    estado: Mapped[str] = mapped_column(
        SAEnum(EstadoMotivada), default=EstadoMotivada.GENERADA
    )
