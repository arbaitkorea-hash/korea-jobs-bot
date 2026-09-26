"""Собирает 3D-витрину Дома (web/index.html) из шаблона и данных комнат data/*.json.

Запускайте после изменения цен или партнёров:  python web/build_site.py
"""
import json
import sys
from pathlib import Path

WEB = Path(__file__).parent
sys.path.insert(0, str(WEB.parent))

from knowledge_base import load_rooms  # noqa: E402

# Минимальное число часов для почасовых услуг (яхта Ana Marina — от 4 ч)
MIN_HOURS = {"ana-marina-charter": 4, "helicopter-charter": 1}


def site_data() -> list[dict]:
    """Только то, что можно показывать гостю: без B2B-цен и рисков."""
    rooms = []
    for room in load_rooms():
        rooms.append({
            "room_id": room["room_id"],
            "room_name": room["room_name"],
            "room_description": room["room_description"],
            "providers": [
                {
                    "id": p["id"],
                    "name": p["provider_name"],
                    "service": p["service_type"],
                    "price": p["pricing_b2c"]["amount"],
                    "unit": p["pricing_b2c"]["unit"],
                    "standard": (p.get("service_standards") or [""])[0],
                    **({"min_hours": MIN_HOURS[p["id"]]} if p["id"] in MIN_HOURS else {}),
                }
                for p in room["providers"]
            ],
        })
    return rooms


def main() -> None:
    template = (WEB / "template.html").read_text(encoding="utf-8")
    data = json.dumps(site_data(), ensure_ascii=False)
    out = WEB / "index.html"
    out.write_text(template.replace("__DATA__", data), encoding="utf-8")
    print(f"✅ Витрина собрана: {out}")


if __name__ == "__main__":
    main()
