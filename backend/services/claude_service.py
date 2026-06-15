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


def _motivada_demo(data: TerceraClaseInput) -> str:
    """Returns a realistic sample motivada for demo/testing without API credits."""
    docs = ", ".join(data.documentos_aportados)
    return f"""ANTECEDENTES

El señor(a) {data.nombre_propietario}, identificado(a) con cédula de ciudadanía número {data.cedula}, en calidad de propietario(a) del inmueble identificado con número predial {data.numero_predial} y folio de matrícula inmobiliaria {data.folio_matricula}, presenta ante la oficina de catastro solicitud formal de incorporación de construcción al inventario catastral, aportando para el efecto los siguientes documentos: {docs}.

La construcción objeto de incorporación cuenta con un área construida de {data.area_construida_m2} metros cuadrados, sobre un área de terreno de {data.area_terreno_m2} metros cuadrados, destinada al uso habitacional.


CONSIDERACIONES JURÍDICAS

Que de conformidad con lo establecido en el artículo 3° de la Ley 14 de 1983, reglamentada por el Decreto 3496 de 1983, el catastro es el inventario o censo, debidamente actualizado y clasificado, de los bienes inmuebles pertenecientes al Estado y a los particulares, con el objeto de lograr su correcta identificación física, jurídica, fiscal y económica.

Que el artículo 5° de la Resolución 1040 de 2009 del Instituto Geográfico Agustín Codazzi - IGAC, establece que las mutaciones catastrales de tercera clase comprenden la incorporación de mejoras o construcciones nuevas no incluidas en el inventario catastral vigente.

Que conforme al artículo 79 de la Resolución 1040 de 2009, para efectuar la incorporación de construcciones es necesario verificar la existencia física de la edificación, sus características técnicas y la documentación soporte aportada por el interesado.

Que la Ley 388 de 1997, en su artículo 59, establece la obligatoriedad de mantener actualizado el catastro con todas las mejoras y construcciones realizadas sobre los predios.


PARTE MOTIVA

Que verificada la documentación aportada y realizada la inspección técnica correspondiente, se constató la existencia física de la construcción sobre el predio identificado con número predial {data.numero_predial}, con las características técnicas anteriormente descritas.

Que el área construida de {data.area_construida_m2} metros cuadrados registrada en el presente trámite corresponde a la edificación existente sobre el predio, la cual no se encuentra incorporada en el inventario catastral actual, siendo procedente su incorporación conforme a las normas citadas.

Que habiéndose cumplido con todos los requisitos legales y técnicos exigidos por la normatividad catastral vigente, y encontrándose debidamente acreditada la titularidad del predio por parte de {data.nombre_propietario}, identificado(a) con cédula de ciudadanía {data.cedula}, se procede a ordenar la incorporación de la construcción al inventario catastral del municipio.

[MODO DEMO — Esta motivada es un ejemplo. Con créditos API, Claude Sonnet generará el texto personalizado y jurídicamente preciso para cada caso.]"""


def generate_motivada(data: TerceraClaseInput) -> dict:
    # Demo mode: no API key or no credits — return realistic sample
    if not settings.anthropic_api_key:
        return {
            "texto_motivada": _motivada_demo(data),
            "tokens_usados": 0,
            "modo_demo": True,
        }

    try:
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
    except anthropic.AuthenticationError:
        return {"texto_motivada": _motivada_demo(data), "tokens_usados": 0, "modo_demo": True}
    except anthropic.BadRequestError as e:
        if "credit" in str(e).lower() or "balance" in str(e).lower():
            return {"texto_motivada": _motivada_demo(data), "tokens_usados": 0, "modo_demo": True}
        raise
    except Exception:
        return {"texto_motivada": _motivada_demo(data), "tokens_usados": 0, "modo_demo": True}
