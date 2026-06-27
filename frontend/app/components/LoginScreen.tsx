"use client";

import { useState } from "react";
import {
  ClipboardList, User, Lock, Eye, EyeOff, LogIn, Fingerprint, ShieldCheck,
  MapPin, Building2, CheckCircle2, Zap, Scale,
} from "lucide-react";

interface Props {
  onLogin: (recordar: boolean) => void;
}

const PARCELAS = ["00345", "00346", "00347", "00348", "00349", "00350", "00351", "00352"];

const FEATURES = [
  { icon: Zap,           label: "Rápido",  desc: "Generación inmediata" },
  { icon: CheckCircle2,  label: "Preciso", desc: "Validado jurídicamente" },
  { icon: Scale,         label: "Normado", desc: "Basado en normativa vigente" },
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
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#070d1a" }}>
      <div className="flex-1 grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-6 p-4 lg:p-6 max-w-[1600px] mx-auto w-full">
        {/* ── Tarjeta de login ── */}
        <div className="rounded-2xl border p-8 sm:p-12 flex flex-col justify-center" style={{ backgroundColor: "#0e1a2e", borderColor: "#1e2c44" }}>
          <div className="flex flex-col items-center text-center mb-8">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5"
              style={{
                background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
                boxShadow: "0 10px 30px rgba(245,158,11,0.35), 0 0 0 1px rgba(251,191,36,0.5)",
              }}
            >
              <ClipboardList size={34} className="text-white" strokeWidth={2.2} />
            </div>
            <h1 className="text-4xl font-bold leading-tight">
              <span className="text-white">Generador de</span><br />
              <span className="text-brand-primary">Motivadas Catastrales</span>
            </h1>
            <p className="text-sm text-slate-400 mt-3">
              Accede a tu asistente inteligente de conservación catastral
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-1.5">Usuario</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  placeholder="Ingresa tu usuario"
                  className="w-full bg-[#0a1424] border border-slate-700 rounded-lg pl-10 pr-3 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200 mb-1.5">Contraseña</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresa tu contraseña"
                  className="w-full bg-[#0a1424] border border-slate-700 rounded-lg pl-10 pr-10 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={recordar}
                onChange={(e) => setRecordar(e.target.checked)}
                className="w-4 h-4 rounded accent-teal-500"
              />
              Recordar sesión
            </label>

            <button type="submit" className="w-full btn-primary justify-center py-3.5 text-sm">
              <LogIn size={16} />Iniciar Sesión
            </button>

            <div className="flex items-center gap-3 text-xs text-slate-500">
              <div className="flex-1 h-px bg-slate-700" />
              o continúa con
              <div className="flex-1 h-px bg-slate-700" />
            </div>

            <button
              type="button"
              onClick={() => onLogin(recordar)}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-lg border border-slate-700 text-sm font-medium text-slate-300 hover:border-slate-500 hover:text-white transition-all"
            >
              <Fingerprint size={16} />Iniciar con huella
            </button>
          </form>
        </div>

        {/* ── Ilustración decorativa ── */}
        <div className="hidden lg:flex flex-col gap-6">
          <div className="relative flex-1 rounded-2xl border overflow-hidden" style={{ backgroundColor: "#0e1a2e", borderColor: "#1e2c44", minHeight: 420 }}>
            {/* Glow ambiental */}
            <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 28% 22%, rgba(45,212,191,0.14), transparent 55%)" }} />

            {/* Líneas decorativas tipo plano técnico */}
            <svg className="absolute inset-0 w-full h-full opacity-40" preserveAspectRatio="none">
              <line x1="58%" y1="6%" x2="94%" y2="1%" stroke="#2dd4bf" strokeWidth="1" />
              <line x1="3%" y1="70%" x2="20%" y2="94%" stroke="#2dd4bf" strokeWidth="1" />
              <circle cx="94%" cy="1%" r="2.5" fill="#2dd4bf" />
              <circle cx="20%" cy="94%" r="2.5" fill="#2dd4bf" />
            </svg>

            {/* Cuadrícula catastral */}
            <div
              className="absolute left-[8%] top-[14%] grid grid-cols-3 gap-[3px]"
              style={{ width: "46%", height: "60%", transform: "rotate(-6deg) skewX(-10deg)" }}
            >
              {PARCELAS.map((n, i) => (
                <div
                  key={n}
                  className="flex items-end p-2 text-[11px] font-mono border rounded-[2px]"
                  style={{
                    borderColor: "rgba(45, 212, 191, 0.45)",
                    color: "rgba(148, 163, 184, 0.85)",
                    background: i === 4
                      ? "linear-gradient(135deg, rgba(45,212,191,0.5), rgba(20,184,166,0.15))"
                      : "rgba(45,212,191,0.04)",
                    boxShadow: i === 4 ? "0 0 18px rgba(45,212,191,0.35)" : undefined,
                  }}
                >
                  {n}
                </div>
              ))}
            </div>

            {/* Pin con halo */}
            <div className="absolute" style={{ left: "29%", top: "36%" }}>
              <div
                className="absolute -inset-3 rounded-full"
                style={{ background: "radial-gradient(circle, rgba(45,212,191,0.45), transparent 70%)", filter: "blur(2px)" }}
              />
              <MapPin size={34} className="relative text-brand-primary drop-shadow-lg" style={{ fill: "rgba(45,212,191,0.35)" }} />
            </div>

            {/* Tarjeta "Resolución" flotante */}
            <div
              className="absolute right-[6%] top-[10%] w-52 rounded-xl border p-4 shadow-2xl"
              style={{ backgroundColor: "rgba(10,20,36,0.88)", borderColor: "rgba(45,212,191,0.3)" }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-md flex items-center justify-center bg-brand-primary/20">
                  <Building2 size={14} className="text-brand-primary" />
                </div>
                <span className="text-xs font-bold text-brand-primary tracking-wide">RESOLUCIÓN</span>
              </div>
              <div className="space-y-1.5">
                {[100, 90, 75, 95, 60].map((w, i) => (
                  <div key={i} className="h-1.5 rounded-full bg-slate-700" style={{ width: `${w}%` }} />
                ))}
              </div>
              <div className="flex items-center justify-between mt-4">
                <svg width="44" height="18" viewBox="0 0 44 18">
                  <path d="M2 14 Q9 2 16 12 T29 9 T42 4" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <div className="relative w-7 h-7 rounded-full flex items-center justify-center" style={{ border: "2px dashed rgba(45,212,191,0.6)" }}>
                  <div className="w-5 h-5 rounded-full border-2 border-brand-primary flex items-center justify-center">
                    <CheckCircle2 size={12} className="text-brand-primary" />
                  </div>
                </div>
              </div>
            </div>

            {/* Plataforma + casa esquemática */}
            <svg className="absolute bottom-[8%] right-[10%] opacity-70" width="170" height="120" viewBox="0 0 170 120">
              <ellipse cx="85" cy="100" rx="78" ry="14" fill="none" stroke="#2dd4bf" strokeOpacity="0.25" />
              <polyline points="20,68 85,22 150,68" fill="none" stroke="#2dd4bf" strokeWidth="1.5" />
              <rect x="38" y="68" width="94" height="36" fill="none" stroke="#2dd4bf" strokeWidth="1.5" />
              <rect x="58" y="78" width="18" height="26" fill="none" stroke="#2dd4bf" strokeWidth="1.5" />
              <rect x="92" y="78" width="18" height="16" fill="none" stroke="#2dd4bf" strokeWidth="1.5" />
            </svg>
          </div>

          {/* Tarjetas de features */}
          <div className="grid grid-cols-3 gap-4">
            {FEATURES.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="rounded-xl border p-4 text-center" style={{ backgroundColor: "#0e1a2e", borderColor: "#1e2c44" }}>
                <div className="w-10 h-10 rounded-full border-2 border-brand-primary flex items-center justify-center mx-auto mb-2.5">
                  <Icon size={18} className="text-brand-primary" />
                </div>
                <p className="text-sm font-semibold text-slate-100">{label}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Pie de página de ancho completo ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 lg:px-6 pb-5 max-w-[1600px] mx-auto w-full text-xs text-slate-500">
        <div className="flex items-center gap-2.5 rounded-xl border px-4 py-3" style={{ backgroundColor: "#0e1a2e", borderColor: "#1e2c44" }}>
          <ShieldCheck size={20} className="text-brand-primary shrink-0" />
          <div className="text-left">
            <p className="font-medium text-slate-300">Sistema seguro</p>
            <p>Tus datos están protegidos bajo estándares de seguridad</p>
          </div>
        </div>
        <span className="hidden sm:inline">Conservación Catastral 2026</span>
        <span className="flex items-center gap-1.5">
          Versión 1.0.0
          <span className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
          En línea
        </span>
      </div>
    </div>
  );
}
