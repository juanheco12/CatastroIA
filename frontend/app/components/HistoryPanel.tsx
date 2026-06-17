"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getHistorial, getHistorialDetalle, deleteHistorialItem,
  HistorialItem, HistorialDetalle,
} from "@/lib/api";
import {
  Search, Trash2, ExternalLink, ChevronDown, ChevronUp,
  RefreshCw, FileText, Clock, CheckSquare, Square,
} from "lucide-react";
import clsx from "clsx";

function Badge({ estado }: { estado: string }) {
  const cls: Record<string, string> = {
    generada: "badge-generada", exportada: "badge-exportada", borrador: "badge-borrador",
  };
  return <span className={cls[estado] ?? "badge-borrador"}>{estado}</span>;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("es-CO", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

interface HistoryPanelProps {
  onReopen?: (detalle: HistorialDetalle) => void;
}

export default function HistoryPanel({ onReopen }: HistoryPanelProps) {
  const [items,    setItems]    = useState<HistorialItem[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [search,   setSearch]   = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [detalle,  setDetalle]  = useState<Record<number, HistorialDetalle>>({});
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getHistorial({ buscar: search || undefined, limit: 100 });
      setItems(data);
      setSelected(new Set());
    } catch {/* ignore */}
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const toggleSelect = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const allSelected = items.length > 0 && selected.size === items.length;
  const toggleSelectAll = () => {
    setSelected(allSelected ? new Set() : new Set(items.map(i => i.id)));
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("¿Eliminar este registro?")) return;
    await deleteHistorialItem(id);
    setItems(prev => prev.filter(x => x.id !== id));
    setSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
    if (expanded === id) setExpanded(null);
  };

  const handleDeleteSelected = async () => {
    if (selected.size === 0) return;
    if (!confirm(`¿Eliminar ${selected.size} registro${selected.size > 1 ? "s" : ""}?`)) return;
    setDeleting(true);
    try {
      await Promise.all(Array.from(selected).map(id => deleteHistorialItem(id)));
      setItems(prev => prev.filter(x => !selected.has(x.id)));
      if (expanded !== null && selected.has(expanded)) setExpanded(null);
      setSelected(new Set());
    } catch {/* ignore */}
    finally { setDeleting(false); }
  };

  const toggleExpand = async (id: number) => {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    if (!detalle[id]) {
      try {
        const d = await getHistorialDetalle(id);
        setDetalle(prev => ({ ...prev, [id]: d }));
      } catch {/* ignore */}
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-0">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            className="field-input pl-9"
            placeholder="Buscar por expediente, propietario o predio..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button type="button" onClick={load} className="btn-ghost px-3 shrink-0">
          <RefreshCw size={15} className={clsx(loading && "animate-spin")} />
        </button>
      </div>

      {/* Bulk actions bar — only when items exist */}
      {items.length > 0 && (
        <div className="flex items-center gap-3 px-1">
          <button
            type="button"
            onClick={toggleSelectAll}
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            {allSelected
              ? <CheckSquare size={16} className="text-brand-primary" />
              : <Square size={16} />}
            {allSelected ? "Quitar selección" : "Seleccionar todo"}
          </button>

          {selected.size > 0 && (
            <button
              type="button"
              onClick={handleDeleteSelected}
              disabled={deleting}
              className="flex items-center gap-1.5 text-xs font-semibold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
            >
              <Trash2 size={13} />
              {deleting ? "Eliminando..." : `Eliminar ${selected.size} seleccionado${selected.size > 1 ? "s" : ""}`}
            </button>
          )}

          <span className="ml-auto text-xs text-slate-600">
            {items.length} registro{items.length !== 1 ? "s" : ""}
            {selected.size > 0 && ` · ${selected.size} seleccionado${selected.size > 1 ? "s" : ""}`}
          </span>
        </div>
      )}

      {/* List */}
      {loading && items.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <RefreshCw size={32} className="mx-auto mb-3 animate-spin opacity-30" />
          Cargando historial...
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <FileText size={40} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm">No hay motivadas en el historial</p>
          <p className="text-xs mt-1 text-slate-600">Las motivadas generadas aparecerán aquí</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className={clsx(
              "card overflow-hidden transition-all",
              selected.has(item.id) && "border-brand-primary/50 bg-teal-500/5"
            )}>
              <div className="flex items-stretch">
                {/* Checkbox column */}
                <button
                  type="button"
                  onClick={e => toggleSelect(item.id, e)}
                  className="flex items-center px-3 border-r border-slate-700 hover:bg-slate-700/30 transition-colors shrink-0"
                >
                  {selected.has(item.id)
                    ? <CheckSquare size={16} className="text-brand-primary" />
                    : <Square size={16} className="text-slate-600" />}
                </button>

                {/* Main row */}
                <button
                  type="button"
                  className="flex-1 text-left p-4 hover:bg-slate-700/30 transition-colors min-w-0"
                  onClick={() => toggleExpand(item.id)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm font-semibold text-brand-primary truncate">
                          {item.numero_expediente}
                        </span>
                        <Badge estado={item.estado} />
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-400">
                        <span className="truncate">{item.propietario_nombre}</span>
                        <span className="hidden sm:inline text-slate-600">·</span>
                        <span className="hidden sm:inline truncate">{item.numero_predio}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-slate-500 hidden md:flex items-center gap-1">
                        <Clock size={11} />
                        {formatDate(item.fecha_creacion)}
                      </span>
                      <button
                        type="button"
                        onClick={e => handleDelete(item.id, e)}
                        className="p-1.5 text-slate-600 hover:text-brand-danger hover:bg-red-500/10 rounded transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                      {expanded === item.id
                        ? <ChevronUp size={16} className="text-slate-500" />
                        : <ChevronDown size={16} className="text-slate-500" />}
                    </div>
                  </div>
                </button>
              </div>

              {/* Expanded detail */}
              {expanded === item.id && (
                <div className="border-t border-slate-700 p-4 bg-slate-900/40">
                  {detalle[item.id] ? (
                    <>
                      <div className="text-xs text-slate-400 max-h-48 overflow-y-auto leading-relaxed whitespace-pre-wrap font-mono bg-slate-900/50 rounded-lg p-3 mb-3">
                        {detalle[item.id].texto_motivada.slice(0, 600)}
                        {detalle[item.id].texto_motivada.length > 600 && "..."}
                      </div>
                      {onReopen && (
                        <button type="button" onClick={() => onReopen(detalle[item.id])} className="btn-ghost text-xs">
                          <ExternalLink size={13} />Reabrir en editor
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="text-xs text-slate-500">Cargando detalle...</div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
