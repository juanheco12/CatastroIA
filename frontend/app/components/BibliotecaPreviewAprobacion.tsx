"use client";

import { useEffect, useState } from "react";
import {
  obtenerDetallePlantilla, previewGeneracionPlantilla, generarFinalPlantilla, downloadBase64Docx, extractErrorMessage,
  eliminarPlantilla,
  PlantillaDetalle, PreviewGeneracionResponse, ORIGENES_TRAMITE, labelCategoria, labelTipoCampo,
} from "@/lib/api";
import { RefreshCw, AlertCircle, FileText, Download, Eye, ArrowLeft, Trash2 } from "lucide-react";

interface BibliotecaPreviewAprobacionProps {
  plantillaId: number;
  onVolver: () => void;
}

export default function BibliotecaPreviewAprobacion({ plantillaId, onVolver }: BibliotecaPreviewAprobacionProps) {
  const [detalle, setDetalle] = useState<PlantillaDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [valores, setValores] = useState<Record<number, string>>({});
  const [tipoTramiteManual, setTipoTramiteManual] = useState("");

  const [preview, setPreview] = useState<PreviewGeneracionResponse | null>(null);
  const [generandoPreview, setGenerandoPreview] = useState(false);
  const [generandoFinal, setGenerandoFinal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listo, setListo] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  useEffect(() => {
    setLoading(true);
    obtenerDetallePlantilla(plantillaId)
      .then((d) => {
        setDetalle(d);
        setTipoTramiteManual(d.tipo_tramite_manual ?? "");
        const inicial: Record<number, string> = {};
        d.campos.filter((c) => c.confirmado).forEach((c) => { inicial[c.id] = c.texto_original; });
        setValores(inicial);
      })
      .catch(() => setError("No se pudo cargar la plantilla."))
      .finally(() => setLoading(false));
  }, [plantillaId]);

  const handleCambioValor = (campoId: number, valor: string) => {
    setValores((prev) => ({ ...prev, [campoId]: valor }));
    setPreview(null);
    setListo(false);
  };

  const handlePreview = async () => {
    setGenerandoPreview(true);
    setError(null);
    try {
      const res = await previewGeneracionPlantilla(plantillaId, valores, tipoTramiteManual || undefined);
      setPreview(res);
      setListo(true);
    } catch (err: unknown) {
      setError(extractErrorMessage(err, "Error al generar la vista previa."));
    } finally {
      setGenerandoPreview(false);
    }
  };

  const handleGenerarFinal = async () => {
    setGenerandoFinal(true);
    setError(null);
    try {
      const res = await generarFinalPlantilla(plantillaId, valores, tipoTramiteManual || undefined);
      downloadBase64Docx(res.content_base64, res.filename);
    } catch (err: unknown) {
      setError(extractErrorMessage(err, "Error al generar el documento final."));
    } finally {
      setGenerandoFinal(false);
    }
  };

  const handleEliminar = async () => {
    if (!detalle) return;
    const confirmado = window.confirm(
      `¿Eliminar "${detalle.nombre_original}" de la biblioteca? Esta acción no se puede deshacer.`
    );
    if (!confirmado) return;
    setEliminando(true);
    setError(null);
    try {
      await eliminarPlantilla(detalle.id);
      onVolver();
    } catch (err: unknown) {
      setError(extractErrorMessage(err, "Error al eliminar la plantilla."));
    } finally {
      setEliminando(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-12 justify-center" style={{ color: "var(--text-muted)" }}>
        <RefreshCw size={18} className="animate-spin" />Cargando plantilla...
      </div>
    );
  }

  if (!detalle) {
    return (
      <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-brand-danger">
        <AlertCircle size={16} />No se pudo cargar la plantilla.
      </div>
    );
  }

  const camposConfirmados = detalle.campos.filter((c) => c.confirmado);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-2">
        <button type="button" onClick={onVolver} className="flex items-center gap-1.5 text-xs btn-ghost px-2 py-1">
          <ArrowLeft size={13} />Volver a buscar
        </button>
        <button
          type="button"
          onClick={handleEliminar}
          disabled={eliminando}
          className="flex items-center gap-1.5 text-xs btn-ghost px-2 py-1 text-brand-danger"
        >
          <Trash2 size={13} />{eliminando ? "Eliminando..." : "Eliminar plantilla"}
        </button>
      </div>

      <div>
        <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>{detalle.nombre_original}</h2>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
          {labelCategoria(detalle.categoria)} · usada {detalle.contador_uso} vez(es)
        </p>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          Datos del caso nuevo
        </p>
        {camposConfirmados.length === 0 && (
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Esta plantilla no tiene campos variables confirmados — se generará el documento original sin cambios.
          </p>
        )}
        <div className="grid sm:grid-cols-2 gap-3">
          {camposConfirmados.map((c) => (
            <div key={c.id}>
              <label className="field-label">{labelTipoCampo(c.tipo_campo)}</label>
              <input
                className="field-input"
                value={valores[c.id] ?? ""}
                onChange={(e) => handleCambioValor(c.id, e.target.value)}
                placeholder={c.texto_original}
              />
            </div>
          ))}
        </div>
        <div>
          <label className="field-label">Origen de la solicitud (opcional)</label>
          <select
            className="field-input"
            value={tipoTramiteManual}
            onChange={(e) => { setTipoTramiteManual(e.target.value); setPreview(null); setListo(false); }}
          >
            <option value="">Sin especificar</option>
            {ORIGENES_TRAMITE.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      <button type="button" onClick={handlePreview} disabled={generandoPreview} className="btn-ghost">
        <Eye size={15} />{generandoPreview ? "Generando vista previa..." : "Ver vista previa"}
      </button>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-brand-danger">
          <AlertCircle size={16} />{error}
        </div>
      )}

      {preview && (
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
              Cambios aplicados
            </p>
            <div className="space-y-1">
              {preview.campos_reemplazados.length === 0 && (
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Sin cambios respecto al texto original.</p>
              )}
              {preview.campos_reemplazados.map((c) => (
                <div key={c.campo_id} className="text-xs flex items-center gap-2 flex-wrap">
                  <span style={{ color: "var(--text-muted)" }}>{labelTipoCampo(c.tipo_campo)}:</span>
                  <span className="font-mono line-through text-slate-500">{c.valor_anterior}</span>
                  <span>→</span>
                  <span className="font-mono" style={{ color: "var(--text)" }}>{c.valor_nuevo}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
              Texto completo previsto
            </p>
            <div
              className="text-sm leading-relaxed rounded-lg border p-4 max-h-[40vh] overflow-y-auto"
              style={{ borderColor: "var(--border)", whiteSpace: "pre-wrap", color: "var(--text)" }}
            >
              {preview.texto_previsto}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button type="button" onClick={handleGenerarFinal} disabled={!listo || generandoFinal} className="btn-primary">
              <Download size={15} />
              {generandoFinal ? "Generando documento..." : "Aprobar y generar documento final"}
            </button>
            <span className="text-xs flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
              <FileText size={12} />
              Revisa el texto antes de aprobar — la descarga genera el .docx final con el mismo formato del original.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}