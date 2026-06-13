"use client";

import { useState } from "react";
import { TerceraClaseFormData } from "@/lib/api";
import { Plus, Minus, Wand2, FileText } from "lucide-react";
import clsx from "clsx";

// Minimal form data type matching the simplified backend schema
export interface SimpleFormData {
  nombre_propietario: string;
  cedula: string;
  numero_predial: string;
  folio_matricula: string;
  area_construida_m2: number | string;
  area_terreno_m2: number | string;
  documentos_aportados: string[];
}

const MOCK_DATA: SimpleFormData = {
  nombre_propietario: "María Fernanda Gómez Restrepo",
  cedula: "43512876",
  numero_predial: "05001000200000010001000",
  folio_matricula: "001-123456",
  area_construida_m2: 95.5,
  area_terreno_m2: 120.0,
  documentos_aportados: [
    "Formulario de solicitud",
    "Copia cédula de ciudadanía",
    "Escritura pública de compraventa",
    "Licencia de construcción",
  ],
};

const INITIAL: SimpleFormData = {
  nombre_propietario: "",
  cedula: "",
  numero_predial: "",
  folio_matricula: "",
  area_construida_m2: "",
  area_terreno_m2: "",
  documentos_aportados: [
    "Formulario de solicitud",
    "Copia del documento de identidad",
  ],
};

const DOCS_COMUNES = [
  "Copia cédula de ciudadanía",
  "Escritura pública",
  "Licencia de construcción",
  "Certificado de libertad y tradición",
  "Plano de construcción",
  "Declaración de construcción",
];

interface FormBuilderProps {
  onGenerate: (data: SimpleFormData) => void;
  isLoading: boolean;
}

export default function FormBuilder({ onGenerate, isLoading }: FormBuilderProps) {
  const [data, setData] = useState<SimpleFormData>(INITIAL);
  const [newDoc, setNewDoc] = useState("");

  const set = (key: keyof SimpleFormData, value: unknown) =>
    setData((p) => ({ ...p, [key]: value }));

  const addDoc = (doc?: string) => {
    const d = (doc ?? newDoc).trim();
    if (!d || data.documentos_aportados.includes(d)) return;
    setData((p) => ({ ...p, documentos_aportados: [...p.documentos_aportados, d] }));
    if (!doc) setNewDoc("");
  };

  const removeDoc = (i: number) =>
    setData((p) => ({ ...p, documentos_aportados: p.documentos_aportados.filter((_, idx) => idx !== i) }));

  const canSubmit =
    data.nombre_propietario.trim() &&
    data.cedula.trim() &&
    data.numero_predial.trim() &&
    data.folio_matricula.trim() &&
    Number(data.area_construida_m2) > 0 &&
    Number(data.area_terreno_m2) > 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-100">Mutación Tercera Clase</h2>
          <p className="text-xs text-slate-500 mt-0.5">Incorporación de Construcción – IGAC</p>
        </div>
        <button type="button" onClick={() => setData(MOCK_DATA)} className="btn-ghost text-xs">
          <Wand2 size={13} />
          Datos de prueba
        </button>
      </div>

      {/* Datos del propietario */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-700">
          <FileText size={15} className="text-brand-primary" />
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Propietario</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="field-label">Nombre completo <span className="text-brand-danger">*</span></label>
            <input
              className="field-input"
              value={data.nombre_propietario}
              onChange={(e) => set("nombre_propietario", e.target.value)}
              placeholder="Nombre completo del propietario"
            />
          </div>
          <div>
            <label className="field-label">Cédula <span className="text-brand-danger">*</span></label>
            <input
              className="field-input"
              value={data.cedula}
              onChange={(e) => set("cedula", e.target.value)}
              placeholder="Número de cédula"
            />
          </div>
          <div>
            <label className="field-label">Número predial <span className="text-brand-danger">*</span></label>
            <input
              className="field-input font-mono text-xs"
              value={data.numero_predial}
              onChange={(e) => set("numero_predial", e.target.value)}
              placeholder="05001000200000010001000"
            />
          </div>
          <div className="col-span-2">
            <label className="field-label">Folio de matrícula inmobiliaria <span className="text-brand-danger">*</span></label>
            <input
              className="field-input"
              value={data.folio_matricula}
              onChange={(e) => set("folio_matricula", e.target.value)}
              placeholder="001-123456"
            />
          </div>
        </div>
      </div>

      {/* Áreas */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-700">
          <FileText size={15} className="text-brand-primary" />
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Áreas</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="field-label">Área construida (m²) <span className="text-brand-danger">*</span></label>
            <input
              type="number"
              min={1}
              step={0.5}
              className="field-input"
              value={data.area_construida_m2}
              onChange={(e) => set("area_construida_m2", e.target.value)}
              placeholder="95.5"
            />
          </div>
          <div>
            <label className="field-label">Área de terreno (m²) <span className="text-brand-danger">*</span></label>
            <input
              type="number"
              min={1}
              step={0.5}
              className="field-input"
              value={data.area_terreno_m2}
              onChange={(e) => set("area_terreno_m2", e.target.value)}
              placeholder="120.0"
            />
          </div>
        </div>
      </div>

      {/* Documentos */}
      <div className="card p-5 space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-700">
          <FileText size={15} className="text-brand-primary" />
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Documentos aportados</h3>
        </div>

        {/* Quick add buttons */}
        <div className="flex flex-wrap gap-1.5">
          {DOCS_COMUNES.filter((d) => !data.documentos_aportados.includes(d)).map((doc) => (
            <button
              key={doc}
              type="button"
              onClick={() => addDoc(doc)}
              className="text-xs px-2.5 py-1 rounded-full border border-slate-600 text-slate-400
                         hover:border-brand-primary hover:text-brand-primary transition-all"
            >
              + {doc}
            </button>
          ))}
        </div>

        {/* Current docs */}
        <div className="space-y-1.5">
          {data.documentos_aportados.map((doc, i) => (
            <div key={i} className="flex items-center gap-2 group">
              <span className="flex-1 text-sm text-slate-300 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/50">
                {doc}
              </span>
              <button
                type="button"
                onClick={() => removeDoc(i)}
                className="opacity-0 group-hover:opacity-100 p-1 text-brand-danger
                           hover:bg-red-500/10 rounded transition-all"
              >
                <Minus size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Manual add */}
        <div className="flex gap-2">
          <input
            className={clsx("field-input flex-1")}
            value={newDoc}
            onChange={(e) => setNewDoc(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addDoc())}
            placeholder="Otro documento..."
          />
          <button type="button" onClick={() => addDoc()} className="btn-ghost px-3">
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Submit */}
      <button
        type="button"
        onClick={() => onGenerate(data)}
        disabled={isLoading || !canSubmit}
        className="btn-primary w-full justify-center py-3 text-base"
      >
        {isLoading ? (
          <>
            <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            Generando motivada con Claude...
          </>
        ) : (
          <>
            <Wand2 size={18} />
            Generar Motivada
          </>
        )}
      </button>
    </div>
  );
}
