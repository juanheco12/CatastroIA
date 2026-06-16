"use client";

import { useState, useEffect } from "react";
import { Sun, Moon, FileText, Save, Check } from "lucide-react";

type Theme = "dark" | "light";

interface Props {
  theme?: Theme;
  onThemeChange?: (t: Theme) => void;
}

export default function SettingsPanel({ theme: themeProp, onThemeChange }: Props) {
  const [localTheme, setLocalTheme] = useState<Theme>("dark");
  const [template,   setTemplate]   = useState("");
  const [saved,      setSaved]      = useState(false);

  const theme = themeProp ?? localTheme;

  useEffect(() => {
    const tmpl = localStorage.getItem("catia-template") ?? "";
    setTemplate(tmpl);
  }, []);

  const toggleTheme = (t: Theme) => {
    if (onThemeChange) {
      onThemeChange(t);
    } else {
      setLocalTheme(t);
      document.documentElement.setAttribute("data-theme", t);
      localStorage.setItem("catia-theme", t);
    }
  };

  const saveTemplate = () => {
    localStorage.setItem("catia-template", template);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>Ajustes</h2>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Personalización de la aplicación</p>
      </div>

      {/* Tema */}
      <div className="card p-5 space-y-4">
        <h3 className="section-title">
          <Sun size={16} />
          Tema
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {/* Oscuro */}
          <button type="button" onClick={() => toggleTheme("dark")}
            className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
              theme === "dark"
                ? "border-brand-primary bg-teal-500/10"
                : "border-slate-700 hover:border-slate-500"
            }`}>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
              theme === "dark" ? "bg-brand-primary" : "bg-slate-700"
            }`}>
              <Moon size={18} className="text-white" />
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>Oscuro</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Fondo negro azulado</p>
            </div>
          </button>

          {/* Claro */}
          <button type="button" onClick={() => toggleTheme("light")}
            className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
              theme === "light"
                ? "border-brand-primary bg-teal-500/10"
                : "border-slate-700 hover:border-slate-500"
            }`}>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
              theme === "light" ? "bg-brand-primary" : "bg-slate-700"
            }`}>
              <Sun size={18} className="text-white" />
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>Claro</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Fondo blanco</p>
            </div>
          </button>
        </div>
      </div>

      {/* Template */}
      <div className="card p-5 space-y-4">
        <h3 className="section-title">
          <FileText size={16} />
          Template de encabezado
        </h3>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Texto que aparecerá antes de cada motivada generada. Úsalo para agregar el encabezado
          institucional de tu oficina.
        </p>
        <textarea
          className="field-input min-h-[120px] resize-y font-mono text-xs"
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
          placeholder={"REPÚBLICA DE COLOMBIA\nDEPARTAMENTO DE CÓRDOBA\nMUNICIPIO DE MONTERÍA\nOFICINA DE CATASTRO\n\nACTO ADMINISTRATIVO No. ____"}
        />
        <button type="button" onClick={saveTemplate} className="btn-primary text-xs">
          {saved ? <><Check size={14} />Guardado</> : <><Save size={14} />Guardar template</>}
        </button>
      </div>
    </div>
  );
}
