import anthropic
from config import settings
from schemas.tercera_clase import TerceraClaseInput


SONNET_SYSTEM_PROMPT = """
Eres un asistente especializado en redacción de motivadas y resoluciones de trámites catastrales colombianos,
siguiendo las normas del IGAC y la Resolución 1040 de 2009.

Tu tarea es generar una MOTIVADA JURÍDICAMENTE VÁLIDA para una mutación catastral de TERCERA CLASE
(Incorporación de Construcción).

La motivada debe:
1. Incluir antecedentes de hecho (quién solicita, qué solicita, por qué)
2. Considerar los fundamentos legales aplicables (Ley 388/97, Resolución 1040/09 IGAC, Decreto 1420/98)
3. Análisis técnico-jurídico breve pero sólido que justifique la incorporación
4. Conclusiones claras que fundamenten la decisión
5. Ser redactada en estilo formal/administrativo colombiano
6. Incluir citas normativas precisas donde corresponda

Formato esperado de salida:
- Sin códigos de formateo markdown, solo texto limpio
- Párrafos separados por saltos de línea dobles
- Máximo 900 palabras
- Lenguaje profesional y técnico, sin legalés innecesario
- Estructura: ANTECEDENTES → CONSIDERACIONES → PARTE MOTIVA

Genera una motivada que pueda ser usada directamente en un documento oficial de la entidad catastral.
"""


def _build_user_prompt(data: TerceraClaseInput) -> str:
    solicitante_info = ""
    if data.solicitante:
        solicitante_info = f"""
SOLICITANTE (diferente al propietario):
- Nombre: {data.solicitante.nombre_completo}
- Documento: {data.solicitante.tipo_documento} {data.solicitante.numero_documento}
- Calidad: {data.solicitante.calidad}
"""
    else:
        solicitante_info = "SOLICITANTE: El mismo propietario"

    documentos = "\n".join(f"  - {doc}" for doc in data.documentos_presentados)

    visita = (
        f"Fecha de visita técnica: {data.fecha_visita_tecnica}"
        if data.fecha_visita_tecnica
        else "Sin fecha de visita registrada"
    )

    observaciones = data.observaciones_tecnicas or "Sin observaciones técnicas adicionales."

    return f"""Genera la motivada para el siguiente trámite catastral:

EXPEDIENTE: {data.numero_expediente}
NÚMERO DE PREDIO (Código Catastral): {data.numero_predio}
MATRÍCULA INMOBILIARIA: {data.matricula_inmobiliaria or "No registrada"}

PROPIETARIO:
- Nombre: {data.propietario.nombre_completo}
- Documento: {data.propietario.tipo_documento} {data.propietario.numero_documento}

{solicitante_info}

CONSTRUCCIÓN A INCORPORAR:
- Dirección: {data.construccion.direccion}, {data.construccion.municipio}, {data.construccion.departamento}
- Área construida: {data.construccion.area_construida_m2} m²
- Número de pisos: {data.construccion.numero_pisos}
- Año de construcción: {data.construccion.anio_construccion}
- Descripción: {data.construccion.descripcion}
- Materiales predominantes: {data.construccion.materiales_predominantes}
- Uso: {data.construccion.uso_construccion}
- Destino económico: {data.construccion.destino_economico}

FECHAS:
- Fecha de solicitud: {data.fecha_solicitud}
- {visita}

INSPECTOR RESPONSABLE: {data.inspector_responsable} - {data.cargo_inspector}

DOCUMENTOS PRESENTADOS:
{documentos}

OBSERVACIONES TÉCNICAS:
{observaciones}

{f"OBSERVACIONES ADICIONALES: {data.observaciones_adicionales}" if data.observaciones_adicionales else ""}

Por favor genera la motivada completa y profesional para este trámite de incorporación de construcción."""


def generate_motivada(data: TerceraClaseInput) -> dict:
    """Calls Claude Sonnet to generate a legally valid motivada."""
    if not settings.anthropic_api_key:
        raise ValueError(
            "ANTHROPIC_API_KEY no configurada. Configure la clave en el archivo .env"
        )

    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1500,
        system=SONNET_SYSTEM_PROMPT,
        messages=[
            {"role": "user", "content": _build_user_prompt(data)}
        ],
    )

    texto_motivada = message.content[0].text
    tokens_usados = message.usage.input_tokens + message.usage.output_tokens

    return {
        "texto_motivada": texto_motivada,
        "tokens_usados": tokens_usados,
    }
