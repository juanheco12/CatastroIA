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

def _lista_y(items: list[str]) -> str:
    """Une una lista al estilo español: 'a, b y c'."""
    items = [i for i in items if i]
    if not items:
        return ""
    if len(items) == 1:
        return items[0]
    return ", ".join(items[:-1]) + f" y {items[-1]}"

_DOC_LABELS = {"CC": "C.C.", "NIT": "NIT.", "CE": "C.E.", "TI": "T.I.", "PA": "Pasaporte"}

def _doc_solicitante(data: SolicitudUnificada) -> str:
    return _DOC_LABELS.get(data.tipo_doc_solicitante or "CC", "C.C.")

def _doc_propietario(data: SolicitudUnificada) -> str:
    """Etiqueta del tipo de documento del propietario/poseedor (C.C., NIT., etc.)
    según lo elegido en el formulario; por defecto NIT para representante legal
    (el propietario es una empresa) y C.C. en el resto de los casos."""
    default = "NIT" if data.tipo_origen == "representante_legal" else "CC"
    return _DOC_LABELS.get(data.tipo_doc_propietario or default, _DOC_LABELS[default])

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
    "1040 de 2023, por la cual se expide la resolución única de la gestión catastral "
    "multipropósito, el artículo 4.6.1 y subsiguientes de la resolución vigente sobre los "
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
        f"Que el(la) señor(a) {data.nombre_propietario}, identificado(a) con {_doc_propietario(data)} No. "
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
        f"Que el(la) señor(a) {data.nombre_solicitante}, identificado(a) con {_doc_solicitante(data)} No. "
        f"{data.cedula_solicitante}, en su condición de autorizado del señor(a) "
        f"{data.nombre_propietario}, identificado con {_doc_propietario(data)} {data.cedula_propietario}, propietario "
        f"del inmueble identificado con número predial {data.numero_predial}, inscrito en la base "
        f"de datos catastral del municipio de {mun}, presentó ante la Oficina de atención al "
        f"público una solicitud de trámite catastral, consistente en Cambio de propietario, "
        f"soportada en los siguientes documentos aportados: {docs}."
    )
    return "\n\n".join([_P1_PRIMERA, p2, _P3_PRIMERA, _p4_primera(mun)])

def _demo_primera_representante_legal(data: SolicitudUnificada) -> str:
    mun  = _municipio(data)
    docs = ", ".join(data.documentos_aportados)
    p2 = (
        f"Que el(la) señor(a) {data.nombre_solicitante}, identificado(a) con {_doc_solicitante(data)} No. "
        f"{data.cedula_solicitante}, en su condición de representante legal del (la) señor(a) "
        f"{data.nombre_propietario}, identificado con {_doc_propietario(data)} {data.cedula_propietario}, propietario "
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
        f"en calidad de apoderado del señor(a) {data.nombre_propietario}, identificado con {_doc_propietario(data)} "
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
    p_snr = (
        f"Que teniendo en cuenta la interrelación catastro-registro y la colaboración armónica "
        f"que entre estas existe, la Superintendencia de Notariado y Registro del circuito de "
        f"{mun}, suministró información para realizar el debido estudio jurídico, con el fin de "
        f"inscribir en la base catastral del municipio de {mun} las respectivas mutaciones. "
        f"La oficina de catastro radicó con el número {data.numero_radicado or 'N/A'}, "
        f"el predio {data.numero_predial}, con el(los) siguiente(s) documento(s) aportado(s) "
        f"por oficina de instrumentos públicos: {docs}."
    )
    consulta  = getattr(data, 'numero_consulta',  None) or 'N/A'
    anotacion = getattr(data, 'numero_anotacion', None) or 'N/A'
    p_consulta = (
        f"Que revisada la información vigente según la consulta No. {consulta} de la ventanilla "
        f"única de registro en el folio de matrícula inmobiliaria {data.folio_matricula}, "
        f"se procede a realizar el respectivo cambio de propietario de conformidad con la "
        f"anotación No. {anotacion}."
    )
    return "\n\n".join([_P1_PRIMERA, p_snr, p_consulta, _P3_PRIMERA, _p4_primera(mun)])

def _demo_tercera(data: SolicitudUnificada) -> str:
    mun  = _municipio(data)
    docs = ", ".join(data.documentos_aportados)

    # Opening paragraph varies by origin
    if data.tipo_origen == "autorizado":
        apertura = (
            f"Que el(la) señor(a) {data.nombre_solicitante}, identificado(a) con {_doc_solicitante(data)} NO. "
            f"{data.cedula_solicitante}, en su condición de contacto y/o autorizado del señor(a) "
            f"{data.nombre_propietario}, identificado con {_doc_propietario(data)} {data.cedula_propietario},"
        )
    elif data.tipo_origen == "poder":
        tp_txt = f", TP. {data.tp_solicitante}" if data.tp_solicitante else ""
        apertura = (
            f"Que el(la) señor(a) {data.nombre_solicitante}, identificado(a) con "
            f"{_doc_solicitante(data)} NO. {data.cedula_solicitante}{tp_txt}, "
            f"en su condición de apoderado del señor(a) {data.nombre_propietario}, "
            f"identificado con {_doc_propietario(data)} {data.cedula_propietario},"
        )
    elif data.tipo_origen == "snr":
        snr_p2 = (
            f"Que teniendo en cuenta la interrelación catastro-registro y la colaboración "
            f"armónica que entre estas existe, la Superintendencia de Notariado y Registro del "
            f"circuito de {mun}, suministra información para realizar el debido estudio jurídico, "
            f"con el fin de inscribir en la base catastral del municipio de {mun} las respectivas "
            f"mutaciones. La oficina de catastro radicó con el número de radicado "
            f"{data.numero_radicado or 'N/A'}"
            + (f", anotación No. {data.numero_anotacion}" if getattr(data, 'numero_anotacion', None) else "")
            + f", una mutación de tercera clase sobre el predio "
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
            f"Que el(la) señor(a) {data.nombre_propietario}, identificado(a) con {_doc_propietario(data)} No. "
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


# ── Segunda Clase (desenglobe) ───────────────────────────────────────────────
# Texto literal reutilizado de motivadas reales aprobadas: esta categoría
# nunca pasa por el LLM (ver generate_motivada), solo sustitución de campos.

_P1_SEGUNDA = (
    "Que la Resolución 1040 de 2023 del Instituto Geográfico Agustín Codazzi (IGAC), en el "
    "artículo 4.5.1 numeral 2) señala que las mutaciones de segunda clase, son aquellas que "
    "involucran cambios en los linderos de los predios por agregación o segregación o en las "
    "que se modifiquen los coeficientes de copropiedad en predios sujetos al régimen de "
    "propiedad horizontal."
)

def _p3_segunda(data: SolicitudUnificada, mun: str) -> str:
    return (
        f"Que la descripción de los linderos del(los) predios identificado(s) con número "
        f"predial {data.numero_predial} (los) cuales se crean en el presente acto "
        f"administrativo son acorde con la realidad física del(los) inmueble(s) y la "
        f"Escritura pública {data.numero_escritura} del {data.fecha_escritura} de la "
        f"{data.notaria}, que el(las) área(s) de terreno relacionada(s) en la escritura antes "
        f"mencionada es(son) congruente(s) con el(las) área(s) producto de la restitución "
        f"cartográfica digital para estos predios."
    )

def _p4_segunda(mun: str) -> str:
    return (
        f"Que el software de gestión catastral, con el cual se administra la base de datos "
        f"catastral del municipio de {mun}, recalcula las áreas de terreno geográficas y las "
        f"adopta como las áreas definitivas de los predios resultantes, corrigiendo, si es el "
        f"caso las disparidades que se encuentren en los mismos."
    )

def _p5_segunda(mun: str) -> str:
    return (
        f"Que, revisados los antecedentes catastrales del municipio de {mun}, verificada la "
        f"documentación aportada por el(la) solicitante, por parte de un funcionario de esta "
        f"entidad, así como la validación correspondiente de la información que reposa en la "
        f"base catastral a través de la aplicación combinada de métodos DIRECTO, INDIRECTO y "
        f"COLABORATIVO, en los términos del artículo 2.2.2.2.6. del Decreto 1170 de 2015, "
        f"modificado por el Decreto 148 de 2020, que procede la mutación de segunda clase, por "
        f"desenglobe y su correspondiente inscripción en el catastro."
    )

def _demo_segunda_propietario(data: SolicitudUnificada) -> str:
    mun    = _municipio(data)
    docs   = ", ".join(data.documentos_aportados)
    folios = _lista_y(data.folios_resultantes)
    p2 = (
        f"Que el(la) señor(a) {data.nombre_propietario}, identificado(a) con "
        f"{_doc_propietario(data)} No. {data.cedula_propietario}, propietario del inmueble con matrícula "
        f"inmobiliaria No. {data.folio_matricula}, segregado del folio matriz "
        f"{data.folio_matriz}, vinculado al número predial {data.numero_predial} inscrito en "
        f"la base de datos catastral, presento ante la Oficina de Catastro adscrita a la "
        f"secretaria de Planeación del municipio de {mun}, solicitud de trámite catastral de "
        f"mutación de segunda clase desenglobe de los folios de matrícula inmobiliaria "
        f"{folios}, soportada en los siguientes documentos aportados: {docs}."
    )
    return "\n\n".join([_P1_SEGUNDA, p2, _p3_segunda(data, mun), _p4_segunda(mun), _p5_segunda(mun)])

def _demo_segunda_poder(data: SolicitudUnificada) -> str:
    mun    = _municipio(data)
    docs   = ", ".join(data.documentos_aportados)
    folios = _lista_y(data.folios_resultantes)
    tp_txt = f", TP. {data.tp_solicitante}" if data.tp_solicitante else ""
    p2 = (
        f"Que el(la) señor(a) {data.nombre_solicitante}, identificado(a) con "
        f"{_doc_solicitante(data)} No. {data.cedula_solicitante}"
        f"{tp_txt}, en calidad de apoderado del señor(a) {data.nombre_propietario}, "
        f"identificado con {_doc_propietario(data)} {data.cedula_propietario}, propietario del inmueble con "
        f"matrícula inmobiliaria No. {data.folio_matricula}, segregado del folio matriz "
        f"{data.folio_matriz}, vinculado al número predial {data.numero_predial} inscrito en "
        f"la base de datos catastral, presento ante la Oficina de Catastro adscrita a la "
        f"secretaria de Planeación del municipio de {mun}, solicitud de trámite catastral de "
        f"mutación de segunda clase desenglobe de los folios de matrícula inmobiliaria "
        f"{folios}, soportada en los siguientes documentos aportados: {docs}."
    )
    return "\n\n".join([_P1_SEGUNDA, p2, _p3_segunda(data, mun), _p4_segunda(mun), _p5_segunda(mun)])

def _demo_segunda_autorizado(data: SolicitudUnificada) -> str:
    mun    = _municipio(data)
    docs   = ", ".join(data.documentos_aportados)
    folios = _lista_y(data.folios_resultantes)
    p2 = (
        f"Que el(la) señor(a) {data.nombre_solicitante}, identificado(a) con "
        f"{_doc_solicitante(data)} No. {data.cedula_solicitante}, en condición de contacto y/o autorizado "
        f"del señor(a) {data.nombre_propietario}, identificado con {_doc_propietario(data)} {data.cedula_propietario}, "
        f"propietario del inmueble con matrícula inmobiliaria No. {data.folio_matricula}, "
        f"segregado del folio matriz {data.folio_matriz}, vinculado al número predial "
        f"{data.numero_predial} inscrito en la base de datos catastral, presento ante la "
        f"Oficina de Catastro adscrita a la secretaria de Planeación del municipio de {mun}, "
        f"solicitud de trámite catastral de mutación de segunda clase desenglobe de los "
        f"folios de matrícula inmobiliaria {folios}, soportada en los siguientes documentos "
        f"aportados: {docs}."
    )
    return "\n\n".join([_P1_SEGUNDA, p2, _p3_segunda(data, mun), _p4_segunda(mun), _p5_segunda(mun)])

def _demo_segunda_oficio(data: SolicitudUnificada) -> str:
    mun    = _municipio(data)
    docs   = ", ".join(data.documentos_aportados)
    folios = _lista_y(data.folios_resultantes)
    p2 = (
        f"Que la oficina de catastro, adscrita a la secretaria de planeación, se radica de "
        f"manera oficiosa un trámite catastral el cual consiste en una mutación de segunda "
        f"clase, desenglobe, de los folios de matrícula inmobiliaria {folios}, soportada en "
        f"los siguientes documentos aportados: {docs}."
    )
    return "\n\n".join([_P1_SEGUNDA, p2, _p3_segunda(data, mun), _p4_segunda(mun), _p5_segunda(mun)])

def _demo_segunda(data: SolicitudUnificada) -> str:
    if data.tipo_origen == "poder":
        return _demo_segunda_poder(data)
    elif data.tipo_origen == "autorizado":
        return _demo_segunda_autorizado(data)
    elif data.tipo_origen == "oficio":
        return _demo_segunda_oficio(data)
    else:
        return _demo_segunda_propietario(data)


# ── Cancelación de inscripción catastral ─────────────────────────────────────
# Texto literal reutilizado de motivadas reales aprobadas: esta categoría
# nunca pasa por el LLM (ver generate_motivada), solo sustitución de campos.

_P1_CANCELACION = (
    "Que la Resolución 1040 de 2023 del Instituto Geográfico Agustín Codazzi (IGAC), en su "
    "artículo 4.5.6, señala que en caso de que se deba cancelar o cambiar un predio de una "
    "entidad territorial a otra, ya sea por solicitud de parte o orden judicial o "
    "administrativa, se procederá a cancelar el predio en la base de datos catastral "
    "correspondiente y a inscribirlo en la base de datos catastral respectiva, manteniendo "
    "la trazabilidad con el número predial anterior."
)

def _p3_cancelacion(data: SolicitudUnificada) -> str:
    return (
        f"Que, en atención a la solicitud presentada y una vez verificada la documentación "
        f"aportada, se determina que procede la cancelación del predio identificado con "
        f"referencia catastral {data.numero_predial}."
    )

def _p4_cancelacion(data: SolicitudUnificada) -> str:
    ref_nueva = data.numero_predial_nuevo or "N/A"
    return (
        f"Lo anterior, teniendo en cuenta que en la base catastral figura el(la) señor(a) "
        f"{data.nombre_propietario} como poseedor(a) de la mejora objeto de cancelación, la "
        f"cual hace parte de la manzana correspondiente al predio de mayor extensión. "
        f"Asimismo, se constató que el(la) señor(a) {data.nombre_propietario} ya se "
        f"encuentra inscrito(a) como poseedor(a) de la mejora identificada con referencia "
        f"catastral {ref_nueva}."
    )

def _p5_cancelacion(data: SolicitudUnificada) -> str:
    return (
        f"En consecuencia, mediante el acto administrativo que resuelva el presente "
        f"radicado, en su artículo primero se dispondrá la cancelación de la mejora antes "
        f"mencionada, con efectos a partir del {data.fecha_efectos}."
    )

def _p6_cancelacion(mun: str) -> str:
    return (
        f"Que el sistema de gestión catastral, con el cual se administra la base de datos "
        f"catastral del municipio de {mun}, recalcula las áreas de terreno geográficas y las "
        f"adopta como las áreas definitivas de los predios resultantes, corrigiendo, si es el "
        f"caso las disparidades que se encuentren en los mismos."
    )

def _p7_cancelacion(data: SolicitudUnificada, mun: str) -> str:
    return (
        f"Que, revisados los antecedentes catastrales del municipio de {mun}, verificada la "
        f"documentación aportada por el(la) solicitante, así como la validación "
        f"correspondiente a través de la aplicación del método DIRECTO, en los términos del "
        f"artículo 2.2.2.2.6. del Decreto 1170 de 2015, modificado por el Decreto 148 de "
        f"2020, que procede la cancelación de inscripción catastral del predio con "
        f"referencia No. {data.numero_predial}, conforme lo indican en los artículos 4.5.6 y "
        f"4.6.10 de la Resolución 1040 de 2023, en concordancia con el artículo 2.2.2.2 "
        f"literal C del 1170 de 2015, modificado por el Decreto 148 de 2020."
    )

def _demo_cancelacion_propietario(data: SolicitudUnificada) -> str:
    mun  = _municipio(data)
    docs = ", ".join(data.documentos_aportados)
    p2 = (
        f"Que el(la) señor(a) {data.nombre_propietario}, identificado(a) con {_doc_propietario(data)} "
        f"{data.cedula_propietario}, en su condición de poseedor(a) del inmueble con número "
        f"predial {data.numero_predial}, inscrito en la base de datos catastral, solicita "
        f"ante la Oficina de Catastro adscrita a la secretaria de Planeación del municipio "
        f"de {mun}, un trámite catastral correspondiente a cancelación de inscripción "
        f"catastral, soportada en los siguientes documentos aportados: {docs}."
    )
    return "\n\n".join([
        _P1_CANCELACION, p2, _p3_cancelacion(data), _p4_cancelacion(data),
        _p5_cancelacion(data), _p6_cancelacion(mun), _p7_cancelacion(data, mun),
    ])

def _demo_cancelacion_poder(data: SolicitudUnificada) -> str:
    mun  = _municipio(data)
    docs = ", ".join(data.documentos_aportados)
    p2 = (
        f"Que el(la) señor(a) {data.nombre_solicitante}, identificado(a) con {_doc_solicitante(data)} "
        f"{data.cedula_solicitante}, quien actúa como apoderado del señor(a) "
        f"{data.nombre_propietario}, identificado con {_doc_propietario(data)} {data.cedula_propietario}, en su "
        f"condición de poseedor(a) del inmueble con número predial {data.numero_predial}, "
        f"inscrito en la base de datos catastral, solicita ante la Oficina de Catastro "
        f"adscrita a la secretaria de Planeación del municipio de {mun}, un trámite "
        f"catastral correspondiente a cancelación de inscripción catastral, soportada en "
        f"los siguientes documentos aportados: {docs}."
    )
    return "\n\n".join([
        _P1_CANCELACION, p2, _p3_cancelacion(data), _p4_cancelacion(data),
        _p5_cancelacion(data), _p6_cancelacion(mun), _p7_cancelacion(data, mun),
    ])

def _demo_cancelacion_oficio(data: SolicitudUnificada) -> str:
    mun  = _municipio(data)
    docs = ", ".join(data.documentos_aportados)
    p2 = (
        f"Que, la Oficina de Catastro adscrita a la secretaria de Planeación del municipio "
        f"de {mun}, se radica de manera oficiosa un trámite catastral que corresponde a una "
        f"cancelación de inscripción catastral, sobre el predio identificado con referencia "
        f"catastral {data.numero_predial}, soportada en los siguientes documentos: {docs}."
    )
    return "\n\n".join([
        _P1_CANCELACION, p2, _p3_cancelacion(data), _p4_cancelacion(data),
        _p5_cancelacion(data), _p6_cancelacion(mun), _p7_cancelacion(data, mun),
    ])

def _demo_cancelacion(data: SolicitudUnificada) -> str:
    if data.tipo_origen == "poder":
        return _demo_cancelacion_poder(data)
    elif data.tipo_origen == "oficio":
        return _demo_cancelacion_oficio(data)
    else:
        return _demo_cancelacion_propietario(data)


# ── Cuarta Clase (revisión de avalúo catastral) ──────────────────────────────
# El párrafo de apertura y el de cierre son fijos (artículo 4.7.4 de la
# Resolución 1040 de 2023). El cuerpo intermedio no sale de un párrafo legal
# fijo: lo aporta el estudio económico/informe técnico, y el usuario elige
# qué párrafos se incorporan (parrafos_informe_tecnico). Por eso esa parte
# tampoco pasa por el LLM: el texto se inserta tal cual lo eligió el usuario,
# sin que la IA lo reescriba.

_P1_CUARTA = (
    "Que la Resolución 1040 de 2023 del Instituto Geográfico Agustín Codazzi (IGAC), en el "
    "capítulo 7 artículo 4.7.4 revisión del avalúo catastral, considera que el propietario, "
    "poseedor o las entidades encargadas de funciones relacionadas con la tierra, podrán "
    "solicitar la revisión del avalúo catastral del predio de interés a partir del día "
    "siguiente a la fecha de la resolución que inscriba el predio o el acto que haya "
    "modificado el avalúo en el catastro."
)

_P1B_CUARTA = (
    "Esta solicitud puede realizarse independientemente del proceso catastral por el que se "
    "determinó el avalúo a revisar. En la solicitud de revisión, el solicitante deberá "
    "indicar la o las vigencias sobre las cuales hace la petición y las pruebas presentadas "
    "deben corresponder específicamente a dichas vigencias. Los avalúos resultantes del "
    "trámite de la solicitud tendrán la vigencia fiscal que se indique en el acto "
    "administrativo en firme, correspondiente a las vigencias objeto de la solicitud."
)

def _apertura_cuarta(data: SolicitudUnificada, mun: str) -> str:
    docs = ", ".join(data.documentos_aportados)
    direccion_txt = f", ubicado en {data.direccion_predio}" if data.direccion_predio else ""
    if data.tipo_origen == "poder":
        tp_txt = f", TP. {data.tp_solicitante}" if data.tp_solicitante else ""
        return (
            f"Que el(la) señor(a) {data.nombre_solicitante}, identificado(a) con "
            f"{_doc_solicitante(data)} {data.cedula_solicitante}{tp_txt}, quien "
            f"actúa en calidad de apoderado del señor(a) {data.nombre_propietario} en su "
            f"condición de propietario, del inmueble con número predial "
            f"{data.numero_predial}{direccion_txt} de la zona urbana del municipio de {mun} "
            f"con matrícula inmobiliaria {data.folio_matricula}, inscrito en la base de datos "
            f"catastral de la Secretaría de Planeación del municipio de {mun}, el trámite "
            f"catastral correspondiente a revisión de avalúo catastral del referido predio, "
            f"soportado con los siguientes documentos: {docs}."
        )
    elif data.tipo_origen == "autorizado":
        return (
            f"Que el(la) señor(a) {data.nombre_solicitante}, identificado(a) con {_doc_solicitante(data)} "
            f"{data.cedula_solicitante}, quien actúa en calidad de autorizado del señor(a) "
            f"{data.nombre_propietario} en su condición de propietario, del inmueble con "
            f"número predial {data.numero_predial}{direccion_txt} de la zona urbana del "
            f"municipio de {mun} con matrícula inmobiliaria {data.folio_matricula}, inscrito "
            f"en la base de datos catastral de la Secretaría de Planeación del municipio de "
            f"{mun}, el trámite catastral correspondiente a revisión de avalúo catastral del "
            f"referido predio, soportado con los siguientes documentos: {docs}."
        )
    elif data.tipo_origen == "oficio":
        return (
            f"Que la Oficina de Catastro adscrita a la Secretaría de Planeación del municipio "
            f"de {mun}, se radica de manera oficiosa el trámite catastral correspondiente a "
            f"revisión de avalúo catastral del inmueble con número predial "
            f"{data.numero_predial}{direccion_txt} con matrícula inmobiliaria "
            f"{data.folio_matricula}, inscrito en la base de datos catastral del municipio de "
            f"{mun}, soportado con los siguientes documentos: {docs}."
        )
    else:  # propietario
        return (
            f"Que el(la) señor(a) {data.nombre_propietario}, identificado(a) con {_doc_propietario(data)} "
            f"{data.cedula_propietario}, en su condición de propietario, del inmueble con "
            f"número predial {data.numero_predial}{direccion_txt} de la zona urbana del "
            f"municipio de {mun} con matrícula inmobiliaria {data.folio_matricula}, inscrito "
            f"en la base de datos catastral de la Secretaría de Planeación del municipio de "
            f"{mun}, el trámite catastral correspondiente a revisión de avalúo catastral del "
            f"referido predio, soportado con los siguientes documentos: {docs}."
        )

def _p_cierre_cuarta(mun: str) -> str:
    return (
        f"Que, revisados los antecedentes catastrales del municipio de {mun}, verificada la "
        f"documentación aportada por el(la) solicitante, así como la validación "
        f"correspondiente a través de la aplicación combinada de métodos DIRECTOS, INDIRECTO "
        f"y DECLARATIVO COLABORATIVO, en los términos del artículo 2.2.2.2.6. del Decreto "
        f"1170 de 2015, modificado por el Decreto 148 de 2020, se confirma el avalúo "
        f"catastral del predio en el presente acto, conforme lo indican el artículo 4.7.4 de "
        f"la Resolución 1040 de 2023, en concordancia del artículo 2.2.2.2.2 literal C del "
        f"1170 de 2015, modificado por el Decreto 148 de 2020."
    )

def _demo_cuarta(data: SolicitudUnificada) -> str:
    mun    = _municipio(data)
    cuerpo = [p.strip() for p in data.parrafos_informe_tecnico if p.strip()]
    return "\n\n".join([_P1_CUARTA, _P1B_CUARTA, _apertura_cuarta(data, mun), *cuerpo, _p_cierre_cuarta(mun)])


# ── Quinta Clase (incorporación de predios formales o informales) ───────────
# Texto literal reutilizado de motivadas reales aprobadas: esta categoría
# nunca pasa por el LLM (ver generate_motivada), solo sustitución de campos.

_P1_QUINTA = (
    "Que la Resolución 1040 de 2023 del Instituto Geográfico Agustín Codazzi (IGAC), en su "
    "artículo 4.5.1 señala que las mutaciones de quinta clase son las que resultan de la "
    "incorporación de predios formales o bajo la condición de informalidad que no estaban "
    "incorporados previamente en la base de datos catastral."
)

def _apertura_quinta(data: SolicitudUnificada, mun: str) -> str:
    docs = ", ".join(data.documentos_aportados)
    if data.tipo_origen == "poder":
        tp_txt = f", TP. {data.tp_solicitante}" if data.tp_solicitante else ""
        return (
            f"Que el(la) señor(a) {data.nombre_solicitante}, identificado(a) con "
            f"{_doc_solicitante(data)} {data.cedula_solicitante}{tp_txt}, quien "
            f"actúa en calidad de apoderado del señor(a) {data.nombre_propietario} en su "
            f"condición de poseedor(a) de una mejora ubicada sobre el inmueble con número "
            f"predial {data.numero_predial}, inscrito en la base de datos catastral del "
            f"municipio de {mun}, presentó ante la Oficina de Catastro adscrita a la "
            f"Secretaría de Planeación del municipio de {mun} una solicitud de incorporación "
            f"o modificación del elemento constructivo, soportada en los siguientes "
            f"documentos justificativos: {docs}."
        )
    elif data.tipo_origen == "autorizado":
        return (
            f"Que el(la) señor(a) {data.nombre_solicitante}, identificado(a) con {_doc_solicitante(data)} "
            f"{data.cedula_solicitante}, quien actúa en calidad de autorizado del señor(a) "
            f"{data.nombre_propietario} en su condición de poseedor(a) de una mejora ubicada "
            f"sobre el inmueble con número predial {data.numero_predial}, inscrito en la base "
            f"de datos catastral del municipio de {mun}, presentó ante la Oficina de Catastro "
            f"adscrita a la Secretaría de Planeación del municipio de {mun} una solicitud de "
            f"incorporación o modificación del elemento constructivo, soportada en los "
            f"siguientes documentos justificativos: {docs}."
        )
    elif data.tipo_origen == "oficio":
        return (
            f"Que la Oficina de Catastro adscrita a la Secretaría de Planeación del municipio "
            f"de {mun}, se radica de manera oficiosa una solicitud de incorporación o "
            f"modificación del elemento constructivo sobre el inmueble con número predial "
            f"{data.numero_predial}, inscrito en la base de datos catastral del municipio de "
            f"{mun}, soportada en los siguientes documentos justificativos: {docs}."
        )
    else:  # propietario / poseedor
        return (
            f"Que el(la) señor(a) {data.nombre_propietario}, identificado(a) con {_doc_propietario(data)} "
            f"{data.cedula_propietario}, en su condición de poseedor(a) de una mejora ubicada "
            f"sobre el inmueble con número predial {data.numero_predial}, inscrito en la base "
            f"de datos catastral del municipio de {mun}, presentó ante la Oficina de Catastro "
            f"adscrita a la Secretaría de Planeación del municipio de {mun} una solicitud de "
            f"incorporación o modificación del elemento constructivo, soportada en los "
            f"siguientes documentos justificativos: {docs}."
        )

def _p3_quinta(data: SolicitudUnificada) -> str:
    return (
        f"Que en atención a la solicitud presentada se realizó la verificación técnica de la "
        f"documentación aportada y visita técnica al predio el día {data.fecha_visita_tecnica}, "
        f"con el fin de realizar la localización geográfica del predio a inscribir, se "
        f"determinó que es procedente inscribir la informalidad a nombre de "
        f"{data.nombre_propietario}, conforme a la compraventa del {data.fecha_compraventa} de "
        f"{data.entidad_compraventa}."
    )

def _p4_quinta(data: SolicitudUnificada) -> str:
    return (
        f"Se concluye que a la posesión o informalidad le corresponderá la referencia "
        f"catastral No. {data.numero_predial_nuevo}."
    )

def _p5_quinta(mun: str) -> str:
    return (
        f"Que el sistema de gestión catastral, con el cual se administra la base de datos "
        f"catastral del municipio de {mun}, recalcula las áreas de terreno geográficas y las "
        f"adopta como las áreas definitivas de los predios resultantes, corrigiendo, si es del "
        f"caso las disparidades que se encuentren en los mismos."
    )

def _p6_quinta(mun: str) -> str:
    return (
        f"Que revisados los antecedentes catastrales del municipio de {mun}, verificada la "
        f"documentación aportada por el(la) solicitante, así como la validación "
        f"correspondiente a través de la aplicación del método DIRECTO, en los términos del "
        f"artículo 2.2.2.2.6. del Decreto 1170 de 2015, modificado por el Decreto 148 de 2020, "
        f"que procede la mutación de quinta clase y su correspondiente inscripción en el "
        f"catastro, conforme lo indican en los artículos 14, 15 literal e, 16, 25, 29, 30 y 31 "
        f"de la Resolución 1149 de 2021, en concordancia del artículo 2.2.2.2.2 literal C del "
        f"1170 de 2015, modificado por el Decreto 148 de 2020."
    )

def _demo_quinta(data: SolicitudUnificada) -> str:
    mun = _municipio(data)
    return "\n\n".join([
        _P1_QUINTA, _apertura_quinta(data, mun), _p3_quinta(data), _p4_quinta(data),
        _p5_quinta(mun), _p6_quinta(mun),
    ])


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
        f"{_doc_propietario(data)} No. {data.cedula_propietario}, en su condición de propietario del inmueble con "
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
        f"{_doc_solicitante(data)} No. {data.cedula_solicitante}, en su condición de contacto y/o autorizado del "
        f"(la) señor(a) {data.nombre_propietario} identificado(a) con {_doc_propietario(data)} "
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
        f"{_doc_propietario(data)} No. {data.cedula_propietario}, en calidad de propietario(a) del predio "
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

def _demo_complementacion_autorizado(data: SolicitudUnificada) -> str:
    mun   = _municipio(data)
    docs  = ", ".join(data.documentos_aportados)
    campo = data.campo_complementado or ""
    p2 = (
        f"Que el(la) señor(a) {data.nombre_solicitante}, identificado(a) con "
        f"{_doc_solicitante(data)} No. {data.cedula_solicitante}, en su condición de contacto y/o autorizado del "
        f"(la) señor(a) {data.nombre_propietario} identificado(a) con {_doc_propietario(data)} "
        f"{data.cedula_propietario}, en calidad de propietario(a) del predio identificado "
        f"catastralmente con {data.numero_predial}, inscrito en la base de datos catastral, "
        f"presentó ante la Oficina de Catastro adscrita a la Secretaria de Planeación del "
        f"municipio de {mun}, el trámite catastral correspondiente a complementación de datos "
        f"bajo el radicado {data.numero_radicado or 'N/A'}, soportada en los siguientes "
        f"documentos aportados: {docs}, con folio de matrícula inmobiliaria "
        f"{data.folio_matricula}."
    )
    p3 = (
        f"Que de acuerdo con el estudio de los documentos jurídicos se verifica por parte del "
        f"operador que procede un trámite de complementación de(la) {campo}."
    )
    return "\n\n".join([_P1_COMPLEMENTACION, p2, p3, _P4_COMPLEMENTACION.format(mun=mun), _P5_COMPLEMENTACION])

def _demo_complementacion_poder(data: SolicitudUnificada) -> str:
    mun    = _municipio(data)
    docs   = ", ".join(data.documentos_aportados)
    campo  = data.campo_complementado or ""
    tp_txt = f", TP. {data.tp_solicitante}" if data.tp_solicitante else ""
    p2 = (
        f"Que el(la) señor(a) {data.nombre_solicitante}, identificado(a) con "
        f"{_doc_solicitante(data)} No. {data.cedula_solicitante}{tp_txt}, actuando "
        f"en calidad de apoderado del señor(a) {data.nombre_propietario}, identificado con "
        f"{_doc_propietario(data)} {data.cedula_propietario}, en calidad de propietario(a) del predio identificado "
        f"catastralmente con {data.numero_predial}, inscrito en la base de datos catastral, "
        f"presentó ante la Oficina de Catastro adscrita a la Secretaria de Planeación del "
        f"municipio de {mun}, el trámite catastral correspondiente a complementación de datos "
        f"bajo el radicado {data.numero_radicado or 'N/A'}, soportada en los siguientes "
        f"documentos aportados: {docs}, con folio de matrícula inmobiliaria "
        f"{data.folio_matricula}."
    )
    p3 = (
        f"Que de acuerdo con el estudio de los documentos jurídicos se verifica por parte del "
        f"operador que procede un trámite de complementación de(la) {campo}."
    )
    return "\n\n".join([_P1_COMPLEMENTACION, p2, p3, _P4_COMPLEMENTACION.format(mun=mun), _P5_COMPLEMENTACION])

def _demo_complementacion_heredero(data: SolicitudUnificada) -> str:
    mun   = _municipio(data)
    docs  = ", ".join(data.documentos_aportados)
    campo = data.campo_complementado or ""
    p2 = (
        f"Que el(la) señor(a) {data.nombre_solicitante}, identificado(a) con "
        f"{_doc_solicitante(data)} No. {data.cedula_solicitante}, en su condición de heredero(a) del (la) señor(a) "
        f"{data.nombre_propietario} (Q.E.P.D.), identificado(a) con {_doc_propietario(data)} "
        f"{data.cedula_propietario}, en calidad de propietario(a) del predio identificado "
        f"catastralmente con {data.numero_predial}, inscrito en la base de datos catastral, "
        f"presentó ante la Oficina de Catastro adscrita a la Secretaria de Planeación del "
        f"municipio de {mun}, el trámite catastral correspondiente a complementación de datos "
        f"bajo el radicado {data.numero_radicado or 'N/A'}, soportada en los siguientes "
        f"documentos aportados: {docs}, con folio de matrícula inmobiliaria "
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
        art5 = (
            "ARTÍCULO QUINTO: Los avalúos inscritos con posterioridad al primero (1°) de enero "
            "tendrán vigencia fiscal para el año siguiente, ajustados con el índice que determine "
            "el Gobierno Nacional, de conformidad con lo dispuesto en el artículo 4.7.13 de la "
            "Resolución 1040 de 2023 expedida por el Instituto Geográfico Agustín Codazzi – IGAC."
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
        art5 = (
            "ARTÍCULO QUINTO: Los avalúos inscritos con posterioridad al primero (1°) de enero "
            "tendrán vigencia fiscal para el año siguiente, ajustados con el índice que determine "
            "el Gobierno Nacional, de conformidad con lo dispuesto en el artículo 4.7.13 de la "
            "Resolución 1040 de 2023 expedida por el Instituto Geográfico Agustín Codazzi – IGAC."
        )
    return "\n\n".join([art2, art3, art4, art5, "COMUNÍQUESE Y CÚMPLASE"])


def _motivada_demo(data: SolicitudUnificada) -> str:
    if data.tipo_mutacion == "segunda_clase":
        return _demo_segunda(data)
    elif data.tipo_mutacion == "cancelacion":
        return _demo_cancelacion(data)
    elif data.tipo_mutacion == "cuarta_clase":
        return _demo_cuarta(data)
    elif data.tipo_mutacion == "quinta_clase":
        return _demo_quinta(data)
    elif data.tipo_mutacion == "primera_clase":
        if data.tipo_origen == "autorizado":
            return _demo_primera_autorizado(data)
        elif data.tipo_origen == "poder":
            return _demo_primera_poder(data)
        elif data.tipo_origen == "representante_legal":
            return _demo_primera_representante_legal(data)
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
        if data.tipo_origen == "autorizado":
            return _demo_complementacion_autorizado(data)
        elif data.tipo_origen == "poder":
            return _demo_complementacion_poder(data)
        elif data.tipo_origen == "heredero":
            return _demo_complementacion_heredero(data)
        elif data.tipo_origen == "snr":
            return _demo_complementacion_snr(data)
        else:
            return _demo_complementacion_propietario(data)
    else:  # tercera_clase
        return _demo_tercera(data)


def generate_motivada(data: SolicitudUnificada) -> dict:
    # Todas las categorías reutilizan texto literal de formatos ya aprobados:
    # nunca pasan por un LLM ni por búsqueda de contexto (RAG), para
    # garantizar que el texto se mantenga idéntico al documento aprobado y
    # que la respuesta sea instantánea.
    texto = _motivada_demo(data)

    # Si el asistente catastral ya redactó párrafos "Que," específicos del caso,
    # se insertan como considerandos adicionales antes de los dos últimos párrafos
    # de cierre ("en consecuencia" y "revisados los antecedentes").
    if data.contexto_adicional and data.contexto_adicional.strip():
        parrafos = texto.split("\n\n")
        # Garantizamos al menos [P1, P2, CIERRE] antes de insertar
        insert_pos = max(2, len(parrafos) - 2)
        parrafos.insert(insert_pos, data.contexto_adicional.strip())
        texto = "\n\n".join(parrafos)

    articulos = None
    if data.tipo_notificacion:
        articulos = _articulos_finales(data.tipo_notificacion, _municipio(data))

    return {"texto_motivada": texto, "tokens_usados": 0, "articulos_finales": articulos}
