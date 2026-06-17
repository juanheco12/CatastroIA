"""
Unified LLM caller.  Priority: Anthropic → Google Gemini → Groq → None
"""
import json
from pathlib import Path
from config import settings

# Persisted across cold starts (Render free tier sleeps and restarts the
# process, wiping the in-memory cache below, but keeps the disk) so we only
# pay for the genai.list_models() round trip once instead of on every wake-up.
_GEMINI_MODEL_CACHE_FILE = Path(settings.exports_path) / ".gemini_model_cache.json"


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


_gemini_model_name: str | None = None


def _discover_gemini_model() -> str:
    import google.generativeai as genai
    candidates = [
        m.name for m in genai.list_models()
        if "generateContent" in m.supported_generation_methods
    ]
    flash = sorted(
        (c for c in candidates if "flash" in c.lower() and "8b" not in c.lower()),
        reverse=True,
    )
    return (flash or sorted(candidates, reverse=True) or ["models/gemini-1.5-flash"])[0]


def _resolve_gemini_model(force_refresh: bool = False) -> str:
    """
    Model names get renamed/retired by Google over time, so ask the API
    which ones are currently available instead of hardcoding one. The result
    is cached in memory and on disk so repeated calls — and repeated cold
    starts on Render's free tier — skip the extra list_models() round trip.
    """
    global _gemini_model_name
    if force_refresh:
        _gemini_model_name = None
    elif _gemini_model_name:
        return _gemini_model_name
    elif _GEMINI_MODEL_CACHE_FILE.exists():
        try:
            _gemini_model_name = json.loads(_GEMINI_MODEL_CACHE_FILE.read_text())["model"]
            return _gemini_model_name
        except Exception:
            pass

    chosen = _discover_gemini_model()
    _gemini_model_name = chosen
    try:
        _GEMINI_MODEL_CACHE_FILE.write_text(json.dumps({"model": chosen}))
    except Exception:
        pass
    return chosen


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
