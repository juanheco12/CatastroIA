"use client";

import { useState } from "react";
import { ClipboardList, User, Lock, Eye, EyeOff, LogIn, MapPin, Landmark, Zap, CheckCircle2, Scale, Fingerprint, ShieldCheck } from "lucide-react";

interface Props {
  onLogin: (recordar: boolean) => void;
}

const TURQUOISE  = "#21D6C7";
const ACCENT     = "#18D8CA";
const TEXT_MUTED = "#9DAAC1";

const PARCELAS = ["00345", "00346", "00347", "00348", "00349", "00350", "00351"];

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

        {/* ── Panel derecho (55%) ── */}
        <div className="hidden lg:flex w-[55%] relative flex-col items-center justify-center gap-6" style={{ padding: 50 }}>
          <div className="relative w-full flex-1 min-h-0">
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
                    borderColor: "rgba(33,214,199,0.45)",
                    color: TEXT_MUTED,
                    background: i === 4
                      ? `linear-gradient(135deg, rgba(33,214,199,0.5), rgba(24,224,209,0.15))`
                      : "rgba(33,214,199,0.04)",
                    boxShadow: i === 4 ? "0 0 18px rgba(33,214,199,0.4)" : undefined,
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
                style={{ background: "radial-gradient(circle, rgba(33,214,199,0.45), transparent 70%)", filter: "blur(2px)" }}
              />
              <MapPin size={34} className="relative" style={{ color: TURQUOISE, fill: "rgba(33,214,199,0.35)" }} />
            </div>

            {/* Documento resolución */}
            <div
              className="absolute right-[4%] top-[8%] w-52 rounded-xl border p-4"
              style={{ backgroundColor: "rgba(18,33,58,0.9)", borderColor: "rgba(33,214,199,0.3)" }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: "rgba(33,214,199,0.2)" }}>
                  <Landmark size={14} style={{ color: TURQUOISE }} />
                </div>
                <span className="text-xs font-bold tracking-wide" style={{ color: TURQUOISE }}>RESOLUCIÓN</span>
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
                <div className="relative w-7 h-7 rounded-full flex items-center justify-center" style={{ border: "2px dashed rgba(33,214,199,0.6)" }}>
                  <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center" style={{ borderColor: TURQUOISE }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={TURQUOISE} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Casa isométrica */}
            <svg className="absolute bottom-[4%] right-[2%]" width="206" height="172" viewBox="0 0 220 190">
              <polygon points="110,125 210,148 110,172 10,148" fill={TURQUOISE} fillOpacity="0.03" stroke={TURQUOISE} strokeOpacity="0.3" strokeWidth="1.1" />
              <line x1="10" y1="148" x2="210" y2="148" stroke={TURQUOISE} strokeOpacity="0.15" strokeWidth="1" />
              <line x1="110" y1="125" x2="110" y2="172" stroke={TURQUOISE} strokeOpacity="0.15" strokeWidth="1" />

              <polygon points="125,85 150,71 150,116 125,130" fill={TURQUOISE} fillOpacity="0.06" stroke={TURQUOISE} strokeOpacity="0.45" strokeWidth="1.2" />
              <polygon points="130,85 155,71 115,41 90,55" fill={TURQUOISE} fillOpacity="0.1" stroke={TURQUOISE} strokeOpacity="0.45" strokeWidth="1.2" />

              <rect x="55" y="85" width="70" height="45" fill={TURQUOISE} fillOpacity="0.05" stroke={TURQUOISE} strokeOpacity="0.6" strokeWidth="1.3" />
              <polygon points="50,85 130,85 90,55" fill={TURQUOISE} fillOpacity="0.12" stroke={TURQUOISE} strokeOpacity="0.6" strokeWidth="1.3" />
              <line x1="90" y1="55" x2="115" y2="41" stroke={TURQUOISE} strokeOpacity="0.6" strokeWidth="1.3" />

              <rect x="61" y="93" width="14" height="13" fill="none" stroke={TURQUOISE} strokeOpacity="0.65" strokeWidth="1.1" />
              <line x1="68" y1="93" x2="68" y2="106" stroke={TURQUOISE} strokeOpacity="0.5" strokeWidth="0.9" />
              <line x1="61" y1="99.5" x2="75" y2="99.5" stroke={TURQUOISE} strokeOpacity="0.5" strokeWidth="0.9" />

              <rect x="103" y="93" width="14" height="13" fill="none" stroke={TURQUOISE} strokeOpacity="0.65" strokeWidth="1.1" />
              <line x1="110" y1="93" x2="110" y2="106" stroke={TURQUOISE} strokeOpacity="0.5" strokeWidth="0.9" />
              <line x1="103" y1="99.5" x2="117" y2="99.5" stroke={TURQUOISE} strokeOpacity="0.5" strokeWidth="0.9" />

              <rect x="82" y="104" width="16" height="26" fill="none" stroke={TURQUOISE} strokeOpacity="0.65" strokeWidth="1.2" />
            </svg>
          </div>

          {/* Tarjetas de valor */}
          <div className="flex gap-4 shrink-0">
            {FEATURES.map(({ icon: Icon, title, desc, color }) => (
              <div
                key={title}
                className="p-4"
                style={{ width: 220, height: 120, background: "rgba(15,25,45,.70)", borderRadius: 18 }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: `${color}1F` }}
                >
                  <Icon size={18} style={{ color }} />
                </div>
                <p className="text-sm font-semibold text-white">{title}</p>
                <p className="text-xs mt-0.5 leading-snug" style={{ color: TEXT_MUTED }}>{desc}</p>
              </div>
            ))}
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
