"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { CheckCircle, XCircle, RefreshCw, Info } from "lucide-react";

export default function SettingsPanel() {
  const [apiUrl, setApiUrl] = useState(
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"
  );
  const [healthStatus, setHealthStatus] = useState<"ok" | "error" | "checking" | null>(null);

  const checkHealth = async () => {
    setHealthStatus("checking");
    try {
      await api.get("/health");
      setHealthStatus("ok");
    } catch {
      setHealthStatus("error");
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-100">Configuración</h2>
        <p className="text-xs text-slate-500 mt-0.5">Parámetros de conexión y sistema</p>
      </div>

      {/* API Connection */}
      <div className="card p-5 space-y-4">
        <h3 className="section-title">
          <span className="w-2 h-2 rounded-full bg-brand-primary inline-block" />
          Conexión al Backend
        </h3>
        <div>
          <label className="field-label">URL del API</label>
          <input
            className="field-input"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            placeholder="http://localhost:8000"
            readOnly
          />
          <p className="text-xs text-slate-500 mt-1">
            Configurado via <code className="font-mono text-slate-400">NEXT_PUBLIC_API_BASE_URL</code>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={checkHealth} className="btn-ghost text-xs">
            <RefreshCw size={13} className={healthStatus === "checking" ? "animate-spin" : ""} />
            Verificar conexión
          </button>
          {healthStatus === "ok" && (
            <span className="flex items-center gap-1.5 text-xs text-brand-success">
              <CheckCircle size={14} />
              Backend conectado
            </span>
          )}
          {healthStatus === "error" && (
            <span className="flex items-center gap-1.5 text-xs text-brand-danger">
              <XCircle size={14} />
              Sin conexión — verifique que el backend esté corriendo
            </span>
          )}
        </div>
      </div>

      {/* LLM Info */}
      <div className="card p-5 space-y-3">
        <h3 className="section-title">
          <span className="w-2 h-2 rounded-full bg-brand-success inline-block" />
          Modelo de IA
        </h3>
        <dl className="space-y-2 text-sm">
          {[
            ["Proveedor", "Anthropic"],
            ["Modelo", "claude-sonnet-4-6"],
            ["Contexto máx.", "1,500 tokens de salida"],
            ["Prompt sistema", "Especializado en normas IGAC / Resolución 1040"],
          ].map(([k, v]) => (
            <div key={k} className="flex gap-2">
              <dt className="text-slate-500 w-36 shrink-0">{k}</dt>
              <dd className="text-slate-300 font-medium">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-400">
          <Info size={14} className="mt-0.5 shrink-0" />
          La clave API de Anthropic se configura en el archivo <code className="font-mono">.env</code> del backend.
        </div>
      </div>

      {/* How to run */}
      <div className="card p-5 bg-slate-900/50">
        <h3 className="section-title mb-4">
          <span className="w-2 h-2 rounded-full bg-brand-warning inline-block" />
          Inicio rápido
        </h3>
        <div className="space-y-3 text-xs font-mono">
          {[
            { label: "Backend", cmd: "cd backend && uvicorn main:app --reload" },
            { label: "Frontend", cmd: "cd frontend && npm run dev" },
          ].map(({ label, cmd }) => (
            <div key={label}>
              <span className="text-slate-500"># {label}</span>
              <div className="bg-slate-950 rounded-lg px-3 py-2 mt-1 text-emerald-400 border border-slate-800">
                {cmd}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
