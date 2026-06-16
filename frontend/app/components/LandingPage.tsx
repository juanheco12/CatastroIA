"use client";

import { useState } from "react";
import { Moon, Sun, Sparkles, ChevronRight } from "lucide-react";

interface Props {
  onStart: () => void;
}

export default function LandingPage({ onStart }: Props) {
  const [darkMode, setDarkMode] = useState(true);

  const lightTheme = {
    primary: "#0f766e", primaryLight: "#0d9488", accent: "#10b981",
    bg: "#f8fafc", bgSecondary: "#f1f5f9", text: "#1e293b",
    textLight: "#64748b", border: "#e2e8f0",
  };
  const darkTheme = {
    primary: "#14b8a6", primaryLight: "#2dd4bf", accent: "#34d399",
    bg: "#0f172a", bgSecondary: "#1e293b", text: "#f1f5f9",
    textLight: "#cbd5e1", border: "#334155",
  };
  const colors = darkMode ? darkTheme : lightTheme;

  return (
    <div style={{
      backgroundColor: colors.bg, minHeight: "100vh", display: "flex",
      alignItems: "center", justifyContent: "center",
      fontFamily: '"Segoe UI", "Roboto", sans-serif',
      color: colors.text, overflow: "hidden", position: "relative",
    }}>
      {/* FONDO */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "400px",
        background: `linear-gradient(135deg, ${colors.primary}10 0%, ${colors.accent}10 100%)`,
        zIndex: 0,
      }} />

      {/* TEMA */}
      <button onClick={() => setDarkMode(!darkMode)} style={{
        position: "absolute", top: "24px", right: "24px",
        backgroundColor: colors.bgSecondary, border: `1.5px solid ${colors.border}`,
        width: "44px", height: "44px", borderRadius: "10px", display: "flex",
        alignItems: "center", justifyContent: "center", cursor: "pointer",
        transition: "all 0.3s", zIndex: 10,
      }}>
        {darkMode
          ? <Sun size={20} style={{ color: colors.primary }} />
          : <Moon size={20} style={{ color: colors.primary }} />}
      </button>

      {/* CONTENIDO */}
      <div style={{
        position: "relative", zIndex: 5, maxWidth: "620px",
        padding: "40px 24px", textAlign: "center",
      }}>
        {/* LOGO */}
        <div style={{ fontSize: "56px", marginBottom: "28px", display: "inline-block" }}>📋</div>

        {/* TÍTULO */}
        <h1 style={{
          fontSize: "48px", fontWeight: "600", margin: "0 0 12px 0",
          color: colors.text, textAlign: "center", lineHeight: "1.3",
          letterSpacing: "-0.5px",
        }}>
          Generador de<br />Motivadas Catastrales
        </h1>

        {/* SUBTÍTULO */}
        <p style={{
          fontSize: "16px", color: colors.textLight,
          margin: "0 0 36px 0", lineHeight: "1.5", fontWeight: "400",
        }}>
          Crea motivadas para tus trámites catastrales en segundos
        </p>

        {/* FEATURES */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "40px" }}>
          {/* Rápido */}
          <div style={{
            backgroundColor: colors.bgSecondary, border: `1px solid ${colors.border}`,
            borderRadius: "12px", padding: "24px 16px", textAlign: "center",
          }}>
            <div style={{ height: "36px", marginBottom: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg viewBox="0 0 24 24" width="36" height="36" style={{ stroke: colors.primary, strokeWidth: "2", fill: "none", strokeLinecap: "round", strokeLinejoin: "round", animation: "rayFlash 1.5s ease-in-out infinite" }}>
                <path d="M13 2L3 14h10l-1 8 10-12h-10l1-8z" fill={colors.primary} />
              </svg>
            </div>
            <p style={{ margin: "0 0 4px 0", fontWeight: "600", fontSize: "14px", color: colors.text }}>Rápido</p>
            <p style={{ margin: "0", fontSize: "12px", color: colors.textLight }}>Segundos</p>
          </div>

          {/* Preciso */}
          <div style={{
            backgroundColor: colors.bgSecondary, border: `1px solid ${colors.border}`,
            borderRadius: "12px", padding: "24px 16px", textAlign: "center",
          }}>
            <div style={{ height: "36px", marginBottom: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg viewBox="0 0 24 24" width="40" height="40" style={{ stroke: colors.accent, strokeWidth: "2.2", fill: "none", strokeLinecap: "round", strokeLinejoin: "round" }}>
                <polyline points="4 12 9 17 20 6" style={{ strokeDasharray: "35", strokeDashoffset: "35", animation: "drawCheck 1.5s ease-in-out infinite" }} />
              </svg>
            </div>
            <p style={{ margin: "0 0 4px 0", fontWeight: "600", fontSize: "14px", color: colors.text }}>Preciso</p>
            <p style={{ margin: "0", fontSize: "12px", color: colors.textLight }}>Validado</p>
          </div>

          {/* Legal */}
          <div style={{
            backgroundColor: colors.bgSecondary, border: `1px solid ${colors.border}`,
            borderRadius: "12px", padding: "24px 16px", textAlign: "center",
          }}>
            <div style={{ height: "36px", marginBottom: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg viewBox="0 0 24 24" width="36" height="36" style={{ fill: "none", stroke: colors.primary, strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }}>
                <line x1="6" y1="12" x2="18" y2="12" style={{ stroke: colors.primary, strokeWidth: "2" }} />
                <circle cx="12" cy="12" r="2" style={{ fill: colors.primary }} />
                <g style={{ animation: "scaleLeftPan 2s ease-in-out infinite", transformOrigin: "6px 12px" }}>
                  <rect x="3" y="14" width="6" height="4" rx="0.5" style={{ stroke: colors.primary, strokeWidth: "1.5", fill: "none" }} />
                  <line x1="5" y1="12" x2="5" y2="14" style={{ stroke: colors.primary, strokeWidth: "1.5" }} />
                  <line x1="7" y1="12" x2="7" y2="14" style={{ stroke: colors.primary, strokeWidth: "1.5" }} />
                </g>
                <g style={{ animation: "scaleRightPan 2s ease-in-out infinite", transformOrigin: "18px 12px" }}>
                  <rect x="15" y="18" width="6" height="4" rx="0.5" style={{ stroke: colors.primary, strokeWidth: "1.5", fill: "none" }} />
                  <line x1="17" y1="12" x2="17" y2="18" style={{ stroke: colors.primary, strokeWidth: "1.5" }} />
                  <line x1="19" y1="12" x2="19" y2="18" style={{ stroke: colors.primary, strokeWidth: "1.5" }} />
                </g>
              </svg>
            </div>
            <p style={{ margin: "0 0 4px 0", fontWeight: "600", fontSize: "14px", color: colors.text }}>Legal</p>
            <p style={{ margin: "0", fontSize: "12px", color: colors.textLight }}>Normado</p>
          </div>
        </div>

        {/* BOTÓN */}
        <button onClick={onStart} style={{
          width: "100%", padding: "14px 28px", backgroundColor: colors.primary,
          color: "#fff", border: "none", borderRadius: "10px", fontSize: "16px",
          fontWeight: "600", cursor: "pointer", transition: "all 0.3s",
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: "10px", boxShadow: `0 8px 24px ${colors.primary}30`,
        }}>
          <Sparkles size={18} />
          Comenzar Ahora
          <ChevronRight size={18} />
        </button>

        {/* FOOTER */}
        <div style={{
          marginTop: "48px", paddingTop: "24px",
          borderTop: `1px solid ${colors.border}`,
          fontSize: "13px", color: colors.textLight,
        }}>
          Conservación Catastral 2026
        </div>
      </div>

      <style>{`
        @keyframes rayFlash {
          0%, 100% { opacity: 1; }
          25%, 35% { opacity: 0.3; }
          50%, 60% { opacity: 1; }
          75%, 85% { opacity: 0.3; }
        }
        @keyframes drawCheck {
          0% { stroke-dashoffset: 40; opacity: 0; }
          20% { opacity: 1; }
          100% { stroke-dashoffset: 0; opacity: 1; }
        }
        @keyframes scaleLeftPan {
          0%, 100% { transform: translateY(-2px); }
          50% { transform: translateY(4px); }
        }
        @keyframes scaleRightPan {
          0%, 100% { transform: translateY(6px); }
          50% { transform: translateY(-2px); }
        }
      `}</style>
    </div>
  );
}
