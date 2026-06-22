"use client";

import { useCallback, useEffect, useState } from "react";
import BibliotecaUploader from "./BibliotecaUploader";
import BibliotecaRevisionPanel from "./BibliotecaRevisionPanel";
import BibliotecaBuscador from "./BibliotecaBuscador";
import BibliotecaPreviewAprobacion from "./BibliotecaPreviewAprobacion";
import { pendientesRevision, PlantillaInfo } from "@/lib/api";
import { Upload, ClipboardList, Search } from "lucide-react";
import clsx from "clsx";

type SubTab = "subir" | "revision" | "buscar";

const SUBTABS: { id: SubTab; label: string; icon: typeof Upload }[] = [
  { id: "buscar", label: "Buscar y generar", icon: Search },
  { id: "revision", label: "Revisión", icon: ClipboardList },
  { id: "subir", label: "Subir", icon: Upload },
];

interface BibliotecaPanelProps {
  /** Id de plantilla a abrir directamente en la pestaña Revisión — usado al
   * llegar aquí desde el aviso de "casos pendientes" del flujo del Formulario. */
  aperturaRevisionId?: number | null;
  onAperturaRevisionConsumida?: () => void;
}

export default function BibliotecaPanel({ aperturaRevisionId, onAperturaRevisionConsumida }: BibliotecaPanelProps) {
  const [subTab, setSubTab] = useState<SubTab>("buscar");
  const [pendientesCount, setPendientesCount] = useState(0);
  const [plantillaSeleccionadaId, setPlantillaSeleccionadaId] = useState<number | null>(null);
  const [idParaRevisar, setIdParaRevisar] = useState<number | null>(null);

  const actualizarConteo = useCallback(() => {
    pendientesRevision().then((p) => setPendientesCount(p.length)).catch(() => {});
  }, []);

  useEffect(() => { actualizarConteo(); }, [actualizarConteo]);

  useEffect(() => {
    if (aperturaRevisionId != null) {
      setIdParaRevisar(aperturaRevisionId);
      setSubTab("revision");
      onAperturaRevisionConsumida?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aperturaRevisionId]);

  const handleSeleccionarPlantilla = (plantilla: PlantillaInfo) => {
    setPlantillaSeleccionadaId(plantilla.id);
  };

  const handleIrARevisar = (plantillaId: number) => {
    setIdParaRevisar(plantillaId);
    setSubTab("revision");
  };

  const cambiarSubTab = (id: SubTab) => {
    setSubTab(id);
    if (id !== "buscar") setPlantillaSeleccionadaId(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex gap-2 border-b pb-3 flex-wrap" style={{ borderColor: "var(--border)" }}>
        {SUBTABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => cambiarSubTab(id)}
            className={clsx(
              "flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all",
              subTab === id ? "border-brand-primary bg-teal-500/10 text-brand-primary" : "btn-ghost"
            )}
          >
            <Icon size={13} />
            {label}
            {id === "revision" && pendientesCount > 0 && (
              <span className="flex items-center justify-center text-[10px] font-bold bg-amber-500 text-white rounded-full w-4.5 h-4.5 min-w-[18px] px-1">
                {pendientesCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {subTab === "subir" && (
        <BibliotecaUploader onIngestaCompleta={actualizarConteo} onBibliotecaVaciada={actualizarConteo} />
      )}
      {subTab === "revision" && (
        <BibliotecaRevisionPanel onCambio={actualizarConteo} plantillaIdInicial={idParaRevisar} />
      )}
      {subTab === "buscar" && (
        plantillaSeleccionadaId ? (
          <BibliotecaPreviewAprobacion
            plantillaId={plantillaSeleccionadaId}
            onVolver={() => setPlantillaSeleccionadaId(null)}
          />
        ) : (
          <BibliotecaBuscador onSeleccionar={handleSeleccionarPlantilla} onIrARevisar={handleIrARevisar} />
        )
      )}
    </div>
  );
}