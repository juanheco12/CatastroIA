"use client";

import { useState } from "react";
import { Wand2, Plus, Minus } from "lucide-react";
import { TipoMutacion, TipoOrigen } from "./MutationSelector";
import clsx from "clsx";

export interface SolicitudFormData {
  tipo_mutacion:   TipoMutacion;
  tipo_origen:     TipoOrigen;
  numero_predial:       string;
  folio_matricula:      string;
  municipio?:           string;
  nombre_propietario?:  string;
  cedula_propietario?:  string;
  nombre_solicitante?:  string;
  tipo_doc_solicitante?:string;
  cedula_solicitante?:  string;
  tp_solicitante?:      string;
  numero_radicado?:     string;
  area_construida_m2?:  number | string;
  area_terreno_m2?:     number | string;
  campo_rectificado?:   string;
  documentos_aportados: string[];
}

// ── Mock data per case ──────────────────────────────────────────────────────
const MOCKS: Record<string, Partial<SolicitudFormData>> = {
  primera_clase_propietario: {
    nombre_propietario: "HERNAN JOSE CAUSIL MARTINEZ",
    cedula_propietario: "6.872.472",
    numero_predial:     "23001000090004000000000",
    folio_matricula:    "140-38712",
    documentos_aportados: ["Sentencia SN del 2018-11-27 Juzgado Tercero Civil Municipal de Montería, debidamente registrada en el folio de matrícula inmobiliaria 140-38712"],
  },
  primera_clase_autorizado: {
    nombre_solicitante: "CARLOS ANDRES PEREZ GOMEZ",
    cedula_solicitante: "1.234.567",
    nombre_propietario: "HERNAN JOSE CAUSIL MARTINEZ",
    cedula_propietario: "6.872.472",
    numero_predial:     "23001000090004000000000",
    folio_matricula:    "140-38712",
    documentos_aportados: ["Sentencia SN del 2018-11-27 Juzgado Tercero Civil Municipal de Montería, debidamente registrada en el folio de matrícula inmobiliaria 140-38712"],
  },
  primera_clase_poder: {
    nombre_solicitante:    "JORGE LUIS MARTINEZ RUIZ",
    tipo_doc_solicitante:  "CC",
    cedula_solicitante:    "9.876.543",
    tp_solicitante:        "45678",
    nombre_propietario:    "HERNAN JOSE CAUSIL MARTINEZ",
    cedula_propietario:    "6.872.472",
    numero_predial:        "23001000090004000000000",
    folio_matricula:       "140-38712",
    documentos_aportados:  ["Poder especial No. 0826 del 31/12/2015 de la GOBERNACION DE CORDOBA, debidamente registrada en el folio de matrícula inmobiliaria 140-38712"],
  },
  primera_clase_snr: {
    numero_radicado: "2024-3312",
    numero_predial:  "23001000100039002700000",
    folio_matricula: "140-133775",
    municipio:       "Montería",
    documentos_aportados: ["Escritura pública No. 1053 del 23/11/2023 de la Notaría Cuarta de Montería, debidamente registrada en el folio de matrícula inmobiliaria 140-133775"],
  },
  tercera_clase_propietario: {
    nombre_propietario: "María Fernanda Gómez Restrepo",
    cedula_propietario: "43512876",
    numero_predial:     "05001000200000010001000",
    folio_matricula:    "001-123456",
    area_construida_m2: 95.5,
    area_terreno_m2:    120,
    documentos_aportados: ["Formulario de solicitud", "Copia cédula de ciudadanía", "Licencia de construcción"],
  },
  rectificacion_propietario: {
    nombre_propietario: "HERNAN JOSE CAUSIL MARTINEZ",
    cedula_propietario: "6.872.472",
    numero_predial:     "23001000090004000000000",
    folio_matricula:    "140-38712",
    campo_rectificado:  "el área construida",
    documentos_aportados: ["Certificado de tradición y libertad 140-38712", "Copia cédula de ciudadanía"],
  },
  rectificacion_autorizado: {
    nombre_solicitante: "CARLOS ANDRES PEREZ GOMEZ",
    cedula_solicitante: "1.234.567",
    nombre_propietario: "HERNAN JOSE CAUSIL MARTINEZ",
    cedula_propietario: "6.872.472",
    numero_predial:     "23001000090004000000000",
    folio_matricula:    "140-38712",
    campo_rectificado:  "la dirección",
    documentos_aportados: ["Certificado de tradición y libertad 140-38712", "Documento de autorización"],
  },
  rectificacion_oficio: {
    numero_predial:    "23001000090004000000000",
    folio_matricula:   "140-38712",
    campo_rectificado: "el propietario",
    documentos_aportados: ["Certificado de tradición y libertad 140-38712"],
  },
};

const DOCS_RAPIDOS: Record<string, string[]> = {
  primera_clase: [
    "Escritura pública",
    "Certificado de libertad y tradición",
    "Sentencia judicial",
    "Poder especial",
    "Resolución de adjudicación",
  ],
  tercera_clase: [
    "Licencia de construcción",
    "Plano de construcción aprobado",
    "Declaración de construcción",
    "Certificado de libertad y tradición",
  ],
  rectificacion: [
    "Certificado de tradición y libertad",
    "Copia cédula de ciudadanía",
    "Escritura pública",
    "Plano topográfico",
  ],
};

const CAMPOS_RAPIDOS = [
  "el área construida",
  "el área de terreno",
  "la dirección",
  "la nomenclatura",
  "el propietario",
  "los linderos",
  "el estrato socioeconómico",
];

interface Props {
  tipoMutacion: TipoMutacion;
  tipoOrigen:   TipoOrigen;
  onGenerate:   (data: SolicitudFormData) => void;
  isLoading:    boolean;
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="field-label">{label}{required && <span className="text-brand-danger ml-1">*</span>}</label>
      {children}
    </div>
  );
}

export default function FormBuilder({ tipoMutacion, tipoOrigen, onGenerate, isLoading }: Props) {
  const mockKey = `${tipoMutacion}_${tipoOrigen}`;
  const [data, setData] = useState<SolicitudFormData>({
    tipo_mutacion: tipoMutacion,
    tipo_origen:   tipoOrigen,
    numero_predial: "", folio_matricula: "",
    documentos_aportados: [],
  });
  const [newDoc, setNewDoc] = useState("");

  const set = (k: keyof SolicitudFormData, v: unknown) =>
    setData(p => ({ ...p, [k]: v }));

  const loadMock = () =>
    setData(p => ({ ...p, ...MOCKS[mockKey] }));

  const addDoc = (doc?: string) => {
    const d = (doc ?? newDoc).trim();
    if (!d || data.documentos_aportados.includes(d)) return;
    setData(p => ({ ...p, documentos_aportados: [...p.documentos_aportados, d] }));
    if (!doc) setNewDoc("");
  };

  const removeDoc = (i: number) =>
    setData(p => ({ ...p, documentos_aportados: p.documentos_aportados.filter((_, idx) => idx !== i) }));

  const inp = "field-input";

  const needsPropietario = tipoOrigen !== "snr" && tipoOrigen !== "oficio";
  const needsSolicitante = tipoOrigen === "autorizado" || tipoOrigen === "poder";

  // ── Validation ──────────────────────────────────────────────
  const canSubmit = (() => {
    if (!data.numero_predial || !data.folio_matricula) return false;
    if (tipoOrigen === "snr")    return !!data.numero_radicado;
    if (tipoOrigen === "oficio") {
      return tipoMutacion === "rectificacion" ? !!data.campo_rectificado : true;
    }
    if (!data.cedula_propietario || !data.nombre_propietario) return false;
    if (needsSolicitante && !data.cedula_solicitante) return false;
    if (tipoMutacion === "tercera_clase") return !!data.area_construida_m2 && !!data.area_terreno_m2;
    if (tipoMutacion === "rectificacion") return !!data.campo_rectificado;
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

      {/* ── SNR ── */}
      {tipoOrigen === "snr" && (
        <div className="card p-5 space-y-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700 pb-2">SNR</h3>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Número de radicado" required>
              <input className={inp} value={data.numero_radicado ?? ""} onChange={e => set("numero_radicado", e.target.value)} placeholder="2024-3312" />
            </Field>
            <Field label="Municipio" required>
              <input className={inp} value={data.municipio ?? ""} onChange={e => set("municipio", e.target.value)} placeholder="Montería" />
            </Field>
          </div>
        </div>
      )}

      {/* ── Solicitante (autorizado / poder) ── */}
      {needsSolicitante && (
        <div className="card p-5 space-y-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700 pb-2">
            {tipoOrigen === "autorizado" ? "Datos del autorizado" : "Datos del apoderado"}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Field label={tipoOrigen === "autorizado" ? "Nombre del autorizado" : "Nombre del apoderado"} required>
                <input className={inp} value={data.nombre_solicitante ?? ""} onChange={e => set("nombre_solicitante", e.target.value)} placeholder="Nombre completo" />
              </Field>
            </div>
            {tipoOrigen === "poder" && (
              <Field label="Tipo de documento">
                <select className={inp} value={data.tipo_doc_solicitante ?? "CC"} onChange={e => set("tipo_doc_solicitante", e.target.value)}>
                  {["CC","NIT","CE","PA"].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
            )}
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

      {/* ── Propietario (todos excepto SNR / Oficio) ── */}
      {needsPropietario && (
        <div className="card p-5 space-y-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700 pb-2">Propietario</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Field label="Nombre completo" required>
                <input className={inp} value={data.nombre_propietario ?? ""} onChange={e => set("nombre_propietario", e.target.value)} placeholder="Nombre completo del propietario" />
              </Field>
            </div>
            <Field label="Cédula" required>
              <input className={inp} value={data.cedula_propietario ?? ""} onChange={e => set("cedula_propietario", e.target.value)} placeholder="C.C. del propietario" />
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
            <input className={inp} value={data.folio_matricula} onChange={e => set("folio_matricula", e.target.value)} placeholder="140-XXXXX" />
          </Field>
        </div>
      </div>

      {/* ── Áreas (solo Tercera Clase) ── */}
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

      {/* ── Campo rectificado (solo Rectificación) ── */}
      {tipoMutacion === "rectificacion" && (
        <div className="card p-5 space-y-3">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700 pb-2">Dato a rectificar</h3>
          <div className="flex flex-wrap gap-1.5">
            {CAMPOS_RAPIDOS.filter(c => c !== data.campo_rectificado).map(campo => (
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

      {/* ── Documentos ── */}
      <div className="card p-5 space-y-3">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700 pb-2">Documentos justificativos</h3>
        <div className="flex flex-wrap gap-1.5">
          {(DOCS_RAPIDOS[tipoMutacion] ?? []).filter(d => !data.documentos_aportados.includes(d)).map(doc => (
            <button key={doc} type="button" onClick={() => addDoc(doc)}
              className="text-xs px-2.5 py-1 rounded-full border border-slate-600 text-slate-400 hover:border-brand-primary hover:text-brand-primary transition-all">
              + {doc}
            </button>
          ))}
        </div>
        <div className="space-y-1.5">
          {data.documentos_aportados.map((doc, i) => (
            <div key={i} className="flex items-center gap-2 group">
              <span className="flex-1 text-sm text-slate-300 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/50">{doc}</span>
              <button type="button" onClick={() => removeDoc(i)} className="opacity-0 group-hover:opacity-100 p-1 text-brand-danger hover:bg-red-500/10 rounded transition-all">
                <Minus size={14} />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input className={clsx(inp, "flex-1")} value={newDoc} onChange={e => setNewDoc(e.target.value)}
            onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addDoc())} placeholder="Otro documento..." />
          <button type="button" onClick={() => addDoc()} className="btn-ghost px-3"><Plus size={16} /></button>
        </div>
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
