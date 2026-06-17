"use client";

import { useCallback, useEffect, useState } from "react";
import { listarSoportes, subirSoporte, eliminarSoporte, SoporteInfo } from "@/lib/api";
import { Upload, FileCheck, AlertCircle, RefreshCw, Trash2, BookOpen } from "lucide-react";
import clsx from "clsx";

const EXTENSIONES_VALIDAS = [".pdf", ".docx", ".txt"];

function formatBytes(bytes: number) {
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${(bytes / 1024).toFixed(1)} KB`;
}

export default function SoportesPanel() {
  const [soportes, setSoportes] = useState<SoporteInfo[]>([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setSoportes(await listarSoportes());
    } catch {/* ignore */}
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleFiles = async (files: FileList) => {
    setError(null);
    const invalido = Array.from(files).find(
      f => !EXTENSIONES_VALIDAS.some(ext => f.name.toLowerCase().endsWith(ext))
    );
    if (invalido) {
      setError("Solo se aceptan archivos .pdf, .docx o .txt");
      return;
    }
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        await subirSoporte(file);
      }
      await load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg ?? "Error al subir el documento");
    } finally {
      setUploading(false);
    }
  };

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar este documento de la base de conocimiento?")) return;
    await eliminarSoporte(id);
    setSoportes(prev => prev.filter(s => s.id !== id));
  };

  return (
    <div className="card p-5 space-y-4">
      <h3 className="section-title">
        <BookOpen size={16} />
        Base de conocimiento del asistente
      </h3>
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
        Sube documentos de referencia (PDF, Word o texto). El Asistente Catastral los usará
        como fuente al responder consultas de cualquier usuario.
      </p>

      <label
        className={clsx(
          "flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed cursor-pointer transition-all",
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
          accept=".pdf,.docx,.txt"
          multiple
          className="hidden"
          onChange={(e) => e.target.files?.length && handleFiles(e.target.files)}
          disabled={uploading}
        />
        {uploading ? (
          <RefreshCw size={24} className="text-brand-primary animate-spin" />
        ) : (
          <Upload size={24} className="text-slate-500" />
        )}
        <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
          {uploading ? "Procesando documento..." : "Arrastra tus documentos aquí"}
        </p>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>o haz clic para seleccionar (.pdf, .docx, .txt)</p>
      </label>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-brand-danger">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {soportes.length > 0 && (
        <div className="space-y-2">
          {soportes.map((s) => (
            <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg border" style={{ borderColor: "var(--border)" }}>
              <FileCheck size={16} className="text-brand-success shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>{s.nombre_original}</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {formatBytes(s.tamano_bytes)} · {s.longitud_texto.toLocaleString("es-CO")} caracteres extraídos
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(s.id)}
                className="p-1.5 text-slate-500 hover:text-brand-danger hover:bg-red-500/10 rounded transition-all shrink-0"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
