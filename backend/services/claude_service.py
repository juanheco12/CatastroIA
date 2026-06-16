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

_P1_PRIMERA = (
    "Que la Resolución 1040 de 2023 del Instituto Geográfico Agustín Codazzi (IGAC), en el "
    "artículo 4.5.1 numeral 1 señala que las mutaciones de primera clase son aquellas que se "
    "presentan cuando cambia el propietario, poseedor u ocupante de un predio y no afecta el "
    "avalúo catastral."
)

_P3_PRIMERA = (
    "Que, en consecuencia, procede una mutación de primera y su correspondiente inscripción en "
    "el catastro, conforme lo indican en los artículos 4.5.1, y subsiguientes de la Resolución "
    "1040 de 2023, 'por la cual se expide la resolución única de la gestión catastral "
    "multipropósito', el artículo 4.6.1 y subsiguientes de la resolución vigente sobre los "
    "requisitos para trámites y otros procedimientos administrativos."
)

def _p4_primera(mun: str) -> str:
    return (
        f"Que, revisados los antecedentes catastrales del municipio de {mun}, verificada la "
        f"documentación aportada por el(la) solicitante, procede la mutación de primera y su "
        f"correspondiente inscripción en el catastro."
    )

def _demo_primera_propietario(data: SolicitudUnificada) -> str:
    mun  = _municipio(data)
    docs = ", ".join(data.documentos_aportados)
    p2 = (
        f"Que el(la) señor(a) {data.nombre_propietario}, identificado(a) con C.C. No. "
        f"{data.cedula_propietario}, propietario del inmueble identificado con número predial "
        f"{data.numero_predial}, inscrito en la base de datos catastral del municipio de {mun}, "
        f"presentó ante la Oficina de atención al público una solicitud de trámite catastral, "
        f"consistente en Cambio de propietario, soportada en los siguientes documentos "
        f"aportados: {docs}."
    )
    return "\n\n".join([_P1_PRIMERA, p2, _P3_PRIMERA, _p4_primera(mun)])

def _demo_primera_autorizado(data: SolicitudUnificada) -> str:
    mun  = _municipio(data)
    docs = ", ".join(data.documentos_aportados)
    p2 = (
        f"Que el(la) señor(a) {data.nombre_solicitante}, identificado(a) con CC No. "
        f"{data.cedula_solicitante}, en su condición de autorizado del señor(a) "
        f"{data.nombre_propietario}, identificado con CC. {data.cedula_propietario}, propietario "
        f"del inmueble identificado con número predial {data.numero_predial}, inscrito en la base "
        f"de datos catastral del municipio de {mun}, presentó ante la Oficina de atención al "
        f"público una solicitud de trámite catastral, consistente en Cambio de propietario, "
        f"soportada en los siguientes documentos aportados: {docs}."
    )
    return "\n\n".join([_P1_PRIMERA, p2, _P3_PRIMERA, _p4_primera(mun)])

def _demo_primera_poder(data: SolicitudUnificada) -> str:
    mun    = _municipio(data)
    docs   = ", ".join(data.documentos_aportados)
    tp_txt = f", TP. {data.tp_solicitante}" if data.tp_solicitante else ""
    p2 = (
        f"Que el(la) señor(a) {data.nombre_solicitante}, identificado(a) con "
        f"{data.tipo_doc_solicitante or 'CC'} No. {data.cedula_solicitante}{tp_txt}, actuando "
        f"en calidad de apoderado del señor(a) {data.nombre_propietario}, identificado con C.C. "
        f"{data.cedula_propietario}, propietario del inmueble identificado con número predial "
        f"{data.numero_predial}, inscrito en la base de datos catastral del municipio de {mun}, "
        f"presentó ante la Oficina de atención al público una solicitud de trámite catastral, "
        f"consistente en Cambio de propietario, soportada en los siguientes documentos "
        f"aportados: {docs}."
    )
    return "\n\n".join([_P1_PRIMERA, p2, _P3_PRIMERA, _p4_primera(mun)])

def _demo_primera_oficio(data: SolicitudUnificada) -> str:
    mun  = _municipio(data)
    docs = ", ".join(data.documentos_aportados)
    p2 = (
        f"Ante la Oficina de Catastro de atención al público adscrita a la Secretaria de "
        f"Planeación del municipio de {mun}, de oficio se inició la actualización catastral "
        f"del inmueble con número predial {data.numero_predial}, inscrito en la base de datos "
        f"catastral del municipio de {mun}, consistente en cambio de propietario, conforme a "
        f"la documentación registral aportada: {docs}."
    )
    return "\n\n".join([_P1_PRIMERA, p2, _P3_PRIMERA, _p4_primera(mun)])

def _demo_primera_snr(data: SolicitudUnificada) -> str:
    mun  = _municipio(data)
    docs = ", ".join(data.documentos_aportados)
    p2 = (
        f"Que teniendo en cuenta la interrelación catastro-registro y la colaboración armónica "
        f"que entre estas existe, la Superintendencia de Notariado y Registro del circuito de "
        f"{mun}, suministra información para realizar el debido estudio jurídico, con el fin de "
        f"inscribir en la base catastral del municipio de {mun} las respectivas mutaciones. "
        f"La oficina de catastro radicó con el número de radicado {data.numero_radicado or 'N/A'}, "
        f"una mutación de primera clase sobre el predio identificado con numero predial "
        f"{data.numero_predial}, soportada en los siguientes documentos justificativos: {docs}."
    )
    return "\n\n".join([_P1_PRIMERA, p2, _P3_PRIMERA, _p4_primera(mun)])

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
        snr_p2 = (
            f"Que teniendo en cuenta la interrelación catastro-registro y la colaboración "
            f"armónica que entre estas existe, la Superintendencia de Notariado y Registro del "
            f"circuito de {mun}, suministra información para realizar el debido estudio jurídico, "
            f"con el fin de inscribir en la base catastral del municipio de {mun} las respectivas "
            f"mutaciones. La oficina de catastro radicó con el número de radicado "
            f"{data.numero_radicado or 'N/A'}, una mutación de tercera clase sobre el predio "
            f"identificado con numero predial {data.numero_predial}, soportada en los siguientes "
            f"documentos justificativos: {docs}."
        )
        return (
            snr_p2
            + f"\n\n"
            + f"Que en atención a la solicitud presentada se realizó la verificación de la "
            f"documentación aportada y visita técnica, se concluye que se procede a incorporar el "
            f"elemento constructivo al predio con referencia catastral No. {data.numero_predial}, "
            f"para un total de área construida de {data.area_construida_m2} metros cuadrados sobre "
            f"un área de terreno de {data.area_terreno_m2} metros cuadrados."
            + f"\n\n"
            + f"Que, revisados los antecedentes catastrales del municipio de {mun}, verificada la "
            f"documentación aportada por el(la) solicitante, se procede a la validación "
            f"correspondiente en los términos del artículo 2.2.2.2.6. del Decreto 1170 de 2015, "
            f"modificado por el Decreto 148 de 2020, se pudo establecer que para el predio con "
            f"referencia catastral predial {data.numero_predial} procede la mutación de tercera "
            f"clase, por incorporar o modificar las unidades y su correspondiente inscripción en el "
            f"catastro, conforme lo indica el artículo 4.5.1 numeral 3 de la Resolución 1040 de "
            f"2023, en concordancia del artículo 2.2.2.2.2 literal C del Decreto 1170 de 2015, "
            f"modificado por el Decreto 148 de 2020."
        )
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


# ── Rectificación ────────────────────────────────────────────────────────────

_P1_RECTIFICACION = (
    "Que la Resolución 1040 de 2023 del Instituto Geográfico Agustín Codazzi (IGAC), en su "
    "artículo 4.5.4 numeral 1, señala que los errores en la inscripción catastral que no "
    "corresponden con la realidad del predio."
)

def _p3_rectificacion(data: SolicitudUnificada) -> str:
    campo = data.campo_rectificado or "el(la)"
    return (
        f"De acuerdo con el estudio realizado, se procede a rectificar {campo} del predio en "
        f"mención, soportada en el certificado tradición y libertad {data.folio_matricula}."
    )

def _p4_rectificacion(data: SolicitudUnificada, mun: str) -> str:
    campo = data.campo_rectificado or "el(la)"
    return (
        f"Que, revisados los antecedentes catastrales del municipio de {mun}, verificada la "
        f"documentación aportada por el(la) solicitante, así como la validación correspondiente "
        f"a través de la aplicación combinada de métodos INDIRECTO y DECLARATIVO-COLABORATIVO, "
        f"en los términos del artículo 2.2.2.2.6. del Decreto 1170 de 2015, modificado por el "
        f"Decreto 148 de 2020, que procede la rectificación de {campo}, del presente acto y su "
        f"correspondiente inscripción en el catastro, conforme lo indican en los artículos 4.5.4 "
        f"y 4.6.8 de la Resolución 1040 de 2023, en concordancia del artículo 2.2.2.2.2 literal "
        f"C del 1170 de 2015, modificado por el Decreto 148 de 2020."
    )

_P5_RECTIFICACION = (
    "Que la rectificación ordenada hace alusión a una corrección simplemente formal, la cual "
    "no modifica el avalúo catastral del predio objeto de esta."
)

def _demo_rectificacion_propietario(data: SolicitudUnificada) -> str:
    mun  = _municipio(data)
    docs = ", ".join(data.documentos_aportados)
    p2 = (
        f"Que el(la) señor(a) {data.nombre_propietario}, identificado(a) con "
        f"C.C. No. {data.cedula_propietario}, en su condición de propietario del inmueble con "
        f"número predial {data.numero_predial} inscrito en la base de datos catastral, presentó "
        f"ante la Oficina de Catastro adscrita a la Secretaria de Planeación del municipio de "
        f"{mun}, el trámite catastral correspondiente a rectificación general de datos del "
        f"referido predio, soportada en los siguientes documentos aportados: {docs}."
    )
    return "\n\n".join([_P1_RECTIFICACION, p2, _p3_rectificacion(data), _p4_rectificacion(data, mun), _P5_RECTIFICACION])

def _demo_rectificacion_autorizado(data: SolicitudUnificada) -> str:
    mun  = _municipio(data)
    docs = ", ".join(data.documentos_aportados)
    p2 = (
        f"Que el(la) señor(a) {data.nombre_solicitante}, identificado(a) con "
        f"CC. No. {data.cedula_solicitante}, en su condición de contacto y/o autorizado del "
        f"(la) señor(a) {data.nombre_propietario} identificado(a) con C.C. "
        f"{data.cedula_propietario} propietario del inmueble identificado con número predial "
        f"{data.numero_predial} inscrito en la base de datos catastral, presentó ante la "
        f"Oficina de Catastro adscrita a la Secretaria de Planeación del municipio de {mun}, "
        f"el trámite catastral correspondiente a rectificación general de datos del referido "
        f"predio, soportada en los siguientes documentos aportados: {docs}."
    )
    return "\n\n".join([_P1_RECTIFICACION, p2, _p3_rectificacion(data), _p4_rectificacion(data, mun), _P5_RECTIFICACION])

def _demo_rectificacion_oficio(data: SolicitudUnificada) -> str:
    mun  = _municipio(data)
    docs = ", ".join(data.documentos_aportados)
    p2 = (
        f"Ante la Oficina de Catastro de atención al público adscrita a la secretaria de "
        f"Planeación del municipio de {mun}, se presentó una solicitud de trámite catastral "
        f"consistente en rectificación de datos, del inmueble con número predial "
        f"{data.numero_predial}, inscrito en la base de datos catastral del municipio de {mun}, "
        f"soportada en los siguientes documentos aportados: {docs}."
    )
    return "\n\n".join([_P1_RECTIFICACION, p2, _p3_rectificacion(data), _p4_rectificacion(data, mun), _P5_RECTIFICACION])


# ── Complementación ──────────────────────────────────────────────────────────

_P1_COMPLEMENTACION = (
    "Que la Resolución 1040 de 2023 del Instituto Geográfico Agustín Codazzi (IGAC), en su "
    "artículo 4.5.4 numeral 1, señala que los errores en la inscripción catastral que no "
    "corresponden con la realidad del predio."
)

_P4_COMPLEMENTACION = (
    "Que, revisados los antecedentes catastrales del municipio de {mun}, verificada la "
    "documentación aportada por el(la) solicitante, así como la validación correspondiente "
    "a través de la aplicación combinada de métodos INDIRECTO y DECLARATIVO-COLABORATIVO, "
    "en los términos del artículo 2.2.2.2.6. del Decreto 1170 de 2015, modificado por el "
    "Decreto 148 de 2020, procede a la complementación y su correspondiente inscripción en "
    "el catastro, conforme lo indican en los artículos 4.5.5 de la Resolución 1040 de 2023, "
    "en concordancia del artículo 2.2.2.2.2 literal C del 1170 de 2015, modificado por el "
    "Decreto 148 de 2020."
)

_P5_COMPLEMENTACION = (
    "Que la complementación ordenada hace alusión a una corrección simplemente formal, la "
    "cual no modifica el avalúo catastral del predio objeto de esta."
)

def _demo_complementacion_propietario(data: SolicitudUnificada) -> str:
    mun   = _municipio(data)
    docs  = ", ".join(data.documentos_aportados)
    campo = data.campo_complementado or ""
    p2 = (
        f"Que el(la) señor(a) {data.nombre_propietario}, identificado(a) con "
        f"C.C. No. {data.cedula_propietario}, en calidad de propietario(a) del predio "
        f"identificado catastralmente con {data.numero_predial}, inscrito en la base de datos "
        f"catastral, presentó ante la Oficina de Catastro adscrita a la Secretaria de "
        f"Planeación del municipio de {mun}, el trámite catastral correspondiente a "
        f"complementación de datos bajo el radicado {data.numero_radicado or 'N/A'}, soportada "
        f"en los siguientes documentos aportados: {docs}, con folio de matrícula inmobiliaria "
        f"{data.folio_matricula}."
    )
    p3 = (
        f"Que de acuerdo con el estudio de los documentos jurídicos se verifica por parte del "
        f"operador que procede un trámite de complementación de(la) {campo}."
    )
    return "\n\n".join([_P1_COMPLEMENTACION, p2, p3, _P4_COMPLEMENTACION.format(mun=mun), _P5_COMPLEMENTACION])

def _demo_complementacion_snr(data: SolicitudUnificada) -> str:
    mun  = _municipio(data)
    docs = ", ".join(data.documentos_aportados)
    p2 = (
        f"Que teniendo en cuenta la interrelación catastro-registro y la colaboración armónica "
        f"que entre estas existe, la superintendencia de notariado y registro del circuito de "
        f"{mun}, suministró información para realizar el debido estudio jurídico, con el fin de "
        f"inscribir en la base catastral del municipio de {mun}, las respectivas mutaciones. "
        f"La oficina de catastro radico con el número {data.numero_radicado or 'N/A'}, el "
        f"{data.numero_predial}, con el(los) siguiente(s) documento(s) aportado(s) por la "
        f"oficina de instrumentos públicos: {docs}."
    )
    p3 = (
        f"De acuerdo con el estudio de los documentos jurídicos y revisada la información "
        f"vigente en el folio de matrícula inmobiliaria {data.folio_matricula}, se procede a "
        f"realizar la respectiva complementación."
    )
    return "\n\n".join([_P1_COMPLEMENTACION, p2, p3, _P4_COMPLEMENTACION.format(mun=mun), _P5_COMPLEMENTACION])


# ── Artículos finales ─────────────────────────────────────────────────────────

def _articulos_finales(tipo: str, mun: str) -> str:
    art2 = (
        "ARTICULO SEGUNDO: La inscripción ordenada en el artículo anterior se realizará de "
        "conformidad con lo dispuesto en el capítulo 6, artículos 4.6.1 y subsiguientes de la "
        "Resolución 1040 de 2023 expedida por el IGAC."
    )
    art5 = (
        f"ARTÍCULO QUINTO: La información física, jurídica y económica, aplicada al predio "
        f"objeto de esta resolución, entrará en vigencia para efectos catastrales al momento de "
        f"quedar en firme su inscripción o incorporación en las bases catastrales del municipio "
        f"de {mun}."
    )
    art6 = (
        f"ARTÍCULO SEXTO: REMITIR copia del acto administrativo, cuando quede en firme, a la "
        f"Dirección de Rentas del municipio de {mun} para la actualización de la información "
        f"para fines fiscales y tributarios."
    )
    if tipo == "notificable":
        art3 = (
            "ARTÍCULO TERCERO: La notificación de la presente resolución se realizará conforme "
            "lo dispuesto en el inciso 3 del artículo 4.8.2 de la Resolución 1040 de 2023, del "
            "Instituto Geográfico Agustín Codazzi."
        )
        art4 = (
            "ARTÍCULO CUARTO: Contra la presente resolución procede el recurso de reposición "
            "ante el secretario de Planeación, y el recurso de apelación se podrá interponer "
            "directamente o como subsidiario al de reposición ante el superior inmediato, dentro "
            "de los diez (10) días siguientes a la notificación, de conformidad a los artículos "
            "76 y 77 de la Ley 1437 de 2011 y lo dispuesto en artículo 4.8.4 de la Resolución "
            "1040 de 2023. Cuando sea rechazado el recurso de apelación procede el recurso de "
            "queja de conformidad con lo establecido en el artículo 74 y siguientes de la Ley "
            "1437 de 2011. Recursos que se concederán en efecto suspensivo."
        )
    else:  # no_notificable
        art3 = (
            "ARTÍCULO TERCERO: La notificación de la presente resolución se realizará conforme "
            "lo dispuesto en el inciso 1 y 2 del artículo 4.8.2 de la Resolución 1040 de 2023, "
            "del Instituto Geográfico Agustín Codazzi."
        )
        art4 = (
            "ARTÍCULO CUARTO: Contra el presente acto administrativo no procede recurso alguno, "
            "conforme lo preceptúa el artículo 4.8.5 de la Resolución 1040 de 2023 y el artículo "
            "75 de la Ley 1437 de 2011."
        )
    return "\n\n".join([art2, art3, art4, art5, art6, "COMUNÍQUESE Y CÚMPLASE"])


def _motivada_demo(data: SolicitudUnificada) -> str:
    if data.tipo_mutacion == "primera_clase":
        if data.tipo_origen == "autorizado":
            return _demo_primera_autorizado(data)
        elif data.tipo_origen == "poder":
            return _demo_primera_poder(data)
        elif data.tipo_origen == "snr":
            return _demo_primera_snr(data)
        elif data.tipo_origen == "oficio":
            return _demo_primera_oficio(data)
        else:
            return _demo_primera_propietario(data)
    elif data.tipo_mutacion == "rectificacion":
        if data.tipo_origen == "autorizado":
            return _demo_rectificacion_autorizado(data)
        elif data.tipo_origen == "oficio":
            return _demo_rectificacion_oficio(data)
        else:
            return _demo_rectificacion_propietario(data)
    elif data.tipo_mutacion == "complementacion":
        if data.tipo_origen == "snr":
            return _demo_complementacion_snr(data)
        else:
            return _demo_complementacion_propietario(data)
    else:  # tercera_clase
        return _demo_tercera(data)


# ── Sistema prompt para Claude ───────────────────────────────────────────────
SYSTEM_PROMPT = """
Eres experto en catastro colombiano. Redactas motivadas siguiendo la Resolución 1040 de 2023
del IGAC, el Decreto 1170 de 2015 y el Decreto 148 de 2020.

Para mutaciones de PRIMERA CLASE genera exactamente 4 párrafos "Que...":
1. Base legal: artículo 4.5.1 numeral 1 de la Resolución 1040 de 2023 (cambio de propietario).
2. Identificación del solicitante/propietario según el origen (propietario, autorizado, apoderado o SNR), con número predial y municipio, y documentos aportados.
3. Consecuencia: procede mutación de primera conforme artículos 4.5.1 y 4.6.1 de la Resolución 1040 de 2023.
4. Conclusión: revisados antecedentes del municipio, procede la mutación de primera.

Para mutaciones de TERCERA CLASE genera 3 párrafos "Que...":
1. Identificación del solicitante con folio de matrícula, número predial, municipio y documentos aportados.
2. Verificación documental y visita técnica: área construida y área de terreno.
3. Validación conforme Decreto 1170 de 2015 y Resolución 1040 de 2023 artículo 4.5.1 numeral 3.

Sin títulos, sin markdown, párrafos separados por doble salto de línea.
Lenguaje formal administrativo colombiano. Máximo 500 palabras.
"""

def generate_motivada(data: SolicitudUnificada) -> dict:
    from services.ai_provider import call_ai, active_provider
    tokens = 0
    if active_provider() == "demo":
        texto = _motivada_demo(data)
    else:
        try:
            messages = [{"role": "user", "content": str(data.model_dump())}]
            texto, tokens = call_ai(messages, SYSTEM_PROMPT, max_tokens=1200)
        except Exception:
            texto = _motivada_demo(data)

    articulos = None
    if data.tipo_notificacion:
        articulos = _articulos_finales(data.tipo_notificacion, _municipio(data))

    return {"texto_motivada": texto, "tokens_usados": tokens, "articulos_finales": articulos}
