import anthropic
from config import settings
from schemas.tercera_clase import TerceraClaseInput


SONNET_SYSTEM_PROMPT = """
Eres un experto en catastro colombiano. Redactas motivadas de resoluciones para mutaciones catastrales
siguiendo la Resolución 1040 de 2009 del IGAC, la Ley 388 de 1997 y el Decreto 1420 de 1998.

Genera una MOTIVADA COMPLETA Y JURÍDICAMENTE VÁLIDA para una mutación de TERCERA CLASE
(Incorporación de Construcción al inventario catastral).

Estructura obligatoria:
1. ANTECEDENTES: Quién solicita, qué solicita, datos del predio y construcción
2. CONSIDERACIONES JURÍDICAS: Fundamentos legales aplicables con citas normativas precisas
3. PARTE MOTIVA: Análisis técnico-jurídico que justifica la incorporación

Reglas:
- Lenguaje formal administrativo colombiano
- Cita exacta de artículos de la Resolución 1040/09 y Ley 388/97
- Máximo 700 palabras
- Solo texto limpio, sin markdown ni numeraciones
- Párrafos separados por doble salto de línea
- Infiere datos complementarios (municipio del código predial, uso habitacional por defecto)
- Sé completo y profesional — el documento debe poder usarse directamente en resolución oficial
"""


def _build_prompt(data: TerceraClaseInput) -> str:
    docs = "\n".join(f"  - {d}" for d in data.documentos_aportados)
    return f"""Genera la motivada para este trámite catastral:

PROPIETARIO: {data.nombre_propietario}
CÉDULA: {data.cedula}
NÚMERO PREDIAL: {data.numero_predial}
FOLIO DE MATRÍCULA INMOBILIARIA: {data.folio_matricula}
ÁREA CONSTRUIDA: {data.area_construida_m2} m²
ÁREA DE TERRENO: {data.area_terreno_m2} m²

DOCUMENTOS APORTADOS:
{docs}

Genera la motivada completa y profesional para este trámite de incorporación de construcción."""


def generate_motivada(data: TerceraClaseInput) -> dict:
    if not settings.anthropic_api_key:
        raise ValueError(
            "ANTHROPIC_API_KEY no configurada. Configure la clave en el archivo .env"
        )

    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1500,
        system=SONNET_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": _build_prompt(data)}],
    )

    return {
        "texto_motivada": message.content[0].text,
        "tokens_usados": message.usage.input_tokens + message.usage.output_tokens,
    }
