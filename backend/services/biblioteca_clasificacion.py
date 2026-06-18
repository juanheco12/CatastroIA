"""Clasificacion de plantillas de la biblioteca por categoria, a partir del
nombre de archivo. Funcion pura, sin DB ni IA — testeable de forma aislada.

La busqueda de cada palabra clave se hace en CUALQUIER posicion del nombre
normalizado (no solo el sufijo final tras el ultimo guion): un archivo real
del corpus ("COMPLEMENTACION SNR_ENGLOBE M-T.docx") tiene la categoria al
INICIO del nombre, no al final.
"""
import re
import unicodedata

from models.biblioteca import CategoriaMotivada

CATEGORIAS_KEYWORDS: dict[CategoriaMotivada, list[str]] = {
    CategoriaMotivada.MUTACION_PRIMERA_CLASE: [
        "mutacion de primera", "mutacion primera clase",
    ],
    CategoriaMotivada.MUTACION_SEGUNDA_CLASE: [
        "mutacion de segunda", "mutacion segunda clase",
    ],
    CategoriaMotivada.MUTACION_TERCERA_CLASE: [
        "mutacion de tercera", "mutacion tercera clase",
    ],
    CategoriaMotivada.MUTACION_CUARTA_CLASE: [
        "mutacion de cuarta", "mutacion cuarta clase",
    ],
    CategoriaMotivada.MUTACION_QUINTA_CLASE: [
        "mutacion de quinta", "mutacion quinta clase",
    ],
    CategoriaMotivada.CAMBIO_REFERENCIA_CATASTRAL: [
        "cambio de referencia",
    ],
    CategoriaMotivada.CANCELACION_INSCRIPCION_CATASTRAL: [
        "cancelacion de inscripcion", "cancelacion inscripcion catastral",
    ],
    CategoriaMotivada.RECTIFICACION_GENERAL_DATOS: [
        "rectificacion general",
    ],
    CategoriaMotivada.COMPLEMENTACION: [
        "complementacion",
    ],
}


def normalizar_nombre(nombre_archivo: str) -> str:
    """minusculas, sin tildes, sin extension."""
    nombre = nombre_archivo.rsplit(".", 1)[0] if "." in nombre_archivo else nombre_archivo
    nombre = nombre.lower().strip()
    nombre = unicodedata.normalize("NFKD", nombre).encode("ascii", "ignore").decode()
    return nombre


def clasificar_por_nombre(nombre_archivo: str) -> tuple[list[CategoriaMotivada], str | None]:
    """
    Retorna (categorias_encontradas, motivo_si_no_es_caso_simple):
      - 1 match  -> ([categoria], None)
      - 0 match  -> ([], "sin_match: ninguna categoria detectada en el nombre")
      - >=2 match -> ([cat1, cat2, ...], "ambiguo: N categorias detectadas")
    Nunca decide "la primera" cuando hay ambiguedad: eso lo resuelve la
    revision humana (estado CASO_ATIPICO).
    """
    nombre_norm = normalizar_nombre(nombre_archivo)
    encontradas = [
        categoria
        for categoria, keywords in CATEGORIAS_KEYWORDS.items()
        if any(re.search(re.escape(kw), nombre_norm) for kw in keywords)
    ]

    if not encontradas:
        return [], "sin_match: ninguna categoria detectada en el nombre"
    if len(encontradas) > 1:
        return encontradas, f"ambiguo: {len(encontradas)} categorias detectadas"
    return encontradas, None