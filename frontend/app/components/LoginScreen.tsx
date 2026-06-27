"use client";

import { useState } from "react";
import {
  ClipboardList, User, Lock, Eye, EyeOff, LogIn, Fingerprint, ShieldCheck,
  MapPin, Building2, CheckCircle2, Zap, Scale,
} from "lucide-react";

interface Props {
  onLogin: (recordar: boolean) => void;
}

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
    <div className="min-h-screen flex items-center justify-center p-4 lg:p-10" style={{ backgroundColor: "#070d1a" }}>
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-10 items-center">
        {/* ── Tarjeta de login ── */}
        <div className="rounded-2xl border p-8 sm:p-10" style={{ backgroundColor: "#0e1a2e", borderColor: "#1e2c44" }}>
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20 mb-5">
              <ClipboardList size={30} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold leading-tight">
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
                  className="w-full bg-[#0a1424] border border-slate-700 rounded-lg pl-10 pr-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
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
                  className="w-full bg-[#0a1424] border border-slate-700 rounded-lg pl-10 pr-10 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
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

            <button type="submit" className="w-full btn-primary justify-center py-3 text-sm">
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
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-slate-700 text-sm font-medium text-slate-300 hover:border-slate-500 hover:text-white transition-all"
            >
              <Fingerprint size={16} />Iniciar con huella
            </button>
          </form>

          <div className="flex items-start gap-2.5 mt-8 text-xs text-slate-500">
            <ShieldCheck size={26} className="text-brand-primary shrink-0" />
            <div>
              <p className="font-medium text-slate-300">Sistema seguro</p>
              <p>Tus datos están protegidos bajo estándares de seguridad</p>
            </div>
          </div>
        </div>

        {/* ── Ilustración decorativa ── */}
        <div className="hidden lg:flex flex-col gap-6">
          <div className="relative rounded-2xl border overflow-hidden p-10" style={{ backgroundColor: "#0e1a2e", borderColor: "#1e2c44", minHeight: 360 }}>
            {/* Cuadrícula catastral */}
            <div
              className="absolute left-10 top-10 grid grid-cols-3 gap-[2px]"
              style={{ width: 280, height: 200, transform: "rotate(-4deg) skewX(-8deg)" }}
            >
              {["00345", "00346", "00347", "00348", "00349", "00350", "00351", "00352"].map((n, i) => (
                <div
                  key={n}
                  className="flex items-end p-1.5 text-[10px] font-mono border"
                  style={{
                    borderColor: "rgba(45, 212, 191, 0.35)",
                    color: "rgba(148, 163, 184, 0.8)",
                    backgroundColor: i === 4 ? "rgba(45, 212, 191, 0.25)" : "transparent",
                  }}
                >
                  {n}
                </div>
              ))}
            </div>
            <MapPin size={30} className="absolute text-brand-primary drop-shadow-lg" style={{ left: 168, top: 92, fill: "rgba(45,212,191,0.3)" }} />

            {/* Tarjeta "Resolución" flotante */}
            <div className="absolute right-6 top-8 w-48 rounded-xl border p-4 shadow-2xl" style={{ backgroundColor: "#0a1424", borderColor: "#1e2c44" }}>
              <div className="flex items-center gap-2 mb-3">
                <Building2 size={16} className="text-brand-primary" />
                <span className="text-xs font-bold text-brand-primary tracking-wide">RESOLUCIÓN</span>
              </div>
              <div className="space-y-1.5">
                {[100, 90, 75, 95, 60].map((w, i) => (
                  <div key={i} className="h-1.5 rounded-full bg-slate-700" style={{ width: `${w}%` }} />
                ))}
              </div>
              <div className="flex items-center justify-between mt-4">
                <svg width="40" height="16" viewBox="0 0 40 16">
                  <path d="M2 12 Q8 2 14 10 T26 8 T38 4" fill="none" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <div className="w-6 h-6 rounded-full border-2 border-brand-primary flex items-center justify-center">
                  <CheckCircle2 size={14} className="text-brand-primary" />
                </div>
              </div>
            </div>

            {/* Casa esquemática */}
            <svg className="absolute bottom-6 right-16 opacity-40" width="120" height="80" viewBox="0 0 120 80">
              <polyline points="10,50 60,15 110,50" fill="none" stroke="#2dd4bf" strokeWidth="1.5" />
              <rect x="25" y="50" width="70" height="28" fill="none" stroke="#2dd4bf" strokeWidth="1.5" />
              <rect x="40" y="58" width="14" height="20" fill="none" stroke="#2dd4bf" strokeWidth="1.5" />
              <rect x="65" y="58" width="14" height="12" fill="none" stroke="#2dd4bf" strokeWidth="1.5" />
            </svg>
          </div>

          {/* Tarjetas de features */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: Zap, label: "Rápido", desc: "Generación inmediata" },
              { icon: CheckCircle2, label: "Preciso", desc: "Validado jurídicamente" },
              { icon: Scale, label: "Normado", desc: "Basado en normativa vigente" },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="rounded-xl border p-4 text-center" style={{ backgroundColor: "#0e1a2e", borderColor: "#1e2c44" }}>
                <Icon size={22} className="text-brand-primary mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-100">{label}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{desc}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>Conservación Catastral 2026</span>
            <span className="flex items-center gap-1.5">
              Versión 1.0.0
              <span className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
              En línea
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
