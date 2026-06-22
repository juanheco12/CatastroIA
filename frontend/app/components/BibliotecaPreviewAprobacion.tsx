"use client";

import { useEffect, useState } from "react";
import {
  obtenerDetallePlantilla, previewGeneracionPlantilla, generarFinalPlantilla, downloadBase64Docx, extractErrorMessage,
  eliminarPlantilla,
  PlantillaDetalle, ORIGENES_TRAMITE, labelCategoria, labelTipoCampo,
} from "@/lib/api";
import { RefreshCw, AlertCircle, Wand2, Download, ArrowLeft, Trash2, CheckCircle, FileText, Tag } from "lucide-react";
import CopyButton from "./CopyButton";

interface BibliotecaPreviewAprobacionProps {
  plantillaId: number;
  onVolver: () => void;
  /** Lleva al usuario a la pestaña Revisión con esta plantilla ya seleccionada,
   * para marcar/ajustar sus campos variables (la plantilla sigue activa mientras tanto). */
  onEditarCampos?: (plantillaId: number) => void;
}

interface ResultadoGeneracion {
  texto: string;
  campos_reemplazados: { campo_id: number; tipo_campo: string; valor_anterior: string; valor_nuevo: string }[];
  docx: { filename: string; content_base64: string };
}

export default function BibliotecaPreviewAprobacion({ plantillaId, onVolver, onEditarCampos }: BibliotecaPreviewAprobacionProps) {
  const [detalle, setDetalle] = useState<PlantillaDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [valores, setValores] = useState<Record<number, string>>({});
  const [tipoTramiteManual, setTipoTramiteManual] = useState("");

  const [resultado, setResultado] = useState<ResultadoGeneracion | null>(null);
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
    setResultado(null);
  };

  const handleGenerar = async () => {
    setGenerando(true);
    setError(null);
    try {
      const [preview, final] = await Promise.all([
        previewGeneracionPlantilla(plantillaId, valores, tipoTramiteManual || undefined),
        generarFinalPlantilla(plantillaId, valores, tipoTramiteManual || undefined),
      ]);
      setResultado({
        texto: preview.texto_previsto,
        campos_reemplazados: preview.campos_reemplazados,
        docx: final,
      });
    } catch (err: unknown) {
      setError(extractErrorMessage(err, "Error al generar la motivada."));
    } finally {
      setGenerando(false);
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
          <div className="flex items-start gap-2 p-3 rounded-lg border bg-amber-500/5" style={{ borderColor: "var(--border)" }}>
            <Tag size={15} className="shrink-0 mt-0.5 text-amber-400" />
            <div>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Esta plantilla todavía no tiene campos variables marcados — no hay datos que puedas personalizar
                para este caso; se generaría el documento original sin cambios.
              </p>
              {onEditarCampos && (
                <button
                  type="button"
                  onClick={() => onEditarCampos(plantillaId)}
                  className="text-xs font-medium text-brand-primary hover:underline mt-1.5"
                >
                  Marcar campos variables en Revisión
                </button>
              )}
            </div>
          </div>
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
            onChange={(e) => { setTipoTramiteManual(e.target.value); setResultado(null); }}
          >
            <option value="">Sin especificar</option>
            {ORIGENES_TRAMITE.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      <button type="button" onClick={handleGenerar} disabled={generando} className="btn-primary w-full justify-center py-3.5 text-base">
        {generando
          ? <><span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />Generando motivada...</>
          : <><Wand2 size={18} />Generar Motivada</>}
      </button>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-brand-danger">
          <AlertCircle size={16} />{error}
        </div>
      )}

      {resultado && (
        <div className="space-y-4">
          <div className="flex items-center gap-2" style={{ color: "var(--text)" }}>
            <CheckCircle size={16} className="text-brand-success" />
            <p className="text-sm font-semibold">Motivada generada</p>
          </div>

          {resultado.campos_reemplazados.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
                Cambios aplicados
              </p>
              <div className="space-y-1">
                {resultado.campos_reemplazados.map((c) => (
                  <div key={c.campo_id} className="text-xs flex items-center gap-2 flex-wrap">
                    <span style={{ color: "var(--text-muted)" }}>{labelTipoCampo(c.tipo_campo)}:</span>
                    <span className="font-mono line-through text-slate-500">{c.valor_anterior}</span>
                    <span>→</span>
                    <span className="font-mono" style={{ color: "var(--text)" }}>{c.valor_nuevo}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
              Motivada
            </p>
            <div
              className="text-sm leading-relaxed rounded-lg border p-4 max-h-[40vh] overflow-y-auto"
              style={{ borderColor: "var(--border)", whiteSpace: "pre-wrap", color: "var(--text)" }}
            >
              {resultado.texto}
            </div>
          </div>

          <CopyButton getText={() => resultado.texto} label="Copiar motivada" />

          <button
            type="button"
            onClick={() => downloadBase64Docx(resultado.docx.content_base64, resultado.docx.filename)}
            className="flex items-center gap-1.5 text-xs btn-ghost px-2 py-1"
          >
            <Download size={13} />Descargar también el .docx (opcional)
          </button>
          <p className="text-xs flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
            <FileText size={12} />
            El texto ya tiene los datos de este caso sustituidos — el formato jurídico nunca se reescribe.
          </p>

          <div className="pt-3 border-t" style={{ borderColor: "var(--border)" }}>
            <p className="text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>
              ¿Esta plantilla quedó mal configurada (campos incorrectos, texto erróneo)?
            </p>
            <button
              type="button"
              onClick={handleEliminar}
              disabled={eliminando}
              className="flex items-center gap-1.5 text-xs btn-ghost px-2 py-1 text-brand-danger"
            >
              <Trash2 size={13} />{eliminando ? "Eliminando..." : "Eliminar esta plantilla de la biblioteca"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
