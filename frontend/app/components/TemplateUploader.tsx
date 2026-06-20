"use client";

import { useCallback, useEffect, useState } from "react";
import { getTemplateInfo, uploadTemplate, extractErrorMessage } from "@/lib/api";
import { Upload, FileCheck, Tag, AlertCircle, RefreshCw } from "lucide-react";
import clsx from "clsx";

interface TemplateInfo {
  existe: boolean;
  nombre: string;
  campos_detectados: string[];
  tamano_bytes: number;
  fecha_subida?: string;
}

export default function TemplateUploader() {
  const [info, setInfo] = useState<TemplateInfo | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const loadInfo = useCallback(async () => {
    try {
      const data = await getTemplateInfo();
      setInfo(data);
    } catch {
      setInfo({ existe: false, nombre: "", campos_detectados: [], tamano_bytes: 0 });
    }
  }, []);

  useEffect(() => {
    loadInfo();
  }, [loadInfo]);

  const handleFile = async (file: File) => {
    if (!file.name.endsWith(".docx")) {
      setError("Solo se aceptan archivos .docx");
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const result = await uploadTemplate(file);
      setInfo({ ...result, existe: true });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      setError(extractErrorMessage(err, "Error al subir el template"));
    } finally {
      setUploading(false);
    }
  };

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-slate-100">Template Word</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Sube un .docx con marcadores {"{{CAMPO}}"} para personalizar la resolución
        </p>
      </div>

      {/* Drop zone */}
      <label
        className={clsx(
          "flex flex-col items-center justify-center gap-3 p-10 rounded-xl border-2 border-dashed cursor-pointer transition-all",
          dragging
            ? "border-brand-primary bg-blue-500/10"
            : "border-slate-600 hover:border-slate-500 hover:bg-slate-800/50"
        )}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <input
          type="file"
          accept=".docx"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          disabled={uploading}
        />
        {uploading ? (
          <RefreshCw size={32} className="text-brand-primary animate-spin" />
        ) : (
          <Upload size={32} className="text-slate-500" />
        )}
        <div className="text-center">
          <p className="text-sm text-slate-300 font-medium">
            {uploading ? "Procesando template..." : "Arrastra tu template .docx aquí"}
          </p>
          <p className="text-xs text-slate-500 mt-1">o haz clic para seleccionar</p>
        </div>
      </label>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-brand-danger">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-sm text-brand-success">
          <FileCheck size={16} />
          Template cargado correctamente
        </div>
      )}

      {/* Current template info */}
      {info?.existe && (
        <div className="card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <FileCheck size={16} className="text-brand-success" />
            <span className="text-sm font-semibold text-slate-200">{info.nombre}</span>
            <span className="ml-auto text-xs text-slate-500">
              {(info.tamano_bytes / 1024).toFixed(1)} KB
            </span>
          </div>
          {info.fecha_subida && (
            <p className="text-xs text-slate-500">
              Subido: {new Date(info.fecha_subida).toLocaleString("es-CO")}
            </p>
          )}
          {info.campos_detectados.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Tag size={12} />
                Campos detectados ({info.campos_detectados.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {info.campos_detectados.map((campo) => (
                  <span
                    key={campo}
                    className="text-xs font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded"
                  >
                    {`{{${campo}}}`}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Guide */}
      <div className="card p-4 bg-slate-900/50">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Campos disponibles para el template
        </h4>
        <div className="grid grid-cols-2 gap-1 font-mono text-xs">
          {[
            "NUMERO_EXPEDIENTE", "NUMERO_PREDIO", "PROPIETARIO_NOMBRE",
            "TIPO_DOCUMENTO", "NUMERO_DOCUMENTO", "DIRECCION_CONSTRUCCION",
            "MUNICIPIO", "AREA_CONSTRUIDA", "ANIO_CONSTRUCCION",
            "MATERIALES", "INSPECTOR_RESPONSABLE", "MOTIVADA",
            "FECHA_SOLICITUD", "DIA_RESOLUCION", "MES_RESOLUCION", "ANIO_RESOLUCION",
          ].map((c) => (
            <span key={c} className="text-blue-400/70">{`{{${c}}}`}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
