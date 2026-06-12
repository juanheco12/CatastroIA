"use client";

import { useState } from "react";
import { TerceraClaseFormData } from "@/lib/api";
import {
  FileText,
  User,
  Building2,
  CalendarDays,
  ClipboardList,
  Plus,
  Minus,
  Wand2,
} from "lucide-react";
import clsx from "clsx";

const MOCK_DATA: TerceraClaseFormData = {
  numero_expediente: "EXP-2024-00342",
  numero_predio: "05001000200000010001000",
  matricula_inmobiliaria: "001-123456",
  propietario: {
    nombre_completo: "María Fernanda Gómez Restrepo",
    tipo_documento: "CC",
    numero_documento: "43512876",
    direccion: "Cra 45 # 32-10, Medellín",
    telefono: "3104567890",
  },
  construccion: {
    direccion: "Cra 45 # 32-10",
    municipio: "Medellín",
    departamento: "Antioquia",
    area_construida_m2: 95.5,
    descripcion:
      "Vivienda de dos plantas en concreto y mampostería, con tres habitaciones, dos baños, sala-comedor, cocina y garaje cubierto.",
    anio_construccion: 2019,
    numero_pisos: 2,
    materiales_predominantes: "Concreto reforzado y mampostería de ladrillo",
    uso_construccion: "Residencial",
    destino_economico: "Habitacional",
  },
  fecha_solicitud: "2024-03-15",
  fecha_visita_tecnica: "2024-03-22",
  inspector_responsable: "Carlos Andrés Mejía Zapata",
  cargo_inspector: "Profesional Catastral",
  documentos_presentados: [
    "Formulario de solicitud",
    "Copia cédula de ciudadanía",
    "Escritura pública de compraventa",
    "Plano de construcción aprobado",
    "Licencia de construcción",
  ],
  observaciones_tecnicas:
    "La construcción se encuentra en excelentes condiciones estructurales y cumple con los parámetros técnicos establecidos.",
};

const INITIAL_DATA: TerceraClaseFormData = {
  numero_expediente: "",
  numero_predio: "",
  matricula_inmobiliaria: "",
  propietario: {
    nombre_completo: "",
    tipo_documento: "CC",
    numero_documento: "",
    direccion: "",
    telefono: "",
  },
  construccion: {
    direccion: "",
    municipio: "",
    departamento: "Antioquia",
    area_construida_m2: 0,
    descripcion: "",
    anio_construccion: new Date().getFullYear(),
    numero_pisos: 1,
    materiales_predominantes: "",
    uso_construccion: "Residencial",
    destino_economico: "Habitacional",
  },
  fecha_solicitud: new Date().toISOString().split("T")[0],
  fecha_visita_tecnica: "",
  inspector_responsable: "",
  cargo_inspector: "Profesional Catastral",
  documentos_presentados: ["Formulario de solicitud", "Copia del documento de identidad"],
  observaciones_tecnicas: "",
  observaciones_adicionales: "",
};

interface FormBuilderProps {
  onGenerate: (data: TerceraClaseFormData) => void;
  isLoading: boolean;
}

function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-700">
      <Icon size={16} className="text-brand-primary" />
      <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">{title}</h3>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="field-label">
        {label}
        {required && <span className="text-brand-danger ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

export default function FormBuilder({ onGenerate, isLoading }: FormBuilderProps) {
  const [data, setData] = useState<TerceraClaseFormData>(INITIAL_DATA);
  const [newDoc, setNewDoc] = useState("");

  const set = (path: string, value: unknown) => {
    setData((prev) => {
      const next = { ...prev } as Record<string, unknown>;
      const keys = path.split(".");
      let cur: Record<string, unknown> = next;
      for (let i = 0; i < keys.length - 1; i++) {
        cur[keys[i]] = { ...(cur[keys[i]] as Record<string, unknown>) };
        cur = cur[keys[i]] as Record<string, unknown>;
      }
      cur[keys[keys.length - 1]] = value;
      return next as unknown as TerceraClaseFormData;
    });
  };

  const addDoc = () => {
    if (!newDoc.trim()) return;
    setData((p) => ({ ...p, documentos_presentados: [...p.documentos_presentados, newDoc.trim()] }));
    setNewDoc("");
  };

  const removeDoc = (i: number) => {
    setData((p) => ({ ...p, documentos_presentados: p.documentos_presentados.filter((_, idx) => idx !== i) }));
  };

  const inputCls = "field-input";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-100">Mutación Tercera Clase</h2>
          <p className="text-xs text-slate-500 mt-0.5">Incorporación de Construcción – IGAC</p>
        </div>
        <button
          type="button"
          onClick={() => setData(MOCK_DATA)}
          className="btn-ghost text-xs"
        >
          <Wand2 size={14} />
          Cargar datos de prueba
        </button>
      </div>

      {/* Expediente */}
      <div className="card p-5 space-y-4">
        <SectionHeader icon={FileText} title="Identificación del Trámite" />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Número de expediente" required>
            <input
              className={inputCls}
              value={data.numero_expediente}
              onChange={(e) => set("numero_expediente", e.target.value)}
              placeholder="EXP-2024-00342"
            />
          </Field>
          <Field label="Número de predio (código catastral)" required>
            <input
              className={inputCls}
              value={data.numero_predio}
              onChange={(e) => set("numero_predio", e.target.value)}
              placeholder="05001000200000010001000"
            />
          </Field>
          <Field label="Matrícula inmobiliaria">
            <input
              className={inputCls}
              value={data.matricula_inmobiliaria}
              onChange={(e) => set("matricula_inmobiliaria", e.target.value)}
              placeholder="001-123456"
            />
          </Field>
        </div>
      </div>

      {/* Propietario */}
      <div className="card p-5 space-y-4">
        <SectionHeader icon={User} title="Propietario" />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nombre completo" required>
            <input
              className={inputCls}
              value={data.propietario.nombre_completo}
              onChange={(e) => set("propietario.nombre_completo", e.target.value)}
              placeholder="Nombre completo del propietario"
            />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Tipo doc." required>
              <select
                className={inputCls}
                value={data.propietario.tipo_documento}
                onChange={(e) => set("propietario.tipo_documento", e.target.value)}
              >
                {["CC", "NIT", "CE", "PA", "TI"].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field label="Número doc." required>
              <input
                className={inputCls}
                value={data.propietario.numero_documento}
                onChange={(e) => set("propietario.numero_documento", e.target.value)}
                placeholder="12345678"
              />
            </Field>
          </div>
          <Field label="Dirección">
            <input
              className={inputCls}
              value={data.propietario.direccion}
              onChange={(e) => set("propietario.direccion", e.target.value)}
              placeholder="Dirección de contacto"
            />
          </Field>
          <Field label="Teléfono">
            <input
              className={inputCls}
              value={data.propietario.telefono}
              onChange={(e) => set("propietario.telefono", e.target.value)}
              placeholder="3100000000"
            />
          </Field>
        </div>
      </div>

      {/* Construcción */}
      <div className="card p-5 space-y-4">
        <SectionHeader icon={Building2} title="Construcción a Incorporar" />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Dirección del predio" required>
            <input
              className={inputCls}
              value={data.construccion.direccion}
              onChange={(e) => set("construccion.direccion", e.target.value)}
              placeholder="Cra 45 # 32-10"
            />
          </Field>
          <Field label="Municipio" required>
            <input
              className={inputCls}
              value={data.construccion.municipio}
              onChange={(e) => set("construccion.municipio", e.target.value)}
              placeholder="Medellín"
            />
          </Field>
          <Field label="Departamento">
            <input
              className={inputCls}
              value={data.construccion.departamento}
              onChange={(e) => set("construccion.departamento", e.target.value)}
              placeholder="Antioquia"
            />
          </Field>
          <Field label="Área construida (m²)" required>
            <input
              type="number"
              min={1}
              step={0.5}
              className={inputCls}
              value={data.construccion.area_construida_m2 || ""}
              onChange={(e) => set("construccion.area_construida_m2", parseFloat(e.target.value))}
              placeholder="95.5"
            />
          </Field>
          <Field label="Año de construcción" required>
            <input
              type="number"
              min={1900}
              max={2025}
              className={inputCls}
              value={data.construccion.anio_construccion}
              onChange={(e) => set("construccion.anio_construccion", parseInt(e.target.value))}
            />
          </Field>
          <Field label="Número de pisos">
            <input
              type="number"
              min={1}
              className={inputCls}
              value={data.construccion.numero_pisos}
              onChange={(e) => set("construccion.numero_pisos", parseInt(e.target.value))}
            />
          </Field>
          <Field label="Uso de la construcción">
            <select
              className={inputCls}
              value={data.construccion.uso_construccion}
              onChange={(e) => set("construccion.uso_construccion", e.target.value)}
            >
              {["Residencial", "Comercial", "Industrial", "Institucional", "Mixto"].map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </Field>
          <Field label="Destino económico">
            <select
              className={inputCls}
              value={data.construccion.destino_economico}
              onChange={(e) => set("construccion.destino_economico", e.target.value)}
            >
              {["Habitacional", "Comercial", "Industrial", "Dotacional", "Mixto"].map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Materiales predominantes" required>
          <input
            className={inputCls}
            value={data.construccion.materiales_predominantes}
            onChange={(e) => set("construccion.materiales_predominantes", e.target.value)}
            placeholder="Concreto reforzado y mampostería de ladrillo"
          />
        </Field>
        <Field label="Descripción de la construcción" required>
          <textarea
            className={inputCls}
            rows={3}
            value={data.construccion.descripcion}
            onChange={(e) => set("construccion.descripcion", e.target.value)}
            placeholder="Descripción detallada de la edificación..."
          />
        </Field>
      </div>

      {/* Fechas e Inspector */}
      <div className="card p-5 space-y-4">
        <SectionHeader icon={CalendarDays} title="Fechas e Inspector" />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Fecha de solicitud" required>
            <input
              type="date"
              className={inputCls}
              value={data.fecha_solicitud}
              onChange={(e) => set("fecha_solicitud", e.target.value)}
            />
          </Field>
          <Field label="Fecha de visita técnica">
            <input
              type="date"
              className={inputCls}
              value={data.fecha_visita_tecnica}
              onChange={(e) => set("fecha_visita_tecnica", e.target.value)}
            />
          </Field>
          <Field label="Inspector / funcionario responsable" required>
            <input
              className={inputCls}
              value={data.inspector_responsable}
              onChange={(e) => set("inspector_responsable", e.target.value)}
              placeholder="Nombre del inspector"
            />
          </Field>
          <Field label="Cargo del inspector">
            <input
              className={inputCls}
              value={data.cargo_inspector}
              onChange={(e) => set("cargo_inspector", e.target.value)}
              placeholder="Profesional Catastral"
            />
          </Field>
        </div>
      </div>

      {/* Documentos */}
      <div className="card p-5 space-y-4">
        <SectionHeader icon={ClipboardList} title="Documentos Presentados" />
        <div className="space-y-2">
          {data.documentos_presentados.map((doc, i) => (
            <div key={i} className="flex items-center gap-2 group">
              <span className="flex-1 text-sm text-slate-300 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
                {doc}
              </span>
              <button
                type="button"
                onClick={() => removeDoc(i)}
                className="opacity-0 group-hover:opacity-100 p-1 text-brand-danger hover:bg-red-500/10 rounded transition-all"
              >
                <Minus size={14} />
              </button>
            </div>
          ))}
          <div className="flex gap-2">
            <input
              className={clsx(inputCls, "flex-1")}
              value={newDoc}
              onChange={(e) => setNewDoc(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addDoc())}
              placeholder="Agregar documento..."
            />
            <button type="button" onClick={addDoc} className="btn-ghost px-3">
              <Plus size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Observaciones */}
      <div className="card p-5 space-y-4">
        <SectionHeader icon={ClipboardList} title="Observaciones" />
        <Field label="Observaciones técnicas">
          <textarea
            className={inputCls}
            rows={3}
            value={data.observaciones_tecnicas}
            onChange={(e) => set("observaciones_tecnicas", e.target.value)}
            placeholder="Condiciones técnicas observadas en la visita..."
          />
        </Field>
        <Field label="Observaciones adicionales">
          <textarea
            className={inputCls}
            rows={2}
            value={data.observaciones_adicionales}
            onChange={(e) => set("observaciones_adicionales", e.target.value)}
            placeholder="Notas adicionales relevantes..."
          />
        </Field>
      </div>

      {/* Submit */}
      <button
        type="button"
        onClick={() => onGenerate(data)}
        disabled={isLoading || !data.numero_expediente || !data.propietario.nombre_completo}
        className="btn-primary w-full justify-center py-3 text-base"
      >
        {isLoading ? (
          <>
            <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            Generando con Claude Sonnet...
          </>
        ) : (
          <>
            <Wand2 size={18} />
            Generar Motivada con IA
          </>
        )}
      </button>
    </div>
  );
}
