"use client";

import { useState } from "react";
import BibliotecaBuscador from "./BibliotecaBuscador";
import { PlantillaInfo, ORIGENES_TRAMITE, labelCategoria } from "@/lib/api";
import { Users, UserCheck, FileSignature, Landmark, Briefcase, ChevronRight } from "lucide-react";
import clsx from "clsx";

const ICONOS_ORIGEN: Record<string, typeof Users> = {
  propietario: Users,
  autorizado: UserCheck,
  poder: FileSignature,
  snr: Landmark,
  oficio: Briefcase,
};

const DESCRIPCIONES_ORIGEN: Record<string, string> = {
  propietario: "El propietario gestiona directamente",
  autorizado: "Contacto o autorizado del propietario",
  poder: "Apoderado con poder notarial o TP",
  snr: "Superintendencia de Notariado y Registro",
  oficio: "La oficina inicia el trámite de oficio",
};

interface BibliotecaFlujoCategoriaProps {
  categoria: string;
  onSeleccionarPlantilla: (plantilla: PlantillaInfo) => void;
  onIrARevisar?: (plantillaId: number) => void;
}

export default function BibliotecaFlujoCategoria({ categoria, onSeleccionarPlantilla, onIrARevisar }: BibliotecaFlujoCategoriaProps) {
  const [origen, setOrigen] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-slate-300 mb-1 flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-brand-primary text-white text-xs flex items-center justify-center font-bold">1</span>
          {labelCategoria(categoria)}
        </h2>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Esta categoría reutiliza motivadas reales ya aprobadas en tu Biblioteca — no se redacta texto
          nuevo con IA, solo se sustituyen los datos del caso sobre el documento original.
        </p>
      </div>

      <div>
        <h2 className="text-base font-semibold text-slate-300 mb-3 flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-brand-primary text-white text-xs flex items-center justify-center font-bold">2</span>
          ¿Cómo viene la solicitud?
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {ORIGENES_TRAMITE.map(({ value, label }) => {
            const Icon = ICONOS_ORIGEN[value] ?? Users;
            const activo = origen === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setOrigen(value)}
                className={clsx(
                  "card p-3.5 text-left transition-all duration-200 flex items-center justify-between gap-2",
                  activo ? "border-brand-success bg-emerald-500/10" : "hover:border-slate-500 hover:bg-slate-800/50"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon size={16} className={activo ? "text-brand-success" : "text-slate-400"} />
                  <div>
                    <p className={clsx("font-semibold text-sm", activo ? "text-brand-success" : "text-slate-200")}>{label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{DESCRIPCIONES_ORIGEN[value]}</p>
                  </div>
                </div>
                {activo && <ChevronRight size={16} className="text-brand-success shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {origen && (
        <div>
          <h2 className="text-base font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-brand-primary text-white text-xs flex items-center justify-center font-bold">3</span>
            Casos que coinciden
          </h2>
          <BibliotecaBuscador
            onSeleccionar={onSeleccionarPlantilla}
            categoriaPreset={categoria}
            origenPreset={origen}
            bloquearFiltros
            onIrARevisar={onIrARevisar}
          />
        </div>
      )}
    </div>
  );
}
