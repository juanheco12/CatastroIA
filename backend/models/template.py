from datetime import datetime
from sqlalchemy import String, DateTime, LargeBinary, Integer
from sqlalchemy.orm import Mapped, mapped_column
from database.db import Base


class TemplateActivo(Base):
    __tablename__ = "template_activo"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    nombre_original: Mapped[str] = mapped_column(String(255))
    contenido: Mapped[bytes] = mapped_column(LargeBinary)
    tamano_bytes: Mapped[int] = mapped_column(Integer)
    campos_detectados: Mapped[str] = mapped_column(String(2000), default="")
    fecha_subida: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
