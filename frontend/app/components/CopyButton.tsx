"use client";

import { useState } from "react";
import { Copy, CheckCircle } from "lucide-react";
import clsx from "clsx";

interface CopyButtonProps {
  getText: () => string;
  label: string;
}

export default function CopyButton({ getText, label }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const handle = async () => {
    try {
      await navigator.clipboard.writeText(getText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Portapapeles no disponible (contexto no seguro o permiso denegado);
      // no hay nada más que hacer aquí, el usuario puede seleccionar el texto a mano.
    }
  };
  return (
    <button type="button" onClick={handle}
      className={clsx(
        "w-full justify-center py-3.5 rounded-xl font-bold text-base flex items-center gap-3 transition-all duration-300",
        copied
          ? "bg-emerald-600 text-white"
          : "bg-brand-primary hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20"
      )}>
      {copied ? <><CheckCircle size={20} />¡Copiado!</> : <><Copy size={20} />{label}</>}
    </button>
  );
}
