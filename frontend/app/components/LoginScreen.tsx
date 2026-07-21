"use client";

import { useState, useEffect } from "react";
import type { CSSProperties } from "react";
import {
  ClipboardList, User, Lock, Eye, EyeOff, LogIn, Workflow, ChevronRight,
  Upload, ScanSearch, Wand2, FileSignature, Zap, CheckCircle2, Scale,
  Fingerprint, ShieldCheck, Sun, Moon,
} from "lucide-react";

interface Props {
  onLogin: (recordar: boolean) => void;
}

const TURQUOISE = "#21D6C7";
const ACCENT    = "#18D8CA";
const THEME_KEY = "catia-theme";

const PALETTES = {
  dark: {
    pageBg: "linear-gradient(180deg, #061120 0%, #081A31 100%)",
    panelBg: "rgba(10,18,35,.88)",
    panelBorder: "1px solid rgba(255,255,255,.05)",
    text: "#fff",
    textMuted: "#9DAAC1",
    inputBg: "rgba(255,255,255,.03)",
    inputBorder: "1px solid rgba(255,255,255,.06)",
    dividerBg: "rgba(255,255,255,.08)",
    huellaBorder: "1px solid rgba(255,255,255,.10)",
    huellaBg: "rgba(255,255,255,.02)",
    rightBg1: "rgba(33,214,199,0.20)",
    rightBg2: "rgba(34,118,200,0.22)",
    rightBgBase: "linear-gradient(160deg, #07182e 0%, #0a2138 100%)",
    gridLine: "rgba(255,255,255,.04)",
    glassBg: "rgba(255,255,255,0.04)",
    glassBorder: "1px solid rgba(255,255,255,0.08)",
    glassShadow: "0 12px 40px rgba(0,0,0,0.28)",
    activityText: "#D6DEEC",
    chevron: "rgba(255,255,255,.18)",
    toggleBg: "rgba(255,255,255,.06)",
    toggleBorder: "1px solid rgba(255,255,255,.10)",
  },
  light: {
    pageBg: "linear-gradient(180deg, #EEF3F9 0%, #E3ECF6 100%)",
    panelBg: "rgba(255,255,255,.92)",
    panelBorder: "1px solid rgba(15,23,42,.07)",
    text: "#0F1B2D",
    textMuted: "#5B6B85",
    inputBg: "rgba(15,23,42,.03)",
    inputBorder: "1px solid rgba(15,23,42,.10)",
    dividerBg: "rgba(15,23,42,.10)",
    huellaBorder: "1px solid rgba(15,23,42,.12)",
    huellaBg: "rgba(15,23,42,.02)",
    rightBg1: "rgba(33,214,199,0.16)",
    rightBg2: "rgba(34,118,200,0.14)",
    rightBgBase: "linear-gradient(160deg, #eef4fa 0%, #e2ecf7 100%)",
    gridLine: "rgba(15,23,42,.05)",
    glassBg: "rgba(255,255,255,0.55)",
    glassBorder: "1px solid rgba(15,23,42,0.08)",
    glassShadow: "0 12px 32px rgba(15,23,42,0.08)",
    activityText: "#33415A",
    chevron: "rgba(15,23,42,.22)",
    toggleBg: "rgba(15,23,42,.04)",
    toggleBorder: "1px solid rgba(15,23,42,.10)",
  },
} as const;

const FEATURES = [
  { icon: Zap, title: "Rápido", desc: "Generación inmediata", color: "#FFC93C" },
  { icon: CheckCircle2, title: "Preciso", desc: "Validado jurídicamente", color: TURQUOISE },
  { icon: Scale, title: "Normado", desc: "Basado en normativa vigente", color: TURQUOISE },
];

const PIPELINE_STEPS = [
  { icon: Upload, label: "Captura" },
  { icon: ScanSearch, label: "Validación IA" },
  { icon: Wand2, label: "Generación" },
  { icon: FileSignature, label: "Firma" },
];

const FLUJO_ITEMS = [
  "Datos del predio capturados",
  "Plantilla jurídica seleccionada",
  "Resolución lista para firma",
];

export default function LoginScreen({ onLogin }: Props) {
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [recordar, setRecordar] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored) setDarkMode(stored === "dark");
  }, []);

  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem(THEME_KEY, next ? "dark" : "light");
  };

  const pal = darkMode ? PALETTES.dark : PALETTES.light;

  const glass: CSSProperties = {
    background: pal.glassBg,
    border: pal.glassBorder,
    borderRadius: 18,
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    boxShadow: pal.glassShadow,
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(recordar);
  };

  return (
    <div
      className="min-h-screen lg:h-screen lg:overflow-hidden flex flex-col relative transition-colors duration-300"
      style={{ background: pal.pageBg }}
    >
      {/* Toggle de tema */}
      <button
        type="button"
        onClick={toggleTheme}
        className="absolute top-6 right-6 z-20 w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-200 hover:scale-105"
        style={{ background: pal.toggleBg, borderColor: "transparent", border: pal.toggleBorder }}
        title={darkMode ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
      >
        {darkMode ? <Sun size={17} style={{ color: TURQUOISE }} /> : <Moon size={17} style={{ color: TURQUOISE }} />}
      </button>

      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* ── Panel izquierdo (45%) ── */}
        <div className="w-full lg:w-[45%]">
          <div
            className="flex flex-col transition-colors duration-300"
            style={{
              marginLeft: 40,
              marginTop: 40,
              height: 820,
              width: "calc(100% - 40px)",
              padding: 50,
              background: pal.panelBg,
              borderRadius: 28,
              border: pal.panelBorder,
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
            }}
          >
            <div
              className="flex items-center justify-center"
              style={{ width: 60, height: 60, background: TURQUOISE, borderRadius: 16, marginBottom: 22 }}
            >
              <ClipboardList size={28} className="text-white" strokeWidth={2.2} />
            </div>

            <h1 style={{ fontSize: 40, fontWeight: 800, color: pal.text, lineHeight: 1.1 }}>
              Generador de<br />
              <span style={{ color: ACCENT }}>Motivadas Catastrales</span>
            </h1>

            <p className="mt-3 text-sm" style={{ color: pal.textMuted }}>
              Accede a tu asistente inteligente<br />de conservación catastral
            </p>

            <form onSubmit={handleSubmit} className="space-y-4 mt-7">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: pal.text }}>Usuario</label>
                <div className="relative">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: pal.textMuted }} />
                  <input
                    type="text"
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
                    placeholder="Ingresa tu usuario"
                    className="w-full h-[54px] rounded-xl pl-12 pr-4 text-sm focus:outline-none focus:ring-2 transition-all"
                    style={{ background: pal.inputBg, border: pal.inputBorder, color: pal.text }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: pal.text }}>Contraseña</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: pal.textMuted }} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ingresa tu contraseña"
                    className="w-full h-[54px] rounded-xl pl-12 pr-12 text-sm focus:outline-none focus:ring-2 transition-all"
                    style={{ background: pal.inputBg, border: pal.inputBorder, color: pal.text }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                    style={{ color: pal.textMuted }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none text-sm" style={{ color: pal.textMuted }}>
                <input
                  type="checkbox"
                  checked={recordar}
                  onChange={(e) => setRecordar(e.target.checked)}
                  className="w-4 h-4 rounded"
                  style={{ accentColor: TURQUOISE }}
                />
                Recordar sesión
              </label>

              <button
                type="submit"
                className="flex items-center justify-center gap-2 text-sm font-semibold text-white"
                style={{ width: "100%", height: 56, background: TURQUOISE, borderRadius: 14 }}
              >
                <LogIn size={18} />Iniciar Sesión
              </button>
            </form>

            {/* o continúa con */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px" style={{ background: pal.dividerBg }} />
              <span className="text-xs" style={{ color: pal.textMuted }}>o continúa con</span>
              <div className="flex-1 h-px" style={{ background: pal.dividerBg }} />
            </div>

            {/* Iniciar con huella */}
            <button
              type="button"
              className="flex items-center justify-center gap-2 text-sm font-medium"
              style={{
                width: "100%",
                height: 54,
                borderRadius: 14,
                border: pal.huellaBorder,
                background: pal.huellaBg,
                color: pal.text,
              }}
            >
              <Fingerprint size={18} style={{ color: TURQUOISE }} />Iniciar con huella
            </button>

            {/* Sistema seguro */}
            <div className="flex items-center gap-3 mt-auto pt-6">
              <div
                className="flex items-center justify-center shrink-0"
                style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(33,214,199,0.12)" }}
              >
                <ShieldCheck size={18} style={{ color: TURQUOISE }} />
              </div>
              <div className="leading-snug">
                <p className="text-sm font-semibold" style={{ color: pal.text }}>Sistema seguro</p>
                <p className="text-xs" style={{ color: pal.textMuted }}>
                  Tus datos están protegidos bajo estándares de seguridad
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Panel derecho (55%) — composición premium ── */}
        <div
          className="hidden lg:flex w-[55%] relative flex-col justify-center overflow-hidden transition-colors duration-300"
          style={{ padding: 64 }}
        >
          {/* Fondo: degradado malla + blobs */}
          <div
            className="absolute inset-0"
            style={{
              background:
                `radial-gradient(60% 50% at 22% 18%, ${pal.rightBg1}, transparent 60%),` +
                `radial-gradient(55% 50% at 85% 78%, ${pal.rightBg2}, transparent 60%),` +
                pal.rightBgBase,
            }}
          />
          {/* Rejilla sutil */}
          <div
            className="absolute inset-0 opacity-[0.4]"
            style={{
              backgroundImage:
                `linear-gradient(${pal.gridLine} 1px, transparent 1px),` +
                `linear-gradient(90deg, ${pal.gridLine} 1px, transparent 1px)`,
              backgroundSize: "44px 44px",
              maskImage: "radial-gradient(70% 70% at 50% 40%, #000 40%, transparent 100%)",
              WebkitMaskImage: "radial-gradient(70% 70% at 50% 40%, #000 40%, transparent 100%)",
            }}
          />

          {/* Contenido */}
          <div className="relative z-10 w-full max-w-[480px] mx-auto flex flex-col gap-6">
            {/* Encabezado */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: TURQUOISE }} />
                  <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: TURQUOISE }} />
                </span>
                <span className="text-xs font-semibold tracking-[0.18em] uppercase" style={{ color: TURQUOISE }}>
                  Plataforma inteligente
                </span>
              </div>
              <h2 className="text-[30px] font-bold leading-[1.18]" style={{ color: pal.text }}>
                Motivadas catastrales con<br />
                respaldo jurídico, <span style={{ color: ACCENT }}>en minutos</span>
              </h2>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: pal.textMuted }}>
                Automatiza la generación de resoluciones de conservación catastral sin reescribir
                el texto jurídico — solo confirmas los datos del predio.
              </p>
            </div>

            {/* Flujo automatizado */}
            <div style={glass} className="p-5">
              <div className="flex items-center gap-2 mb-4" style={{ color: pal.textMuted }}>
                <Workflow size={16} style={{ color: TURQUOISE }} />
                <span className="text-xs font-semibold uppercase tracking-wide">Flujo automatizado</span>
              </div>
              <div className="flex items-center justify-between">
                {PIPELINE_STEPS.map((step, i) => (
                  <div key={step.label} className="flex items-center" style={{ flex: i < PIPELINE_STEPS.length - 1 ? 1 : "0 0 auto" }}>
                    <div className="flex flex-col items-center gap-2" style={{ width: 64 }}>
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(33,214,199,0.12)" }}>
                        <step.icon size={18} style={{ color: TURQUOISE }} />
                      </div>
                      <span className="text-[11px] text-center leading-tight" style={{ color: pal.activityText }}>{step.label}</span>
                    </div>
                    {i < PIPELINE_STEPS.length - 1 && (
                      <ChevronRight size={16} className="shrink-0 mx-1" style={{ color: pal.chevron }} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Resumen del proceso */}
            <div style={glass} className="p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold" style={{ color: pal.text }}>Cómo funciona</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ color: TURQUOISE, background: "rgba(33,214,199,0.12)" }}>
                  Automático
                </span>
              </div>
              <div className="space-y-3.5">
                {FLUJO_ITEMS.map((t) => (
                  <div key={t} className="flex items-center gap-3">
                    <CheckCircle2 size={18} style={{ color: TURQUOISE }} className="shrink-0" />
                    <span className="text-sm flex-1" style={{ color: pal.activityText }}>{t}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chips de valor */}
            <div className="grid grid-cols-3 gap-3">
              {FEATURES.map(({ icon: Icon, title, color }, i) => (
                <div
                  key={title}
                  style={glass}
                  className="px-3 py-3 flex items-center gap-2 transition-transform duration-300 hover:-translate-y-1 hover:scale-[1.03]"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 animate-pulse"
                    style={{ background: `${color}1F`, animationDuration: "2.4s", animationDelay: `${i * 0.3}s` }}
                  >
                    <Icon size={15} style={{ color }} />
                  </div>
                  <span className="text-xs font-semibold" style={{ color: pal.text }}>{title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Pie de página ── */}
      <div
        className="flex items-center justify-center sm:justify-between gap-4 px-6 lg:px-12 py-4 text-xs flex-wrap"
        style={{ color: pal.textMuted }}
      >
        <span>Conservación Catastral 2026</span>
        <span className="flex items-center gap-1.5">
          Versión 1.0.0
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: TURQUOISE }} />
          En línea
        </span>
      </div>
    </div>
  );
}
