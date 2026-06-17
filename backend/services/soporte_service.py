import io
import re
from sqlalchemy.orm import Session
from sqlalchemy import select
from docx import Document
from models.soporte import SoporteDocumento
from schemas.soporte import SoporteInfoResponse

MAX_DOCS_CONTEXTO = 2
MAX_CHARS_POR_DOC = 4000

_STOPWORDS = {
    "de", "la", "el", "en", "y", "a", "que", "los", "las", "un", "una", "es",
    "del", "se", "por", "con", "para", "su", "al", "lo", "como", "más", "o",
    "pero", "sus", "le", "ya", "este", "esta", "entre", "sin", "sobre", "ser",
    "qué", "cómo", "cuál", "cuáles", "cuándo", "dónde", "puede", "debe",
}


def _extraer_texto(file_bytes: bytes, tipo_archivo: str) -> str:
    if tipo_archivo == "pdf":
        from pypdf import PdfReader
        reader = PdfReader(io.BytesIO(file_bytes))
        return "\n".join(page.extract_text() or "" for page in reader.pages)
    if tipo_archivo == "docx":
        doc = Document(io.BytesIO(file_bytes))
        partes = [p.text for p in doc.paragraphs]
        for table in doc.tables:
            for row in table.rows:
                for cell in row.cells:
                    partes.append(cell.text)
        return "\n".join(partes)
    return file_bytes.decode("utf-8", errors="ignore")


def _a_response(doc: SoporteDocumento) -> SoporteInfoResponse:
    return SoporteInfoResponse(
        id=doc.id,
        nombre_original=doc.nombre_original,
        tipo_archivo=doc.tipo_archivo,
        tamano_bytes=doc.tamano_bytes,
        longitud_texto=len(doc.contenido_texto),
        fecha_subida=doc.fecha_subida,
    )


def guardar_soporte(db: Session, file_bytes: bytes, filename: str) -> SoporteInfoResponse:
    tipo_archivo = filename.rsplit(".", 1)[-1].lower()
    texto = _extraer_texto(file_bytes, tipo_archivo)
    if not texto.strip():
        raise ValueError("No se pudo extraer texto del documento")

    doc = SoporteDocumento(
        nombre_original=filename,
        tipo_archivo=tipo_archivo,
        contenido_texto=texto,
        tamano_bytes=len(file_bytes),
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return _a_response(doc)


def listar_soportes(db: Session) -> list[SoporteInfoResponse]:
    docs = db.scalars(select(SoporteDocumento).order_by(SoporteDocumento.fecha_subida.desc())).all()
    return [_a_response(d) for d in docs]


def eliminar_soporte(db: Session, soporte_id: int) -> bool:
    doc = db.get(SoporteDocumento, soporte_id)
    if not doc:
        return False
    db.delete(doc)
    db.commit()
    return True


def _palabras_clave(texto: str) -> list[str]:
    palabras = re.findall(r"[a-záéíóúñ0-9]+", texto.lower())
    return [p for p in palabras if p not in _STOPWORDS and len(p) > 2]


def buscar_contexto_relevante(db: Session, pregunta: str) -> str:
    """Puntúa los soportes guardados por solapamiento de palabras clave con la pregunta
    y devuelve un extracto de los más relevantes, listo para inyectar en el prompt."""
    docs = db.scalars(select(SoporteDocumento)).all()
    if not docs:
        return ""

    claves = set(_palabras_clave(pregunta))
    if not claves:
        return ""

    puntuados = []
    for doc in docs:
        texto_lower = doc.contenido_texto.lower()
        puntaje = sum(texto_lower.count(palabra) for palabra in claves)
        if puntaje > 0:
            puntuados.append((puntaje, doc))

    if not puntuados:
        return ""

    puntuados.sort(key=lambda x: x[0], reverse=True)
    mejores = puntuados[:MAX_DOCS_CONTEXTO]

    bloques = []
    for _, doc in mejores:
        extracto = doc.contenido_texto[:MAX_CHARS_POR_DOC]
        bloques.append(f"--- {doc.nombre_original} ---\n{extracto}")

    return "\n\n".join(bloques)
