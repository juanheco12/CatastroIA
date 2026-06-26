"""
Unified LLM caller.  Priority: Anthropic → Google Gemini → Groq → None
"""
import json
from pathlib import Path
from typing import Callable
from config import settings


def _make_model_resolver(cache_filename: str, discover_fn: Callable[[], str]) -> Callable[..., str]:
    """
    Model names get renamed/retired by Google over time, so ask the API which
    ones are currently available instead of hardcoding one. The result is
    cached in memory and on disk — persisted across cold starts (Render free
    tier wipes the in-memory cache on every sleep/wake, but keeps the disk) —
    so repeated calls skip the extra list_models() round trip.
    """
    cache_file = Path(settings.exports_path) / cache_filename
    state: dict[str, str | None] = {"name": None}

    def resolver(force_refresh: bool = False) -> str:
        if force_refresh:
            state["name"] = None
        elif state["name"]:
            return state["name"]
        elif cache_file.exists():
            try:
                state["name"] = json.loads(cache_file.read_text())["model"]
                return state["name"]
            except Exception:
                pass

        chosen = discover_fn()
        state["name"] = chosen
        try:
            cache_file.write_text(json.dumps({"model": chosen}))
        except Exception:
            pass
        return chosen

    return resolver


def _call_anthropic(messages: list[dict], system: str, max_tokens: int) -> tuple[str, int]:
    import anthropic
    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    r = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=max_tokens,
        system=system,
        messages=messages,
    )
    return r.content[0].text, r.usage.input_tokens + r.usage.output_tokens


_TAGS_INESTABLES = ("thinking", "exp", "preview", "8b")


def _discover_gemini_model() -> str:
    import google.generativeai as genai
    candidates = [
        m.name for m in genai.list_models()
        if "generateContent" in m.supported_generation_methods
    ]

    def _flash_sin_tags(tags: tuple[str, ...]) -> list[str]:
        return sorted(
            (c for c in candidates if "flash" in c.lower() and not any(t in c.lower() for t in tags)),
            reverse=True,
        )

    # Las variantes "thinking"/"exp"/"preview" responden mucho mas lento (razonan
    # de mas) y tienen cuotas de la API muchisimo mas bajas que el modelo estable
    # — preferirlas por ordenar despues alfabeticamente causaba respuestas lentas
    # y errores de cuota en horas de uso concurrido. Se prueba primero la lista
    # estable; solo si no hay ninguna disponible se cae a la version permisiva.
    flash = _flash_sin_tags(_TAGS_INESTABLES) or _flash_sin_tags(("8b",))
    return (flash or sorted(candidates, reverse=True) or ["models/gemini-1.5-flash"])[0]


_resolve_gemini_model = _make_model_resolver(".gemini_model_cache_v2.json", _discover_gemini_model)


def _discover_gemini_embed_model() -> str:
    import google.generativeai as genai
    candidates = [
        m.name for m in genai.list_models()
        if "embedContent" in m.supported_generation_methods
    ]
    preferido = sorted(c for c in candidates if "text-embedding" in c.lower())
    return (preferido or sorted(candidates) or ["models/text-embedding-004"])[0]


_resolve_gemini_embed_model = _make_model_resolver(".gemini_embed_model_cache.json", _discover_gemini_embed_model)


def _generate_with_gemini(model_name: str, messages: list[dict], system: str, max_tokens: int) -> str:
    import google.generativeai as genai
    model = genai.GenerativeModel(
        model_name,
        system_instruction=system,
        generation_config={"max_output_tokens": max_tokens},
    )
    # Convert history (all except last message)
    history = [
        {
            "role": "user" if m["role"] == "user" else "model",
            "parts": [m["content"]],
        }
        for m in messages[:-1]
    ]
    chat = model.start_chat(history=history)
    return chat.send_message(messages[-1]["content"]).text


def _call_gemini(messages: list[dict], system: str, max_tokens: int) -> tuple[str, int]:
    import google.generativeai as genai
    genai.configure(api_key=settings.google_api_key)
    try:
        text = _generate_with_gemini(_resolve_gemini_model(), messages, system, max_tokens)
    except Exception:
        # Cached model name may be stale (Google retired it) — rediscover once and retry.
        text = _generate_with_gemini(_resolve_gemini_model(force_refresh=True), messages, system, max_tokens)
    return text, 0  # Gemini free tier doesn't return token counts reliably


EMBEDDING_DIM = 768  # debe coincidir con Vector(768) en models/soporte.py y models/biblioteca.py


def embed_texts(texts: list[str], task_type: str) -> list[list[float]]:
    """
    Embeddings de Gemini para busqueda semantica (RAG). task_type debe ser
    "retrieval_document" al indexar fragmentos o "retrieval_query" al
    embeber la pregunta del usuario — Gemini usa vectores asimetricos segun
    el caso, lo que mejora la calidad de la busqueda.
    """
    import google.generativeai as genai
    genai.configure(api_key=settings.google_api_key)

    def _lote(textos: list[str], model: str) -> list[list[float]]:
        # Modelos nuevos como gemini-embedding-001 devuelven 3072 dimensiones
        # por defecto; se pide explicitamente 768, pero la API no siempre
        # honra output_dimensionality (se ha visto ignorado en llamadas en
        # lote) — se trunca tambien del lado del cliente para que la columna
        # Vector(768) jamas reciba un vector de tamano distinto. Truncar es
        # seguro: es la misma tecnica (Matryoshka) que aplica el parametro
        # output_dimensionality del lado del servidor.
        resultado = genai.embed_content(
            model=model, content=textos, task_type=task_type,
            output_dimensionality=EMBEDDING_DIM,
        )
        return [v[:EMBEDDING_DIM] for v in resultado["embedding"]]

    model = _resolve_gemini_embed_model()
    embeddings: list[list[float]] = []
    TAM_LOTE = 90  # margen bajo el limite de 100 textos por llamada de la API
    for i in range(0, len(texts), TAM_LOTE):
        lote = texts[i:i + TAM_LOTE]
        try:
            embeddings.extend(_lote(lote, model))
        except Exception:
            model = _resolve_gemini_embed_model(force_refresh=True)
            embeddings.extend(_lote(lote, model))
    return embeddings


def _call_groq(messages: list[dict], system: str, max_tokens: int) -> tuple[str, int]:
    from groq import Groq
    client = Groq(api_key=settings.groq_api_key)
    groq_messages = [{"role": "system", "content": system}] + messages
    r = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=groq_messages,
        max_tokens=max_tokens,
    )
    tokens = r.usage.total_tokens if r.usage else 0
    return r.choices[0].message.content, tokens


def call_ai(messages: list[dict], system: str, max_tokens: int = 1024) -> tuple[str, int]:
    """
    Call the first available AI provider.
    Returns (text, tokens_used).
    Raises RuntimeError if no provider is configured.
    """
    if settings.anthropic_api_key:
        return _call_anthropic(messages, system, max_tokens)
    if settings.google_api_key:
        return _call_gemini(messages, system, max_tokens)
    if settings.groq_api_key:
        return _call_groq(messages, system, max_tokens)
    raise RuntimeError("no_provider")


def active_provider() -> str:
    """Returns a human-readable name of the active provider."""
    if settings.anthropic_api_key:
        return "Anthropic Claude"
    if settings.google_api_key:
        return "Google Gemini Flash"
    if settings.groq_api_key:
        return "Groq Llama 3"
    return "demo"
