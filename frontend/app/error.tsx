"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "var(--bg)" }}>
      <div className="max-w-md text-center space-y-4">
        <AlertTriangle size={40} className="mx-auto text-amber-400" />
        <h1 className="text-lg font-semibold" style={{ color: "var(--text)" }}>Algo salió mal</h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Puede deberse a que el servidor estaba despertando de un periodo de inactividad.
          Intenta de nuevo en unos segundos.
        </p>
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-medium hover:bg-blue-600 transition-colors"
        >
          <RotateCcw size={15} />
          Reintentar
        </button>
      </div>
    </div>
  );
}
