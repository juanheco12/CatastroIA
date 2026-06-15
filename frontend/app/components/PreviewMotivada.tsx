"use client";

import { useState } from "react";
import { Copy, CheckCircle, RotateCcw, Cpu, Edit3, Save } from "lucide-react";
import { MotivadaGeneradaResponse, TerceraClaseFormData } from "@/lib/api";
import clsx from "clsx";

interface PreviewMotivadaProps {
  motivada: MotivadaGeneradaResponse;
  formData: TerceraClaseFormData;
  onReset: () => void;
}

export default function PreviewMotivada({ motivada, formData, onReset }: PreviewMotivadaProps) {
  const [texto, setTexto]         = useState(motivada.texto_motivada);
  const [editMode, setEditMode]   = useState(false);
  const [copied, setCopied]       = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(texto);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const wordCount = texto.split(/\s+/).filter(Boolean).length;

  // Simplified form data (new schema)
  const fd = formData as never as {
    nombre_propietario: string;
    cedula: string;
    numero_predial: string;
    folio_matricula: string;
    area_construida_m2: number;
    area_terreno_m2: number;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <CheckCircle size={18} className="text-brand-success" />
            Motivada generada
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {fd.nombre_propietario} · Predial {fd.numero_predial}
            {motivada.tokens_usados ? (
              <span className="ml-2 inline-flex items-center gap-1">
                <Cpu size={11} />{motivada.tokens_usados.toLocaleString()} tokens
              </span>
            ) : (
              <span className="ml-2 text-amber-500/70">modo demo</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setEditMode(v => !v)}
            className={clsx("btn-ghost text-xs", editMode && "border-blue-500 text-blue-400")}
          >
            {editMode ? <><Save size={13} />Listo</> : <><Edit3 size={13} />Editar</>}
          </button>
          <button type="button" onClick={onReset} className="btn-ghost text-xs">
            <RotateCcw size={13} />
            Nueva
          </button>
        </div>
      </div>

      {/* Motivada text */}
      <div className="card glow-border">
        {editMode ? (
          <textarea
            className="w-full bg-transparent px-5 py-4 text-slate-200 text-sm leading-relaxed
                       resize-none focus:outline-none min-h-[400px]"
            value={texto}
            onChange={e => setTexto(e.target.value)}
          />
        ) : (
          <div className="px-5 py-4 text-slate-200 text-sm leading-relaxed whitespace-pre-wrap min-h-[400px]">
            {texto}
          </div>
        )}
        <div className="border-t border-slate-700 px-5 py-2 text-xs text-slate-500">
          {wordCount} palabras
        </div>
      </div>

      {/* PRIMARY ACTION — Copy */}
      <button
        type="button"
        onClick={handleCopy}
        className={clsx(
          "w-full justify-center py-4 rounded-xl font-bold text-base flex items-center gap-3 transition-all duration-300",
          copied
            ? "bg-emerald-600 text-white"
            : "bg-brand-primary hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20"
        )}
      >
        {copied ? (
          <><CheckCircle size={20} />¡Copiado al portapapeles!</>
        ) : (
          <><Copy size={20} />Copiar motivada</>
        )}
      </button>

      {/* Summary */}
      <div className="card p-4 bg-slate-900/50 grid grid-cols-3 gap-3 text-xs">
        {[
          ["Propietario", fd.nombre_propietario],
          ["Cédula",      fd.cedula],
          ["Predial",     fd.numero_predial],
          ["Matrícula",   fd.folio_matricula],
          ["Área constr.", `${fd.area_construida_m2} m²`],
          ["Área terreno", `${fd.area_terreno_m2} m²`],
        ].map(([k, v]) => (
          <div key={k}>
            <dt className="text-slate-500">{k}</dt>
            <dd className="text-slate-300 font-medium truncate">{v}</dd>
          </div>
        ))}
      </div>
    </div>
  );
}
