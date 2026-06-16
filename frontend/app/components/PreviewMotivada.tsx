"use client";

import { useState } from "react";
import { Copy, CheckCircle, RotateCcw, Edit3, Save, FileText, ScrollText } from "lucide-react";
import { MotivadaGeneradaResponse } from "@/lib/api";
import { SolicitudFormData } from "./FormBuilder";
import clsx from "clsx";

interface PreviewMotivadaProps {
  motivada: MotivadaGeneradaResponse;
  formData: SolicitudFormData;
  onReset: () => void;
}

function CopyButton({ getText, label }: { getText: () => string; label: string }) {
  const [copied, setCopied] = useState(false);
  const handle = async () => {
    await navigator.clipboard.writeText(getText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };
  return (
    <button type="button" onClick={handle}
      className={clsx(
        "w-full justify-center py-3.5 rounded-xl font-bold text-base flex items-center gap-3 transition-all duration-300",
        copied
          ? "bg-emerald-600 text-white"
          : "bg-brand-primary hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20"
      )}>
      {copied ? <><CheckCircle size={20} />¡Copiado!</> : <><Copy size={20} />{label}</>}
    </button>
  );
}

export default function PreviewMotivada({ motivada, formData, onReset }: PreviewMotivadaProps) {
  const [texto, setTexto]       = useState(motivada.texto_motivada);
  const [editMode, setEditMode] = useState(false);

  const wordCount = texto.split(/\s+/).filter(Boolean).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <CheckCircle size={18} className="text-brand-success" />
            Motivada generada
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {motivada.propietario} · Predial {formData.numero_predial}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button type="button" onClick={() => setEditMode(v => !v)}
            className={clsx("btn-ghost text-xs", editMode && "border-blue-500 text-blue-400")}>
            {editMode ? <><Save size={13} />Listo</> : <><Edit3 size={13} />Editar</>}
          </button>
          <button type="button" onClick={onReset} className="btn-ghost text-xs">
            <RotateCcw size={13} />Nueva
          </button>
        </div>
      </div>

      {/* ── Motivada ── */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <FileText size={14} className="text-brand-primary" />
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Motivada</span>
        </div>
        <div className="card glow-border">
          {editMode ? (
            <textarea
              className="w-full bg-transparent px-5 py-4 text-slate-200 text-sm leading-relaxed
                         resize-none focus:outline-none min-h-[320px]"
              value={texto}
              onChange={e => setTexto(e.target.value)}
            />
          ) : (
            <div className="px-5 py-4 text-slate-200 text-sm leading-relaxed whitespace-pre-wrap min-h-[320px]">
              {texto}
            </div>
          )}
          <div className="border-t border-slate-700 px-5 py-2 text-xs text-slate-500">
            {wordCount} palabras
          </div>
        </div>
        <div className="mt-2">
          <CopyButton getText={() => texto} label="Copiar motivada" />
        </div>
      </div>

      {/* ── Artículos Finales (if present) ── */}
      {motivada.articulos_finales && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <ScrollText size={14} className="text-brand-warning" />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Artículos Finales</span>
          </div>
          <div className="card border-amber-500/20">
            <div className="px-5 py-4 text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
              {motivada.articulos_finales}
            </div>
          </div>
          <div className="mt-2">
            <CopyButton getText={() => motivada.articulos_finales!} label="Copiar artículos finales" />
          </div>
        </div>
      )}
    </div>
  );
}
