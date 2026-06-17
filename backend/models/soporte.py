from datetime import datetime
from sqlalchemy import String, DateTime, Text, Integer
from sqlalchemy.orm import Mapped, mapped_column
from database.db import Base


class SoporteDocumento(Base):
    __tablename__ = "soportes_documentos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    nombre_original: Mapped[str] = mapped_column(String(255))
    tipo_archivo: Mapped[str] = mapped_column(String(10))
    contenido_texto: Mapped[str] = mapped_column(Text)
    tamano_bytes: Mapped[int] = mapped_column(Integer)
    fecha_subida: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
