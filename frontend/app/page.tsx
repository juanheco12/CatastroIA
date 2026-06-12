"use client";

import { useState } from "react";
import FormBuilder from "./components/FormBuilder";
import PreviewMotivada from "./components/PreviewMotivada";
import HistoryPanel from "./components/HistoryPanel";
import TemplateUploader from "./components/TemplateUploader";
import SettingsPanel from "./components/SettingsPanel";
import {
  generarMotivada,
  TerceraClaseFormData,
  MotivadaGeneradaResponse,
  HistorialDetalle,
} from "@/lib/api";
import {
  FileText,
  Eye,
  History,
  Upload,
  Settings,
  MapPin,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import clsx from "clsx";

type Tab = "form" | "preview" | "historial" | "template" | "settings";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "form", label: "Formulario", icon: FileText },
  { id: "preview", label: "Vista previa", icon: Eye },
  { id: "historial", label: "Historial", icon: History },
  { id: "template", label: "Template", icon: Upload },
  { id: "settings", label: "Ajustes", icon: Settings },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("form");
  const [formData, setFormData] = useState<TerceraClaseFormData | null>(null);
  const [motivada, setMotivada] = useState<MotivadaGeneradaResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (data: TerceraClaseFormData) => {
    setIsLoading(true);
    setError(null);
    setFormData(data);
    try {
      const result = await generarMotivada(data);
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
    const data: TerceraClaseFormData = JSON.parse(detalle.datos_formulario);
    setFormData(data);
    setMotivada({
      texto_motivada: detalle.texto_motivada,
      numero_expediente: detalle.numero_expediente,
      propietario: detalle.propietario_nombre,
      tipo_mutacion: "Tercera Clase - Incorporación de Construcción",
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-primary flex items-center justify-center shrink-0">
              <MapPin size={16} className="text-white" />
            </div>
            <div className="leading-none">
              <span className="font-bold text-slate-100 text-base tracking-tight">CatIA</span>
              <span className="hidden sm:inline text-slate-500 text-xs ml-2">
                Generador de Motivadas Catastrales
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Sparkles size={12} className="text-brand-warning" />
            <span className="hidden sm:inline">Claude Sonnet 4.6</span>
            <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-400">
              Tercera Clase
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex-1">
        <div className="flex gap-6">
          {/* Sidebar nav */}
          <nav className="hidden lg:flex flex-col gap-1 w-48 shrink-0">
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
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={clsx(
                  "flex-1 flex flex-col items-center gap-0.5 py-2 text-xs transition-colors",
                  activeTab === id ? "text-brand-primary" : "text-slate-500"
                )}
              >
                <Icon size={18} />
                <span className="hidden xs:inline">{label}</span>
              </button>
            ))}
          </div>

          {/* Main content */}
          <main className="flex-1 min-w-0 pb-20 lg:pb-0">
            {/* Error banner */}
            {error && (
              <div className="flex items-start gap-3 p-4 mb-5 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-brand-danger">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold mb-0.5">Error al generar motivada</p>
                  <p className="text-red-400/80 text-xs">{error}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="ml-auto text-red-400/60 hover:text-red-400"
                >
                  ×
                </button>
              </div>
            )}

            {activeTab === "form" && (
              <FormBuilder onGenerate={handleGenerate} isLoading={isLoading} />
            )}

            {activeTab === "preview" && motivada && formData ? (
              <PreviewMotivada
                motivada={motivada}
                formData={formData}
                onReset={handleReset}
              />
            ) : activeTab === "preview" ? (
              <div className="flex flex-col items-center justify-center py-24 text-slate-500 gap-3">
                <Eye size={48} className="opacity-20" />
                <p className="text-sm">Aún no hay motivada generada</p>
                <button
                  type="button"
                  onClick={() => setActiveTab("form")}
                  className="btn-primary text-xs mt-2"
                >
                  Ir al formulario
                </button>
              </div>
            ) : null}

            {activeTab === "historial" && <HistoryPanel onReopen={handleReopen} />}

            {activeTab === "template" && <TemplateUploader />}

            {activeTab === "settings" && <SettingsPanel />}
          </main>
        </div>
      </div>
    </div>
  );
}
