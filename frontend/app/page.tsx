"use client";

import { useState } from "react";
import MutationSelector, { TipoMutacion, TipoOrigen } from "./components/MutationSelector";
import FormBuilder, { SolicitudFormData } from "./components/FormBuilder";
import PreviewMotivada from "./components/PreviewMotivada";
import HistoryPanel from "./components/HistoryPanel";
import SettingsPanel from "./components/SettingsPanel";
import { generarMotivada, MotivadaGeneradaResponse, HistorialDetalle } from "@/lib/api";
import {
  MapPin, FileText, Eye, History, Settings, AlertCircle, ArrowLeft,
} from "lucide-react";
import clsx from "clsx";

type Tab     = "form" | "preview" | "historial" | "settings";
type Step    = "select" | "form";

const TABS = [
  { id: "form"      as Tab, label: "Formulario", icon: FileText  },
  { id: "preview"   as Tab, label: "Motivada",   icon: Eye       },
  { id: "historial" as Tab, label: "Historial",  icon: History   },
  { id: "settings"  as Tab, label: "Ajustes",    icon: Settings  },
];

export default function Dashboard() {
  const [tab,      setTab]      = useState<Tab>("form");
  const [step,     setStep]     = useState<Step>("select");
  const [mutacion, setMutacion] = useState<TipoMutacion | null>(null);
  const [origen,   setOrigen]   = useState<TipoOrigen   | null>(null);
  const [motivada, setMotivada] = useState<MotivadaGeneradaResponse | null>(null);
  const [formData, setFormData] = useState<SolicitudFormData | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const handleOrigenSelect = (v: TipoOrigen) => {
    setOrigen(v);
    setStep("form");
  };

  const handleGenerate = async (data: SolicitudFormData) => {
    setLoading(true);
    setError(null);
    setFormData(data);
    try {
      const result = await generarMotivada(data as never);
      setMotivada(result);
      setTab("preview");
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(detail ?? "Error al conectar con el servidor. ¿Está corriendo el backend?");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setMotivada(null); setFormData(null); setError(null);
    setStep("select"); setMutacion(null); setOrigen(null);
    setTab("form");
  };

  const handleReopen = (d: HistorialDetalle) => {
    const fd: SolicitudFormData = JSON.parse(d.datos_formulario);
    setFormData(fd);
    setMotivada({
      texto_motivada:    d.texto_motivada,
      numero_expediente: d.numero_expediente,
      propietario:       d.propietario_nombre,
      tipo_mutacion:     d.tipo_mutacion,
    });
    setTab("preview");
  };

  const labelMutacion: Record<TipoMutacion, string> = {
    primera_clase:   "1ra Clase",
    tercera_clase:   "3ra Clase",
    rectificacion:   "Rectificación",
    complementacion: "Complementación",
  };
  const labelOrigen: Record<TipoOrigen, string> = {
    propietario: "Propietario",
    autorizado:  "Autorizado",
    poder:       "Con poder",
    snr:         "SNR",
    oficio:      "Oficio",
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-primary flex items-center justify-center">
              <MapPin size={16} className="text-white" />
            </div>
            <span className="font-bold text-slate-100">CatIA</span>
            <span className="hidden sm:inline text-slate-500 text-xs">Motivadas Catastrales</span>
          </div>
          {mutacion && origen && (
            <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-300 text-xs">
              {labelMutacion[mutacion]} · {labelOrigen[origen]}
            </span>
          )}
        </div>
      </header>

      <div className="max-w-6xl mx-auto w-full px-4 py-6 flex-1">
        <div className="flex gap-6">
          {/* Sidebar */}
          <nav className="hidden lg:flex flex-col gap-1 w-44 shrink-0">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} type="button" onClick={() => setTab(id)}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left",
                  tab === id
                    ? "bg-brand-primary text-white shadow-lg shadow-blue-500/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                )}>
                <Icon size={16} />{label}
                {id === "preview" && motivada && <span className="ml-auto w-2 h-2 rounded-full bg-brand-success" />}
              </button>
            ))}
          </nav>

          {/* Main */}
          <main className="flex-1 min-w-0 pb-20 lg:pb-0">
            {/* Error banner */}
            {error && (
              <div className="flex items-start gap-3 p-4 mb-5 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-brand-danger">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold">Error al generar motivada</p>
                  <p className="text-red-400/80 text-xs mt-0.5">{error}</p>
                </div>
                <button type="button" onClick={() => setError(null)} className="ml-auto opacity-60 hover:opacity-100">×</button>
              </div>
            )}

            {/* FORMULARIO tab */}
            {tab === "form" && (
              <>
                {step === "select" && (
                  <MutationSelector
                    selectedMutacion={mutacion}
                    selectedOrigen={origen}
                    onSelectMutacion={(v) => { setMutacion(v); setOrigen(null); setStep("select"); }}
                    onSelectOrigen={handleOrigenSelect}
                  />
                )}
                {step === "form" && mutacion && origen && (
                  <div className="space-y-4">
                    <button type="button" onClick={() => setStep("select")}
                      className="btn-ghost text-xs">
                      <ArrowLeft size={13} />
                      Cambiar tipo / origen
                    </button>
                    <FormBuilder
                      tipoMutacion={mutacion}
                      tipoOrigen={origen}
                      onGenerate={handleGenerate}
                      isLoading={loading}
                    />
                  </div>
                )}
              </>
            )}

            {/* PREVIEW tab */}
            {tab === "preview" && motivada && formData ? (
              <PreviewMotivada motivada={motivada} formData={formData as never} onReset={handleReset} />
            ) : tab === "preview" ? (
              <div className="flex flex-col items-center justify-center py-24 text-slate-500 gap-3">
                <Eye size={48} className="opacity-20" />
                <p className="text-sm">Aún no hay motivada generada</p>
                <button type="button" onClick={() => setTab("form")} className="btn-primary text-xs mt-2">Ir al formulario</button>
              </div>
            ) : null}

            {tab === "historial" && <HistoryPanel onReopen={handleReopen} />}
            {tab === "settings"  && <SettingsPanel />}
          </main>
        </div>
      </div>

      {/* Mobile tab bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 z-10 flex">
        {TABS.map(({ id, icon: Icon }) => (
          <button key={id} type="button" onClick={() => setTab(id)}
            className={clsx("flex-1 flex flex-col items-center py-2.5 transition-colors",
              tab === id ? "text-brand-primary" : "text-slate-500")}>
            <Icon size={18} />
          </button>
        ))}
      </div>
    </div>
  );
}
