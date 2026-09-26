# 🌴 VIP-консьерж Нячанг — ИИ-агенты

Агент-Аналитик и база знаний премиального консьерж-сервиса. Работает через меню в терминале.

## Запуск за 3 шага

```bash
cd vip-concierge
pip install -r requirements.txt
cp .env.example .env        # откройте .env и вставьте ANTHROPIC_API_KEY
python main.py
```

Ключ API: https://console.anthropic.com → API Keys.
Калькулятор пакета (пункт 2) и просмотр базы (пункт 6) работают **без ключа**.

## Меню

| Пункт | Что делает | Результат |
|---|---|---|
| 1 | Аудит поставщиков: риски, узкие места, несоответствия VIP-стандарту. Можно подключить отзывы и логи из `inputs/` | `reports/…_audit.md` |
| 2 | Расчёт пакета: себестоимость, цена B2C для гостя, цена B2B для агентств, маржа + текст КП через Claude (по желанию) | `reports/…_package.csv` (открывается в Excel), `…_kp.md` |
| 3 | УТП под запрос гостя: 3 варианта (Комфорт+ / Премиум / Ультра) со строками для калькулятора | `reports/…_usp.md` |
| 4 | Программа пребывания по дням с планом Б (Агент-Планировщик) | `reports/…_plan.md` |
| 5 | Пост для соцсетей (Агент-Контентмейкер) | `reports/…_post.md` |
| 6 | Список всех услуг и их id | в терминале |

Пример ввода для пункта 2:
```
amanoi-villa 5
maybach-transfer 2
cxr-fasttrack-arrival 2
nemo-yacht-sunset 1
```
Количество считается в единицах прайса: ночи, часы, люди или поездки.

## Структура

```
vip-concierge/
├── main.py                  # меню
├── config.py                # модель, сбор консьержа %, комиссия агентствам %, мин. маржа %
├── knowledge_base.py        # загрузка и проверка базы
├── data/                    # база знаний — 5 направлений
│   ├── yachting.json
│   ├── villas_wellness.json
│   ├── transfers_fasttrack.json
│   ├── fine_dining.json
│   └── elite_leisure.json
├── prompts/                 # системные промпты (правятся как обычный текст)
│   ├── analyst.md
│   ├── planner.md
│   └── content.md
├── agents/
│   ├── llm.py               # вызов Claude
│   └── analyst/
│       ├── agent.py         # аудит, КП, УТП
│       └── pricing.py       # расчёт цен и маржи (без ИИ)
├── inputs/                  # сюда кладите отзывы и логи (.txt/.md/.csv/.json)
└── reports/                 # готовые отчёты
```

## Как обновлять базу знаний

Каждая услуга в `data/*.json`:

```json
{
  "id": "amanoi-villa",
  "provider_name": "Amanoi",
  "service_type": "Вилла с бассейном",
  "pricing_b2b": {"amount": 1600, "currency": "USD", "unit": "per_night"},
  "pricing_b2c": {"amount": 2100, "currency": "USD", "unit": "per_night"},
  "price_verified": false,
  "service_standards": ["..."],
  "risk_factors": ["..."]
}
```

- `pricing_b2b` — сколько вы платите партнёру; `pricing_b2c` — розничная цена для гостя.
- `unit`: `per_trip`, `per_night`, `per_hour`, `per_person`, `per_booking`, `per_event`.
- ⚠ **Все цены в базе сейчас примерные** (`price_verified: false`). Замените их на цены из договоров с партнёрами и поставьте `true`.
- Новая услуга — скопируйте блок, поменяйте `id` (он должен быть уникальным). Ошибки в базе показываются при запуске.

## Настройки (`config.py`)

| Параметр | По умолчанию | Смысл |
|---|---|---|
| `CONCIERGE_FEE_PCT` | 10 | сервисный сбор сверх B2C-цены |
| `AGENT_COMMISSION_PCT` | 15 | скидка турагентствам от цены гостя |
| `MIN_MARGIN_PCT` | 20 | ниже этой маржи — предупреждение |
| `CLAUDE_MODEL` (в .env) | `claude-opus-5` | модель |
| `CLAUDE_EFFORT` (в .env) | `high` | глубина анализа: `low` дешевле и быстрее |
