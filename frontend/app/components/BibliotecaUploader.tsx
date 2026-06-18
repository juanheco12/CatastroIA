"use client";

import { useState, useCallback } from "react";
import { ingestarZipBiblioteca, IngestaResumen, labelCategoria } from "@/lib/api";
import { Upload, RefreshCw, AlertCircle, CheckCircle2, FileWarning } from "lucide-react";
import clsx from "clsx";

interface BibliotecaUploaderProps {
  onIngestaCompleta?: (resumen: IngestaResumen) => void;
}

export default function BibliotecaUploader({ onIngestaCompleta }: BibliotecaUploaderProps) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resumen, setResumen] = useState<IngestaResumen | null>(null);

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".zip")) {
      setError("Solo se aceptan archivos .zip");
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const data = await ingestarZipBiblioteca(file);
      setResumen(data);
      onIngestaCompleta?.(data);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg ?? "Error al subir el archivo .zip");
    } finally {
      setUploading(false);
    }
  };

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>Subir motivadas existentes</h2>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
          Sube un .zip con tus motivadas .docx ya redactadas. Ninguna queda activa automáticamente:
          cada una pasa por revisión humana antes de poder reutilizarse en un caso nuevo.
        </p>
      </div>

      <label
        className={clsx(
          "flex flex-col items-center justify-center gap-3 p-10 rounded-xl border-2 border-dashed cursor-pointer transition-all",
          dragging
            ? "border-brand-primary bg-teal-500/10"
            : "border-slate-600 hover:border-slate-500 hover:bg-slate-800/30"
        )}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <input
          type="file"
          accept=".zip"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          disabled={uploading}
        />
        {uploading ? (
          <RefreshCw size={32} className="text-brand-primary animate-spin" />
        ) : (
          <Upload size={32} className="text-slate-500" />
        )}
        <div className="text-center">
          <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
            {uploading ? "Procesando documentos..." : "Arrastra tu .zip de motivadas aquí"}
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>o haz clic para seleccionar</p>
        </div>
      </label>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-brand-danger">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {resumen && (
        <div className="card p-4 space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-brand-success" />
            <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>
              {resumen.total_ingestados} de {resumen.total_archivos} documentos procesados
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.entries(resumen.distribucion_categorias).map(([cat, n]) => (
              <div key={cat} className="rounded-lg border px-3 py-2" style={{ borderColor: "var(--border)" }}>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{labelCategoria(cat)}</p>
                <p className="text-lg font-bold" style={{ color: "var(--text)" }}>{n}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4 text-xs" style={{ color: "var(--text-muted)" }}>
            <span className="flex items-center gap-1.5">
              <FileWarning size={13} className="text-amber-400" />
              {resumen.total_casos_atipicos} caso{resumen.total_casos_atipicos !== 1 ? "s" : ""} atípico{resumen.total_casos_atipicos !== 1 ? "s" : ""}
            </span>
            {resumen.total_errores > 0 && (
              <span className="flex items-center gap-1.5 text-brand-danger">
                <AlertCircle size={13} />
                {resumen.total_errores} error{resumen.total_errores !== 1 ? "es" : ""}
              </span>
            )}
          </div>

          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Todos los documentos cayeron en revisión pendiente — ve a la pestaña &ldquo;Revisión&rdquo; para
            confirmar los campos variables y activarlos.
          </p>

          {resumen.items.some((i) => i.estado === "error") && (
            <div className="space-y-1 border-t pt-3" style={{ borderColor: "var(--border)" }}>
              {resumen.items.filter((i) => i.estado === "error").map((i) => (
                <p key={i.nombre_original} className="text-xs text-brand-danger">
                  {i.nombre_original}: {i.error}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}