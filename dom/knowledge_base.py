"""База знаний Дома: каждая комната виллы — отдельный файл в папке data/."""
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


def load_rooms() -> list[dict]:
    """Все комнаты из data/*.json в порядке обхода Дома (по имени файла)."""
    rooms = []
    for path in sorted(DATA_DIR.glob("*.json")):
        with path.open(encoding="utf-8") as f:
            rooms.append(json.load(f))
    return rooms


def all_providers(rooms: list[dict] | None = None) -> dict[str, dict]:
    """Плоский словарь {id услуги: услуга} с полем room_name."""
    rooms = rooms if rooms is not None else load_rooms()
    result = {}
    for room in rooms:
        for p in room["providers"]:
            result[p["id"]] = {**p, "room_name": room["room_name"]}
    return result


def validate(rooms: list[dict] | None = None) -> list[str]:
    """Список ошибок в базе. Пустой список — всё в порядке."""
    rooms = rooms if rooms is not None else load_rooms()
    errors, seen = [], set()
    for room in rooms:
        room_id = room.get("room_id", "?")
        for p in room.get("providers", []):
            pid = p.get("id", "?")
            for field in REQUIRED_FIELDS:
                if field not in p:
                    errors.append(f"{room_id}/{pid}: нет поля {field}")
            for field in ("pricing_b2b", "pricing_b2c"):
                price = p.get(field, {})
                if not {"amount", "currency", "unit"} <= price.keys():
                    errors.append(f"{pid}: {field} должен содержать amount, currency, unit")
            if pid in seen:
                errors.append(f"{pid}: id повторяется")
            seen.add(pid)
    return errors


def as_context(rooms: list[dict] | None = None) -> str:
    """База знаний одним JSON-текстом для передачи агенту."""
    rooms = rooms if rooms is not None else load_rooms()
    return json.dumps(rooms, ensure_ascii=False, indent=1)
