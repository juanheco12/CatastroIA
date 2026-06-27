"use client";

import { useState } from "react";
import { ClipboardList, User, Lock, Eye, EyeOff, LogIn, MapPin, FileText } from "lucide-react";

interface Props {
  onLogin: (recordar: boolean) => void;
}

const PRIMARY       = "#15C9B8";
const PRIMARY_LIGHT = "#18E0D1";
const TEXT          = "#F4F6FA";
const TEXT_MUTED    = "#9DAAC1";
const BORDER        = "rgba(255,255,255,.05)";

const PARCELAS = ["00345", "00346", "00347", "00348", "00349", "00350", "00351", "00352"];

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
    <div className="min-h-screen lg:h-screen lg:overflow-hidden flex flex-col" style={{ backgroundColor: "#061120" }}>
      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* ── Columna izquierda — Formulario (55%) ── */}
        <div className="w-full lg:w-[55%] flex items-center justify-center p-6 lg:p-12">
          <div
            className="w-full rounded-[32px] p-8 sm:p-12"
            style={{
              background: "rgba(8,18,35,.85)",
              backdropFilter: "blur(18px)",
              WebkitBackdropFilter: "blur(18px)",
              border: `1px solid ${BORDER}`,
              transform: "rotate(-1deg)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
            }}
          >
            <div className="flex flex-col items-start mb-9">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                style={{
                  background: `linear-gradient(135deg, ${PRIMARY}, ${PRIMARY_LIGHT})`,
                  boxShadow: "0 8px 24px rgba(21,201,184,0.35)",
                }}
              >
                <ClipboardList size={26} className="text-white" strokeWidth={2.2} />
              </div>
              <h1 className="font-bold leading-[1.08] text-4xl sm:text-5xl lg:text-[52px]" style={{ color: TEXT }}>
                Generador de<br />
                <span style={{ color: PRIMARY }}>Motivadas Catastrales</span>
              </h1>
              <p className="mt-3 text-sm sm:text-base" style={{ color: TEXT_MUTED }}>
                Accede a tu asistente inteligente de conservación catastral
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: TEXT }}>Usuario</label>
                <div className="relative">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: TEXT_MUTED }} />
                  <input
                    type="text"
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
                    placeholder="Ingresa tu usuario"
                    className="w-full h-[58px] rounded-xl pl-12 pr-4 text-sm focus:outline-none focus:ring-2 transition-all"
                    style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)", color: TEXT }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: TEXT }}>Contraseña</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: TEXT_MUTED }} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ingresa tu contraseña"
                    className="w-full h-[58px] rounded-xl pl-12 pr-12 text-sm focus:outline-none focus:ring-2 transition-all"
                    style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)", color: TEXT }}
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

              <div className="flex items-center justify-between text-sm flex-wrap gap-2">
                <label className="flex items-center gap-2 cursor-pointer select-none" style={{ color: TEXT_MUTED }}>
                  <input
                    type="checkbox"
                    checked={recordar}
                    onChange={(e) => setRecordar(e.target.checked)}
                    className="w-4 h-4 rounded"
                    style={{ accentColor: PRIMARY }}
                  />
                  Recordar sesión
                </label>
                <button type="button" className="hover:underline transition-colors" style={{ color: PRIMARY }}>
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              <button
                type="submit"
                className="w-full h-[58px] rounded-[14px] flex items-center justify-center gap-2 text-sm font-semibold text-white transition-shadow duration-300 hover:shadow-[0_0_35px_rgba(21,201,184,.45)]"
                style={{ background: `linear-gradient(90deg, ${PRIMARY}, ${PRIMARY_LIGHT})` }}
              >
                <LogIn size={18} />Iniciar sesión
              </button>
            </form>
          </div>
        </div>

        {/* ── Columna derecha — Ilustración tecnológica (45%) ── */}
        <div
          className="hidden lg:flex w-[45%] relative items-center justify-center p-10"
          style={{
            background: "linear-gradient(180deg, #061120, #0A2242, #061120)",
            boxShadow: "inset 0 0 60px rgba(21,201,184,.15)",
          }}
        >
          <div className="relative w-full h-full max-h-[640px]">
            {/* Líneas luminosas turquesa */}
            <svg className="absolute inset-0 w-full h-full opacity-40" preserveAspectRatio="none">
              <line x1="55%" y1="6%" x2="92%" y2="0%" stroke={PRIMARY} strokeWidth="1" />
              <line x1="2%" y1="70%" x2="18%" y2="96%" stroke={PRIMARY} strokeWidth="1" />
              <circle cx="92%" cy="0%" r="2.5" fill={PRIMARY} />
              <circle cx="18%" cy="96%" r="2.5" fill={PRIMARY} />
            </svg>

            {/* Mapa catastral */}
            <div
              className="absolute left-[6%] top-[14%] grid grid-cols-3 gap-[3px]"
              style={{ width: "52%", height: "58%", transform: "rotate(-6deg) skewX(-10deg)" }}
            >
              {PARCELAS.map((n, i) => (
                <div
                  key={n}
                  className="flex items-end p-2 text-[11px] font-mono border rounded-[2px]"
                  style={{
                    borderColor: "rgba(21,201,184,0.45)",
                    color: TEXT_MUTED,
                    background: i === 4
                      ? `linear-gradient(135deg, rgba(21,201,184,0.5), rgba(24,224,209,0.15))`
                      : "rgba(21,201,184,0.04)",
                    boxShadow: i === 4 ? "0 0 18px rgba(21,201,184,0.4)" : undefined,
                  }}
                >
                  {n}
                </div>
              ))}
            </div>

            {/* Marcador de ubicación */}
            <div className="absolute" style={{ left: "27%", top: "38%" }}>
              <div
                className="absolute -inset-3 rounded-full"
                style={{ background: "radial-gradient(circle, rgba(21,201,184,0.45), transparent 70%)", filter: "blur(2px)" }}
              />
              <MapPin size={34} className="relative drop-shadow-lg" style={{ color: PRIMARY, fill: "rgba(21,201,184,0.35)" }} />
            </div>

            {/* Documento resolución */}
            <div
              className="absolute right-[4%] top-[8%] w-52 rounded-xl border p-4 shadow-2xl"
              style={{ backgroundColor: "rgba(18,33,58,0.9)", borderColor: "rgba(21,201,184,0.3)" }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: "rgba(21,201,184,0.2)" }}>
                  <FileText size={14} style={{ color: PRIMARY }} />
                </div>
                <span className="text-xs font-bold tracking-wide" style={{ color: PRIMARY }}>RESOLUCIÓN</span>
              </div>
              <div className="space-y-1.5">
                {[100, 90, 75, 95, 60].map((w, i) => (
                  <div key={i} className="h-1.5 rounded-full" style={{ width: `${w}%`, background: "rgba(255,255,255,.08)" }} />
                ))}
              </div>
              <div className="flex items-center justify-between mt-4">
                <svg width="44" height="18" viewBox="0 0 44 18">
                  <path d="M2 14 Q9 2 16 12 T29 9 T42 4" fill="none" stroke={TEXT_MUTED} strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <div className="relative w-7 h-7 rounded-full flex items-center justify-center" style={{ border: "2px dashed rgba(21,201,184,0.6)" }}>
                  <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center" style={{ borderColor: PRIMARY }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={PRIMARY} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Casa isométrica */}
            <svg className="absolute bottom-[10%] right-[8%] opacity-80" width="170" height="120" viewBox="0 0 170 120">
              <ellipse cx="85" cy="100" rx="78" ry="14" fill="none" stroke={PRIMARY} strokeOpacity="0.25" />
              <polyline points="20,68 85,22 150,68" fill="none" stroke={PRIMARY} strokeWidth="1.5" />
              <rect x="38" y="68" width="94" height="36" fill="none" stroke={PRIMARY} strokeWidth="1.5" />
              <rect x="58" y="78" width="18" height="26" fill="none" stroke={PRIMARY} strokeWidth="1.5" />
              <rect x="92" y="78" width="18" height="16" fill="none" stroke={PRIMARY} strokeWidth="1.5" />
            </svg>
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
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: PRIMARY }} />
          En línea
        </span>
      </div>
    </div>
  );
}
