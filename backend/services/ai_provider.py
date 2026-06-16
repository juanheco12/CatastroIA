"""
Unified LLM caller.  Priority: Anthropic → Google Gemini → Groq → None
"""
from config import settings


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


def _call_gemini(messages: list[dict], system: str, max_tokens: int) -> tuple[str, int]:
    import google.generativeai as genai
    genai.configure(api_key=settings.google_api_key)
    model = genai.GenerativeModel(
        "gemini-1.5-flash",
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
    resp = chat.send_message(messages[-1]["content"])
    return resp.text, 0  # Gemini free tier doesn't return token counts reliably


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
