"""Deteccion de campos variables candidatos en el texto de una plantilla via
regex ancladas por palabra clave. Esto SOLO sugiere — nunca decide ni aplica
nada (modo estricto): cada candidato queda con origen_deteccion='regex' y
confirmado=False hasta revision humana explicita.

Nombre de propietario y direccion nunca se detectan aqui: no tienen un
formato reconocible de forma fiable y quedan para marcado manual en la UI de
revision (seleccion de texto).
"""
import re
from dataclasses import dataclass

from models.biblioteca import TipoCampoVariable

# Numeros de normas de caracter general citadas como marco legal en los 69
# documentos reales (Resolucion 1040/2023 y 746/2024 del IGAC, Resolucion
# 620/2008) — NO son el numero de resolucion propio del caso, sino la cita
# de la norma que lo fundamenta. La fecha que las acompaña varia de formato
# ("de 2023", "del 08/08/2023"), asi que se excluyen por el numero (sin
# ceros a la izquierda): ninguno de los actos propios del caso observados en
# el corpus real coincide con estos 3 numeros, que son exclusivos del marco
# normativo general. Se excluyen para no inundar la revision con la misma
# cita repetida en casi todos los documentos.
NORMAS_CONOCIDAS_NUMEROS: set[str] = {"1040", "746", "620"}

PAT_PREDIAL = re.compile(r"\b\d{1,4}(?:-\d{1,4}){5,10}\b")

PAT_RESOLUCION_CASO = re.compile(
    r"resoluci[oó]n\s+No\.?\s*(\d{1,4}(?:[-.]\d{1,4}){0,5})", re.IGNORECASE
)

PAT_MATRICULA_KEYWORD = re.compile(r"matr[ií]cul\w*", re.IGNORECASE)
PAT_MATRICULA_CANDIDATO = re.compile(r"\d{2,3}-\d{4,8}")
VENTANA_MATRICULA = 40

PAT_CEDULA_KEYWORD = re.compile(
    r"c[eé]dula(?:\s+de\s+ciudadan[ií]a)?|\bC\.?C\.?\b"
)
PAT_CEDULA_CANDIDATO = re.compile(r"\d{1,3}(?:\.\d{3}){1,3}")
VENTANA_CEDULA = 25

PAT_NIT_KEYWORD = re.compile(r"\bNIT\b", re.IGNORECASE)
PAT_NIT_CANDIDATO = re.compile(r"(?:\d{1,3}(?:\.\d{3}){1,3}|\d{6,12})-\d{1,2}")
VENTANA_NIT = 15

PAT_RADICADO = re.compile(r"radicado\s+(?:No\.?\s*)?(\d{4}-[\w\d]+)", re.IGNORECASE)

PAT_ESCRITURA = re.compile(r"escritura\s+p[uú]blica\s*(?:No\.?\s*)?(\d+)", re.IGNORECASE)

PAT_CONSULTA = re.compile(r"No\.?\s*de\s+consulta\s+(\d+)", re.IGNORECASE)

PAT_ANOTACION = re.compile(r"anotaci[oó]n\s+No\.?\s*(\d+)", re.IGNORECASE)

PAT_AREA = re.compile(
    r"[áa]rea[a-záéíóúñ\s]{0,30}?de\s+([\d.,]+)\s*metros\s*cuadrados", re.IGNORECASE
)

PAT_FECHA_TEXTUAL = re.compile(
    r"\b\d{1,2}\s+de\s+[a-záéíóúñ]+\s+de[l]?\s+\d{4}\b", re.IGNORECASE
)
PAT_FECHA_NUMERICA = re.compile(r"\b\d{1,2}[/-]\d{1,2}[/-]\d{4}\b")


@dataclass
class CampoDetectado:
    tipo_campo: str
    texto_original: str
    offset_inicio: int
    offset_fin: int
    tipo_identificacion: str | None = None


def _candidato_tras_keyword(
    texto: str,
    pat_keyword: re.Pattern,
    pat_candidato: re.Pattern,
    ventana: int,
    tipo_campo: str,
    tipo_identificacion: str | None = None,
) -> list[CampoDetectado]:
    """Busca, para cada ocurrencia de la palabra clave, el PRIMER candidato
    que aparece justo despues (ventana corta hacia adelante). Anclar hacia
    adelante y tomar el mas cercano evita falsos positivos con fragmentos de
    otros campos (p. ej. un trozo del numero predial que coincide por azar
    con la forma de una matricula, pero esta mucho mas lejos de la palabra
    clave que la matricula real)."""
    encontrados = []
    for m_kw in pat_keyword.finditer(texto):
        inicio_busqueda = m_kw.end()
        fragmento = texto[inicio_busqueda:inicio_busqueda + ventana]
        m_cand = pat_candidato.search(fragmento)
        if not m_cand:
            continue
        ini = inicio_busqueda + m_cand.start()
        fin = inicio_busqueda + m_cand.end()
        encontrados.append(
            CampoDetectado(tipo_campo, texto[ini:fin], ini, fin, tipo_identificacion)
        )
    return encontrados


def _detectar_predial(texto: str) -> list[CampoDetectado]:
    return [
        CampoDetectado(TipoCampoVariable.NUMERO_PREDIAL.value, m.group(0), m.start(), m.end())
        for m in PAT_PREDIAL.finditer(texto)
    ]


def _detectar_matricula(texto: str) -> list[CampoDetectado]:
    return _candidato_tras_keyword(
        texto, PAT_MATRICULA_KEYWORD, PAT_MATRICULA_CANDIDATO, VENTANA_MATRICULA,
        TipoCampoVariable.MATRICULA_INMOBILIARIA.value,
    )


def _detectar_identificacion(texto: str) -> list[CampoDetectado]:
    cedulas = _candidato_tras_keyword(
        texto, PAT_CEDULA_KEYWORD, PAT_CEDULA_CANDIDATO, VENTANA_CEDULA,
        TipoCampoVariable.IDENTIFICACION.value, tipo_identificacion="CC",
    )
    nits = _candidato_tras_keyword(
        texto, PAT_NIT_KEYWORD, PAT_NIT_CANDIDATO, VENTANA_NIT,
        TipoCampoVariable.IDENTIFICACION.value, tipo_identificacion="NIT",
    )
    return cedulas + nits


def _es_norma_conocida(numero_capturado: str) -> bool:
    """True si el numero capturado corresponde a una norma general conocida
    (p. ej. 'Resolucion 1040 de 2023'), no al acto administrativo propio del
    caso. Solo aplica a candidatos sin guion ni punto (los actos propios del
    caso siempre los llevan: '23-001-586-2025', '170-2023', etc.)."""
    return (numero_capturado.lstrip("0") or "0") in NORMAS_CONOCIDAS_NUMEROS


def _detectar_resolucion(texto: str) -> list[CampoDetectado]:
    encontrados = []
    for m in PAT_RESOLUCION_CASO.finditer(texto):
        numero = m.group(1)
        if "-" not in numero and "." not in numero and _es_norma_conocida(numero):
            continue
        ini, fin = m.start(1), m.end(1)
        encontrados.append(
            CampoDetectado(TipoCampoVariable.NUMERO_RESOLUCION.value, texto[ini:fin], ini, fin)
        )
    return encontrados


def _detectar_simple(pat: re.Pattern, tipo_campo: str, texto: str, grupo: int = 1) -> list[CampoDetectado]:
    return [
        CampoDetectado(tipo_campo, m.group(grupo), m.start(grupo), m.end(grupo))
        for m in pat.finditer(texto)
    ]


def _dentro_de_algun_rango(ini: int, fin: int, rangos: list[tuple[int, int]]) -> bool:
    return any(ini >= r_ini and fin <= r_fin for r_ini, r_fin in rangos)


def _detectar_fechas(texto: str, rangos_excluidos: list[tuple[int, int]]) -> list[CampoDetectado]:
    """PAT_FECHA_NUMERICA no tiene palabra clave que la ancle: un fragmento
    del numero predial (p. ej. '00-00-0128') tiene exactamente la forma
    DD-MM-AAAA y se confundiria con una fecha. Por eso se excluye cualquier
    candidato que caiga dentro de un numero_predial ya detectado."""
    encontrados = [
        CampoDetectado(TipoCampoVariable.FECHA.value, m.group(0), m.start(), m.end())
        for m in PAT_FECHA_TEXTUAL.finditer(texto)
    ]
    rangos_textuales = [(c.offset_inicio, c.offset_fin) for c in encontrados]
    for m in PAT_FECHA_NUMERICA.finditer(texto):
        if _dentro_de_algun_rango(m.start(), m.end(), rangos_textuales):
            continue
        if _dentro_de_algun_rango(m.start(), m.end(), rangos_excluidos):
            continue
        encontrados.append(
            CampoDetectado(TipoCampoVariable.FECHA.value, m.group(0), m.start(), m.end())
        )
    return encontrados


def detectar_campos(texto: str) -> list[CampoDetectado]:
    """Corre todos los detectores y devuelve los candidatos ordenados por
    posicion. Cada uno es solo una sugerencia (confirmado=False al
    persistir) — la revision humana decide cuales aplicar, editar o
    descartar."""
    candidatos: list[CampoDetectado] = []
    prediales = _detectar_predial(texto)
    rangos_prediales = [(c.offset_inicio, c.offset_fin) for c in prediales]
    candidatos += prediales
    candidatos += _detectar_matricula(texto)
    candidatos += _detectar_identificacion(texto)
    candidatos += _detectar_resolucion(texto)
    candidatos += _detectar_simple(PAT_RADICADO, TipoCampoVariable.RADICADO.value, texto)
    candidatos += _detectar_simple(PAT_ESCRITURA, TipoCampoVariable.ESCRITURA.value, texto)
    candidatos += _detectar_simple(PAT_CONSULTA, TipoCampoVariable.NUMERO_CONSULTA.value, texto)
    candidatos += _detectar_simple(PAT_ANOTACION, TipoCampoVariable.NUMERO_ANOTACION.value, texto)
    candidatos += _detectar_simple(PAT_AREA, TipoCampoVariable.AREA.value, texto)
    candidatos += _detectar_fechas(texto, rangos_prediales)
    candidatos.sort(key=lambda c: c.offset_inicio)
    return candidatos