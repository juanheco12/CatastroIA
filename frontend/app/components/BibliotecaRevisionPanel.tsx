"use client";

import { useCallback, useEffect, useState } from "react";
import {
  pendientesRevision, obtenerDetallePlantilla, aprobarPlantilla, marcarPlantillaAtipico, extractErrorMessage,
  PlantillaInfo, PlantillaDetalle, CampoManualInput,
  CATEGORIAS_MOTIVADA, TIPOS_CAMPO_VARIABLE, ORIGENES_TRAMITE, labelCategoria, labelTipoCampo,
} from "@/lib/api";
import {
  RefreshCw, AlertCircle, FileWarning, CheckCircle2, MousePointerClick,
  X, ClipboardList, Tag, Info,
} from "lucide-react";
import clsx from "clsx";

interface BibliotecaRevisionPanelProps {
  onCambio?: () => void;
}

interface CampoVisual {
  key: string;
  offset_inicio: number;
  offset_fin: number;
  tipo_campo: string;
  origen: "regex" | "manual";
  confirmado: boolean;
  campoId?: number;
  manualIndex?: number;
}

function calcularOffsetsSeleccion(container: HTMLElement): { inicio: number; fin: number; texto: string } | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return null;
  const range = selection.getRangeAt(0);
  if (!container.contains(range.startContainer) || !container.contains(range.endContainer)) return null;

  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let offset = 0;
  let inicio = -1;
  let fin = -1;
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const len = node.textContent?.length ?? 0;
    if (node === range.startContainer) inicio = offset + range.startOffset;
    if (node === range.endContainer) fin = offset + range.endOffset;
    offset += len;
  }
  if (inicio === -1 || fin === -1) return null;
  if (fin < inicio) { const t = inicio; inicio = fin; fin = t; }
  if (fin <= inicio) return null;
  return { inicio, fin, texto: selection.toString() };
}

export default function BibliotecaRevisionPanel({ onCambio }: BibliotecaRevisionPanelProps) {
  const [pendientes, setPendientes] = useState<PlantillaInfo[]>([]);
  const [loadingLista, setLoadingLista] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detalle, setDetalle] = useState<PlantillaDetalle | null>(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  const [confirmadosIds, setConfirmadosIds] = useState<Set<number>>(new Set());
  const [camposManuales, setCamposManuales] = useState<CampoManualInput[]>([]);
  const [categoria, setCategoria] = useState("");
  const [tipoTramiteManual, setTipoTramiteManual] = useState("");
  const [modoSeleccion, setModoSeleccion] = useState(false);
  const [tipoCampoManualDraft, setTipoCampoManualDraft] = useState("nombre_propietario");
  const [selectionError, setSelectionError] = useState<string | null>(null);

  const [accionEnCurso, setAccionEnCurso] = useState(false);
  const [accionError, setAccionError] = useState<string | null>(null);

  const cargarPendientes = useCallback(async () => {
    setLoadingLista(true);
    try {
      setPendientes(await pendientesRevision());
      setLoadError(null);
    } catch {
      setLoadError("No se pudo cargar la lista de revisión. El servidor puede estar despertando, intenta de nuevo.");
    } finally {
      setLoadingLista(false);
    }
  }, []);

  useEffect(() => { cargarPendientes(); }, [cargarPendientes]);

  const seleccionarPlantilla = async (id: number) => {
    setSelectedId(id);
    setDetalle(null);
    setLoadingDetalle(true);
    setAccionError(null);
    setSelectionError(null);
    setCamposManuales([]);
    setModoSeleccion(false);
    try {
      const d = await obtenerDetallePlantilla(id);
      setDetalle(d);
      setCategoria(d.categoria ?? "");
      setTipoTramiteManual(d.tipo_tramite_manual ?? "");
      setConfirmadosIds(new Set(d.campos.filter((c) => c.confirmado).map((c) => c.id)));
    } catch {
      setAccionError("No se pudo cargar el detalle de la plantilla.");
    } finally {
      setLoadingDetalle(false);
    }
  };

  const toggleConfirmado = (campoId: number) => {
    setConfirmadosIds((prev) => {
      const next = new Set(prev);
      next.has(campoId) ? next.delete(campoId) : next.add(campoId);
      return next;
    });
  };

  const eliminarManual = (idx: number) => {
    setCamposManuales((prev) => prev.filter((_, i) => i !== idx));
  };

  const onMouseUpTexto = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!modoSeleccion) return;
    const resultado = calcularOffsetsSeleccion(e.currentTarget);
    window.getSelection()?.removeAllRanges();
    if (!resultado) return;
    if (!detalle) return;
    const { inicio, fin, texto } = resultado;
    if (detalle.contenido_texto.slice(inicio, fin).includes("\n")) {
      setSelectionError("La selección cruza un salto de párrafo — no se puede usar como campo.");
      return;
    }
    setSelectionError(null);
    setCamposManuales((prev) => [
      ...prev,
      { tipo_campo: tipoCampoManualDraft, texto_original: texto, offset_inicio: inicio, offset_fin: fin },
    ]);
  };

  const handleAprobar = async () => {
    if (!detalle) return;
    if (!categoria) {
      setAccionError("Selecciona una categoría antes de aprobar.");
      return;
    }
    setAccionEnCurso(true);
    setAccionError(null);
    try {
      await aprobarPlantilla(detalle.id, {
        categoria,
        tipo_tramite_manual: tipoTramiteManual || undefined,
        campos_confirmados_ids: Array.from(confirmadosIds),
        campos_manuales: camposManuales,
      });
      setPendientes((prev) => prev.filter((p) => p.id !== detalle.id));
      setSelectedId(null);
      setDetalle(null);
      onCambio?.();
    } catch (err: unknown) {
      setAccionError(extractErrorMessage(err, "Error al aprobar la plantilla."));
    } finally {
      setAccionEnCurso(false);
    }
  };

  const handleMarcarAtipico = async () => {
    if (!detalle) return;
    const motivo = window.prompt("Motivo por el cual este caso queda como atípico:");
    if (!motivo || !motivo.trim()) return;
    setAccionEnCurso(true);
    setAccionError(null);
    try {
      await marcarPlantillaAtipico(detalle.id, motivo);
      await cargarPendientes();
      setSelectedId(null);
      setDetalle(null);
      onCambio?.();
    } catch (err: unknown) {
      setAccionError(extractErrorMessage(err, "Error al marcar el caso como atípico."));
    } finally {
      setAccionEnCurso(false);
    }
  };

  const renderTexto = () => {
    if (!detalle) return null;
    const texto = detalle.contenido_texto;
    const visuales: CampoVisual[] = [
      ...detalle.campos.map((c) => ({
        key: `regex-${c.id}`,
        offset_inicio: c.offset_inicio,
        offset_fin: c.offset_fin,
        tipo_campo: c.tipo_campo,
        origen: "regex" as const,
        confirmado: confirmadosIds.has(c.id),
        campoId: c.id,
      })),
      ...camposManuales.map((c, idx) => ({
        key: `manual-${idx}`,
        offset_inicio: c.offset_inicio,
        offset_fin: c.offset_fin,
        tipo_campo: c.tipo_campo,
        origen: "manual" as const,
        confirmado: true,
        manualIndex: idx,
      })),
    ].sort((a, b) => a.offset_inicio - b.offset_inicio);

    const nodos: React.ReactNode[] = [];
    let cursor = 0;
    for (const v of visuales) {
      if (v.offset_inicio < cursor) continue; // overlap defensivo — se omite del render visual
      if (v.offset_inicio > cursor) nodos.push(texto.slice(cursor, v.offset_inicio));
      nodos.push(
        <span
          key={v.key}
          title={labelTipoCampo(v.tipo_campo)}
          onClick={() => (v.origen === "regex" ? toggleConfirmado(v.campoId!) : eliminarManual(v.manualIndex!))}
          className={clsx(
            "cursor-pointer rounded px-0.5",
            v.origen === "manual"
              ? "bg-violet-500/30 text-violet-200"
              : v.confirmado
                ? "bg-teal-500/30 text-teal-200"
                : "bg-amber-500/20 text-amber-200"
          )}
        >
          {texto.slice(v.offset_inicio, v.offset_fin)}
        </span>
      );
      cursor = v.offset_fin;
    }
    if (cursor < texto.length) nodos.push(texto.slice(cursor));
    return nodos;
  };

  return (
    <div className="flex flex-col lg:flex-row gap-5">
      {/* Lista de pendientes */}
      <div className="lg:w-64 shrink-0 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="section-title text-sm">
            <ClipboardList size={15} />
            Pendientes ({pendientes.length})
          </h3>
          <button type="button" onClick={cargarPendientes} className="btn-ghost px-2 py-1">
            <RefreshCw size={13} className={clsx(loadingLista && "animate-spin")} />
          </button>
        </div>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Plantillas recién subidas o re-versionadas, esperando que confirmes sus datos variables.
        </p>

        {loadError && (
          <div className="text-xs text-brand-danger flex items-center gap-1.5">
            <AlertCircle size={13} />{loadError}
          </div>
        )}

        {!loadingLista && pendientes.length === 0 && !loadError && (
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            No hay plantillas pendientes de revisión.
          </p>
        )}

        <div className="space-y-1.5 max-h-[70vh] overflow-y-auto">
          {pendientes.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => seleccionarPlantilla(p.id)}
              className={clsx(
                "w-full text-left p-2.5 rounded-lg border text-xs transition-all",
                selectedId === p.id ? "border-brand-primary bg-teal-500/5" : "hover:bg-slate-800/30"
              )}
              style={{ borderColor: selectedId === p.id ? undefined : "var(--border)" }}
            >
              <p className="font-medium truncate" style={{ color: "var(--text)" }}>{p.nombre_original}</p>
              <div className="flex items-center gap-1.5 mt-1">
                {p.estado === "caso_atipico" ? (
                  <span className="flex items-center gap-1 text-amber-400">
                    <FileWarning size={11} />Caso atípico
                  </span>
                ) : (
                  <span style={{ color: "var(--text-muted)" }}>{labelCategoria(p.categoria)}</span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Detalle / revisión */}
      <div className="flex-1 min-w-0">
        {!selectedId && (
          <div className="flex flex-col items-center justify-center py-24 gap-3" style={{ color: "var(--text-muted)" }}>
            <ClipboardList size={40} className="opacity-20" />
            <p className="text-sm">Selecciona una plantilla para revisarla</p>
          </div>
        )}

        {selectedId && loadingDetalle && (
          <div className="flex items-center gap-2 py-12 justify-center" style={{ color: "var(--text-muted)" }}>
            <RefreshCw size={18} className="animate-spin" />Cargando plantilla...
          </div>
        )}

        {selectedId && detalle && !loadingDetalle && (
          <div className="space-y-4">
            <div className="flex items-start gap-2 p-3 rounded-lg border bg-teal-500/5" style={{ borderColor: "var(--border)" }}>
              <Info size={15} className="shrink-0 mt-0.5 text-brand-primary" />
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Esta plantilla no se puede usar en un caso nuevo hasta que la apruebes. Resalta en el texto
                qué partes son datos variables (predial, cédula, fechas...): confirma o descarta lo que el
                sistema detectó solo, y marca a mano el nombre del propietario y la dirección (eso nunca se
                detecta automáticamente). Elige categoría y origen — se usan después para que la plantilla
                aparezca al buscar por coincidencia — y aprueba para activarla.
              </p>
            </div>

            <div>
              <h3 className="text-base font-semibold" style={{ color: "var(--text)" }}>{detalle.nombre_original}</h3>
              {detalle.motivo_revision_pendiente && (
                <p className="text-xs text-amber-400 mt-1">{detalle.motivo_revision_pendiente}</p>
              )}
              {detalle.categorias_candidatas && (
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  Categorías candidatas: {detalle.categorias_candidatas.split(",").map(labelCategoria).join(" · ")}
                </p>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="field-label">Categoría</label>
                <select className="field-input" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                  <option value="">Selecciona una categoría...</option>
                  {CATEGORIAS_MOTIVADA.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="field-label">Origen de la solicitud (opcional)</label>
                <select className="field-input" value={tipoTramiteManual} onChange={(e) => setTipoTramiteManual(e.target.value)}>
                  <option value="">Sin especificar</option>
                  {ORIGENES_TRAMITE.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => setModoSeleccion((v) => !v)}
                className={clsx(
                  "flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all",
                  modoSeleccion ? "border-violet-400 bg-violet-500/15 text-violet-300" : "btn-ghost"
                )}
              >
                <MousePointerClick size={13} />
                {modoSeleccion ? "Selección manual activa" : "Marcar campo manual"}
              </button>
              {modoSeleccion && (
                <select
                  className="field-input w-auto py-1.5"
                  value={tipoCampoManualDraft}
                  onChange={(e) => setTipoCampoManualDraft(e.target.value)}
                >
                  {TIPOS_CAMPO_VARIABLE.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              )}
              {modoSeleccion && (
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Selecciona texto en el documento para marcarlo como &ldquo;{labelTipoCampo(tipoCampoManualDraft)}&rdquo;
                </span>
              )}
            </div>

            {selectionError && (
              <div className="text-xs text-brand-danger flex items-center gap-1.5">
                <AlertCircle size={13} />{selectionError}
              </div>
            )}

            <div
              onMouseUp={onMouseUpTexto}
              className="text-sm leading-relaxed rounded-lg border p-4 max-h-[50vh] overflow-y-auto"
              style={{ borderColor: "var(--border)", whiteSpace: "pre-wrap", color: "var(--text)" }}
            >
              {renderTexto()}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
                  Campos detectados ({detalle.campos.length})
                </p>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {detalle.campos.map((c) => (
                    <label key={c.id} className="flex items-center gap-2 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={confirmadosIds.has(c.id)}
                        onChange={() => toggleConfirmado(c.id)}
                      />
                      <Tag size={11} className="shrink-0" style={{ color: "var(--text-muted)" }} />
                      <span className="shrink-0" style={{ color: "var(--text-muted)" }}>{labelTipoCampo(c.tipo_campo)}:</span>
                      <span className="font-mono truncate" style={{ color: "var(--text)" }}>{c.texto_original}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
                  Campos manuales agregados ({camposManuales.length})
                </p>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {camposManuales.length === 0 && (
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>Ninguno por ahora.</p>
                  )}
                  {camposManuales.map((c, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs">
                      <button type="button" onClick={() => eliminarManual(idx)} className="text-slate-500 hover:text-brand-danger">
                        <X size={12} />
                      </button>
                      <span className="shrink-0" style={{ color: "var(--text-muted)" }}>{labelTipoCampo(c.tipo_campo)}:</span>
                      <span className="font-mono truncate" style={{ color: "var(--text)" }}>{c.texto_original}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {accionError && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-brand-danger">
                <AlertCircle size={16} />{accionError}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button type="button" onClick={handleAprobar} disabled={accionEnCurso} className="btn-primary">
                <CheckCircle2 size={15} />
                {accionEnCurso ? "Procesando..." : "Aprobar y activar plantilla"}
              </button>
              <button type="button" onClick={handleMarcarAtipico} disabled={accionEnCurso} className="btn-ghost">
                <FileWarning size={14} />
                Marcar como caso atípico
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}