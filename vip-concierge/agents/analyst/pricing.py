"""Расчёт стоимости и маржи пакета.

Цифры считает Python, а не ИИ, поэтому расчёт точный и работает без API-ключа.
"""
import csv
from dataclasses import dataclass, field
from pathlib import Path

import config

UNIT_NAMES = {
    "per_trip": "поездка",
    "per_night": "ночь",
    "per_hour": "час",
    "per_person": "чел.",
    "per_booking": "бронь",
    "per_event": "ивент",
}


@dataclass
class Line:
    provider: str
    service: str
    qty: float
    unit: str
    b2b_unit: float
    b2c_unit: float

    @property
    def cost(self) -> float:
        return self.b2b_unit * self.qty

    @property
    def retail(self) -> float:
        return self.b2c_unit * self.qty


@dataclass
class Package:
    lines: list[Line] = field(default_factory=list)
    currency: str = "USD"
    unverified: list[str] = field(default_factory=list)

    @property
    def cost(self) -> float:
        """Себестоимость: сколько платим партнёрам (B2B-прайсы)."""
        return sum(l.cost for l in self.lines)

    @property
    def retail(self) -> float:
        """Сумма розничных цен партнёров (B2C-прайсы)."""
        return sum(l.retail for l in self.lines)

    @property
    def concierge_fee(self) -> float:
        return self.retail * config.CONCIERGE_FEE_PCT / 100

    @property
    def price_b2c(self) -> float:
        """Цена для прямого гостя."""
        return self.retail + self.concierge_fee

    @property
    def price_b2b(self) -> float:
        """Цена для турагентства (минус агентская комиссия)."""
        return self.price_b2c * (1 - config.AGENT_COMMISSION_PCT / 100)

    @staticmethod
    def _margin_pct(price: float, cost: float) -> float:
        return (price - cost) / price * 100 if price else 0.0

    @property
    def margin_b2c_pct(self) -> float:
        return self._margin_pct(self.price_b2c, self.cost)

    @property
    def margin_b2b_pct(self) -> float:
        return self._margin_pct(self.price_b2b, self.cost)

    def summary_rows(self) -> list[tuple[str, float, str]]:
        return [
            ("Себестоимость (B2B-прайсы партнёров)", self.cost, ""),
            ("Розничная стоимость услуг (B2C-прайсы)", self.retail, ""),
            (f"Сервисный сбор консьержа {config.CONCIERGE_FEE_PCT}%", self.concierge_fee, ""),
            ("ЦЕНА ДЛЯ ГОСТЯ (B2C)", self.price_b2c, f"маржа {self.margin_b2c_pct:.1f}%"),
            (
                f"ЦЕНА ДЛЯ АГЕНТСТВА (B2B, −{config.AGENT_COMMISSION_PCT}%)",
                self.price_b2b,
                f"маржа {self.margin_b2b_pct:.1f}%",
            ),
        ]

    def as_text(self) -> str:
        """Таблица для вывода в терминал и передачи агенту."""
        rows = [f"{'Услуга':<46}{'Кол-во':>12}{'B2B':>10}{'B2C':>10}"]
        for l in self.lines:
            name = f"{l.provider}: {l.service}"[:45]
            qty = f"{l.qty:g} {UNIT_NAMES.get(l.unit, l.unit)}"
            rows.append(f"{name:<46}{qty:>12}{l.cost:>10,.0f}{l.retail:>10,.0f}")
        rows.append("-" * 78)
        for label, value, note in self.summary_rows():
            rows.append(f"{label:<58}{value:>10,.0f} {self.currency}  {note}")
        if self.margin_b2b_pct < config.MIN_MARGIN_PCT:
            rows.append(f"⚠ Маржа B2B ниже {config.MIN_MARGIN_PCT}% — пересмотрите состав или цены")
        if self.unverified:
            rows.append("⚠ Цены не подтверждены партнёром: " + ", ".join(self.unverified))
        return "\n".join(rows)

    def save_csv(self, path: Path) -> Path:
        """CSV открывается в Excel без доработки (кодировка с BOM, разделитель ;)."""
        path.parent.mkdir(parents=True, exist_ok=True)
        with path.open("w", newline="", encoding="utf-8-sig") as f:
            w = csv.writer(f, delimiter=";")
            w.writerow(["Партнёр", "Услуга", "Кол-во", "Ед.", "B2B за ед.", "B2C за ед.",
                        "Себестоимость", "Розница", "Валюта"])
            for l in self.lines:
                w.writerow([l.provider, l.service, f"{l.qty:g}", UNIT_NAMES.get(l.unit, l.unit),
                            l.b2b_unit, l.b2c_unit, round(l.cost, 2), round(l.retail, 2),
                            self.currency])
            w.writerow([])
            for label, value, note in self.summary_rows():
                w.writerow([label, "", "", "", "", "", "", round(value, 2), note])
        return path


def calculate_package(items: list[tuple[str, float]], providers: dict[str, dict]) -> Package:
    """items — список (id услуги, количество единиц: ночей, часов, человек, поездок)."""
    package = Package()
    currencies = set()
    for pid, qty in items:
        if pid not in providers:
            raise ValueError(f"Услуга с id '{pid}' не найдена в базе")
        p = providers[pid]
        b2b, b2c = p["pricing_b2b"], p["pricing_b2c"]
        currencies.update({b2b["currency"], b2c["currency"]})
        package.lines.append(Line(
            provider=p["provider_name"],
            service=p["service_type"],
            qty=qty,
            unit=b2c["unit"],
            b2b_unit=b2b["amount"],
            b2c_unit=b2c["amount"],
        ))
        if not p.get("price_verified", False):
            package.unverified.append(p["provider_name"])
    if len(currencies) > 1:
        raise ValueError(f"В пакете разные валюты: {', '.join(sorted(currencies))}")
    if currencies:
        package.currency = currencies.pop()
    return package
