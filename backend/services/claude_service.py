import anthropic
from config import settings
from schemas.tercera_clase import TerceraClaseInput

SONNET_SYSTEM_PROMPT = """
Eres un experto en catastro colombiano. Redactas motivadas de resoluciones para mutaciones catastrales
siguiendo la Resolución 1040 de 2023 del IGAC, el Decreto 1170 de 2015 y el Decreto 148 de 2020.

Genera una MOTIVADA en formato de párrafos "Que..." para una mutación de TERCERA CLASE
(Incorporación o modificación de elemento constructivo).

Estructura EXACTA — cuatro párrafos "Que...":
1. Base legal: cita art. 4.5.1 numeral 3 Resolución 1040/2023 sobre mutaciones de tercera clase
2. Identificación: propietario, CC, folio de matrícula, número predial, municipio, solicitud y documentos
3. Verificación: visita técnica, conclusión de incorporación y área en metros cuadrados
4. Conclusión jurídica: cita art. 2.2.2.2.6 Decreto 1170/2015 mod. Decreto 148/2020, art. 4.5.1 num. 3 Res. 1040/2023

Reglas estrictas:
- Solo párrafos que empiezan con "Que..."
- Sin títulos, sin numeración, sin markdown
- Párrafos separados por doble salto de línea
- Lenguaje formal administrativo colombiano
- Máximo 400 palabras
"""


# Lookup DANE code → municipality name (most common)
_MUNICIPIOS: dict[str, str] = {
    "05001": "Medellín",       "11001": "Bogotá D.C.",    "76001": "Cali",
    "08001": "Barranquilla",   "13001": "Cartagena",       "23001": "Montería",
    "54001": "Cúcuta",         "68001": "Bucaramanga",     "17001": "Manizales",
    "63001": "Armenia",        "66001": "Pereira",          "41001": "Neiva",
    "73001": "Ibagué",         "52001": "Pasto",            "18001": "Florencia",
    "85001": "Yopal",          "86001": "Mocoa",            "91001": "Leticia",
    "05088": "Bello",          "05380": "Itagüí",           "05615": "Rionegro",
    "25754": "Soacha",         "08758": "Soledad",          "15001": "Tunja",
    "20001": "Valledupar",     "44001": "Riohacha",         "70001": "Sincelejo",
    "19001": "Popayán",        "27001": "Quibdó",           "50001": "Villavicencio",
}


def _get_municipio(numero_predial: str) -> str:
    """Infers municipality from the first 5 digits of the IGAC predial code."""
    clean = numero_predial.replace("-", "").replace(" ", "")
    return _MUNICIPIOS.get(clean[:5], "el municipio")


def _build_prompt(data: TerceraClaseInput) -> str:
    municipio = _get_municipio(data.numero_predial)
    docs = ", ".join(data.documentos_aportados)
    return f"""Genera la motivada con el formato exacto de cuatro párrafos "Que..." para este trámite:

PROPIETARIO: {data.nombre_propietario}
CÉDULA: {data.cedula}
FOLIO DE MATRÍCULA: {data.folio_matricula}
NÚMERO PREDIAL: {data.numero_predial}
MUNICIPIO: {municipio}
ÁREA CONSTRUIDA: {data.area_construida_m2} m²
ÁREA DE TERRENO: {data.area_terreno_m2} m²
DOCUMENTOS APORTADOS: {docs}"""


def _motivada_demo(data: TerceraClaseInput) -> str:
    """
    Realistic motivada using the exact format used by Colombian cadastral offices.
    Based on the official Resolución 1040 de 2023 structure.
    """
    municipio = _get_municipio(data.numero_predial)
    docs = ", ".join(data.documentos_aportados)

    return (
        f"Que la Resolución 1040 de 2023 del Instituto Geográfico Agustín Codazzi (IGAC), "
        f"en el artículo 4.5.1 numeral 3, señala que las mutaciones de tercera clase son aquellas "
        f"que se refieren a los cambios que ocurren en los predios por nuevas construcciones o "
        f"edificaciones, demoliciones y modificaciones de las condiciones y características "
        f"constructivas. Así mismo, se incluyen los cambios que se presenten respecto del uso de "
        f"la unidad de construcción y destino económico del predio."
        f"\n\n"
        f"Que el(la) señor(a) {data.nombre_propietario}, identificado(a) con CC. {data.cedula}, "
        f"en su condición de propietario del folio de matrícula No. {data.folio_matricula} "
        f"vinculado al número predial No. {data.numero_predial}, inscrito en la base de datos "
        f"catastral, presentó ante la Oficina adscrita a la secretaría de Planeación del municipio "
        f"de {municipio}, una solicitud de incorporación o modificación del elemento constructivo, "
        f"soportada en los siguientes documentos aportados: {docs}."
        f"\n\n"
        f"Que en atención a la solicitud presentada se realizó la verificación de la documentación "
        f"aportada y visita técnica, se concluye que se procede a incorporar el elemento constructivo "
        f"al predio con referencia catastral No. {data.numero_predial}, para un total de área "
        f"construida de {data.area_construida_m2} metros cuadrados sobre un área de terreno de "
        f"{data.area_terreno_m2} metros cuadrados."
        f"\n\n"
        f"Que, revisados los antecedentes catastrales del municipio de {municipio}, verificada la "
        f"documentación aportada por el(la) solicitante, se procede a la validación correspondiente "
        f"en los términos del artículo 2.2.2.2.6. del Decreto 1170 de 2015, modificado por el "
        f"Decreto 148 de 2020, se pudo establecer que para el predio con referencia catastral "
        f"predial {data.numero_predial} procede la mutación de tercera clase, por incorporar o "
        f"modificar las unidades y su correspondiente inscripción en el catastro, conforme lo indica "
        f"el artículo 4.5.1 numeral 3 de la Resolución 1040 de 2023, en concordancia del artículo "
        f"2.2.2.2.2 literal C del Decreto 1170 de 2015, modificado por el Decreto 148 de 2020."
    )


def generate_motivada(data: TerceraClaseInput) -> dict:
    # No API key configured → demo mode
    if not settings.anthropic_api_key:
        return {"texto_motivada": _motivada_demo(data), "tokens_usados": 0}

    try:
        client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        message = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1000,
            system=SONNET_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": _build_prompt(data)}],
        )
        return {
            "texto_motivada": message.content[0].text,
            "tokens_usados": message.usage.input_tokens + message.usage.output_tokens,
        }
    except Exception:
        # Any API error (credits, auth, network) → fallback to demo
        return {"texto_motivada": _motivada_demo(data), "tokens_usados": 0}
