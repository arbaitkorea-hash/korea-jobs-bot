# 🇰🇷 Работа в Корее — Telegram Бот

## Быстрый старт

### 1. Создай файл .env
Скопируй `.env.example` в `.env` и заполни:
```
BOT_TOKEN=твой_токен_от_BotFather
ADMIN_ID=твой_telegram_id
```

Узнать свой Telegram ID: напиши боту @userinfobot

### 2. Установка (один раз)
```bash
pip install -r requirements.txt
```

### 3. Запуск бота
```bash
python main.py
```

### 4. Запуск админ-панели (отдельно)
```bash
python admin/app.py
```
Открой браузер: http://localhost:5001

## Структура
```
main.py          — запуск бота
bot/handlers.py  — логика бота
bot/keyboards.py — кнопки
db/database.py   — база данных
admin/app.py     — веб-админка
data/jobs.db     — база данных (создаётся автоматически)
```

## Деплой на Railway
1. Загрузи проект на GitHub
2. Зайди на railway.app
3. New Project → Deploy from GitHub
4. Добавь переменную BOT_TOKEN в настройках

## AI-оркестрация (маркетинг и контент)

Команда ИИ-агентов для продвижения бота: дирижёр (Fable 5) разбивает
задачу на брифы и раздаёт их специалистам (Sonnet/Opus), затем сводит их
ответы в один план.

| Роль | Модель |
|---|---|
| Дирижёр | `claude-fable-5` (fallback на `claude-opus-4-8`) |
| SEO-специалист | `claude-sonnet-5` |
| Маркетолог | `claude-opus-4-8` |
| Дизайнер | `claude-opus-4-8` |
| Контент-криейтор | `claude-sonnet-5` |
| Контент-менеджер | `claude-sonnet-5` |
| SMM-специалист | `claude-sonnet-5` |

### Установка и запуск

```bash
pip install -r requirements.txt
export ANTHROPIC_API_KEY=твой_ключ   # console.anthropic.com
python -m agents.cli "Придумай контент-план на неделю для запуска в Пусане"
python -m agents.cli --json "..." > result.json   # структурированный вывод
```

Структура:
```
agents/config.py       — модели дирижёра и специалистов
agents/base.py         — обёртка над Anthropic Messages API
agents/specialists.py  — роли: system-промпт + модель на каждого
agents/conductor.py    — планирование → параллельный вызов → синтез
agents/cli.py          — CLI-точка входа
```

Для работы внутри Claude Code те же роли доступны как саб-агенты в
`.claude/agents/*.md` — см. `CLAUDE.md`.
