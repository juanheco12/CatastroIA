"use client";

import { useState } from "react";
import { FileDown, Edit3, Save, CheckCircle, Copy, RotateCcw, Cpu } from "lucide-react";
import { TerceraClaseFormData, MotivadaGeneradaResponse, exportarWord, downloadBase64Docx } from "@/lib/api";
import clsx from "clsx";

interface PreviewMotivadaProps {
  motivada: MotivadaGeneradaResponse;
  formData: TerceraClaseFormData;
  onReset: () => void;
}

export default function PreviewMotivada({ motivada, formData, onReset }: PreviewMotivadaProps) {
  const [editMode, setEditMode] = useState(false);
  const [textoEditado, setTextoEditado] = useState(motivada.texto_motivada);
  const [exporting, setExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const result = await exportarWord(formData, textoEditado);
      downloadBase64Docx(result.content_base64, result.filename);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (err) {
      console.error("Error al exportar:", err);
      alert("Error al generar el documento Word. Revise la consola.");
    } finally {
      setExporting(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(textoEditado);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const wordCount = textoEditado.split(/\s+/).filter(Boolean).length;
  const charCount = textoEditado.length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="card p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <CheckCircle size={20} className="text-brand-success" />
              Motivada Generada
            </h2>
            <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-400">
              <span>
                <span className="text-slate-300 font-medium">Expediente:</span>{" "}
                {motivada.numero_expediente}
              </span>
              <span>
                <span className="text-slate-300 font-medium">Propietario:</span>{" "}
                {motivada.propietario}
              </span>
              <span>
                <span className="text-slate-300 font-medium">Tipo:</span>{" "}
                {motivada.tipo_mutacion}
              </span>
              {motivada.tokens_usados && (
                <span className="flex items-center gap-1">
                  <Cpu size={12} />
                  {motivada.tokens_usados.toLocaleString()} tokens
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setEditMode((v) => !v)}
              className={clsx("btn-ghost", editMode && "border-blue-500 text-blue-400")}
            >
              {editMode ? <Save size={15} /> : <Edit3 size={15} />}
              {editMode ? "Guardar edición" : "Editar"}
            </button>
            <button type="button" onClick={handleCopy} className="btn-ghost">
              <Copy size={15} />
              {copied ? "Copiado" : "Copiar"}
            </button>
          </div>
        </div>
      </div>

      {/* Motivada content */}
      <div className="card glow-border">
        {editMode ? (
          <textarea
            className="w-full bg-transparent px-5 py-4 text-slate-200 text-sm leading-relaxed
                       font-mono resize-none focus:outline-none min-h-[450px]"
            value={textoEditado}
            onChange={(e) => setTextoEditado(e.target.value)}
          />
        ) : (
          <div className="px-5 py-4 text-slate-200 text-sm leading-relaxed whitespace-pre-wrap min-h-[450px]">
            {textoEditado}
          </div>
        )}
        <div className="border-t border-slate-700 px-5 py-2 flex justify-between items-center">
          <span className="text-xs text-slate-500">
            {wordCount} palabras · {charCount} caracteres
          </span>
          {wordCount > 900 && (
            <span className="text-xs text-brand-warning">
              Supera el límite recomendado de 900 palabras
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className={clsx(
            "btn-success flex-1 justify-center py-3",
            exportSuccess && "bg-emerald-600"
          )}
        >
          {exporting ? (
            <>
              <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              Generando documento...
            </>
          ) : exportSuccess ? (
            <>
              <CheckCircle size={18} />
              ¡Descargado!
            </>
          ) : (
            <>
              <FileDown size={18} />
              Exportar a Word (.docx)
            </>
          )}
        </button>
        <button type="button" onClick={onReset} className="btn-ghost px-4">
          <RotateCcw size={16} />
          Nueva motivada
        </button>
      </div>

      {/* Metadata card */}
      <div className="card p-4 bg-slate-900/50">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Resumen del trámite
        </h4>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
          {[
            ["Propietario", (formData as never as { nombre_propietario: string }).nombre_propietario],
            ["Cédula", (formData as never as { cedula: string }).cedula],
            ["Número predial", (formData as never as { numero_predial: string }).numero_predial],
            ["Folio matrícula", (formData as never as { folio_matricula: string }).folio_matricula],
            ["Área construida", `${(formData as never as { area_construida_m2: number }).area_construida_m2} m²`],
            ["Área terreno", `${(formData as never as { area_terreno_m2: number }).area_terreno_m2} m²`],
          ].map(([k, v]) => (
            <div key={String(k)}>
              <dt className="text-slate-500">{k}</dt>
              <dd className="text-slate-300 font-medium">{String(v)}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
