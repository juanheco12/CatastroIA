import re
import json
from pathlib import Path
from datetime import datetime
from docx import Document
from config import settings


TEMPLATE_FILENAME = "template_activo.docx"
TEMPLATE_META_FILENAME = "template_meta.json"


def _template_path() -> Path:
    return Path(settings.template_storage_path) / TEMPLATE_FILENAME


def _meta_path() -> Path:
    return Path(settings.template_storage_path) / TEMPLATE_META_FILENAME


def save_template(file_bytes: bytes, original_name: str) -> dict:
    """Persists an uploaded .docx template and returns its metadata."""
    path = _template_path()
    path.write_bytes(file_bytes)

    campos = detect_template_fields(file_bytes)
    meta = {
        "nombre_original": original_name,
        "fecha_subida": datetime.utcnow().isoformat(),
        "campos_detectados": campos,
        "tamano_bytes": len(file_bytes),
    }
    _meta_path().write_text(json.dumps(meta, ensure_ascii=False), encoding="utf-8")
    return meta


def detect_template_fields(file_bytes: bytes) -> list[str]:
    """Extracts {{FIELD}} placeholders from a .docx file."""
    import io
    doc = Document(io.BytesIO(file_bytes))
    full_text = " ".join(p.text for p in doc.paragraphs)
    # Also scan tables
    for table in doc.tables:
        for row in table.rows:
            for cell in row.cells:
                full_text += " " + cell.text
    return list(set(re.findall(r"\{\{(\w+)\}\}", full_text)))


def get_template_info() -> dict:
    """Returns metadata about the currently stored template."""
    path = _template_path()
    if not path.exists():
        return {"existe": False, "nombre": "", "campos_detectados": [], "tamano_bytes": 0}

    meta: dict = {}
    if _meta_path().exists():
        meta = json.loads(_meta_path().read_text(encoding="utf-8"))

    return {
        "existe": True,
        "nombre": meta.get("nombre_original", TEMPLATE_FILENAME),
        "campos_detectados": meta.get("campos_detectados", []),
        "tamano_bytes": path.stat().st_size,
        "fecha_subida": meta.get("fecha_subida"),
    }


def load_template_bytes() -> bytes | None:
    path = _template_path()
    return path.read_bytes() if path.exists() else None
