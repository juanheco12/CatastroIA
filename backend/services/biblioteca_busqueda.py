"""Busqueda de la plantilla mas adecuada para un caso nuevo: por filtros
estructurados o por similitud semantica sobre plantillas `activa`.

Modo estricto: si ninguna plantilla supera el umbral minimo de relevancia,
se devuelve `encontrado=False` con un mensaje explicito — nunca se
sintetiza una respuesta de respaldo ni se inventa una plantilla.
"""
import numpy as np
from sqlalchemy import select, func, or_
from sqlalchemy.orm import Session

from database.db import IS_SQLITE
from models.biblioteca import PlantillaMotivada, EstadoPlantilla
from schemas.biblioteca import (
    PlantillaInfoResponse,
    ResultadoBusqueda,
    BusquedaSemanticaResponse,
)
from services import ai_provider

# Distancia coseno maxima (0=identico, 1=ortogonal, 2=opuesto) para
# considerar una plantilla suficientemente relevante. Valor conservador sin
# calibrar contra busquedas reales — limitacion aceptada de la v1.
UMBRAL_DISTANCIA_COSENO = 0.4
MAX_ALTERNATIVAS = 3


def buscar_por_filtros(
    db: Session,
    categoria: str | None = None,
    tipo_tramite: str | None = None,
    keyword: str | None = None,
) -> list[PlantillaInfoResponse]:
    """Busqueda estructurada sobre plantillas activas — solo estas estan
    aprobadas para reutilizarse en un caso nuevo."""
    stmt = select(PlantillaMotivada).where(PlantillaMotivada.estado == EstadoPlantilla.ACTIVA.value)
    if categoria:
        stmt = stmt.where(PlantillaMotivada.categoria == categoria)
    if tipo_tramite:
        stmt = stmt.where(PlantillaMotivada.tipo_tramite_manual == tipo_tramite)
    if keyword:
        patron = f"%{keyword.lower()}%"
        stmt = stmt.where(or_(
            func.lower(PlantillaMotivada.nombre_original).like(patron),
            func.lower(PlantillaMotivada.contenido_texto).like(patron),
        ))
    stmt = stmt.order_by(PlantillaMotivada.contador_uso.desc())
    return [PlantillaInfoResponse.model_validate(p) for p in db.scalars(stmt).all()]


def _distancia_coseno(a, b) -> float:
    """Calculo en Python del fallback SQLite, donde no existe el operador
    `<=>` de pgvector para ordenar en SQL."""
    a, b = np.asarray(a, dtype=float), np.asarray(b, dtype=float)
    norma_a, norma_b = np.linalg.norm(a), np.linalg.norm(b)
    if norma_a == 0 or norma_b == 0:
        return 1.0
    return float(1 - np.dot(a, b) / (norma_a * norma_b))


def _candidatos_activos(db: Session, categoria: str | None) -> list[PlantillaMotivada]:
    stmt = select(PlantillaMotivada).where(
        PlantillaMotivada.estado == EstadoPlantilla.ACTIVA.value,
        PlantillaMotivada.embedding.is_not(None),
    )
    if categoria:
        stmt = stmt.where(PlantillaMotivada.categoria == categoria)
    return list(db.scalars(stmt).all())


def _candidatos_puntuados(db: Session, vector: list[float], categoria: str | None) -> list[tuple[PlantillaMotivada, float]]:
    if IS_SQLITE:
        candidatos = _candidatos_activos(db, categoria)
        puntuados = [(p, _distancia_coseno(vector, p.embedding)) for p in candidatos]
        puntuados.sort(key=lambda t: t[1])
        return puntuados[:1 + MAX_ALTERNATIVAS]

    stmt = select(
        PlantillaMotivada,
        PlantillaMotivada.embedding.cosine_distance(vector).label("distancia"),
    ).where(
        PlantillaMotivada.estado == EstadoPlantilla.ACTIVA.value,
        PlantillaMotivada.embedding.is_not(None),
    )
    if categoria:
        stmt = stmt.where(PlantillaMotivada.categoria == categoria)
    stmt = stmt.order_by("distancia").limit(1 + MAX_ALTERNATIVAS)
    return [(p, float(d)) for p, d in db.execute(stmt).all()]


def buscar_semantica(db: Session, descripcion_caso: str, categoria: str | None = None) -> BusquedaSemanticaResponse:
    """Embebe la descripcion del caso y compara contra plantillas activas
    por similitud de coseno. Si no hay candidatos o ninguno supera el
    umbral minimo, lo dice explicitamente — nunca genera una respuesta de
    respaldo."""
    try:
        vector = ai_provider.embed_texts([descripcion_caso], task_type="retrieval_query")[0]
    except Exception:
        return BusquedaSemanticaResponse(
            encontrado=False,
            mensaje="No se pudo generar el embedding de la descripcion (proveedor de IA no disponible). Usa la busqueda por filtros.",
        )

    puntuados = _candidatos_puntuados(db, vector, categoria)
    if not puntuados:
        return BusquedaSemanticaResponse(
            encontrado=False,
            mensaje="No hay plantillas activas con embedding disponible para comparar.",
        )

    mejor_p, mejor_d = puntuados[0]
    alternativas_resto = puntuados[1:]

    if mejor_d > UMBRAL_DISTANCIA_COSENO:
        return BusquedaSemanticaResponse(
            encontrado=False,
            alternativas=[
                ResultadoBusqueda(plantilla=PlantillaInfoResponse.model_validate(p), score=1 - d, razon="similitud baja")
                for p, d in puntuados
            ],
            mensaje="Ninguna plantilla activa es suficientemente similar a la descripcion del caso. Revisa las alternativas o crea una plantilla nueva.",
        )

    return BusquedaSemanticaResponse(
        encontrado=True,
        mejor=ResultadoBusqueda(
            plantilla=PlantillaInfoResponse.model_validate(mejor_p),
            score=1 - mejor_d,
            razon="mejor coincidencia semantica",
        ),
        alternativas=[
            ResultadoBusqueda(plantilla=PlantillaInfoResponse.model_validate(p), score=1 - d)
            for p, d in alternativas_resto
        ],
    )