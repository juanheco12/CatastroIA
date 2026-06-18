"use client";

import { useState } from "react";
import {
  buscarPlantillasPorFiltros, buscarPlantillaSemantica,
  PlantillaInfo, ResultadoBusqueda, BusquedaSemanticaResponse,
  CATEGORIAS_MOTIVADA, labelCategoria,
} from "@/lib/api";
import { Search, Sparkles, AlertCircle, Star, FileSearch, ListFilter } from "lucide-react";
import clsx from "clsx";

interface BibliotecaBuscadorProps {
  onSeleccionar: (plantilla: PlantillaInfo) => void;
}

export default function BibliotecaBuscador({ onSeleccionar }: BibliotecaBuscadorProps) {
  const [modo, setModo] = useState<"filtros" | "semantica">("semantica");

  // Modo filtros
  const [categoriaFiltro, setCategoriaFiltro] = useState("");
  const [keyword, setKeyword] = useState("");
  const [tipoTramite, setTipoTramite] = useState("");
  const [resultadosFiltro, setResultadosFiltro] = useState<PlantillaInfo[] | null>(null);

  // Modo semantica
  const [descripcion, setDescripcion] = useState("");
  const [categoriaSemantica, setCategoriaSemantica] = useState("");
  const [resultadoSemantico, setResultadoSemantico] = useState<BusquedaSemanticaResponse | null>(null);

  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBuscarFiltros = async () => {
    setBuscando(true);
    setError(null);
    try {
      const res = await buscarPlantillasPorFiltros({
        categoria: categoriaFiltro || undefined,
        keyword: keyword || undefined,
        tipo_tramite: tipoTramite || undefined,
      });
      setResultadosFiltro(res);
    } catch {
      setError("Error al buscar plantillas.");
    } finally {
      setBuscando(false);
    }
  };

  const handleBuscarSemantica = async () => {
    if (!descripcion.trim()) {
      setError("Describe brevemente el caso para buscar por similitud.");
      return;
    }
    setBuscando(true);
    setError(null);
    setResultadoSemantico(null);
    try {
      const res = await buscarPlantillaSemantica(descripcion, categoriaSemantica || undefined);
      setResultadoSemantico(res);
    } catch {
      setError("Error al buscar por similitud semántica.");
    } finally {
      setBuscando(false);
    }
  };

  const renderResultado = (r: ResultadoBusqueda, destacado = false, mostrarScore = true) => (
    <button
      key={r.plantilla.id}
      type="button"
      onClick={() => onSeleccionar(r.plantilla)}
      className={clsx(
        "w-full text-left p-3.5 rounded-xl border transition-all space-y-1.5",
        destacado ? "border-brand-primary bg-teal-500/5" : "hover:bg-slate-800/30"
      )}
      style={{ borderColor: destacado ? undefined : "var(--border)" }}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>{r.plantilla.nombre_original}</p>
        {r.plantilla.es_favorita && <Star size={13} className="text-amber-400 shrink-0" fill="currentColor" />}
      </div>
      <div className="flex items-center gap-2 text-xs flex-wrap" style={{ color: "var(--text-muted)" }}>
        <span>{labelCategoria(r.plantilla.categoria)}</span>
        {r.plantilla.tipo_tramite_manual && <span>· {r.plantilla.tipo_tramite_manual}</span>}
        <span>· usada {r.plantilla.contador_uso}x</span>
        {mostrarScore && <span className="ml-auto font-mono">{(r.score * 100).toFixed(0)}% similitud</span>}
      </div>
      {r.razon && <p className="text-xs italic" style={{ color: "var(--text-muted)" }}>{r.razon}</p>}
    </button>
  );

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>Buscar plantilla para un caso nuevo</h2>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
          Encuentra la motivada activa más parecida al caso que vas a tramitar. El texto jurídico nunca
          se reescribe — solo se sustituyen los datos variables que confirmes después.
        </p>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setModo("semantica")}
          className={clsx("flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all",
            modo === "semantica" ? "border-brand-primary bg-teal-500/10 text-brand-primary" : "btn-ghost")}
        >
          <Sparkles size={13} />Por descripción del caso
        </button>
        <button
          type="button"
          onClick={() => setModo("filtros")}
          className={clsx("flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all",
            modo === "filtros" ? "border-brand-primary bg-teal-500/10 text-brand-primary" : "btn-ghost")}
        >
          <ListFilter size={13} />Por filtros
        </button>
      </div>

      {modo === "semantica" && (
        <div className="space-y-3">
          <div>
            <label className="field-label">Describe el caso (libre)</label>
            <textarea
              className="field-input min-h-24"
              placeholder="Ej: Mutación de segunda clase por compraventa, predio urbano, el comprador aporta escritura nueva y solicita actualización de propietario..."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
          </div>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="field-label">Categoría (opcional, acota la búsqueda)</label>
              <select className="field-input" value={categoriaSemantica} onChange={(e) => setCategoriaSemantica(e.target.value)}>
                <option value="">Todas las categorías</option>
                {CATEGORIAS_MOTIVADA.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <button type="button" onClick={handleBuscarSemantica} disabled={buscando} className="btn-primary">
              <Search size={15} />{buscando ? "Buscando..." : "Buscar"}
            </button>
          </div>

          {resultadoSemantico && (
            <div className="space-y-3 pt-2">
              {!resultadoSemantico.encontrado ? (
                <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-sm text-amber-300">
                  <AlertCircle size={16} />
                  {resultadoSemantico.mensaje ?? "No se encontró una plantilla suficientemente parecida a este caso."}
                </div>
              ) : (
                <>
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                    Mejor coincidencia
                  </p>
                  {resultadoSemantico.mejor && renderResultado(resultadoSemantico.mejor, true)}
                </>
              )}
              {resultadoSemantico.alternativas.length > 0 && (
                <>
                  <p className="text-xs font-semibold uppercase tracking-wider pt-1" style={{ color: "var(--text-muted)" }}>
                    Alternativas
                  </p>
                  <div className="space-y-2">{resultadoSemantico.alternativas.map((r) => renderResultado(r))}</div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {modo === "filtros" && (
        <div className="space-y-3">
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="field-label">Categoría</label>
              <select className="field-input" value={categoriaFiltro} onChange={(e) => setCategoriaFiltro(e.target.value)}>
                <option value="">Todas</option>
                {CATEGORIAS_MOTIVADA.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">Palabra clave</label>
              <input className="field-input" placeholder="Ej: predio urbano" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
            </div>
            <div>
              <label className="field-label">Tipo de trámite</label>
              <input className="field-input" placeholder="Ej: Propietario" value={tipoTramite} onChange={(e) => setTipoTramite(e.target.value)} />
            </div>
          </div>
          <button type="button" onClick={handleBuscarFiltros} disabled={buscando} className="btn-primary">
            <Search size={15} />{buscando ? "Buscando..." : "Buscar"}
          </button>

          {resultadosFiltro && (
            <div className="space-y-2 pt-2">
              {resultadosFiltro.length === 0 ? (
                <div className="flex items-center gap-2 py-8 justify-center" style={{ color: "var(--text-muted)" }}>
                  <FileSearch size={18} />
                  <span className="text-sm">Sin resultados para estos filtros.</span>
                </div>
              ) : (
                resultadosFiltro.map((p) => renderResultado({ plantilla: p, score: 0 }, false, false))
              )}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-brand-danger">
          <AlertCircle size={16} />{error}
        </div>
      )}
    </div>
  );
}