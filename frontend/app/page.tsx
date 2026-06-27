"use client";

import { useState, useEffect } from "react";
import LoginScreen from "./components/LoginScreen";
import MutationSelector, { TipoMutacion, TipoOrigen, LABEL_MUTACION, LABEL_ORIGEN } from "./components/MutationSelector";
import FormBuilder, { SolicitudFormData } from "./components/FormBuilder";
import PreviewMotivada from "./components/PreviewMotivada";
import HistoryPanel from "./components/HistoryPanel";
import SettingsPanel from "./components/SettingsPanel";
import ChatBot from "./components/ChatBot";
import BibliotecaPanel from "./components/BibliotecaPanel";
import BibliotecaFlujoCategoria from "./components/BibliotecaFlujoCategoria";
import BibliotecaPreviewAprobacion from "./components/BibliotecaPreviewAprobacion";
import { generarMotivada, extractErrorMessage, MotivadaGeneradaResponse, HistorialDetalle, PlantillaInfo } from "@/lib/api";
import {
  FileText, Eye, History, Settings, AlertCircle, ArrowLeft,
  Sun, Moon, Building2, Home, MessageCircle, Library, ShieldCheck,
} from "lucide-react";
import clsx from "clsx";

type Tab  = "form" | "preview" | "historial" | "biblioteca" | "settings" | "chat";
type Step = "select" | "form" | "biblioteca";

const TABS = [
  { id: "form"        as Tab, label: "Formulario", icon: FileText       },
  { id: "preview"     as Tab, label: "Motivada",   icon: Eye            },
  { id: "historial"   as Tab, label: "Historial",  icon: History        },
  { id: "biblioteca"  as Tab, label: "Biblioteca",  icon: Library        },
  { id: "chat"        as Tab, label: "Asistente",  icon: MessageCircle  },
  { id: "settings"    as Tab, label: "Ajustes",    icon: Settings       },
];

export default function Dashboard() {
  const [loggedIn,    setLoggedIn]    = useState(false);
  const [darkMode,    setDarkMode]    = useState(true);
  const [tab,      setTab]      = useState<Tab>("form");
  const [step,     setStep]     = useState<Step>("select");
  const [mutacion, setMutacion] = useState<TipoMutacion | null>(null);
  const [origen,   setOrigen]   = useState<TipoOrigen   | null>(null);
  const [bibliotecaCategoria, setBibliotecaCategoria] = useState<string | null>(null);
  const [bibliotecaPlantillaId, setBibliotecaPlantillaId] = useState<number | null>(null);
  const [aperturaRevisionId, setAperturaRevisionId] = useState<number | null>(null);
  const [motivada, setMotivada] = useState<MotivadaGeneradaResponse | null>(null);
  const [formData, setFormData] = useState<SolicitudFormData | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [chatContexto, setChatContexto] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("catia-theme");
    const isDark = stored ? stored === "dark" : true;
    setDarkMode(isDark);
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");

    if (localStorage.getItem("catia-sesion") === "1") setLoggedIn(true);
  }, []);

  const applyTheme = (isDark: boolean) => {
    setDarkMode(isDark);
    const t = isDark ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", t);
    localStorage.setItem("catia-theme", t);
  };

  const handleLogin = (recordar: boolean) => {
    if (recordar) localStorage.setItem("catia-sesion", "1");
    setLoggedIn(true);
  };

  const handleCerrarSesion = () => {
    localStorage.removeItem("catia-sesion");
    setLoggedIn(false);
  };

  if (!loggedIn) return <LoginScreen onLogin={handleLogin} />;

  const handleOrigenSelect = (v: TipoOrigen) => { setOrigen(v); setStep("form"); };

  const handleSelectCategoriaBiblioteca = (categoria: string) => {
    setBibliotecaCategoria(categoria);
    setBibliotecaPlantillaId(null);
    setStep("biblioteca");
  };

  const handleVolverDesdeBiblioteca = () => {
    setBibliotecaCategoria(null);
    setBibliotecaPlantillaId(null);
    setStep("select");
  };

  const handleIrARevisarDesdeFormulario = (plantillaId: number) => {
    setAperturaRevisionId(plantillaId);
    setBibliotecaCategoria(null);
    setBibliotecaPlantillaId(null);
    setStep("select");
    setTab("biblioteca");
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
      setError(extractErrorMessage(err, "Error al conectar con el servidor. ¿Está corriendo el backend?"));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setMotivada(null); setFormData(null); setError(null);
    setStep("select"); setMutacion(null); setOrigen(null);
    setBibliotecaCategoria(null); setBibliotecaPlantillaId(null);
    setChatContexto("");
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

  const labelMutacion = LABEL_MUTACION;
  const labelOrigen   = LABEL_ORIGEN;

  const handleSugerirMotivada = (m: TipoMutacion, o: TipoOrigen, contexto: string) => {
    setMutacion(m);
    setOrigen(o);
    setChatContexto(contexto);
    setStep("form");
    setTab("form");
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Header ── */}
      <header
        className="border-b sticky top-0 z-10 backdrop-blur-sm transition-colors duration-200"
        style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          {/* Logo */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-brand-primary flex items-center justify-center shrink-0 shadow-lg shadow-teal-500/30">
              <Building2 size={16} className="text-white" />
            </div>
            <div className="leading-tight">
              <div className="font-bold text-sm" style={{ color: "var(--text)" }}>CatIA</div>
              <div className="hidden sm:block text-[10px]" style={{ color: "var(--text-muted)" }}>
                Conservación Catastral
              </div>
            </div>
            {mutacion && origen && (
              <span
                className="hidden md:inline font-mono text-xs px-2 py-0.5 rounded-md border"
                style={{
                  backgroundColor: "rgba(20,184,166,0.08)",
                  borderColor: "rgba(20,184,166,0.25)",
                  color: "#2dd4bf",
                }}
              >
                {labelMutacion[mutacion]} · {labelOrigen[origen]}
              </span>
            )}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Theme toggle */}
            <button
              type="button"
              onClick={() => applyTheme(!darkMode)}
              className="w-9 h-9 rounded-xl flex items-center justify-center border transition-all duration-200 hover:border-brand-primary"
              style={{ backgroundColor: "var(--muted)", borderColor: "var(--border)" }}
              title={darkMode ? "Cambiar a claro" : "Cambiar a oscuro"}
            >
              {darkMode
                ? <Sun  size={16} className="text-brand-primary" />
                : <Moon size={16} className="text-brand-primary" />}
            </button>

            {/* Cerrar sesión */}
            <button
              type="button"
              onClick={handleCerrarSesion}
              className="flex items-center gap-1.5 text-xs font-medium px-3 h-9 rounded-xl border transition-all duration-200 hover:border-brand-primary"
              style={{
                backgroundColor: "var(--muted)",
                borderColor: "var(--border)",
                color: "var(--text-muted)",
              }}
            >
              <Home size={13} />
              <span className="hidden sm:inline">Inicio</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[1440px] mx-auto w-full px-4 sm:px-6 py-6 flex-1">
        <div className="flex gap-6 lg:gap-8">
          {/* Sidebar */}
          <nav className="hidden md:flex flex-col gap-1 w-48 shrink-0">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} type="button" onClick={() => setTab(id)}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left",
                  tab === id
                    ? "bg-brand-primary text-white shadow-lg shadow-teal-500/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                )}>
                <Icon size={16} />{label}
                {id === "preview" && motivada && <span className="ml-auto w-2 h-2 rounded-full bg-brand-success" />}
              </button>
            ))}
            <div className="mt-auto pt-4 flex items-start gap-2.5 text-xs" style={{ color: "var(--text-muted)" }}>
              <ShieldCheck size={20} className="text-brand-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-medium" style={{ color: "var(--text)" }}>Sistema seguro</p>
                <p className="mt-0.5">Tus datos están protegidos bajo estándares de seguridad</p>
              </div>
            </div>
          </nav>

          {/* Main */}
          <main className="flex-1 min-w-0 pb-20 md:pb-0">
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

            {tab === "form" && (
              <>
                {step === "select" && (
                  <MutationSelector
                    selectedMutacion={mutacion}
                    selectedOrigen={origen}
                    onSelectMutacion={(v) => { setMutacion(v); setOrigen(null); setStep("select"); }}
                    onSelectOrigen={handleOrigenSelect}
                    onSelectCategoriaBiblioteca={handleSelectCategoriaBiblioteca}
                  />
                )}
                {step === "form" && mutacion && origen && (
                  <div className="space-y-4">
                    <button type="button" onClick={() => setStep("select")} className="btn-ghost text-xs">
                      <ArrowLeft size={13} />Cambiar tipo / origen
                    </button>
                    <FormBuilder
                      tipoMutacion={mutacion}
                      tipoOrigen={origen}
                      onGenerate={handleGenerate}
                      isLoading={loading}
                      contextoInicial={chatContexto}
                    />
                  </div>
                )}
                {step === "biblioteca" && bibliotecaCategoria && (
                  <div className="space-y-4">
                    <button type="button" onClick={handleVolverDesdeBiblioteca} className="btn-ghost text-xs">
                      <ArrowLeft size={13} />Cambiar tipo de mutación
                    </button>
                    {bibliotecaPlantillaId ? (
                      <BibliotecaPreviewAprobacion
                        plantillaId={bibliotecaPlantillaId}
                        onVolver={() => setBibliotecaPlantillaId(null)}
                        onEditarCampos={handleIrARevisarDesdeFormulario}
                      />
                    ) : (
                      <BibliotecaFlujoCategoria
                        categoria={bibliotecaCategoria}
                        onSeleccionarPlantilla={(p: PlantillaInfo) => setBibliotecaPlantillaId(p.id)}
                        onIrARevisar={handleIrARevisarDesdeFormulario}
                      />
                    )}
                  </div>
                )}
              </>
            )}

            {tab === "preview" && motivada && formData ? (
              <PreviewMotivada motivada={motivada} formData={formData as never} onReset={handleReset} />
            ) : tab === "preview" ? (
              <div className="flex flex-col items-center justify-center py-24 text-slate-500 gap-3">
                <Eye size={48} className="opacity-20" />
                <p className="text-sm">Aún no hay motivada generada</p>
                <button type="button" onClick={() => setTab("form")} className="btn-primary text-xs mt-2">
                  Ir al formulario
                </button>
              </div>
            ) : null}

            {tab === "historial"  && <HistoryPanel onReopen={handleReopen} />}
            {tab === "biblioteca" && (
              <BibliotecaPanel
                aperturaRevisionId={aperturaRevisionId}
                onAperturaRevisionConsumida={() => setAperturaRevisionId(null)}
              />
            )}
            {tab === "chat"       && <ChatBot onSugerirMotivada={handleSugerirMotivada} />}
            {tab === "settings"  && (
              <SettingsPanel
                theme={darkMode ? "dark" : "light"}
                onThemeChange={(t) => applyTheme(t === "dark")}
              />
            )}
          </main>
        </div>
      </div>

      <div className="hidden md:block text-center text-xs pb-6" style={{ color: "var(--text-muted)" }}>
        Conservación Catastral 2026
      </div>

      {/* Mobile tab bar */}
      <div
        className="mobile-tabbar md:hidden fixed bottom-0 left-0 right-0 border-t z-10 flex shadow-[0_-4px_12px_rgba(0,0,0,0.15)]"
        style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
      >
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" onClick={() => setTab(id)}
            className="flex-1 flex flex-col items-center gap-0.5 py-2 transition-colors"
            style={{ color: tab === id ? "#2dd4bf" : "var(--text-muted)" }}>
            <Icon size={18} />
            <span className="text-[9px] font-medium leading-none truncate max-w-full px-0.5">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
