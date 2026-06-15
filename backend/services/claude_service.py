import anthropic
from config import settings
from schemas.solicitud import SolicitudUnificada

# ── Lookup DANE → municipio ──────────────────────────────────────────────────
_MUNICIPIOS: dict[str, str] = {
    "05001": "Medellín",     "11001": "Bogotá D.C.",  "76001": "Cali",
    "08001": "Barranquilla", "13001": "Cartagena",     "23001": "Montería",
    "54001": "Cúcuta",       "68001": "Bucaramanga",   "17001": "Manizales",
    "63001": "Armenia",      "66001": "Pereira",       "41001": "Neiva",
    "73001": "Ibagué",       "52001": "Pasto",         "18001": "Florencia",
    "85001": "Yopal",        "86001": "Mocoa",         "50001": "Villavicencio",
    "20001": "Valledupar",   "44001": "Riohacha",      "70001": "Sincelejo",
    "19001": "Popayán",      "27001": "Quibdó",        "15001": "Tunja",
    "05088": "Bello",        "05380": "Itagüí",        "25754": "Soacha",
}

def _municipio(data: SolicitudUnificada) -> str:
    if data.municipio:
        return data.municipio
    clean = data.numero_predial.replace("-", "").replace(" ", "")
    return _MUNICIPIOS.get(clean[:5], "el municipio")

# ── Demo motivadas ────────────────────────────────────────────────────────────

def _demo_primera_propietario(data: SolicitudUnificada) -> str:
    mun  = _municipio(data)
    docs = ", ".join(data.documentos_aportados)
    return (
        f"Que el(la) señor(a) {data.nombre_propietario}, identificado(a) con C.C. No. "
        f"{data.cedula_propietario}, propietario del inmueble identificado con número predial "
        f"{data.numero_predial}, inscrito en la base de datos catastral del municipio de {mun}, "
        f"presentó ante la Oficina de atención al público una solicitud de trámite catastral, "
        f"consistente en Cambio de propietario, soportada en los siguientes documentos "
        f"justificativos: {docs}."
    )

def _demo_primera_autorizado(data: SolicitudUnificada) -> str:
    mun  = _municipio(data)
    docs = ", ".join(data.documentos_aportados)
    return (
        f"Que el(la) señor(a) {data.nombre_solicitante}, identificado(a) con CC NO. "
        f"{data.cedula_solicitante}, en su condición de contacto y/o autorizado del señor(a) "
        f"{data.nombre_propietario}, identificado con C.C. {data.cedula_propietario}, propietario "
        f"del inmueble identificado con número predial {data.numero_predial}, inscrito en la base "
        f"de datos catastral del municipio de {mun}, presentó ante la Oficina de atención al "
        f"público una solicitud de trámite catastral, consistente en Cambio de propietario, "
        f"soportada en los siguientes documentos justificativos: {docs}."
    )

def _demo_primera_poder(data: SolicitudUnificada) -> str:
    mun    = _municipio(data)
    docs   = ", ".join(data.documentos_aportados)
    tp_txt = f", y TP. {data.tp_solicitante}" if data.tp_solicitante else ""
    return (
        f"Que el(la) señor(a) {data.nombre_solicitante}, identificado(a) con "
        f"{data.tipo_doc_solicitante or 'CC'} NO. {data.cedula_solicitante}{tp_txt}, en su "
        f"condición de apoderado del señor(a) {data.nombre_propietario}, identificado con c.c. "
        f"{data.cedula_propietario}, propietario del inmueble identificado con número predial "
        f"{data.numero_predial}, inscrito en la base de datos catastral del municipio de {mun}, "
        f"presentó ante la Oficina de atención al público una solicitud de trámite catastral, "
        f"consistente en Cambio de propietario, soportada en los siguientes documentos "
        f"justificativos: {docs}."
    )

def _demo_primera_snr(data: SolicitudUnificada) -> str:
    mun  = _municipio(data)
    docs = ", ".join(data.documentos_aportados)
    return (
        f"Que teniendo en cuenta la interrelación catastro-registro y la colaboración armónica "
        f"que entre estas existe, la superintendencia de notariado y registro del circuito de "
        f"{mun}, suministra información para realizar el debido estudio jurídico, con el fin de "
        f"inscribir en la base catastral del municipio de {mun}, Córdoba las respectivas "
        f"mutaciones. La oficina de catastro radico con el número {data.numero_radicado or 'N/A'}, "
        f"el predio {data.numero_predial}, soportada en los siguientes documentos justificativos: "
        f"{docs}."
    )

def _demo_tercera(data: SolicitudUnificada) -> str:
    mun  = _municipio(data)
    docs = ", ".join(data.documentos_aportados)

    # Opening paragraph varies by origin
    if data.tipo_origen == "autorizado":
        apertura = (
            f"Que el(la) señor(a) {data.nombre_solicitante}, identificado(a) con CC NO. "
            f"{data.cedula_solicitante}, en su condición de contacto y/o autorizado del señor(a) "
            f"{data.nombre_propietario}, identificado con C.C. {data.cedula_propietario},"
        )
    elif data.tipo_origen == "poder":
        tp_txt = f", TP. {data.tp_solicitante}" if data.tp_solicitante else ""
        apertura = (
            f"Que el(la) señor(a) {data.nombre_solicitante}, identificado(a) con "
            f"{data.tipo_doc_solicitante or 'CC'} NO. {data.cedula_solicitante}{tp_txt}, "
            f"en su condición de apoderado del señor(a) {data.nombre_propietario}, "
            f"identificado con C.C. {data.cedula_propietario},"
        )
    elif data.tipo_origen == "snr":
        return _demo_primera_snr(data)  # SNR uses same structure for any mutation type
    else:  # propietario
        apertura = (
            f"Que el(la) señor(a) {data.nombre_propietario}, identificado(a) con C.C. No. "
            f"{data.cedula_propietario},"
        )

    return (
        f"{apertura} propietario del folio de matrícula No. {data.folio_matricula} vinculado "
        f"al número predial No. {data.numero_predial}, inscrito en la base de datos catastral "
        f"del municipio de {mun}, presentó ante la Oficina adscrita a la secretaría de "
        f"Planeación del municipio de {mun}, una solicitud de incorporación o modificación del "
        f"elemento constructivo, soportada en los siguientes documentos aportados: {docs}."
        f"\n\n"
        f"Que en atención a la solicitud presentada se realizó la verificación de la "
        f"documentación aportada y visita técnica, se concluye que se procede a incorporar el "
        f"elemento constructivo al predio con referencia catastral No. {data.numero_predial}, "
        f"para un total de área construida de {data.area_construida_m2} metros cuadrados sobre "
        f"un área de terreno de {data.area_terreno_m2} metros cuadrados."
        f"\n\n"
        f"Que, revisados los antecedentes catastrales del municipio de {mun}, verificada la "
        f"documentación aportada por el(la) solicitante, se procede a la validación "
        f"correspondiente en los términos del artículo 2.2.2.2.6. del Decreto 1170 de 2015, "
        f"modificado por el Decreto 148 de 2020, se pudo establecer que para el predio con "
        f"referencia catastral predial {data.numero_predial} procede la mutación de tercera "
        f"clase, por incorporar o modificar las unidades y su correspondiente inscripción en el "
        f"catastro, conforme lo indica el artículo 4.5.1 numeral 3 de la Resolución 1040 de "
        f"2023, en concordancia del artículo 2.2.2.2.2 literal C del Decreto 1170 de 2015, "
        f"modificado por el Decreto 148 de 2020."
    )


def _motivada_demo(data: SolicitudUnificada) -> str:
    if data.tipo_mutacion == "primera_clase":
        if data.tipo_origen == "autorizado":
            return _demo_primera_autorizado(data)
        elif data.tipo_origen == "poder":
            return _demo_primera_poder(data)
        elif data.tipo_origen == "snr":
            return _demo_primera_snr(data)
        else:
            return _demo_primera_propietario(data)
    else:  # tercera_clase
        return _demo_tercera(data)


# ── Sistema prompt para Claude ───────────────────────────────────────────────
SYSTEM_PROMPT = """
Eres experto en catastro colombiano. Redactas motivadas siguiendo la Resolución 1040 de 2023
del IGAC, el Decreto 1170 de 2015 y el Decreto 148 de 2020.

Genera párrafos "Que..." según el tipo de mutación y origen de la solicitud.
Sin títulos, sin markdown, párrafos separados por doble salto de línea.
Lenguaje formal administrativo colombiano. Máximo 400 palabras.
"""

def generate_motivada(data: SolicitudUnificada) -> dict:
    if not settings.anthropic_api_key:
        return {"texto_motivada": _motivada_demo(data), "tokens_usados": 0}
    try:
        client  = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        message = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1000,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": str(data.model_dump())}],
        )
        return {
            "texto_motivada": message.content[0].text,
            "tokens_usados":  message.usage.input_tokens + message.usage.output_tokens,
        }
    except Exception:
        return {"texto_motivada": _motivada_demo(data), "tokens_usados": 0}
