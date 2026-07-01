"use client";

import { useEffect, useRef, useState } from "react";
import { Wand2, Plus, Minus, Bell, BellOff, BellMinus, Upload, ListChecks, X, ChevronDown } from "lucide-react";
import { TipoMutacion, TipoOrigen } from "./MutationSelector";
import { extraerInformeTecnico, extractErrorMessage } from "@/lib/api";
import clsx from "clsx";

export interface SolicitudFormData {
  tipo_mutacion:        TipoMutacion;
  tipo_origen:          TipoOrigen;
  numero_predial:       string;
  folio_matricula:      string;
  municipio?:           string;
  nombre_propietario?:  string;
  tipo_doc_propietario?:string;
  cedula_propietario?:  string;
  nombre_solicitante?:  string;
  tipo_doc_solicitante?:string;
  cedula_solicitante?:  string;
  tp_solicitante?:      string;
  numero_radicado?:     string;
  area_construida_m2?:  number | string;
  area_terreno_m2?:     number | string;
  folio_matriz?:        string;
  folios_resultantes:   string[];
  numero_escritura?:    string;
  fecha_escritura?:     string;
  notaria?:             string;
  campo_rectificado?:   string;
  campo_complementado?: string;
  numero_predial_nuevo?:string;
  fecha_efectos?:       string;
  direccion_predio?:        string;
  parrafos_informe_tecnico: string[];
  fecha_visita_tecnica?: string;
  fecha_compraventa?:    string;
  entidad_compraventa?:  string;
  tipo_notificacion?:   "notificable" | "no_notificable" | null;
  documentos_aportados: string[];
  fuente_administrativa_tipo?:        string;
  fuente_administrativa_numero?:      string;
  fuente_administrativa_fecha?:       string;
  fuente_administrativa_ente_emisor?: string;
  contexto_adicional?:  string;
}

/** Catálogo de fuentes administrativas para Primera Clase, Complementación y
 * Rectificación — reemplaza el listado libre de "documentos justificativos"
 * en esos tipos: ahí el dato relevante no es elegir entre muchas opciones
 * sueltas, sino identificar UNA fuente administrativa concreta (con su
 * número, fecha y ente emisor) que sustenta el trámite. */
/** Catálogo de tipos de documento de identidad — se pide siempre antes del número. */
const TIPOS_DOCUMENTO = ["CC", "NIT", "CE", "TI", "PA"];

const FUENTES_ADMINISTRATIVAS: { value: string; label: string }[] = [
  { value: "acto_administrativo", label: "Acto administrativo" },
  { value: "documento_privado",   label: "Documento privado" },
  { value: "documento_publico",   label: "Documento público" },
  { value: "escritura_publica",   label: "Escritura pública" },
  { value: "resolucion",          label: "Resolución" },
  { value: "sentencia_judicial",  label: "Sentencia judicial" },
  { value: "sin_documento",       label: "Sin documento" },
];

/** Catálogo fijo del modal "Doc. Aportados" de Primera Clase / Complementación / Rectificación. */
const DOCS_JUSTIFICATIVOS_CATALOGO = [
  "Acta de defunción", "Carta de solicitud", "Cédula de ciudadanía",
  "Certificado de tradición y libertad", "Planos", "Registro civil",
];

// Reconstruye párrafos a partir de texto extraído de un PDF/DOCX: el DOCX trae
// un salto de línea por párrafo real, pero el PDF suele traer un salto por
// línea de texto justificado, así que se van uniendo líneas hasta encontrar
// un final de frase (. : ;) para aproximar el párrafo original.
function splitParrafos(texto: string): string[] {
  const lineas = texto.split("\n").map((l) => l.trim()).filter(Boolean);
  const parrafos: string[] = [];
  let actual = "";
  for (const linea of lineas) {
    actual = actual ? `${actual} ${linea}` : linea;
    if (/[.:;]$/.test(linea)) {
      parrafos.push(actual);
      actual = "";
    }
  }
  if (actual) parrafos.push(actual);
  return parrafos.filter((p) => p.length > 10);
}

/** Documentos cuya redacción es siempre la misma combinación de datos que el
 * usuario ya llenó en otra parte del formulario (escritura/notaría/fecha en
 * Desenglobe, compraventa/entidad en Quinta clase) — se componen solos para
 * no pedirle que los vuelva a escribir a mano. Solo aplican mientras todos
 * sus datos de origen estén llenos; si el usuario borra uno a mano, no se
 * reinserta hasta que vuelva a cambiar alguno de esos datos de origen. */
function documentosAutomaticos(data: SolicitudFormData): string[] {
  const docs: string[] = [];
  if (data.tipo_mutacion === "segunda_clase") {
    if (data.folio_matriz) {
      docs.push(`Certificado de tradición y libertad de la matrícula inmobiliaria No. ${data.folio_matriz}`);
    }
    if (data.numero_escritura && data.fecha_escritura && data.notaria) {
      docs.push(`Escritura pública No. ${data.numero_escritura} del ${data.fecha_escritura} de la ${data.notaria}`);
    }
  }
  if (data.tipo_mutacion === "quinta_clase" && data.fecha_compraventa && data.entidad_compraventa) {
    docs.push(`Documento de compraventa del ${data.fecha_compraventa} de la ${data.entidad_compraventa}`);
  }
  if (
    (data.tipo_mutacion === "primera_clase" || data.tipo_mutacion === "complementacion" || data.tipo_mutacion === "rectificacion") &&
    data.fuente_administrativa_tipo && data.fuente_administrativa_tipo !== "sin_documento" &&
    data.fuente_administrativa_numero && data.fuente_administrativa_fecha && data.fuente_administrativa_ente_emisor
  ) {
    const label = FUENTES_ADMINISTRATIVAS.find(f => f.value === data.fuente_administrativa_tipo)?.label ?? "Documento";
    docs.push(`${label} No. ${data.fuente_administrativa_numero} del ${data.fuente_administrativa_fecha} de ${data.fuente_administrativa_ente_emisor}`);
  }
  return docs;
}

// ── Mock data ────────────────────────────────────────────────────────────────
const MOCKS: Record<string, Partial<SolicitudFormData>> = {
  primera_clase_propietario: {
    nombre_propietario: "HERNAN JOSE CAUSIL MARTINEZ", cedula_propietario: "6.872.472",
    numero_predial: "23001000090004000000000", folio_matricula: "140-38712",
    fuente_administrativa_tipo: "sentencia_judicial", fuente_administrativa_numero: "SN",
    fuente_administrativa_fecha: "27/11/2018", fuente_administrativa_ente_emisor: "Juzgado Tercero Civil Municipal de Montería",
    documentos_aportados: [],
  },
  primera_clase_autorizado: {
    nombre_solicitante: "CARLOS ANDRES PEREZ GOMEZ", cedula_solicitante: "1.234.567",
    nombre_propietario: "HERNAN JOSE CAUSIL MARTINEZ", cedula_propietario: "6.872.472",
    numero_predial: "23001000090004000000000", folio_matricula: "140-38712",
    fuente_administrativa_tipo: "sentencia_judicial", fuente_administrativa_numero: "SN",
    fuente_administrativa_fecha: "27/11/2018", fuente_administrativa_ente_emisor: "Juzgado Tercero Civil Municipal de Montería",
    documentos_aportados: [],
  },
  primera_clase_poder: {
    nombre_solicitante: "JORGE LUIS MARTINEZ RUIZ", tipo_doc_solicitante: "CC",
    cedula_solicitante: "9.876.543", tp_solicitante: "45678",
    nombre_propietario: "HERNAN JOSE CAUSIL MARTINEZ", cedula_propietario: "6.872.472",
    numero_predial: "23001000090004000000000", folio_matricula: "140-38712",
    fuente_administrativa_tipo: "documento_privado", fuente_administrativa_numero: "0826",
    fuente_administrativa_fecha: "31/12/2015", fuente_administrativa_ente_emisor: "Gobernación de Córdoba",
    documentos_aportados: [],
  },
  primera_clase_representante_legal: {
    nombre_solicitante: "IVAN ENRIQUE VERGARA ORDOSGOITA", cedula_solicitante: "1.102.812.454",
    nombre_propietario: "INVERSIONES Y NEGOCIOS DBEB S.A.S", cedula_propietario: "901.916.558-8",
    numero_predial: "23001000090004000000000", folio_matricula: "140-38712",
    fuente_administrativa_tipo: "documento_privado", fuente_administrativa_numero: "0826",
    fuente_administrativa_fecha: "31/12/2015", fuente_administrativa_ente_emisor: "Gobernación de Córdoba",
    documentos_aportados: [],
  },
  primera_clase_snr: {
    numero_radicado: "2024-3312", numero_predial: "23001000100039002700000",
    folio_matricula: "140-133775", municipio: "Montería",
    fuente_administrativa_tipo: "escritura_publica", fuente_administrativa_numero: "1053",
    fuente_administrativa_fecha: "23/11/2023", fuente_administrativa_ente_emisor: "Notaría Cuarta de Montería",
    documentos_aportados: [],
  },
  segunda_clase_propietario: {
    nombre_propietario: "JUAN CARLOS HERRERA OQUENDO", cedula_propietario: "78.027.389",
    numero_predial: "00-01-00-00-0001-1335-0-00-00-0000", folio_matricula: "140-191374",
    folio_matriz: "140-96493", folios_resultantes: ["140-191373", "140-191374", "140-191375"],
    numero_escritura: "1308", fecha_escritura: "06/06/2024", notaria: "Notaria segunda de Montería",
    municipio: "Montería",
    documentos_aportados: ["Carta de solicitud", "Certificados de tradición de la matrícula inmobiliaria No. 140-96493", "Escritura pública 1308 del 06/06/2024 de la Notaria segunda de Montería y plano"],
  },
  segunda_clase_poder: {
    nombre_solicitante: "JUAN CARLOS HERRERA OQUENDO", tipo_doc_solicitante: "CC", cedula_solicitante: "78.027.389",
    nombre_propietario: "MARIA TERESA OQUENDO PEREZ", cedula_propietario: "23.456.789",
    numero_predial: "00-01-00-00-0001-1335-0-00-00-0000", folio_matricula: "140-191374",
    folio_matriz: "140-96493", folios_resultantes: ["140-191373", "140-191374", "140-191375"],
    numero_escritura: "1308", fecha_escritura: "06/06/2024", notaria: "Notaria segunda de Montería",
    municipio: "Montería",
    documentos_aportados: ["Carta de solicitud", "Poder especial", "Certificados de tradición de la matrícula inmobiliaria No. 140-96493", "Escritura pública 1308 del 06/06/2024 de la Notaria segunda de Montería y plano"],
  },
  segunda_clase_autorizado: {
    nombre_solicitante: "JUAN CARLOS HERRERA OQUENDO", cedula_solicitante: "78.027.389",
    nombre_propietario: "MARIA TERESA OQUENDO PEREZ", cedula_propietario: "23.456.789",
    numero_predial: "00-01-00-00-0001-1335-0-00-00-0000", folio_matricula: "140-191374",
    folio_matriz: "140-96493", folios_resultantes: ["140-191373", "140-191374", "140-191375"],
    numero_escritura: "1308", fecha_escritura: "06/06/2024", notaria: "Notaria segunda de Montería",
    municipio: "Montería",
    documentos_aportados: ["Carta de solicitud", "Documento de autorización", "Certificados de tradición de la matrícula inmobiliaria No. 140-96493", "Escritura pública 1308 del 06/06/2024 de la Notaria segunda de Montería y plano"],
  },
  segunda_clase_oficio: {
    numero_predial: "00-01-00-00-0001-1335-0-00-00-0000", folio_matricula: "140-191374",
    folio_matriz: "140-96493", folios_resultantes: ["140-191373", "140-191374", "140-191375"],
    numero_escritura: "1308", fecha_escritura: "06/06/2024", notaria: "Notaria segunda de Montería",
    municipio: "Montería",
    documentos_aportados: ["Certificados de tradición de la matrícula inmobiliaria No. 140-96493", "Escritura pública 1308 del 06/06/2024 de la Notaria segunda de Montería y plano"],
  },
  tercera_clase_propietario: {
    nombre_propietario: "María Fernanda Gómez Restrepo", cedula_propietario: "43512876",
    numero_predial: "05001000200000010001000", folio_matricula: "140-123456",
    area_construida_m2: 95.5, area_terreno_m2: 120,
    documentos_aportados: ["Formulario de solicitud", "Copia cédula de ciudadanía", "Licencia de construcción"],
  },
  rectificacion_propietario: {
    nombre_propietario: "HERNAN JOSE CAUSIL MARTINEZ", cedula_propietario: "6.872.472",
    numero_predial: "23001000090004000000000", folio_matricula: "140-38712",
    campo_rectificado: "el área construida",
    fuente_administrativa_tipo: "escritura_publica", fuente_administrativa_numero: "1053",
    fuente_administrativa_fecha: "23/11/2023", fuente_administrativa_ente_emisor: "Notaría Cuarta de Montería",
    documentos_aportados: [],
  },
  rectificacion_autorizado: {
    nombre_solicitante: "CARLOS ANDRES PEREZ GOMEZ", cedula_solicitante: "1.234.567",
    nombre_propietario: "HERNAN JOSE CAUSIL MARTINEZ", cedula_propietario: "6.872.472",
    numero_predial: "23001000090004000000000", folio_matricula: "140-38712",
    campo_rectificado: "la dirección",
    fuente_administrativa_tipo: "documento_publico", fuente_administrativa_numero: "045",
    fuente_administrativa_fecha: "10/02/2022", fuente_administrativa_ente_emisor: "Curaduría Urbana Primera de Montería",
    documentos_aportados: [],
  },
  rectificacion_oficio: {
    numero_predial: "23001000090004000000000", folio_matricula: "140-38712",
    campo_rectificado: "el propietario",
    fuente_administrativa_tipo: "sentencia_judicial", fuente_administrativa_numero: "SN",
    fuente_administrativa_fecha: "15/05/2021", fuente_administrativa_ente_emisor: "Juzgado Segundo de Familia de Montería",
    documentos_aportados: [],
  },
  complementacion_propietario: {
    nombre_propietario: "HERNAN JOSE CAUSIL MARTINEZ", cedula_propietario: "6.872.472",
    numero_predial: "23001000090004000000000", folio_matricula: "140-38712",
    numero_radicado: "2024-1528",
    campo_complementado: "propietario",
    documentos_aportados: ["Certificado de tradición y libertad", "Cédula de ciudadanía"],
  },
  complementacion_autorizado: {
    nombre_solicitante: "CARLOS ANDRES PEREZ GOMEZ", cedula_solicitante: "1.234.567",
    nombre_propietario: "HERNAN JOSE CAUSIL MARTINEZ", cedula_propietario: "6.872.472",
    numero_predial: "23001000090004000000000", folio_matricula: "140-38712",
    numero_radicado: "2024-1528", campo_complementado: "propietario",
    fuente_administrativa_tipo: "documento_publico", fuente_administrativa_numero: "045",
    fuente_administrativa_fecha: "10/02/2022", fuente_administrativa_ente_emisor: "Curaduría Urbana Primera de Montería",
    documentos_aportados: [],
  },
  complementacion_poder: {
    nombre_solicitante: "JORGE LUIS MARTINEZ RUIZ", tipo_doc_solicitante: "CC",
    cedula_solicitante: "9.876.543", tp_solicitante: "45678",
    nombre_propietario: "HERNAN JOSE CAUSIL MARTINEZ", cedula_propietario: "6.872.472",
    numero_predial: "23001000090004000000000", folio_matricula: "140-38712",
    numero_radicado: "2024-1528", campo_complementado: "propietario",
    fuente_administrativa_tipo: "escritura_publica", fuente_administrativa_numero: "1053",
    fuente_administrativa_fecha: "23/11/2023", fuente_administrativa_ente_emisor: "Notaría Cuarta de Montería",
    documentos_aportados: [],
  },
  complementacion_heredero: {
    nombre_solicitante: "LUIS ALFONSO HERRERA OSORIO", cedula_solicitante: "6.887.586",
    nombre_propietario: "ANA MARIA OSORIO OVIEDO", cedula_propietario: "26.208.979",
    numero_predial: "01-03-00-0333-0023-0-00-00-0000", folio_matricula: "140-54500",
    numero_radicado: "2024-1528", campo_complementado: "propietario",
    fuente_administrativa_tipo: "escritura_publica", fuente_administrativa_numero: "99",
    fuente_administrativa_fecha: "15/02/1968", fuente_administrativa_ente_emisor: "Notaría Segunda de Montería",
    documentos_aportados: [],
  },
  complementacion_snr: {
    numero_radicado: "2024-3312", numero_predial: "23001000100039002700000",
    folio_matricula: "140-133775", municipio: "Montería",
    fuente_administrativa_tipo: "escritura_publica", fuente_administrativa_numero: "1053",
    fuente_administrativa_fecha: "23/11/2023", fuente_administrativa_ente_emisor: "Notaría Cuarta de Montería",
    documentos_aportados: [],
  },
  cancelacion_propietario: {
    nombre_propietario: "DAYAN FERNANDO BAENA ESCORCIA", cedula_propietario: "1.067.946.214",
    numero_predial: "01-03-00-00-0471-0001-5-00-00-0001", folio_matricula: "140-191374",
    numero_predial_nuevo: "01-03-00-00-0471-0002-5-00-00-0001", fecha_efectos: "01/07/2025",
    municipio: "Montería",
    documentos_aportados: ["Carta de solicitud", "Extrajuicio No. 4947 del 18/10/2024 de la Notaria segunda de Montería"],
  },
  cancelacion_poder: {
    nombre_solicitante: "JORGE LUIS MARTINEZ RUIZ", tipo_doc_solicitante: "CC",
    cedula_solicitante: "9.876.543", tp_solicitante: "45678",
    nombre_propietario: "DAYAN FERNANDO BAENA ESCORCIA", cedula_propietario: "1.067.946.214",
    numero_predial: "01-03-00-00-0471-0001-5-00-00-0001", folio_matricula: "140-191374",
    numero_predial_nuevo: "01-03-00-00-0471-0002-5-00-00-0001", fecha_efectos: "01/07/2025",
    municipio: "Montería",
    documentos_aportados: ["Carta de solicitud", "Poder especial", "Extrajuicio No. 4947 del 18/10/2024 de la Notaria segunda de Montería"],
  },
  cuarta_clase_propietario: {
    nombre_propietario: "LUIS FERNANDO RAMIREZ TORRES", cedula_propietario: "9.345.678",
    numero_predial: "23001000090010000000000", folio_matricula: "140-55210",
    direccion_predio: "Calle 45 No. 12-30, barrio Cantaclaro", municipio: "Montería",
    parrafos_informe_tecnico: [
      "Que el(la) solicitante manifiesta lo siguiente: \"el avalúo catastral asignado a mi predio no corresponde con las condiciones reales del inmueble, motivo por el cual solicito sea revisado y ajustado conforme a los valores actuales del sector.\"",
      "Que mediante el Decreto Municipal No. 0187 de 2024, la administración municipal adoptó la actualización de las zonas homogéneas geoeconómicas y físicas del municipio de Montería.",
      "Que de conformidad con el Decreto Nacional 1170 de 2015, modificado por el Decreto 148 de 2020, los avalúos catastrales deben reflejar las condiciones reales del mercado inmobiliario.",
      "Que conforme al estudio económico y al Plan de Ordenamiento Territorial vigente, el predio se ubica en una zona homogénea geoeconómica cuyo valor de referencia difiere del registrado actualmente en la base catastral.",
    ],
    documentos_aportados: ["Solicitud", "Certificado de tradición y libertad", "Avalúo comercial"],
  },
  cuarta_clase_autorizado: {
    nombre_solicitante: "CARLOS ANDRES PEREZ GOMEZ", cedula_solicitante: "1.234.567",
    nombre_propietario: "LUIS FERNANDO RAMIREZ TORRES", cedula_propietario: "9.345.678",
    numero_predial: "23001000090010000000000", folio_matricula: "140-55210",
    direccion_predio: "Calle 45 No. 12-30, barrio Cantaclaro", municipio: "Montería",
    parrafos_informe_tecnico: [
      "Que el(la) propietario(a) manifiesta lo siguiente: \"el valor catastral vigente no guarda relación con el estado actual del inmueble, por lo cual solicito su revisión.\"",
      "Que mediante el Decreto Municipal No. 0187 de 2024, la administración municipal adoptó la actualización de las zonas homogéneas geoeconómicas y físicas del municipio de Montería.",
      "Que conforme al estudio económico vigente, el predio se ubica en una zona homogénea geoeconómica cuyo valor de referencia difiere del registrado actualmente en la base catastral.",
    ],
    documentos_aportados: ["Certificado de tradición y libertad", "Cédula de ciudadanía"],
  },
  cuarta_clase_poder: {
    nombre_solicitante: "JORGE LUIS MARTINEZ RUIZ", tipo_doc_solicitante: "CC",
    cedula_solicitante: "9.876.543", tp_solicitante: "45678",
    nombre_propietario: "LUIS FERNANDO RAMIREZ TORRES", cedula_propietario: "9.345.678",
    numero_predial: "23001000090010000000000", folio_matricula: "140-55210",
    direccion_predio: "Calle 45 No. 12-30, barrio Cantaclaro", municipio: "Montería",
    parrafos_informe_tecnico: [
      "Que el(la) propietario(a) manifiesta lo siguiente: \"solicito la revisión del avalúo catastral de mi predio, dado que no corresponde con las condiciones reales del mismo.\"",
      "Que mediante el Decreto Nacional 1170 de 2015, modificado por el Decreto 148 de 2020, se establecen los métodos de avalúo aplicables a la revisión solicitada.",
      "Que conforme al estudio económico y al Plan de Ordenamiento Territorial vigente, el predio se ubica en una zona homogénea geoeconómica cuyo valor de referencia difiere del registrado actualmente en la base catastral.",
    ],
    documentos_aportados: ["Poder especial", "Certificado de tradición y libertad", "Avalúo comercial"],
  },
  cuarta_clase_oficio: {
    numero_predial: "23001000090010000000000", folio_matricula: "140-55210",
    direccion_predio: "Calle 45 No. 12-30, barrio Cantaclaro", municipio: "Montería",
    parrafos_informe_tecnico: [
      "Que mediante el Decreto Municipal No. 0187 de 2024, la administración municipal adoptó la actualización de las zonas homogéneas geoeconómicas y físicas del municipio de Montería.",
      "Que conforme al estudio económico vigente, el predio se ubica en una zona homogénea geoeconómica cuyo valor de referencia difiere del registrado actualmente en la base catastral, motivo por el cual la oficina de catastro inicia de oficio la revisión correspondiente.",
    ],
    documentos_aportados: ["Solicitud", "Certificado de tradición y libertad"],
  },
  cancelacion_oficio: {
    nombre_propietario: "MARIA TERESA OQUENDO PEREZ", cedula_propietario: "23.456.789",
    numero_predial: "01-05-00-00-0034-0013-5-00-00-0001", folio_matricula: "140-96493",
    numero_predial_nuevo: "01-05-00-00-0034-0014-5-00-00-0001", fecha_efectos: "01/07/2025",
    municipio: "Montería",
    documentos_aportados: ["Solicitud", "Extraproceso del 03/06/2025 de la Notaria tercera de Montería", "Cédula de ciudadanía"],
  },
  quinta_clase_propietario: {
    nombre_propietario: "ROSA MARIA TORRES VELASQUEZ", cedula_propietario: "45.678.912",
    numero_predial: "23001000090020000000000", folio_matricula: "140-66321",
    municipio: "Montería",
    fecha_visita_tecnica: "10/04/2025", fecha_compraventa: "15/01/2024",
    entidad_compraventa: "Notaría Tercera de Montería",
    numero_predial_nuevo: "23001000090020500000087",
    documentos_aportados: ["Carta de solicitud", "Documento de compraventa", "Copia de cédula de ciudadanía", "Plano"],
  },
  quinta_clase_autorizado: {
    nombre_solicitante: "CARLOS ANDRES PEREZ GOMEZ", cedula_solicitante: "1.234.567",
    nombre_propietario: "ROSA MARIA TORRES VELASQUEZ", cedula_propietario: "45.678.912",
    numero_predial: "23001000090020000000000", folio_matricula: "140-66321",
    municipio: "Montería",
    fecha_visita_tecnica: "10/04/2025", fecha_compraventa: "15/01/2024",
    entidad_compraventa: "Notaría Tercera de Montería",
    numero_predial_nuevo: "23001000090020500000087",
    documentos_aportados: ["Documento de autorización", "Documento de compraventa", "Copia de cédula de ciudadanía"],
  },
  quinta_clase_poder: {
    nombre_solicitante: "JORGE LUIS MARTINEZ RUIZ", tipo_doc_solicitante: "CC",
    cedula_solicitante: "9.876.543", tp_solicitante: "45678",
    nombre_propietario: "ROSA MARIA TORRES VELASQUEZ", cedula_propietario: "45.678.912",
    numero_predial: "23001000090020000000000", folio_matricula: "140-66321",
    municipio: "Montería",
    fecha_visita_tecnica: "10/04/2025", fecha_compraventa: "15/01/2024",
    entidad_compraventa: "Notaría Tercera de Montería",
    numero_predial_nuevo: "23001000090020500000087",
    documentos_aportados: ["Poder especial", "Documento de compraventa", "Copia de cédula de ciudadanía"],
  },
  quinta_clase_oficio: {
    nombre_propietario: "ROSA MARIA TORRES VELASQUEZ",
    numero_predial: "23001000090020000000000", folio_matricula: "140-66321",
    municipio: "Montería",
    fecha_visita_tecnica: "10/04/2025", fecha_compraventa: "15/01/2024",
    entidad_compraventa: "Notaría Tercera de Montería",
    numero_predial_nuevo: "23001000090020500000087",
    documentos_aportados: ["Documento de compraventa", "Plano"],
  },
};

const DOCS_RAPIDOS: Record<string, string[]> = {
  primera_clase:   ["Escritura pública", "Certificado de libertad y tradición", "Sentencia judicial", "Poder especial", "Resolución de adjudicación"],
  segunda_clase:   ["Carta de solicitud", "Certificado de tradición y libertad", "Escritura pública", "Plano", "Poder especial"],
  tercera_clase:   ["Licencia de construcción", "Plano de construcción aprobado", "Declaración de construcción", "Certificado de libertad y tradición"],
  cuarta_clase:    ["Solicitud", "Certificado de tradición y libertad", "Escritura pública", "Cédula de ciudadanía", "Avalúo comercial", "Poder especial"],
  quinta_clase:    ["Carta de solicitud", "Documento de compraventa", "Copia de cédula de ciudadanía", "Plano", "Poder especial"],
  rectificacion:   ["Certificado de tradición y libertad", "Copia cédula de ciudadanía", "Escritura pública", "Plano topográfico"],
  complementacion: ["Certificado de tradición y libertad", "Escritura pública", "Copia cédula de ciudadanía", "Resolución judicial"],
  cancelacion:     ["Carta de solicitud", "Extrajuicio notarial", "Cédula de ciudadanía", "Certificado de tradición y libertad"],
};

const CAMPOS_RAPIDOS_RECT = ["el área construida", "el área de terreno", "la dirección", "la nomenclatura", "el propietario", "los linderos", "el estrato socioeconómico"];
const CAMPOS_RAPIDOS_COMP = ["propietario", "área construida", "área de terreno", "dirección", "nombre", "documento de identidad", "folio de matrícula"];

interface Props {
  tipoMutacion:     TipoMutacion;
  tipoOrigen:       TipoOrigen;
  onGenerate:       (data: SolicitudFormData) => void;
  isLoading:        boolean;
  contextoInicial?: string;
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="field-label">{label}{required && <span className="text-brand-danger ml-1">*</span>}</label>
      {children}
    </div>
  );
}

/** Círculo registral de Montería: se antepone solo, el usuario solo digita el número de folio. */
const CIRCULO_REGISTRAL = "140-";

function FolioInput({ value, onChange, onKeyDown }: { value: string; onChange: (v: string) => void; onKeyDown?: React.KeyboardEventHandler<HTMLInputElement> }) {
  const sufijo = value.startsWith(CIRCULO_REGISTRAL) ? value.slice(CIRCULO_REGISTRAL.length) : value;
  return (
    <div className="w-full flex items-center bg-brand-muted border border-slate-600 rounded-lg pl-3 pr-1 focus-within:ring-2 focus-within:ring-brand-primary focus-within:border-transparent transition-all">
      <span className="text-sm text-slate-500 font-medium select-none shrink-0">{CIRCULO_REGISTRAL}</span>
      <input
        className="flex-1 min-w-0 bg-transparent border-0 outline-none py-2 pl-0.5 pr-2 text-sm text-brand-text placeholder-slate-500"
        value={sufijo}
        onChange={e => {
          let v = e.target.value;
          if (v.startsWith(CIRCULO_REGISTRAL)) v = v.slice(CIRCULO_REGISTRAL.length);
          onChange(CIRCULO_REGISTRAL + v);
        }}
        onKeyDown={onKeyDown}
        placeholder="XXXXX"
      />
    </div>
  );
}

export default function FormBuilder({ tipoMutacion, tipoOrigen, onGenerate, isLoading, contextoInicial }: Props) {
  const mockKey = `${tipoMutacion}_${tipoOrigen}`;
  const [data, setData] = useState<SolicitudFormData>({
    tipo_mutacion: tipoMutacion, tipo_origen: tipoOrigen,
    numero_predial: "", folio_matricula: "", documentos_aportados: [],
    folios_resultantes: [],
    parrafos_informe_tecnico: [],
    contexto_adicional: contextoInicial ?? "",
  });
  const [asistenteAbierto, setAsistenteAbierto] = useState(!!contextoInicial);
  const [newDoc, setNewDoc] = useState("");
  const [newFolio, setNewFolio] = useState("");
  const [newParrafo, setNewParrafo] = useState("");
  const [informeCandidatos, setInformeCandidatos] = useState<string[]>([]);
  const [uploadingInforme, setUploadingInforme] = useState(false);
  const [informeError, setInformeError] = useState("");

  const set = (k: keyof SolicitudFormData, v: unknown) => setData(p => ({ ...p, [k]: v }));
  const loadMock = () => setData(p => ({ ...p, ...MOCKS[mockKey] }));

  const autoDocsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const nuevos = documentosAutomaticos(data);
    const nuevosSet = new Set(nuevos);
    const anteriores = autoDocsRef.current;
    const sinCambios = anteriores.size === nuevosSet.size && Array.from(anteriores).every((d) => nuevosSet.has(d));
    if (sinCambios) return;
    autoDocsRef.current = nuevosSet;
    setData((p) => {
      const conservados = p.documentos_aportados.filter((d) => !anteriores.has(d));
      const combinados = [...conservados];
      for (const d of nuevos) if (!combinados.includes(d)) combinados.push(d);
      return { ...p, documentos_aportados: combinados };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    data.tipo_mutacion, data.folio_matriz, data.numero_escritura, data.fecha_escritura, data.notaria,
    data.fecha_compraventa, data.entidad_compraventa,
    data.fuente_administrativa_tipo, data.fuente_administrativa_numero,
    data.fuente_administrativa_fecha, data.fuente_administrativa_ente_emisor,
  ]);

  const addDoc = (doc?: string) => {
    const d = (doc ?? newDoc).trim();
    if (!d || data.documentos_aportados.includes(d)) return;
    setData(p => ({ ...p, documentos_aportados: [...p.documentos_aportados, d] }));
    if (!doc) setNewDoc("");
  };
  const removeDoc = (i: number) =>
    setData(p => ({ ...p, documentos_aportados: p.documentos_aportados.filter((_, idx) => idx !== i) }));
  const toggleDoc = (doc: string) => {
    const i = data.documentos_aportados.indexOf(doc);
    if (i === -1) addDoc(doc); else removeDoc(i);
  };
  const [modalDocsAbierto, setModalDocsAbierto] = useState(false);
  const [docModalInput, setDocModalInput] = useState("");

  const addFolio = () => {
    const f = newFolio.trim();
    if (!f || data.folios_resultantes.includes(f)) return;
    setData(p => ({ ...p, folios_resultantes: [...p.folios_resultantes, f] }));
    setNewFolio("");
  };
  const removeFolio = (i: number) =>
    setData(p => ({ ...p, folios_resultantes: p.folios_resultantes.filter((_, idx) => idx !== i) }));

  const addParrafo = (texto?: string) => {
    const p = (texto ?? newParrafo).trim();
    if (!p) return;
    setData(prev => ({ ...prev, parrafos_informe_tecnico: [...prev.parrafos_informe_tecnico, p] }));
    if (!texto) setNewParrafo("");
  };
  const removeParrafo = (i: number) =>
    setData(p => ({ ...p, parrafos_informe_tecnico: p.parrafos_informe_tecnico.filter((_, idx) => idx !== i) }));

  const handleUploadInforme = async (file: File) => {
    setUploadingInforme(true);
    setInformeError("");
    try {
      const { texto } = await extraerInformeTecnico(file);
      setInformeCandidatos(splitParrafos(texto));
    } catch (err) {
      setInformeError(extractErrorMessage(err, "No se pudo extraer el texto del informe técnico"));
    } finally {
      setUploadingInforme(false);
    }
  };

  const inp = "field-input";
  const needsPropietario = (tipoMutacion === "cancelacion" || tipoMutacion === "quinta_clase") ? true : (tipoOrigen !== "snr" && tipoOrigen !== "oficio");
  const needsSolicitante = tipoOrigen === "autorizado" || tipoOrigen === "poder" || tipoOrigen === "heredero" || tipoOrigen === "representante_legal";
  const needsRadicado    = tipoOrigen === "snr" || tipoMutacion === "complementacion";
  const usaFuenteAdministrativa = tipoMutacion === "primera_clase" || tipoMutacion === "complementacion" || tipoMutacion === "rectificacion";
  const fuenteVacia = !data.fuente_administrativa_tipo;
  const fuenteSinDocumento = data.fuente_administrativa_tipo === "sin_documento";
  const detalleFuenteDeshabilitado = fuenteVacia || fuenteSinDocumento;

  const setFuenteTipo = (tipo: string) => {
    setData(p => ({
      ...p,
      fuente_administrativa_tipo: tipo,
      ...(tipo === "" || tipo === "sin_documento"
        ? { fuente_administrativa_numero: "", fuente_administrativa_fecha: "", fuente_administrativa_ente_emisor: "" }
        : {}),
    }));
  };

  // ── Validation ────────────────────────────────────────────────
  const canSubmit = (() => {
    if (!data.numero_predial || !data.folio_matricula) return false;
    if (tipoMutacion === "segunda_clase") {
      if (!data.folio_matriz || data.folios_resultantes.length < 2) return false;
      if (!data.numero_escritura || !data.fecha_escritura || !data.notaria) return false;
    }
    if (tipoMutacion === "cancelacion") {
      if (!data.nombre_propietario || !data.cedula_propietario) return false;
      if (!data.numero_predial_nuevo || !data.fecha_efectos) return false;
      if (needsSolicitante && !data.cedula_solicitante) return false;
      return true;
    }
    if (tipoMutacion === "cuarta_clase") {
      if (data.parrafos_informe_tecnico.length === 0) return false;
      if (tipoOrigen === "oficio") return true;
      if (!data.cedula_propietario || !data.nombre_propietario) return false;
      if (needsSolicitante && !data.cedula_solicitante) return false;
      return true;
    }
    if (tipoMutacion === "quinta_clase") {
      if (!data.nombre_propietario) return false;
      if (tipoOrigen !== "oficio" && !data.cedula_propietario) return false;
      if (needsSolicitante && !data.cedula_solicitante) return false;
      if (!data.fecha_visita_tecnica || !data.fecha_compraventa || !data.entidad_compraventa || !data.numero_predial_nuevo) return false;
      return true;
    }
    if (tipoOrigen === "snr")    return !!data.numero_radicado;
    if (tipoOrigen === "oficio") return tipoMutacion === "rectificacion" ? !!data.campo_rectificado : true;
    if (!data.cedula_propietario || !data.nombre_propietario) return false;
    if (needsSolicitante && !data.cedula_solicitante) return false;
    if (tipoMutacion === "tercera_clase")   return !!data.area_construida_m2 && !!data.area_terreno_m2;
    if (tipoMutacion === "rectificacion")   return !!data.campo_rectificado;
    if (tipoMutacion === "complementacion") return !!data.numero_radicado && !!data.campo_complementado;
    return true;
  })();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">Completa los campos para generar la motivada</p>
        <button type="button" onClick={loadMock} className="btn-ghost text-xs">
          <Wand2 size={13} />Datos de prueba
        </button>
      </div>

      {/* ── Análisis del asistente IA (desplegable) ── */}
      <div className="card p-5">
        <button
          type="button"
          onClick={() => setAsistenteAbierto(o => !o)}
          className="w-full flex items-center justify-between gap-3 text-left"
        >
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Análisis del asistente (opcional)</h3>
          <ChevronDown size={16} className={clsx("text-slate-500 shrink-0 transition-transform", asistenteAbierto && "rotate-180")} />
        </button>
        {asistenteAbierto && (
          <div className="space-y-3 mt-3 pt-3 border-t border-slate-700">
            <p className="text-xs text-slate-500">
              Si vienes del chat, aquí está la conclusión que te dio el Asistente Catastral. Puedes editarla —
              se usará como fundamento al redactar la motivada.
            </p>
            <textarea
              className="field-input min-h-[100px] resize-y text-sm"
              value={data.contexto_adicional ?? ""}
              onChange={e => set("contexto_adicional", e.target.value)}
              placeholder="Pega o edita aquí el razonamiento que quieres usar como base de la motivada..."
            />
          </div>
        )}
      </div>

      <div className="grid gap-5 xl:grid-cols-2 items-start">
      {/* ── SNR ── */}
      {tipoOrigen === "snr" && (
        <div className="card p-5 space-y-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700 pb-2">SNR</h3>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Número de radicado" required>
              <input className={inp} value={data.numero_radicado ?? ""} onChange={e => set("numero_radicado", e.target.value)} placeholder="2024-3312" />
            </Field>
            <Field label="Municipio">
              <input className={inp} value={data.municipio ?? ""} onChange={e => set("municipio", e.target.value)} placeholder="Montería" />
            </Field>
          </div>
        </div>
      )}

      {/* ── Solicitante (autorizado / poder) ── */}
      {needsSolicitante && (
        <div className="card p-5 space-y-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700 pb-2">
            {tipoOrigen === "autorizado" ? "Datos del autorizado" : tipoOrigen === "heredero" ? "Datos del heredero" : tipoOrigen === "representante_legal" ? "Datos del representante legal" : "Datos del apoderado"}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Field label={tipoOrigen === "autorizado" ? "Nombre del autorizado" : tipoOrigen === "heredero" ? "Nombre del heredero" : tipoOrigen === "representante_legal" ? "Nombre del representante legal" : "Nombre del apoderado"} required>
                <input className={inp} value={data.nombre_solicitante ?? ""} onChange={e => set("nombre_solicitante", e.target.value)} placeholder="Nombre completo" />
              </Field>
            </div>
            <Field label="Tipo de documento">
              <select className={inp} value={data.tipo_doc_solicitante ?? "CC"} onChange={e => set("tipo_doc_solicitante", e.target.value)}>
                {TIPOS_DOCUMENTO.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Número de documento" required>
              <input className={inp} value={data.cedula_solicitante ?? ""} onChange={e => set("cedula_solicitante", e.target.value)} placeholder="Cédula / NIT" />
            </Field>
            {tipoOrigen === "poder" && (
              <Field label="TP (Tarjeta Profesional)">
                <input className={inp} value={data.tp_solicitante ?? ""} onChange={e => set("tp_solicitante", e.target.value)} placeholder="Número TP" />
              </Field>
            )}
          </div>
        </div>
      )}

      {/* ── Propietario ── */}
      {needsPropietario && (
        <div className="card p-5 space-y-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700 pb-2">
            {tipoMutacion === "cancelacion" || tipoMutacion === "quinta_clase" ? "Poseedor" : tipoOrigen === "representante_legal" ? "Empresa propietaria" : "Propietario"}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Field label={tipoOrigen === "representante_legal" ? "Razón social" : "Nombre completo"} required>
                <input className={inp} value={data.nombre_propietario ?? ""} onChange={e => set("nombre_propietario", e.target.value)} placeholder={tipoOrigen === "representante_legal" ? "Razón social de la empresa" : "Nombre completo del propietario"} />
              </Field>
            </div>
            {tipoOrigen !== "representante_legal" && (
              <Field label="Tipo de documento">
                <select className={inp} value={data.tipo_doc_propietario ?? "CC"} onChange={e => set("tipo_doc_propietario", e.target.value)}>
                  {TIPOS_DOCUMENTO.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
            )}
            <Field label={tipoOrigen === "representante_legal" ? "NIT" : "Número de documento"} required>
              <input className={inp} value={data.cedula_propietario ?? ""} onChange={e => set("cedula_propietario", e.target.value)} placeholder={tipoOrigen === "representante_legal" ? "NIT de la empresa" : "Cédula / NIT"} />
            </Field>
          </div>
        </div>
      )}

      {/* ── Predio ── */}
      <div className="card p-5 space-y-4">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700 pb-2">Datos del predio</h3>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Número predial" required>
            <input className={clsx(inp, "font-mono text-xs")} value={data.numero_predial} onChange={e => set("numero_predial", e.target.value)} placeholder="Código catastral" />
          </Field>
          <Field label="Folio de matrícula inmobiliaria" required>
            <FolioInput value={data.folio_matricula} onChange={v => set("folio_matricula", v)} />
          </Field>
          {/* Radicado para complementación propietario */}
          {needsRadicado && tipoOrigen !== "snr" && (
            <Field label="Número de radicado" required>
              <input className={inp} value={data.numero_radicado ?? ""} onChange={e => set("numero_radicado", e.target.value)} placeholder="2024-XXXX" />
            </Field>
          )}
        </div>
      </div>

      {/* ── Desenglobe (Segunda Clase) ── */}
      {tipoMutacion === "segunda_clase" && (
        <div className="card p-5 space-y-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700 pb-2">Desenglobe</h3>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Folio matriz" required>
              <FolioInput value={data.folio_matriz ?? ""} onChange={v => set("folio_matriz", v)} />
            </Field>
            <Field label="Número de escritura" required>
              <input className={inp} value={data.numero_escritura ?? ""} onChange={e => set("numero_escritura", e.target.value)} placeholder="1308" />
            </Field>
            <Field label="Fecha de escritura" required>
              <input className={inp} value={data.fecha_escritura ?? ""} onChange={e => set("fecha_escritura", e.target.value)} placeholder="06/06/2024" />
            </Field>
            <Field label="Notaría" required>
              <input className={inp} value={data.notaria ?? ""} onChange={e => set("notaria", e.target.value)} placeholder="Notaria segunda de Montería" />
            </Field>
          </div>
          <Field label="Folios resultantes del desenglobe" required>
            <div className="space-y-1.5">
              {data.folios_resultantes.map((folio, i) => (
                <div key={i} className="flex items-center gap-2 group">
                  <span className="flex-1 text-sm text-slate-300 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/50">{folio}</span>
                  <button type="button" onClick={() => removeFolio(i)} className="opacity-0 group-hover:opacity-100 p-1 text-brand-danger hover:bg-red-500/10 rounded transition-all">
                    <Minus size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-1.5">
              <div className="flex-1">
                <FolioInput value={newFolio} onChange={setNewFolio} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addFolio())} />
              </div>
              <button type="button" onClick={addFolio} className="btn-ghost px-3"><Plus size={16} /></button>
            </div>
          </Field>
          <p className="text-xs text-slate-500">Se requieren al menos 2 folios resultantes.</p>
        </div>
      )}

      {/* ── Cancelación de inscripción ── */}
      {tipoMutacion === "cancelacion" && (
        <div className="card p-5 space-y-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700 pb-2">Cancelación de inscripción</h3>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Referencia catastral donde ya está inscrito(a)" required>
              <input className={clsx(inp, "font-mono text-xs")} value={data.numero_predial_nuevo ?? ""} onChange={e => set("numero_predial_nuevo", e.target.value)} placeholder="Código catastral" />
            </Field>
            <Field label="Fecha de efectos de la cancelación" required>
              <input className={inp} value={data.fecha_efectos ?? ""} onChange={e => set("fecha_efectos", e.target.value)} placeholder="01/07/2025" />
            </Field>
          </div>
        </div>
      )}

      {/* ── Revisión de avalúo catastral (Cuarta Clase) ── */}
      {tipoMutacion === "cuarta_clase" && (
        <div className="card p-5 space-y-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700 pb-2">
            Revisión de avalúo catastral
          </h3>
          <Field label="Dirección del predio">
            <input className={inp} value={data.direccion_predio ?? ""} onChange={e => set("direccion_predio", e.target.value)} placeholder="Calle 45 No. 12-30, barrio Cantaclaro" />
          </Field>

          <div>
            <label className="field-label">Subir informe técnico (PDF / Word / TXT)</label>
            <label className="mt-1 flex items-center gap-2 cursor-pointer text-xs px-3 py-2 rounded-lg border border-slate-600 text-slate-400 hover:border-brand-primary hover:text-brand-primary transition-all w-fit">
              <Upload size={14} />
              {uploadingInforme ? "Extrayendo texto..." : "Elegir archivo"}
              <input
                type="file" accept=".pdf,.docx,.txt" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadInforme(f); e.target.value = ""; }}
              />
            </label>
            {informeError && <p className="text-xs text-brand-danger mt-1.5">{informeError}</p>}
          </div>

          {informeCandidatos.length > 0 && (
            <Field label="Párrafos detectados en el documento — agrega los que correspondan">
              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {informeCandidatos.map((p, i) => (
                  <div key={i} className="flex items-start gap-2 bg-slate-800/40 border border-slate-700/50 rounded-lg p-2">
                    <button type="button" onClick={() => addParrafo(p)} className="btn-ghost px-2 py-1 shrink-0 mt-0.5">
                      <Plus size={14} />
                    </button>
                    <p className="text-xs text-slate-400 leading-relaxed">{p}</p>
                  </div>
                ))}
              </div>
            </Field>
          )}

          <Field label="Párrafos seleccionados para la motivada" required>
            <div className="space-y-1.5">
              {data.parrafos_informe_tecnico.map((p, i) => (
                <div key={i} className="flex items-start gap-2 group">
                  <span className="flex-1 text-sm text-slate-300 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/50">{p}</span>
                  <button type="button" onClick={() => removeParrafo(i)} className="opacity-0 group-hover:opacity-100 p-1 text-brand-danger hover:bg-red-500/10 rounded transition-all shrink-0">
                    <Minus size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-1.5">
              <textarea className={clsx(inp, "flex-1 min-h-[60px] resize-y text-xs")} value={newParrafo} onChange={e => setNewParrafo(e.target.value)}
                placeholder="O escribe/pega aquí un párrafo manualmente..." />
              <button type="button" onClick={() => addParrafo()} className="btn-ghost px-3 self-start"><Plus size={16} /></button>
            </div>
            <p className="text-xs text-slate-500 mt-1">Se requiere al menos un párrafo.</p>
          </Field>
        </div>
      )}

      {/* ── Incorporación de mejora/informalidad (Quinta Clase) ── */}
      {tipoMutacion === "quinta_clase" && (
        <div className="card p-5 space-y-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700 pb-2">
            Incorporación de predio formal/informal
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Fecha de visita técnica" required>
              <input className={inp} value={data.fecha_visita_tecnica ?? ""} onChange={e => set("fecha_visita_tecnica", e.target.value)} placeholder="10/04/2025" />
            </Field>
            <Field label="Nueva referencia catastral asignada" required>
              <input className={clsx(inp, "font-mono text-xs")} value={data.numero_predial_nuevo ?? ""} onChange={e => set("numero_predial_nuevo", e.target.value)} placeholder="Código catastral de la mejora/informalidad" />
            </Field>
            <Field label="Fecha de la compraventa" required>
              <input className={inp} value={data.fecha_compraventa ?? ""} onChange={e => set("fecha_compraventa", e.target.value)} placeholder="15/01/2024" />
            </Field>
            <Field label="Notaría o entidad de la compraventa" required>
              <input className={inp} value={data.entidad_compraventa ?? ""} onChange={e => set("entidad_compraventa", e.target.value)} placeholder="Notaría Tercera de Montería" />
            </Field>
          </div>
        </div>
      )}

      {/* ── Áreas (Tercera Clase) ── */}
      {tipoMutacion === "tercera_clase" && (
        <div className="card p-5 space-y-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700 pb-2">Áreas</h3>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Área construida (m²)" required>
              <input type="number" min={1} step={0.5} className={inp} value={data.area_construida_m2 ?? ""} onChange={e => set("area_construida_m2", e.target.value)} placeholder="95.5" />
            </Field>
            <Field label="Área de terreno (m²)" required>
              <input type="number" min={1} step={0.5} className={inp} value={data.area_terreno_m2 ?? ""} onChange={e => set("area_terreno_m2", e.target.value)} placeholder="120" />
            </Field>
          </div>
        </div>
      )}

      {/* ── Campo rectificado (Rectificación) ── */}
      {tipoMutacion === "rectificacion" && (
        <div className="card p-5 space-y-3">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700 pb-2">Dato a rectificar</h3>
          <div className="flex flex-wrap gap-1.5">
            {CAMPOS_RAPIDOS_RECT.filter(c => c !== data.campo_rectificado).map(campo => (
              <button key={campo} type="button" onClick={() => set("campo_rectificado", campo)}
                className="text-xs px-2.5 py-1 rounded-full border border-slate-600 text-slate-400 hover:border-brand-primary hover:text-brand-primary transition-all">
                {campo}
              </button>
            ))}
          </div>
          <Field label="Campo que se rectifica" required>
            <input className={inp} value={data.campo_rectificado ?? ""} onChange={e => set("campo_rectificado", e.target.value)} placeholder="ej: el área construida, la dirección..." />
          </Field>
        </div>
      )}

      {/* ── Campo complementado (Complementación propietario) ── */}
      {tipoMutacion === "complementacion" && tipoOrigen !== "snr" && (
        <div className="card p-5 space-y-3">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700 pb-2">Dato a complementar</h3>
          <div className="flex flex-wrap gap-1.5">
            {CAMPOS_RAPIDOS_COMP.filter(c => c !== data.campo_complementado).map(campo => (
              <button key={campo} type="button" onClick={() => set("campo_complementado", campo)}
                className="text-xs px-2.5 py-1 rounded-full border border-slate-600 text-slate-400 hover:border-brand-primary hover:text-brand-primary transition-all">
                {campo}
              </button>
            ))}
          </div>
          <Field label="Dato que se complementa" required>
            <input className={inp} value={data.campo_complementado ?? ""} onChange={e => set("campo_complementado", e.target.value)} placeholder="ej: propietario, área construida..." />
          </Field>
        </div>
      )}
      </div>

      {/* ── Documentos ── */}
      <div className="card p-5 space-y-3">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700 pb-2">Documentos justificativos</h3>

        {usaFuenteAdministrativa ? (
          <>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Fuente administrativa">
                <select className={inp} value={data.fuente_administrativa_tipo ?? ""} onChange={e => setFuenteTipo(e.target.value)}>
                  <option value="">Fuente administrativa</option>
                  {FUENTES_ADMINISTRATIVAS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </Field>
              <Field label="N°">
                <input
                  className={clsx(inp, detalleFuenteDeshabilitado && "opacity-50 cursor-not-allowed")} disabled={detalleFuenteDeshabilitado}
                  value={data.fuente_administrativa_numero ?? ""}
                  onChange={e => set("fuente_administrativa_numero", e.target.value)}
                  placeholder="N°"
                />
              </Field>
              <Field label="Fecha">
                <input
                  className={clsx(inp, detalleFuenteDeshabilitado && "opacity-50 cursor-not-allowed")} disabled={detalleFuenteDeshabilitado}
                  value={data.fuente_administrativa_fecha ?? ""}
                  onChange={e => set("fuente_administrativa_fecha", e.target.value)}
                  placeholder="DD/MM/AAAA"
                />
              </Field>
              <Field label="Ente emisor">
                <input
                  className={clsx(inp, detalleFuenteDeshabilitado && "opacity-50 cursor-not-allowed")} disabled={detalleFuenteDeshabilitado}
                  value={data.fuente_administrativa_ente_emisor ?? ""}
                  onChange={e => set("fuente_administrativa_ente_emisor", e.target.value)}
                  onPaste={e => {
                    e.preventDefault();
                    const raw = e.clipboardData.getData("text");
                    const formatted = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
                    const el = e.currentTarget;
                    const start = el.selectionStart ?? 0;
                    const end   = el.selectionEnd   ?? 0;
                    const cur   = data.fuente_administrativa_ente_emisor ?? "";
                    set("fuente_administrativa_ente_emisor", cur.slice(0, start) + formatted + cur.slice(end));
                  }}
                  placeholder="Ente emisor"
                />
              </Field>
            </div>
            <button type="button" onClick={() => setModalDocsAbierto(true)} className="btn-primary">
              <ListChecks size={15} />Elegir documentos aportados
            </button>
          </>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {(DOCS_RAPIDOS[tipoMutacion] ?? []).filter(d => !data.documentos_aportados.includes(d)).map(doc => (
              <button key={doc} type="button" onClick={() => addDoc(doc)}
                className="text-xs px-2.5 py-1 rounded-full border border-slate-600 text-slate-400 hover:border-brand-primary hover:text-brand-primary transition-all">
                + {doc}
              </button>
            ))}
          </div>
        )}

        <div className="space-y-1.5">
          {data.documentos_aportados.map((doc, i) => {
            const esAuto = autoDocsRef.current.has(doc);
            return (
              <div key={i} className="flex items-center gap-2 group">
                <span className="flex-1 text-sm text-slate-300 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/50 flex items-center gap-2">
                  {esAuto && (
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-primary border border-brand-primary/40 rounded px-1.5 py-0.5 shrink-0">
                      Auto
                    </span>
                  )}
                  {doc}
                </span>
                <button type="button" onClick={() => removeDoc(i)} className="opacity-0 group-hover:opacity-100 p-1 text-brand-danger hover:bg-red-500/10 rounded transition-all">
                  <Minus size={14} />
                </button>
              </div>
            );
          })}
        </div>

        {!usaFuenteAdministrativa && (
          <div className="flex gap-2">
            <input className={clsx(inp, "flex-1")} value={newDoc} onChange={e => setNewDoc(e.target.value)}
              onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addDoc())} placeholder="Otro documento..." />
            <button type="button" onClick={() => addDoc()} className="btn-ghost px-3"><Plus size={16} /></button>
          </div>
        )}
        {(tipoMutacion === "segunda_clase" || tipoMutacion === "quinta_clase" || usaFuenteAdministrativa) && (
          <p className="text-xs text-slate-500">
            Los marcados <span className="text-brand-primary font-medium">Auto</span> se redactan solos con los datos
            que ya llenaste arriba — si no aplican para este caso, quítalos a mano.
          </p>
        )}
      </div>

      {modalDocsAbierto && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70" onClick={() => setModalDocsAbierto(false)}>
          <div
            className="card w-full sm:max-w-lg max-h-[85vh] overflow-y-auto rounded-b-none sm:rounded-xl p-5 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-brand-text">Documentos aportados</h3>
                <p className="text-xs text-slate-500">Toca para sumarlos a la lista</p>
              </div>
              <button type="button" onClick={() => setModalDocsAbierto(false)} className="p-1.5 rounded-lg text-slate-500 hover:text-brand-text hover:bg-slate-700/50">
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {DOCS_JUSTIFICATIVOS_CATALOGO.map(doc => {
                const activo = data.documentos_aportados.includes(doc);
                return (
                  <button
                    key={doc} type="button" onClick={() => toggleDoc(doc)}
                    className={clsx(
                      "text-xs px-2.5 py-1.5 rounded-full border transition-all",
                      activo
                        ? "bg-brand-primary border-brand-primary text-white"
                        : "border-slate-600 text-slate-400 hover:border-brand-primary hover:text-brand-primary",
                    )}
                  >
                    {activo ? "✓ " : "+ "}{doc}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-700">
              <input
                className={clsx(inp, "flex-1")}
                value={docModalInput} onChange={e => setDocModalInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && (e.preventDefault(), (addDoc(docModalInput), setDocModalInput("")))}
                placeholder="Otro documento que no esté en la lista..."
              />
              <button type="button" onClick={() => { addDoc(docModalInput); setDocModalInput(""); }} className="btn-ghost px-3">
                <Plus size={16} />
              </button>
            </div>

            <button type="button" onClick={() => setModalDocsAbierto(false)} className="btn-primary w-full justify-center">
              Listo
            </button>
          </div>
        </div>
      )}

      {/* ── Artículos finales ── */}
      <div className="card p-5 space-y-3">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700 pb-2">Artículos finales</h3>
        <div className="grid grid-cols-3 gap-2">
          {([
            { id: null,              label: "Sin artículos", icon: BellMinus },
            { id: "notificable",     label: "Notificable",   icon: Bell     },
            { id: "no_notificable",  label: "No notificable",icon: BellOff  },
          ] as const).map(({ id, label, icon: Icon }) => (
            <button key={label} type="button"
              onClick={() => set("tipo_notificacion", id)}
              className={clsx(
                "flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium border transition-all",
                data.tipo_notificacion === id
                  ? "border-brand-primary bg-blue-500/10 text-brand-primary"
                  : "border-slate-600 text-slate-400 hover:border-slate-400 hover:text-slate-200"
              )}>
              <Icon size={15} />{label}
            </button>
          ))}
        </div>
        {data.tipo_notificacion && (
          <p className="text-xs text-slate-500">
            Se agregarán los artículos segundo al quinto + COMUNÍQUESE Y CÚMPLASE al final de la motivada.
          </p>
        )}
      </div>

      <button type="button" onClick={() => onGenerate(data)} disabled={isLoading || !canSubmit}
        className="btn-primary w-full justify-center py-3.5 text-base">
        {isLoading
          ? <><span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />Generando motivada...</>
          : <><Wand2 size={18} />Generar Motivada</>}
      </button>
    </div>
  );
}
