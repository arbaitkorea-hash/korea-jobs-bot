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
