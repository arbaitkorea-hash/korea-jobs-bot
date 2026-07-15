# KoreaJob AI — заметки для Claude Code

Telegram-бот для поиска работы в Корее (аудитория — русскоязычные мигранты).
Монетизация: платный доступ к контактам работодателя (5000 вон/вакансия).
Стек: aiogram 3, aiosqlite, python-dotenv. Точка входа — `main.py`
(содержит и БД, и клавиатуры, и хендлеры в одном файле); `app.py`,
`admin.py`, `database.py`, `handlers.py`, `keyboards.py` — более
разложенный вариант той же логики.

## AI-команда маркетинга и контента

В проекте есть два слоя одной команды агентов — дирижёр (Fable 5) +
специалисты (Sonnet/Opus), каждый в своей роли:

| Роль | Модель | Файл |
|---|---|---|
| SEO-специалист | Sonnet | `.claude/agents/seo-specialist.md` |
| Маркетолог | Opus | `.claude/agents/marketer.md` |
| Дизайнер | Opus | `.claude/agents/designer.md` |
| Контент-криейтор | Sonnet | `.claude/agents/content-creator.md` |
| Контент-менеджер | Sonnet | `.claude/agents/content-manager.md` |
| SMM-специалист | Sonnet | `.claude/agents/smm-specialist.md` |

**Слой 1 — внутри Claude Code сессии.** Когда пользователь просит что-то из
маркетинга/контента/SEO/дизайна для этого проекта, действуй как дирижёр:
через инструмент Agent вызывай нужных специалистов (только тех, кто
реально нужен для задачи), независимые задачи — параллельно в одном
сообщении, затем сведи их ответы в один согласованный результат. Не
дублируй их работу самостоятельно.

**Слой 2 — production-оркестратор.** Пакет `agents/` — рабочий Python-код,
который дергает Anthropic API напрямую (дирижёр — `claude-fable-5` с
сервер-сайд fallback на `claude-opus-4-8`, специалисты — те же роли на
`claude-sonnet-5`/`claude-opus-4-8`). Запуск:

```bash
export ANTHROPIC_API_KEY=...  # или ANTHROPIC_AUTH_TOKEN / `ant auth login`
python -m agents.cli "Составь контент-план на неделю для запуска в Пусане"
```

Подробности и структура — в README.md, раздел «AI-оркестрация».
