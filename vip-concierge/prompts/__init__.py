"""Системные промпты агентов. Сами тексты лежат в .md-файлах рядом — их можно править без кода."""
from pathlib import Path

_DIR = Path(__file__).parent


def load_prompt(name: str) -> str:
    return (_DIR / f"{name}.md").read_text(encoding="utf-8").strip()


ANALYST_PROMPT = load_prompt("analyst")
PLANNER_PROMPT = load_prompt("planner")
CONTENT_PROMPT = load_prompt("content")
