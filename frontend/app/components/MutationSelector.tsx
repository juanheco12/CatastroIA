"use client";

import { Building2, Users, ClipboardEdit, FilePlus2, ChevronRight, Library, SplitSquareHorizontal, FileX, FileSearch } from "lucide-react";
import clsx from "clsx";
import { CATEGORIAS_MOTIVADA } from "@/lib/api";

export type TipoMutacion = "primera_clase" | "segunda_clase" | "tercera_clase" | "cuarta_clase" | "rectificacion" | "complementacion" | "cancelacion";
export type TipoOrigen   = "propietario"   | "autorizado" | "poder" | "snr" | "oficio";

const MUTACIONES = [
  { id: "primera_clase"   as TipoMutacion, titulo: "Primera Clase",   subtitulo: "Cambio de propietario",          icon: Users        },
  { id: "segunda_clase"   as TipoMutacion, titulo: "Segunda Clase",   subtitulo: "Desenglobe / agregación de predios", icon: SplitSquareHorizontal },
  { id: "tercera_clase"   as TipoMutacion, titulo: "Tercera Clase",   subtitulo: "Incorporación de construcción",   icon: Building2    },
  { id: "cuarta_clase"    as TipoMutacion, titulo: "Cuarta Clase",    subtitulo: "Revisión de avalúo catastral",    icon: FileSearch   },
  { id: "rectificacion"   as TipoMutacion, titulo: "Rectificación",   subtitulo: "Corrección de datos catastrales", icon: ClipboardEdit },
  { id: "complementacion" as TipoMutacion, titulo: "Complementación", subtitulo: "Adición de datos faltantes",      icon: FilePlus2    },
  { id: "cancelacion"     as TipoMutacion, titulo: "Cancelación",     subtitulo: "Cancelación de inscripción catastral", icon: FileX    },
];

// Categorías de la Biblioteca que no tienen redacción IA propia (las otras
// ya están cubiertas arriba bajo otro id/etiqueta). Estas usan motivadas
// reales ya subidas y aprobadas, no texto generado desde cero. La Biblioteca
// queda reservada para los casos atípicos de cada mutación.
const CATEGORIAS_CUBIERTAS_POR_IA = new Set([
  "mutacion_primera_clase", "mutacion_segunda_clase", "mutacion_tercera_clase",
  "mutacion_cuarta_clase", "rectificacion_general_datos", "complementacion",
  "cancelacion_inscripcion_catastral",
]);
const CATEGORIAS_BIBLIOTECA = CATEGORIAS_MOTIVADA.filter((c) => !CATEGORIAS_CUBIERTAS_POR_IA.has(c.value));

const ORIGENES_POR_MUTACION: Record<TipoMutacion, { id: TipoOrigen; titulo: string; desc: string }[]> = {
  primera_clase: [
    { id: "propietario", titulo: "De parte del propietario", desc: "El propietario gestiona directamente" },
    { id: "autorizado",  titulo: "De parte con autorizado",  desc: "Contacto o autorizado del propietario" },
    { id: "poder",       titulo: "De parte con poder",       desc: "Apoderado con poder notarial o TP" },
    { id: "snr",         titulo: "De la SNR",                desc: "Superintendencia de Notariado y Registro" },
    { id: "oficio",      titulo: "De oficio",                desc: "La oficina inicia la actualización registral" },
  ],
  segunda_clase: [
    { id: "propietario", titulo: "De parte del propietario", desc: "El propietario gestiona directamente" },
    { id: "autorizado",  titulo: "De parte con autorizado",  desc: "Contacto o autorizado del propietario" },
    { id: "poder",       titulo: "De parte con poder",       desc: "Apoderado con poder notarial o TP" },
    { id: "oficio",      titulo: "De oficio",                desc: "La oficina inicia el desenglobe de oficio" },
  ],
  tercera_clase: [
    { id: "propietario", titulo: "De parte del propietario", desc: "El propietario gestiona directamente" },
    { id: "autorizado",  titulo: "De parte con autorizado",  desc: "Contacto o autorizado del propietario" },
    { id: "poder",       titulo: "De parte con poder",       desc: "Apoderado con poder notarial o TP" },
    { id: "snr",         titulo: "De la SNR",                desc: "Superintendencia de Notariado y Registro" },
  ],
  cuarta_clase: [
    { id: "propietario", titulo: "De parte del propietario", desc: "El propietario gestiona directamente" },
    { id: "autorizado",  titulo: "De parte con autorizado",  desc: "Contacto o autorizado del propietario" },
    { id: "poder",       titulo: "De parte con poder",       desc: "Apoderado con poder notarial o TP" },
    { id: "oficio",      titulo: "De oficio",                desc: "La oficina inicia el trámite de oficio" },
  ],
  rectificacion: [
    { id: "propietario", titulo: "Por propietario", desc: "El propietario solicita la corrección" },
    { id: "autorizado",  titulo: "Por autorizado",  desc: "Contacto o autorizado del propietario" },
    { id: "oficio",      titulo: "De oficio",       desc: "La oficina de catastro corrige por oficio" },
  ],
  complementacion: [
    { id: "propietario", titulo: "Por propietario", desc: "El propietario solicita la adición" },
    { id: "snr",         titulo: "De la SNR",       desc: "Superintendencia de Notariado y Registro" },
  ],
  cancelacion: [
    { id: "propietario", titulo: "De parte del poseedor", desc: "El poseedor gestiona directamente" },
    { id: "poder",       titulo: "De parte con poder",    desc: "Apoderado con poder notarial o TP" },
    { id: "oficio",      titulo: "De oficio",             desc: "La oficina inicia la cancelación de oficio" },
  ],
};

export const LABEL_MUTACION: Record<TipoMutacion, string> = {
  primera_clase:   "1ra Clase",
  segunda_clase:   "2da Clase",
  tercera_clase:   "3ra Clase",
  cuarta_clase:    "4ta Clase",
  rectificacion:   "Rectificación",
  complementacion: "Complementación",
  cancelacion:     "Cancelación",
};

export const LABEL_ORIGEN: Record<TipoOrigen, string> = {
  propietario: "Propietario",
  autorizado:  "Autorizado",
  poder:       "Con poder",
  snr:         "SNR",
  oficio:      "Oficio",
};

interface Props {
  selectedMutacion: TipoMutacion | null;
  selectedOrigen:   TipoOrigen   | null;
  onSelectMutacion: (v: TipoMutacion) => void;
  onSelectOrigen:   (v: TipoOrigen)   => void;
  onSelectCategoriaBiblioteca: (categoria: string) => void;
}

export default function MutationSelector({
  selectedMutacion, selectedOrigen, onSelectMutacion, onSelectOrigen, onSelectCategoriaBiblioteca,
}: Props) {
  const origenes = selectedMutacion ? ORIGENES_POR_MUTACION[selectedMutacion] : [];

  return (
    <div className="space-y-6">
      {/* Tipo de mutación */}
      <div>
        <h2 className="text-base font-semibold text-slate-300 mb-3 flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-brand-primary text-white text-xs flex items-center justify-center font-bold">1</span>
          ¿Qué tipo de mutación?
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          {MUTACIONES.map(({ id, titulo, subtitulo, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => onSelectMutacion(id)}
              className={clsx(
                "card p-4 text-left transition-all duration-200 flex items-start gap-3",
                selectedMutacion === id
                  ? "border-brand-primary bg-blue-500/10 glow-border"
                  : "hover:border-slate-500 hover:bg-slate-800/50"
              )}
            >
              <div className={clsx(
                "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                selectedMutacion === id ? "bg-brand-primary" : "bg-slate-700"
              )}>
                <Icon size={18} className="text-white" />
              </div>
              <div>
                <p className="font-semibold text-slate-100 text-sm">{titulo}</p>
                <p className="text-xs text-slate-400 mt-0.5">{subtitulo}</p>
              </div>
            </button>
          ))}
        </div>

        <p className="text-xs mt-4 mb-2" style={{ color: "var(--text-muted)" }}>
          Otras categorías — usan motivadas reales de tu Biblioteca en vez de redactar con IA
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {CATEGORIAS_BIBLIOTECA.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => onSelectCategoriaBiblioteca(value)}
              className="card p-4 text-left transition-all duration-200 flex items-start gap-3 hover:border-slate-500 hover:bg-slate-800/50"
            >
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 bg-slate-700">
                <Library size={18} className="text-white" />
              </div>
              <div>
                <p className="font-semibold text-slate-100 text-sm">{label}</p>
                <p className="text-xs text-slate-400 mt-0.5">Desde tu Biblioteca</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Origen de la solicitud */}
      {selectedMutacion && (
        <div>
          <h2 className="text-base font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-brand-primary text-white text-xs flex items-center justify-center font-bold">2</span>
            ¿Cómo viene la solicitud?
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {origenes.map(({ id, titulo, desc }) => (
              <button
                key={id}
                type="button"
                onClick={() => onSelectOrigen(id)}
                className={clsx(
                  "card p-3.5 text-left transition-all duration-200 flex items-center justify-between gap-2",
                  selectedOrigen === id
                    ? "border-brand-success bg-emerald-500/10"
                    : "hover:border-slate-500 hover:bg-slate-800/50"
                )}
              >
                <div>
                  <p className={clsx(
                    "font-semibold text-sm",
                    selectedOrigen === id ? "text-brand-success" : "text-slate-200"
                  )}>{titulo}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                </div>
                {selectedOrigen === id && (
                  <ChevronRight size={16} className="text-brand-success shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
