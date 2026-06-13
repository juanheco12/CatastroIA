"use client";

import { useState } from "react";
import FormBuilder, { SimpleFormData } from "./components/FormBuilder";
import PreviewMotivada from "./components/PreviewMotivada";
import HistoryPanel from "./components/HistoryPanel";
import TemplateUploader from "./components/TemplateUploader";
import SettingsPanel from "./components/SettingsPanel";
import {
  generarMotivada,
  MotivadaGeneradaResponse,
  HistorialDetalle,
} from "@/lib/api";
import {
  FileText, Eye, History, Upload, Settings, MapPin, AlertCircle, Sparkles,
} from "lucide-react";
import clsx from "clsx";

type Tab = "form" | "preview" | "historial" | "template" | "settings";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "form",      label: "Formulario",  icon: FileText  },
  { id: "preview",   label: "Vista previa", icon: Eye      },
  { id: "historial", label: "Historial",   icon: History   },
  { id: "template",  label: "Template",    icon: Upload    },
  { id: "settings",  label: "Ajustes",     icon: Settings  },
];

export default function Dashboard() {
  const [activeTab, setActiveTab]   = useState<Tab>("form");
  const [formData,  setFormData]    = useState<SimpleFormData | null>(null);
  const [motivada,  setMotivada]    = useState<MotivadaGeneradaResponse | null>(null);
  const [isLoading, setIsLoading]   = useState(false);
  const [error,     setError]       = useState<string | null>(null);

  const handleGenerate = async (data: SimpleFormData) => {
    setIsLoading(true);
    setError(null);
    setFormData(data);
    try {
      const result = await generarMotivada(data as never);
      setMotivada(result);
      setActiveTab("preview");
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(detail ?? "Error al conectar con el servidor. ¿Está corriendo el backend?");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReopen = (detalle: HistorialDetalle) => {
    const data: SimpleFormData = JSON.parse(detalle.datos_formulario);
    setFormData(data);
    setMotivada({
      texto_motivada:  detalle.texto_motivada,
      numero_expediente: detalle.numero_expediente,
      propietario:     detalle.propietario_nombre,
      tipo_mutacion:   "Tercera Clase - Incorporación de Construcción",
    });
    setActiveTab("preview");
  };

  const handleReset = () => {
    setMotivada(null);
    setFormData(null);
    setError(null);
    setActiveTab("form");
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
            <span className="font-bold text-slate-100 tracking-tight">CatIA</span>
            <span className="hidden sm:inline text-slate-500 text-xs">Motivadas Catastrales</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Sparkles size={12} className="text-brand-warning" />
            <span className="hidden sm:inline">Claude Sonnet 4.6</span>
            <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-400">3ra Clase</span>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto w-full px-4 py-6 flex-1">
        <div className="flex gap-6">
          {/* Sidebar */}
          <nav className="hidden lg:flex flex-col gap-1 w-44 shrink-0">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left",
                  activeTab === id
                    ? "bg-brand-primary text-white shadow-lg shadow-blue-500/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                )}
              >
                <Icon size={16} />
                {label}
                {id === "preview" && motivada && (
                  <span className="ml-auto w-2 h-2 rounded-full bg-brand-success" />
                )}
              </button>
            ))}
          </nav>

          {/* Mobile tab bar */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 z-10 flex">
            {TABS.map(({ id, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={clsx(
                  "flex-1 flex flex-col items-center py-2.5 transition-colors",
                  activeTab === id ? "text-brand-primary" : "text-slate-500"
                )}
              >
                <Icon size={18} />
              </button>
            ))}
          </div>

          {/* Main */}
          <main className="flex-1 min-w-0 pb-20 lg:pb-0">
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

            {activeTab === "form" && (
              <FormBuilder onGenerate={handleGenerate} isLoading={isLoading} />
            )}

            {activeTab === "preview" && motivada && formData ? (
              <PreviewMotivada
                motivada={motivada}
                formData={formData as never}
                onReset={handleReset}
              />
            ) : activeTab === "preview" ? (
              <div className="flex flex-col items-center justify-center py-24 text-slate-500 gap-3">
                <Eye size={48} className="opacity-20" />
                <p className="text-sm">Aún no hay motivada generada</p>
                <button type="button" onClick={() => setActiveTab("form")} className="btn-primary text-xs mt-2">
                  Ir al formulario
                </button>
              </div>
            ) : null}

            {activeTab === "historial" && <HistoryPanel onReopen={handleReopen} />}
            {activeTab === "template"  && <TemplateUploader />}
            {activeTab === "settings"  && <SettingsPanel />}
          </main>
        </div>
      </div>
    </div>
  );
}
