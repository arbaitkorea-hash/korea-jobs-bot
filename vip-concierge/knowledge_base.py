"""Загрузка и проверка базы знаний из папки data/."""
import json
from pathlib import Path

DATA_DIR = Path(__file__).parent / "data"

REQUIRED_FIELDS = (
    "id",
    "provider_name",
    "service_type",
    "pricing_b2b",
    "pricing_b2c",
    "service_standards",
    "risk_factors",
)


def load_directions() -> list[dict]:
    """Все направления из data/*.json, отсортированные по имени файла."""
    directions = []
    for path in sorted(DATA_DIR.glob("*.json")):
        with path.open(encoding="utf-8") as f:
            directions.append(json.load(f))
    return directions


def all_providers(directions: list[dict] | None = None) -> dict[str, dict]:
    """Плоский словарь {id услуги: услуга} с полем direction_name."""
    directions = directions if directions is not None else load_directions()
    result = {}
    for d in directions:
        for p in d["providers"]:
            result[p["id"]] = {**p, "direction_name": d["direction_name"]}
    return result


def validate(directions: list[dict] | None = None) -> list[str]:
    """Список ошибок в базе. Пустой список — всё в порядке."""
    directions = directions if directions is not None else load_directions()
    errors, seen = [], set()
    for d in directions:
        for p in d.get("providers", []):
            pid = p.get("id", "?")
            for field in REQUIRED_FIELDS:
                if field not in p:
                    errors.append(f"{d.get('direction_id')}/{pid}: нет поля {field}")
            for field in ("pricing_b2b", "pricing_b2c"):
                price = p.get(field, {})
                if not {"amount", "currency", "unit"} <= price.keys():
                    errors.append(f"{pid}: {field} должен содержать amount, currency, unit")
            if pid in seen:
                errors.append(f"{pid}: id повторяется")
            seen.add(pid)
    return errors


def as_context(directions: list[dict] | None = None) -> str:
    """База знаний одним JSON-текстом для передачи агенту."""
    directions = directions if directions is not None else load_directions()
    return json.dumps(directions, ensure_ascii=False, indent=1)
