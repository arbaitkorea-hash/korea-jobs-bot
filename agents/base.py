"""Thin wrapper around the Anthropic Messages API used by every agent."""

from __future__ import annotations

import anthropic

from .config import DEFAULT_MAX_TOKENS

_client: anthropic.Anthropic | None = None


def get_client() -> anthropic.Anthropic:
    """Return a lazily-constructed shared Anthropic client.

    Resolves credentials from ANTHROPIC_API_KEY / ANTHROPIC_AUTH_TOKEN /
    an `ant auth login` profile — see the project README for setup.
    """
    global _client
    if _client is None:
        _client = anthropic.Anthropic()
    return _client


def _extract_text(content) -> str:
    return "".join(block.text for block in content if block.type == "text")


def call_specialist(
    model: str,
    system_prompt: str,
    task: str,
    *,
    effort: str = "high",
    max_tokens: int = DEFAULT_MAX_TOKENS,
) -> str:
    """Run one specialist turn (Sonnet/Opus) and return its text output."""
    client = get_client()
    response = client.messages.create(
        model=model,
        max_tokens=max_tokens,
        system=system_prompt,
        thinking={"type": "adaptive"},
        output_config={"effort": effort},
        messages=[{"role": "user", "content": task}],
    )
    if response.stop_reason == "refusal":
        return "[Модель отказалась выполнять эту задачу по соображениям безопасности.]"
    return _extract_text(response.content)
