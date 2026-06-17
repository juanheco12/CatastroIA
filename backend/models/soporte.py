from datetime import datetime
from sqlalchemy import String, DateTime, Text, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from pgvector.sqlalchemy import Vector
from database.db import Base

# Dimension de los modelos de embedding de Gemini (text-embedding-004 / embedding-001).
EMBEDDING_DIM = 768


class SoporteDocumento(Base):
    __tablename__ = "soportes_documentos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    nombre_original: Mapped[str] = mapped_column(String(255))
    tipo_archivo: Mapped[str] = mapped_column(String(10))
    contenido_texto: Mapped[str] = mapped_column(Text)
    tamano_bytes: Mapped[int] = mapped_column(Integer)
    fecha_subida: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class SoporteChunk(Base):
    """Fragmento indexado de un SoporteDocumento, con su embedding para busqueda
    semantica (RAG) en vez de coincidencia literal de palabras clave."""

    __tablename__ = "soporte_chunks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    soporte_id: Mapped[int] = mapped_column(
        ForeignKey("soportes_documentos.id", ondelete="CASCADE"), index=True
    )
    orden: Mapped[int] = mapped_column(Integer)
    texto: Mapped[str] = mapped_column(Text)
    embedding: Mapped[list[float]] = mapped_column(Vector(EMBEDDING_DIM))
