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

export default function BibliotecaPanel() {
  const [subTab, setSubTab] = useState<SubTab>("buscar");
  const [pendientesCount, setPendientesCount] = useState(0);
  const [plantillaSeleccionadaId, setPlantillaSeleccionadaId] = useState<number | null>(null);

  const actualizarConteo = useCallback(() => {
    pendientesRevision().then((p) => setPendientesCount(p.length)).catch(() => {});
  }, []);

  useEffect(() => { actualizarConteo(); }, [actualizarConteo]);

  const handleSeleccionarPlantilla = (plantilla: PlantillaInfo) => {
    setPlantillaSeleccionadaId(plantilla.id);
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

      {subTab === "subir" && <BibliotecaUploader onIngestaCompleta={actualizarConteo} />}
      {subTab === "revision" && <BibliotecaRevisionPanel onCambio={actualizarConteo} />}
      {subTab === "buscar" && (
        plantillaSeleccionadaId ? (
          <BibliotecaPreviewAprobacion
            plantillaId={plantillaSeleccionadaId}
            onVolver={() => setPlantillaSeleccionadaId(null)}
          />
        ) : (
          <BibliotecaBuscador onSeleccionar={handleSeleccionarPlantilla} />
        )
      )}
    </div>
  );
}