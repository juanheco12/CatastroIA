"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import { ClipboardList, User, Lock, Eye, EyeOff, LogIn, Landmark, Zap, CheckCircle2, Scale, Fingerprint, ShieldCheck } from "lucide-react";

interface Props {
  onLogin: (recordar: boolean) => void;
}

const TURQUOISE  = "#21D6C7";
const ACCENT     = "#18D8CA";
const TEXT_MUTED = "#9DAAC1";

const glass: CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 18,
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  boxShadow: "0 12px 40px rgba(0,0,0,0.28)",
};

const FEATURES = [
  { icon: Zap, title: "Rápido", desc: "Generación inmediata", color: "#FFC93C" },
  { icon: CheckCircle2, title: "Preciso", desc: "Validado jurídicamente", color: TURQUOISE },
  { icon: Scale, title: "Normado", desc: "Basado en normativa vigente", color: TURQUOISE },
];

export default function LoginScreen({ onLogin }: Props) {
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [recordar, setRecordar] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(recordar);
  };

  return (
    <div
      className="min-h-screen lg:h-screen lg:overflow-hidden flex flex-col"
      style={{ background: "linear-gradient(180deg, #061120 0%, #081A31 100%)" }}
    >
      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* ── Panel izquierdo (45%) ── */}
        <div className="w-full lg:w-[45%]">
          <div
            className="flex flex-col"
            style={{
              marginLeft: 40,
              marginTop: 40,
              height: 820,
              width: "calc(100% - 40px)",
              padding: 50,
              background: "rgba(10,18,35,.88)",
              borderRadius: 28,
              border: "1px solid rgba(255,255,255,.05)",
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

            <h1 style={{ fontSize: 40, fontWeight: 800, color: "#fff", lineHeight: 1.1 }}>
              Generador de<br />
              <span style={{ color: ACCENT }}>Motivadas Catastrales</span>
            </h1>

            <p className="mt-3 text-sm" style={{ color: TEXT_MUTED }}>
              Accede a tu asistente inteligente<br />de conservación catastral
            </p>

            <form onSubmit={handleSubmit} className="space-y-4 mt-7">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "#fff" }}>Usuario</label>
                <div className="relative">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: TEXT_MUTED }} />
                  <input
                    type="text"
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
                    placeholder="Ingresa tu usuario"
                    className="w-full h-[54px] rounded-xl pl-12 pr-4 text-sm focus:outline-none focus:ring-2 transition-all"
                    style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)", color: "#fff" }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "#fff" }}>Contraseña</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: TEXT_MUTED }} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ingresa tu contraseña"
                    className="w-full h-[54px] rounded-xl pl-12 pr-12 text-sm focus:outline-none focus:ring-2 transition-all"
                    style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)", color: "#fff" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                    style={{ color: TEXT_MUTED }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none text-sm" style={{ color: TEXT_MUTED }}>
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
              <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,.08)" }} />
              <span className="text-xs" style={{ color: TEXT_MUTED }}>o continúa con</span>
              <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,.08)" }} />
            </div>

            {/* Iniciar con huella */}
            <button
              type="button"
              className="flex items-center justify-center gap-2 text-sm font-medium"
              style={{
                width: "100%",
                height: 54,
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,.10)",
                background: "rgba(255,255,255,.02)",
                color: "#fff",
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
                <p className="text-sm font-semibold text-white">Sistema seguro</p>
                <p className="text-xs" style={{ color: TEXT_MUTED }}>
                  Tus datos están protegidos bajo estándares de seguridad
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Panel derecho (55%) — composición premium ── */}
        <div
          className="hidden lg:flex w-[55%] relative flex-col justify-center overflow-hidden"
          style={{ padding: 64 }}
        >
          {/* Fondo: degradado malla + blobs */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(60% 50% at 22% 18%, rgba(33,214,199,0.20), transparent 60%)," +
                "radial-gradient(55% 50% at 85% 78%, rgba(34,118,200,0.22), transparent 60%)," +
                "linear-gradient(160deg, #07182e 0%, #0a2138 100%)",
            }}
          />
          {/* Rejilla sutil */}
          <div
            className="absolute inset-0 opacity-[0.4]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px)," +
                "linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px)",
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
              <h2 className="text-[30px] font-bold leading-[1.18]" style={{ color: "#fff" }}>
                Motivadas catastrales con<br />
                respaldo jurídico, <span style={{ color: ACCENT }}>en minutos</span>
              </h2>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: TEXT_MUTED }}>
                Automatiza la generación de resoluciones de conservación catastral sin reescribir
                el texto jurídico — solo confirmas los datos del predio.
              </p>
            </div>

            {/* Tarjetas de métricas */}
            <div className="grid grid-cols-2 gap-4">
              <div style={glass} className="p-5">
                <div className="flex items-center gap-2 mb-3" style={{ color: TEXT_MUTED }}>
                  <Landmark size={16} style={{ color: TURQUOISE }} />
                  <span className="text-xs">Predios procesados</span>
                </div>
                <p className="text-3xl font-bold" style={{ color: "#fff" }}>1.248</p>
                <p className="text-xs mt-1" style={{ color: "#5BE3D5" }}>+18% este mes</p>
              </div>

              <div style={glass} className="p-5 flex items-center gap-4">
                <svg width="56" height="56" viewBox="0 0 56 56" className="shrink-0 -rotate-90">
                  <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="6" />
                  <circle
                    cx="28" cy="28" r="22" fill="none" stroke={TURQUOISE} strokeWidth="6" strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 22}
                    strokeDashoffset={2 * Math.PI * 22 * (1 - 0.98)}
                  />
                </svg>
                <div>
                  <p className="text-2xl font-bold leading-none" style={{ color: "#fff" }}>98%</p>
                  <p className="text-xs mt-1.5 leading-snug" style={{ color: TEXT_MUTED }}>Validado<br />jurídicamente</p>
                </div>
              </div>
            </div>

            {/* Actividad en tiempo real */}
            <div style={glass} className="p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold" style={{ color: "#fff" }}>Actividad en tiempo real</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ color: TURQUOISE, background: "rgba(33,214,199,0.12)" }}>
                  En vivo
                </span>
              </div>
              <div className="space-y-3.5">
                {[
                  { t: "Resolución 00349 generada", s: "ahora" },
                  { t: "Predio urbano validado", s: "hace 2 min" },
                  { t: "Motivada exportada a PDF", s: "hace 5 min" },
                ].map((row) => (
                  <div key={row.t} className="flex items-center gap-3">
                    <CheckCircle2 size={18} style={{ color: TURQUOISE }} className="shrink-0" />
                    <span className="text-sm flex-1" style={{ color: "#D6DEEC" }}>{row.t}</span>
                    <span className="text-xs" style={{ color: TEXT_MUTED }}>{row.s}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chips de valor */}
            <div className="grid grid-cols-3 gap-3">
              {FEATURES.map(({ icon: Icon, title, color }) => (
                <div key={title} style={glass} className="px-3 py-3 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}1F` }}>
                    <Icon size={15} style={{ color }} />
                  </div>
                  <span className="text-xs font-semibold" style={{ color: "#fff" }}>{title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Pie de página ── */}
      <div
        className="flex items-center justify-center sm:justify-between gap-4 px-6 lg:px-12 py-4 text-xs flex-wrap"
        style={{ color: TEXT_MUTED }}
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
