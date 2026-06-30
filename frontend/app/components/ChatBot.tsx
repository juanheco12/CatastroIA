"use client";

import { useState, useRef, useEffect } from "react";
import { enviarMensajeChat, ChatMessage } from "@/lib/api";
import { Send, Bot, User, Sparkles, RotateCcw, FileText, ArrowRight } from "lucide-react";
import { TipoMutacion, TipoOrigen, LABEL_MUTACION, LABEL_ORIGEN } from "./MutationSelector";
import clsx from "clsx";

interface UIMessage extends ChatMessage {
  sugerencia?: { tipo_mutacion: TipoMutacion; tipo_origen: TipoOrigen } | null;
}

const PREGUNTAS_RAPIDAS = [
  "¿Qué documentos se necesitan para una mutación de primera clase?",
  "¿Cuál es la diferencia entre rectificación y complementación?",
  "¿Cuándo se aplica una mutación de tercera clase?",
  "¿Qué artículos aplican para una mutación de oficio?",
  "¿Qué es la interrelación catastro-registro?",
  "¿Cuáles son los recursos contra un acto catastral?",
];

function BubbleUser({ text }: { text: string }) {
  return (
    <div className="flex justify-end gap-2">
      <div className="max-w-[80%] bg-brand-primary text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm leading-relaxed">
        {text}
      </div>
      <div className="w-7 h-7 rounded-full bg-brand-primary/20 flex items-center justify-center shrink-0 mt-0.5">
        <User size={14} className="text-brand-primary" />
      </div>
    </div>
  );
}

function BubbleBot({ text, loading }: { text: string; loading?: boolean }) {
  return (
    <div className="flex gap-2">
      <div className="w-7 h-7 rounded-full bg-teal-500/15 border border-teal-500/30 flex items-center justify-center shrink-0 mt-0.5">
        <Bot size={14} className="text-brand-primary" />
      </div>
      <div className="max-w-[80%] card px-4 py-2.5 text-sm leading-relaxed text-slate-200 rounded-2xl rounded-tl-sm">
        {loading ? (
          <span className="flex items-center gap-2 text-slate-400">
            <span className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </span>
            Consultando normativa...
          </span>
        ) : (
          <span className="whitespace-pre-wrap">{text}</span>
        )}
      </div>
    </div>
  );
}

interface Props {
  onSugerirMotivada?: (tipoMutacion: TipoMutacion, tipoOrigen: TipoOrigen, contexto: string) => void;
}

const CHAT_STORAGE_KEY = "catia-chat-history";

function cargarHistorialGuardado(): UIMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export default function ChatBot({ onSugerirMotivada }: Props) {
  const [messages,  setMessages]  = useState<UIMessage[]>(cargarHistorialGuardado);
  const [input,     setInput]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  const send = async (texto: string) => {
    const trimmed = texto.trim();
    if (!trimmed || loading) return;
    setInput("");
    const userMsg: UIMessage = { role: "user", content: trimmed };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setLoading(true);
    try {
      const res = await enviarMensajeChat(trimmed, messages);
      setMessages([...newHistory, {
        role: "assistant",
        content: res.respuesta,
        sugerencia: res.sugerencia as UIMessage["sugerencia"],
      }]);
    } catch {
      setMessages([...newHistory, {
        role: "assistant",
        content: "Error al conectar con el servidor. Verifica que el backend esté corriendo.",
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] min-h-[500px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: "var(--text)" }}>
            <Sparkles size={18} className="text-brand-primary" />
            Asistente Catastral
          </h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            Resuelve dudas sobre normativa catastral colombiana — Res. 1040/2023 · Dec. 1170/2015
          </p>
        </div>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={() => { setMessages([]); localStorage.removeItem(CHAT_STORAGE_KEY); }}
            className="btn-ghost text-xs"
          >
            <RotateCcw size={13} />Nueva consulta
          </button>
        )}
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-4">
        {messages.length === 0 ? (
          <div className="py-8">
            {/* Welcome */}
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mx-auto mb-3">
                <Bot size={28} className="text-brand-primary" />
              </div>
              <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                Hola, soy el Asistente Catastral
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                Pregúntame sobre procedimientos, normativa y trámites catastrales de Colombia
              </p>
            </div>

            {/* Quick questions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PREGUNTAS_RAPIDAS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => send(q)}
                  className="text-left text-xs p-3 rounded-xl border transition-all hover:border-brand-primary/50 hover:bg-teal-500/5"
                  style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((m, i) => (
              <div key={i}>
                {m.role === "user"
                  ? <BubbleUser text={m.content} />
                  : <BubbleBot  text={m.content} />}
                {m.role === "assistant" && m.sugerencia && (
                  <div className="pl-9 mt-2">
                    <div
                      className="rounded-xl border p-3.5 flex items-center gap-3 transition-all hover:border-brand-primary/60"
                      style={{ borderColor: "rgba(20,184,166,0.35)", background: "rgba(20,184,166,0.06)" }}
                    >
                      <div className="w-9 h-9 rounded-lg bg-teal-500/15 flex items-center justify-center shrink-0">
                        <FileText size={16} className="text-brand-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>Análisis completo</p>
                        <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>
                          {LABEL_MUTACION[m.sugerencia.tipo_mutacion]} · {LABEL_ORIGEN[m.sugerencia.tipo_origen]}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onSugerirMotivada?.(m.sugerencia!.tipo_mutacion, m.sugerencia!.tipo_origen, m.content)}
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-brand-primary text-white hover:bg-teal-600 transition-all shrink-0"
                      >
                        Generar motivada
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {loading && <BubbleBot text="" loading />}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="relative">
        <textarea
          ref={inputRef}
          rows={2}
          className="field-input pr-12 resize-none text-sm"
          placeholder="Escribe tu pregunta sobre catastro... (Enter para enviar)"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />
        <button
          type="button"
          onClick={() => send(input)}
          disabled={!input.trim() || loading}
          className={clsx(
            "absolute right-3 bottom-3 w-8 h-8 rounded-lg flex items-center justify-center transition-all",
            input.trim() && !loading
              ? "bg-brand-primary hover:bg-teal-600 text-white"
              : "bg-slate-700 text-slate-500 cursor-not-allowed"
          )}
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}
