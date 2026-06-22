"use client";

import { useState, useCallback } from "react";
import {
  ingestarZipBiblioteca, ingestarDocxBiblioteca, eliminarTodasPlantillas, extractErrorMessage,
  IngestaResumen, ItemIngesta, labelCategoria,
} from "@/lib/api";
import { Upload, RefreshCw, AlertCircle, CheckCircle2, FileWarning, Trash2 } from "lucide-react";
import clsx from "clsx";

interface BibliotecaUploaderProps {
  onIngestaCompleta?: (resumen: IngestaResumen) => void;
  /** Se dispara despues de vaciar la biblioteca completa, para que el panel
   * contenedor refresque contadores (p. ej. el badge de "Revisión"). */
  onBibliotecaVaciada?: () => void;
}

/** Un .docx suelto se ingesta con su propio endpoint (devuelve un solo
 * ItemIngesta, no un IngestaResumen) — se envuelve en la misma forma que el
 * resumen de un .zip para reutilizar el bloque de resultados de abajo. */
function resumenDeUnItem(item: ItemIngesta): IngestaResumen {
  return {
    total_archivos: 1,
    total_ingestados: item.estado === "error" ? 0 : 1,
    total_errores: item.estado === "error" ? 1 : 0,
    distribucion_categorias: item.categoria ? { [item.categoria]: 1 } : {},
    total_casos_atipicos: item.estado === "caso_atipico" ? 1 : 0,
    items: [item],
  };
}

export default function BibliotecaUploader({ onIngestaCompleta, onBibliotecaVaciada }: BibliotecaUploaderProps) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [vaciando, setVaciando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resumen, setResumen] = useState<IngestaResumen | null>(null);
  const [vaciado, setVaciado] = useState<number | null>(null);

  const handleFile = async (file: File) => {
    const nombre = file.name.toLowerCase();
    const esZip = nombre.endsWith(".zip");
    const esDocx = nombre.endsWith(".docx");
    if (!esZip && !esDocx) {
      setError("Solo se aceptan archivos .zip o .docx");
      return;
    }
    setError(null);
    setVaciado(null);
    setUploading(true);
    try {
      const data = esZip ? await ingestarZipBiblioteca(file) : resumenDeUnItem(await ingestarDocxBiblioteca(file));
      setResumen(data);
      onIngestaCompleta?.(data);
    } catch (err: unknown) {
      setError(extractErrorMessage(err, `Error al subir el archivo ${esZip ? ".zip" : ".docx"}`));
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

  const handleVaciarTodo = async () => {
    const confirmado = confirm(
      "Esto borra TODAS las plantillas de la biblioteca de forma permanente — incluidas las ya aprobadas/activas, " +
      "no solo las pendientes. Úsalo para empezar de cero si una carga subió documentos duplicados. ¿Confirmas que " +
      "quieres vaciar la biblioteca completa?"
    );
    if (!confirmado) return;
    setError(null);
    setResumen(null);
    setVaciando(true);
    try {
      const { eliminadas } = await eliminarTodasPlantillas();
      setVaciado(eliminadas);
      onBibliotecaVaciada?.();
    } catch (err: unknown) {
      setError(extractErrorMessage(err, "Error al vaciar la biblioteca"));
    } finally {
      setVaciando(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>Subir motivadas existentes</h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            Sube un .zip con varias motivadas .docx, o un .docx suelto. Ninguna queda activa automáticamente:
            cada una pasa por revisión humana antes de poder reutilizarse en un caso nuevo.
          </p>
        </div>
        <button
          type="button"
          onClick={handleVaciarTodo}
          disabled={vaciando || uploading}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-red-500/30 text-brand-danger hover:bg-red-500/10 transition-all shrink-0"
        >
          <Trash2 size={13} />{vaciando ? "Vaciando..." : "Vaciar todo"}
        </button>
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
          accept=".zip,.docx"
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
            {uploading ? "Procesando documentos..." : "Arrastra tu .zip o .docx de motivadas aquí"}
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

      {vaciado != null && (
        <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-sm text-brand-success">
          <CheckCircle2 size={16} />
          Se eliminaron {vaciado} plantilla{vaciado !== 1 ? "s" : ""}. La biblioteca quedó vacía — ya puedes volver a subir tus documentos.
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