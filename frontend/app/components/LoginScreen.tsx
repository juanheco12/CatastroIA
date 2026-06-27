"use client";

import { useState } from "react";
import { ClipboardList, User, Lock, Eye, EyeOff, LogIn, MapPin, Landmark, Zap, CheckCircle2, Scale } from "lucide-react";

interface Props {
  onLogin: (recordar: boolean) => void;
}

const PRIMARY       = "#15C9B8";
const PRIMARY_LIGHT = "#18E0D1";
const TEXT          = "#F4F6FA";
const TEXT_MUTED    = "#9DAAC1";
const BORDER        = "rgba(255,255,255,.05)";

const PARCELAS = ["00345", "00346", "00347", "00348", "00349", "00350", "00351", "00352"];

const FEATURES = [
  { icon: Zap, title: "Rápido", desc: "Generación inmediata", color: "#FFC93C" },
  { icon: CheckCircle2, title: "Preciso", desc: "Validado jurídicamente", color: PRIMARY },
  { icon: Scale, title: "Normado", desc: "Basado en normativa vigente", color: PRIMARY },
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
          <div className="relative w-full h-full max-h-[640px] flex flex-col gap-5">
            <div className="relative flex-1 min-h-0">
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
                    <Landmark size={14} style={{ color: PRIMARY }} />
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

              {/* Plataforma y casa isométrica */}
              <svg className="absolute bottom-[4%] right-[2%]" width="206" height="172" viewBox="0 0 220 190">
                {/* Plataforma base */}
                <polygon points="110,125 210,148 110,172 10,148" fill={PRIMARY} fillOpacity="0.03" stroke={PRIMARY} strokeOpacity="0.3" strokeWidth="1.1" />
                <line x1="10" y1="148" x2="210" y2="148" stroke={PRIMARY} strokeOpacity="0.15" strokeWidth="1" />
                <line x1="110" y1="125" x2="110" y2="172" stroke={PRIMARY} strokeOpacity="0.15" strokeWidth="1" />

                {/* Cara lateral y faldón del techo */}
                <polygon points="125,85 150,71 150,116 125,130" fill={PRIMARY} fillOpacity="0.06" stroke={PRIMARY} strokeOpacity="0.45" strokeWidth="1.2" />
                <polygon points="130,85 155,71 115,41 90,55" fill={PRIMARY} fillOpacity="0.1" stroke={PRIMARY} strokeOpacity="0.45" strokeWidth="1.2" />

                {/* Cara frontal y faldón del techo */}
                <rect x="55" y="85" width="70" height="45" fill={PRIMARY} fillOpacity="0.05" stroke={PRIMARY} strokeOpacity="0.6" strokeWidth="1.3" />
                <polygon points="50,85 130,85 90,55" fill={PRIMARY} fillOpacity="0.12" stroke={PRIMARY} strokeOpacity="0.6" strokeWidth="1.3" />
                <line x1="90" y1="55" x2="115" y2="41" stroke={PRIMARY} strokeOpacity="0.6" strokeWidth="1.3" />

                {/* Ventanas */}
                <rect x="61" y="93" width="14" height="13" fill="none" stroke={PRIMARY} strokeOpacity="0.65" strokeWidth="1.1" />
                <line x1="68" y1="93" x2="68" y2="106" stroke={PRIMARY} strokeOpacity="0.5" strokeWidth="0.9" />
                <line x1="61" y1="99.5" x2="75" y2="99.5" stroke={PRIMARY} strokeOpacity="0.5" strokeWidth="0.9" />

                <rect x="103" y="93" width="14" height="13" fill="none" stroke={PRIMARY} strokeOpacity="0.65" strokeWidth="1.1" />
                <line x1="110" y1="93" x2="110" y2="106" stroke={PRIMARY} strokeOpacity="0.5" strokeWidth="0.9" />
                <line x1="103" y1="99.5" x2="117" y2="99.5" stroke={PRIMARY} strokeOpacity="0.5" strokeWidth="0.9" />

                {/* Puerta */}
                <rect x="82" y="104" width="16" height="26" fill="none" stroke={PRIMARY} strokeOpacity="0.65" strokeWidth="1.2" />
              </svg>
            </div>

            {/* Tarjetas de valor */}
            <div className="grid grid-cols-3 gap-3 shrink-0">
              {FEATURES.map(({ icon: Icon, title, desc, color }) => (
                <div
                  key={title}
                  className="rounded-2xl p-4 border"
                  style={{ background: "rgba(12,24,42,0.6)", borderColor: "rgba(255,255,255,.06)" }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                    style={{ background: `${color}1F` }}
                  >
                    <Icon size={18} style={{ color }} />
                  </div>
                  <p className="text-sm font-semibold" style={{ color: TEXT }}>{title}</p>
                  <p className="text-xs mt-0.5 leading-snug" style={{ color: TEXT_MUTED }}>{desc}</p>
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
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: PRIMARY }} />
          En línea
        </span>
      </div>
    </div>
  );
}
