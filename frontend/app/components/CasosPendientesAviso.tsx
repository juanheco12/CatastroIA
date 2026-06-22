"use client";

import { useEffect, useState } from "react";
import { listarPlantillas, PlantillaInfo } from "@/lib/api";
import { ClipboardList, FileWarning, ChevronRight } from "lucide-react";

interface CasosPendientesAvisoProps {
  categoria?: string;
  tipoTramite?: string;
  onIrARevisar: (plantillaId: number) => void;
}

/** Cuando una búsqueda no encuentra plantillas activas, esto explica por qué:
 * casi siempre es porque las plantillas relevantes existen pero siguen sin
 * aprobar (pendiente_revision/caso_atipico) — y da acceso directo a revisarlas. */
export default function CasosPendientesAviso({ categoria, tipoTramite, onIrARevisar }: CasosPendientesAvisoProps) {
  const [items, setItems] = useState<PlantillaInfo[] | null>(null);

  useEffect(() => {
    let activo = true;
    listarPlantillas({ categoria: categoria || undefined, tipo_tramite: tipoTramite || undefined })
      .then((todas) => {
        if (!activo) return;
        setItems(todas.filter((p) => p.estado === "pendiente_revision" || p.estado === "caso_atipico"));
      })
      .catch(() => { if (activo) setItems([]); });
    return () => { activo = false; };
  }, [categoria, tipoTramite]);

  if (!items || items.length === 0) return null;

  const atipicos = items.filter((p) => p.estado === "caso_atipico").length;
  const pendientes = items.length - atipicos;

  return (
    <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-2.5">
      <p className="text-xs flex items-center gap-1.5 text-amber-300">
        <ClipboardList size={14} className="shrink-0" />
        <span>
          {categoria ? "En esta categoría hay " : "Hay "}
          {pendientes > 0 && <>{pendientes} plantilla{pendientes !== 1 ? "s" : ""} pendiente{pendientes !== 1 ? "s" : ""} de revisión</>}
          {pendientes > 0 && atipicos > 0 && " y "}
          {atipicos > 0 && <>{atipicos} caso{atipicos !== 1 ? "s" : ""} atípico{atipicos !== 1 ? "s" : ""}</>}
          {" "}sin aprobar — por eso no aparecen todavía en la búsqueda.
        </span>
      </p>
      <div className="space-y-1.5">
        {items.slice(0, 5).map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onIrARevisar(p.id)}
            className="w-full flex items-center justify-between gap-2 text-xs p-2 rounded-lg border border-amber-500/20 hover:bg-amber-500/10 transition-all text-left"
          >
            <span className="flex items-center gap-1.5 truncate" style={{ color: "var(--text)" }}>
              {p.estado === "caso_atipico" && <FileWarning size={12} className="text-amber-400 shrink-0" />}
              {p.nombre_original}
            </span>
            <span className="flex items-center gap-1 text-amber-300 shrink-0">
              Revisar y aprobar <ChevronRight size={12} />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
