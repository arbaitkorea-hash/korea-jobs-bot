"""Настройки проекта. Меняйте цифры здесь — код трогать не нужно."""
import os
from pathlib import Path

BASE_DIR = Path(__file__).parent
REPORTS_DIR = BASE_DIR / "reports"
INPUTS_DIR = BASE_DIR / "inputs"


def _load_env() -> None:
    """Подхватывает переменные из файла .env рядом с проектом (если он есть)."""
    env = BASE_DIR / ".env"
    if not env.exists():
        return
    for line in env.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip())


_load_env()

# Модель Claude и глубина анализа (low / medium / high / xhigh / max)
MODEL = os.getenv("CLAUDE_MODEL", "claude-opus-5")
EFFORT = os.getenv("CLAUDE_EFFORT", "high")

# Коммерческие параметры пакета
CONCIERGE_FEE_PCT = 10   # сервисный сбор Дома сверх B2C-цены, %
AGENT_COMMISSION_PCT = 15  # скидка турагентствам от итоговой B2C-цены, %
MIN_MARGIN_PCT = 20      # ниже этой маржи пакет помечается как «низкая маржа», %
