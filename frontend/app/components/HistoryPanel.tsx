"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getHistorial,
  getHistorialDetalle,
  deleteHistorialItem,
  HistorialItem,
  HistorialDetalle,
} from "@/lib/api";
import {
  Search,
  Trash2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  FileText,
  Clock,
} from "lucide-react";
import clsx from "clsx";

function Badge({ estado }: { estado: string }) {
  const cls: Record<string, string> = {
    generada: "badge-generada",
    exportada: "badge-exportada",
    borrador: "badge-borrador",
  };
  return <span className={cls[estado] ?? "badge-borrador"}>{estado}</span>;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("es-CO", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface HistoryPanelProps {
  onReopen?: (detalle: HistorialDetalle) => void;
}

export default function HistoryPanel({ onReopen }: HistoryPanelProps) {
  const [items, setItems] = useState<HistorialItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [detalle, setDetalle] = useState<Record<number, HistorialDetalle>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getHistorial({ buscar: search || undefined, limit: 100 });
      setItems(data);
    } catch {
      /* ignore for now */
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleExpand = async (id: number) => {
    if (expanded === id) {
      setExpanded(null);
      return;
    }
    setExpanded(id);
    if (!detalle[id]) {
      try {
        const d = await getHistorialDetalle(id);
        setDetalle((prev) => ({ ...prev, [id]: d }));
      } catch {/* ignore */}
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("¿Eliminar este registro del historial?")) return;
    try {
      await deleteHistorialItem(id);
      setItems((prev) => prev.filter((x) => x.id !== id));
      if (expanded === id) setExpanded(null);
    } catch {/* ignore */}
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            className="field-input pl-9"
            placeholder="Buscar por expediente, propietario o predio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button type="button" onClick={load} className="btn-ghost px-3">
          <RefreshCw size={15} className={clsx(loading && "animate-spin")} />
        </button>
      </div>

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
          {items.map((item) => (
            <div key={item.id} className="card overflow-hidden">
              <button
                type="button"
                className="w-full text-left p-4 hover:bg-slate-700/30 transition-colors"
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
                      onClick={(e) => handleDelete(item.id, e)}
                      className="p-1.5 text-slate-600 hover:text-brand-danger hover:bg-red-500/10 rounded transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                    {expanded === item.id ? (
                      <ChevronUp size={16} className="text-slate-500" />
                    ) : (
                      <ChevronDown size={16} className="text-slate-500" />
                    )}
                  </div>
                </div>
              </button>

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
                        <button
                          type="button"
                          onClick={() => onReopen(detalle[item.id])}
                          className="btn-ghost text-xs"
                        >
                          <ExternalLink size={13} />
                          Reabrir en editor
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

      <p className="text-center text-xs text-slate-600">
        {items.length} registro{items.length !== 1 ? "s" : ""} encontrado{items.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
}
