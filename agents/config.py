"""Model assignments for the agent orchestration system."""

# Conductor — Anthropic's most capable widely released model. Used only for
# planning (splitting a goal into specialist briefs) and synthesis (combining
# their output). Requires 30-day data retention on the org's API key.
CONDUCTOR_MODEL = "claude-fable-5"

# Fable 5 can refuse on policy grounds (stop_reason == "refusal"). Opt into
# the server-side fallback so a refused planning/synthesis call is retried
# automatically on Opus 4.8 within the same request.
CONDUCTOR_FALLBACK_BETA = "server-side-fallback-2026-06-01"
CONDUCTOR_FALLBACKS = [{"model": "claude-opus-4-8"}]

# Specialist tiers.
MODEL_SONNET = "claude-sonnet-5"
MODEL_OPUS = "claude-opus-4-8"

DEFAULT_MAX_TOKENS = 8000
