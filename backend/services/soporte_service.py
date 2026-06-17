import io
import re
from sqlalchemy.orm import Session
from sqlalchemy import select, func, case
from docx import Document
from models.soporte import SoporteDocumento
from schemas.soporte import SoporteInfoResponse

MAX_DOCS_CONTEXTO = 2
MAX_CHARS_POR_DOC = 4000
MAX_PALABRAS_CLAVE = 12

_BLOQUE_CONTEXTO_TEMPLATE = """

## Documentos de soporte cargados por la entidad
A continuación hay extractos de documentos internos que la entidad cargó como referencia. Cítalos por su nombre de archivo cuando los uses. Si alguno contiene el texto literal de un artículo o norma, puedes citarlo entre comillas tal cual aparece; si no, no inventes una redacción exacta. Si no aportan nada a la pregunta, ignóralos.

{contexto}"""

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
    filas = db.execute(
        select(
            SoporteDocumento.id,
            SoporteDocumento.nombre_original,
            SoporteDocumento.tipo_archivo,
            SoporteDocumento.tamano_bytes,
            func.length(SoporteDocumento.contenido_texto).label("longitud_texto"),
            SoporteDocumento.fecha_subida,
        ).order_by(SoporteDocumento.fecha_subida.desc())
    ).all()
    return [
        SoporteInfoResponse(
            id=f.id,
            nombre_original=f.nombre_original,
            tipo_archivo=f.tipo_archivo,
            tamano_bytes=f.tamano_bytes,
            longitud_texto=f.longitud_texto,
            fecha_subida=f.fecha_subida,
        )
        for f in filas
    ]


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
    y devuelve un extracto de los más relevantes, listo para inyectar en el prompt.

    La puntuación y el recorte del texto se hacen en SQL para no transferir ni
    procesar en Python el contenido completo de cada documento (puede pesar
    decenas o cientos de MB) en cada mensaje del chat."""
    claves = list(set(_palabras_clave(pregunta)))[:MAX_PALABRAS_CLAVE]
    if not claves:
        return ""

    contenido_lower = func.lower(SoporteDocumento.contenido_texto)
    puntaje = sum(
        case((contenido_lower.like(f"%{palabra}%"), 1), else_=0) for palabra in claves
    )

    subq = select(
        SoporteDocumento.nombre_original.label("nombre"),
        func.substr(SoporteDocumento.contenido_texto, 1, MAX_CHARS_POR_DOC).label("extracto"),
        puntaje.label("puntaje"),
    ).subquery()

    filas = db.execute(
        select(subq.c.nombre, subq.c.extracto)
        .where(subq.c.puntaje > 0)
        .order_by(subq.c.puntaje.desc())
        .limit(MAX_DOCS_CONTEXTO)
    ).all()

    if not filas:
        return ""

    return "\n\n".join(f"--- {nombre} ---\n{extracto}" for nombre, extracto in filas)


def construir_bloque_contexto(contexto: str) -> str:
    """Envuelve un extracto de soportes con las instrucciones de uso, listo para anexar a un system prompt."""
    if not contexto:
        return ""
    return _BLOQUE_CONTEXTO_TEMPLATE.format(contexto=contexto)
