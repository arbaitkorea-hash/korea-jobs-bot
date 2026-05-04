import asyncio
import logging
import os
import time
import aiosqlite
from dotenv import load_dotenv
from aiogram import Bot, Dispatcher, Router, F
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.types import (
    Message, CallbackQuery,
    InlineKeyboardMarkup, InlineKeyboardButton,
    ReplyKeyboardMarkup, KeyboardButton
)
from aiogram.filters import CommandStart

load_dotenv()
logging.basicConfig(level=logging.INFO)

BOT_TOKEN = os.getenv('BOT_TOKEN')
DB_PATH = 'jobs.db'

# ==============================
# БАЗА ДАННЫХ
# ==============================
async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute('''CREATE TABLE IF NOT EXISTS vacancies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            city TEXT NOT NULL, job_type TEXT NOT NULL,
            salary TEXT NOT NULL, schedule TEXT,
            has_housing INTEGER DEFAULT 0, foreigner_ok INTEGER DEFAULT 1,
            description TEXT, contact_phone TEXT,
            contact_kakao TEXT, contact_tg TEXT,
            is_active INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')
        await db.execute('''CREATE TABLE IF NOT EXISTS users (
            telegram_id INTEGER PRIMARY KEY, username TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')
        await db.execute('''CREATE TABLE IF NOT EXISTS purchases (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL, vacancy_id INTEGER NOT NULL,
            purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, vacancy_id))''')
        cursor = await db.execute('SELECT COUNT(*) FROM vacancies')
        count = (await cursor.fetchone())[0]
        if count == 0:
            test_vacancies = [
                ('Хвасон','Завод автозапчастей','3 500 000 вон','5/2 день/ночь',1,1,'Работа на конвейере.','+82-10-1234-5678','kakao_hwaseong',None),
                ('Пхёнтэк','Сборочный цех (электроника)','3 200 000 вон','5/2 день',1,1,'Сборка электронных компонентов.','+82-10-2345-6789',None,'@ptjobs'),
                ('Сеул','Склад (Купанг)','2 800 000 вон','5/2 или 4/2',0,1,'Сортировка и упаковка товаров.','+82-10-3456-7890','kakao_seoul_wh',None),
                ('Инчхон','Завод продуктов питания','3 000 000 вон','6/1',1,1,'Упаковка и контроль качества.','+82-10-4567-8901',None,'@incheon_food'),
                ('Асан','Металлообработка (сварка)','3 800 000 вон','5/2',1,1,'Сварочные работы. Опыт приветствуется.','+82-10-5678-9012','kakao_asan_metal',None),
            ]
            await db.executemany('''INSERT INTO vacancies
                (city,job_type,salary,schedule,has_housing,foreigner_ok,description,contact_phone,contact_kakao,contact_tg)
                VALUES (?,?,?,?,?,?,?,?,?,?)''', test_vacancies)
        await db.commit()

async def get_vacancies(city=None):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        if city and city != 'Все':
            cursor = await db.execute('SELECT * FROM vacancies WHERE is_active=1 AND city=? ORDER BY created_at DESC', (city,))
        else:
            cursor = await db.execute('SELECT * FROM vacancies WHERE is_active=1 ORDER BY created_at DESC')
        return [dict(r) for r in await cursor.fetchall()]

async def get_vacancy(vid):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute('SELECT * FROM vacancies WHERE id=?', (vid,))
        row = await cursor.fetchone()
        return dict(row) if row else None

async def register_user(tid, username=None):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute('INSERT OR IGNORE INTO users (telegram_id, username) VALUES (?,?)', (tid, username))
        await db.commit()

async def has_purchased(uid, vid):
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute('SELECT 1 FROM purchases WHERE user_id=? AND vacancy_id=?', (uid, vid))
        return await cursor.fetchone() is not None

async def add_purchase(uid, vid):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute('INSERT OR IGNORE INTO purchases (user_id, vacancy_id) VALUES (?,?)', (uid, vid))
        await db.commit()

async def get_purchases(uid):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute('''SELECT v.* FROM vacancies v
            JOIN purchases p ON v.id=p.vacancy_id WHERE p.user_id=?
            ORDER BY p.purchased_at DESC''', (uid,))
        return [dict(r) for r in await cursor.fetchall()]

# ==============================
# КЛАВИАТУРЫ
# ==============================
def main_menu():
    return ReplyKeyboardMarkup(keyboard=[
        [KeyboardButton(text='📋 Смотреть вакансии')],
        [KeyboardButton(text='📌 Мои покупки'), KeyboardButton(text='ℹ️ О сервисе')],
    ], resize_keyboard=True)

def cities_keyboard():
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text='🗺️ Все города', callback_data='city_Все')],
        [InlineKeyboardButton(text='Сеул', callback_data='city_Сеул'), InlineKeyboardButton(text='Хвасон', callback_data='city_Хвасон')],
        [InlineKeyboardButton(text='Пхёнтэк', callback_data='city_Пхёнтэк'), InlineKeyboardButton(text='Инчхон', callback_data='city_Инчхон')],
        [InlineKeyboardButton(text='Асан', callback_data='city_Асан'), InlineKeyboardButton(text='Другой', callback_data='city_Другой')],
    ])

def vacancies_list_keyboard(vacancies, page=0, city='Все'):
    buttons = [[InlineKeyboardButton(text=f"{v['city']} | {v['job_type']} | {v['salary']}", callback_data=f"vac_{v['id']}")] for v in vacancies]
    nav = []
    if page > 0:
        nav.append(InlineKeyboardButton(text='◀️ Назад', callback_data=f'page_{city}_{page-1}'))
    nav.append(InlineKeyboardButton(text='🔍 Сменить город', callback_data='change_city'))
    if len(vacancies) == 5:
        nav.append(InlineKeyboardButton(text='Вперёд ▶️', callback_data=f'page_{city}_{page+1}'))
    if nav:
        buttons.append(nav)
    return InlineKeyboardMarkup(inline_keyboard=buttons)

def vacancy_card_keyboard(vid, purchased=False):
    if purchased:
        return InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text='📞 Показать контакты', callback_data=f'contacts_{vid}')],
            [InlineKeyboardButton(text='◀️ К списку', callback_data='back_to_list')],
        ])
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text='💳 Получить контакты — 5 000 вон', callback_data=f'buy_{vid}')],
        [InlineKeyboardButton(text='◀️ К списку', callback_data='back_to_list')],
    ])

def confirm_payment_keyboard(vid):
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text='✅ Подтвердить оплату', callback_data=f'confirm_{vid}')],
        [InlineKeyboardButton(text='❌ Отмена', callback_data=f'vac_{vid}')],
    ])

# ==============================
# ХЭНДЛЕРЫ
# ==============================
router = Router()
flood_storage = {}
user_city_filter = {}
user_vacancies_cache = {}

def is_flood(uid):
    now = time.time()
    if now - flood_storage.get(uid, 0) < 1.5:
        return True
    flood_storage[uid] = now
    return False

def format_contacts(v, uid):
    lines = [f'📞 <b>Контакты работодателя</b>', f'🔐 <i>Выдано пользователю #{uid}</i>\n']
    if v.get('contact_phone'): lines.append(f'📱 Телефон: <code>{v["contact_phone"]}</code>')
    if v.get('contact_kakao'): lines.append(f'💬 KakaoTalk: <code>{v["contact_kakao"]}</code>')
    if v.get('contact_tg'): lines.append(f'✈️ Telegram: {v["contact_tg"]}')
    lines.append(f'\n📍 {v["city"]} — {v["job_type"]}')
    lines.append(f'\n⚠️ <i>Передача контактов третьим лицам запрещена.</i>')
    return '\n'.join(lines)

def format_vacancy(v):
    return (f"📍 <b>{v['city']}</b> — {v['job_type']}\n\n"
            f"💰 Зарплата: <b>{v['salary']}</b>\n"
            f"🕐 График: {v.get('schedule') or 'не указан'}\n"
            f"🏠 Жильё: {'✅ Есть' if v.get('has_housing') else '❌ Нет'}\n"
            f"🌍 Иностранцы: {'✅ Да' if v.get('foreigner_ok') else '⚠️ Уточняйте'}\n\n"
            f"{v.get('description') or ''}\n\n"
            f"🔒 <i>Контакты скрыты. Стоимость: 5 000 вон.</i>")

@router.message(CommandStart())
async def cmd_start(message: Message):
    await register_user(message.from_user.id, message.from_user.username)
    await message.answer('👋 Привет! Я помогу найти работу в Корее.\n\nИспользуй кнопки ниже:', reply_markup=main_menu())

@router.message(F.text == '📋 Смотреть вакансии')
async def show_cities(message: Message):
    if is_flood(message.from_user.id): return
    await message.answer('🗺️ Выбери город:', reply_markup=cities_keyboard())

@router.callback_query(F.data.startswith('city_'))
async def select_city(callback: CallbackQuery):
    if is_flood(callback.from_user.id):
        await callback.answer('Не так быстро!')
        return
    city = callback.data.replace('city_', '')
    user_city_filter[callback.from_user.id] = city
    vacancies = await get_vacancies(city if city != 'Все' else None)
    user_vacancies_cache[callback.from_user.id] = vacancies
    if not vacancies:
        await callback.message.edit_text(f'😔 По городу <b>{city}</b> вакансий нет.', reply_markup=cities_keyboard())
        await callback.answer()
        return
    await callback.message.edit_text(f'📋 Найдено: <b>{len(vacancies)}</b>\n\nВыбери вакансию:', reply_markup=vacancies_list_keyboard(vacancies[:5], 0, city))
    await callback.answer()

@router.callback_query(F.data == 'change_city')
async def change_city(callback: CallbackQuery):
    await callback.message.edit_text('🗺️ Выбери город:', reply_markup=cities_keyboard())
    await callback.answer()

@router.callback_query(F.data == 'back_to_list')
async def back_to_list(callback: CallbackQuery):
    vacancies = user_vacancies_cache.get(callback.from_user.id, [])
    city = user_city_filter.get(callback.from_user.id, 'Все')
    if not vacancies:
        await callback.message.edit_text('🗺️ Выбери город:', reply_markup=cities_keyboard())
    else:
        await callback.message.edit_text(f'📋 Найдено: <b>{len(vacancies)}</b>\n\nВыбери вакансию:', reply_markup=vacancies_list_keyboard(vacancies[:5], 0, city))
    await callback.answer()

@router.callback_query(F.data.startswith('vac_'))
async def show_vacancy(callback: CallbackQuery):
    if is_flood(callback.from_user.id):
        await callback.answer('Подожди...')
        return
    vid = int(callback.data.replace('vac_', ''))
    v = await get_vacancy(vid)
    if not v:
        await callback.answer('Вакансия не найдена', show_alert=True)
        return
    purchased = await has_purchased(callback.from_user.id, vid)
    await callback.message.edit_text(format_vacancy(v), reply_markup=vacancy_card_keyboard(vid, purchased))
    await callback.answer()

@router.callback_query(F.data.startswith('buy_'))
async def buy_contacts(callback: CallbackQuery):
    vid = int(callback.data.replace('buy_', ''))
    if await has_purchased(callback.from_user.id, vid):
        v = await get_vacancy(vid)
        await callback.message.edit_text(format_contacts(v, callback.from_user.id))
        await callback.answer()
        return
    v = await get_vacancy(vid)
    await callback.message.edit_text(
        f'💳 <b>Оплата контактов</b>\n\n📍 {v["city"]} — {v["job_type"]}\n💰 Стоимость: <b>5 000 вон</b>',
        reply_markup=confirm_payment_keyboard(vid))
    await callback.answer()

@router.callback_query(F.data.startswith('confirm_'))
async def confirm_payment(callback: CallbackQuery):
    vid = int(callback.data.replace('confirm_', ''))
    await add_purchase(callback.from_user.id, vid)
    v = await get_vacancy(vid)
    await callback.message.edit_text('✅ <b>Оплата подтверждена!</b>\n\n' + format_contacts(v, callback.from_user.id))
    await callback.answer('Контакты получены!')

@router.callback_query(F.data.startswith('contacts_'))
async def show_contacts(callback: CallbackQuery):
    vid = int(callback.data.replace('contacts_', ''))
    v = await get_vacancy(vid)
    await callback.message.answer(format_contacts(v, callback.from_user.id))
    await callback.answer()

@router.message(F.text == '📌 Мои покупки')
async def my_purchases(message: Message):
    purchases = await get_purchases(message.from_user.id)
    if not purchases:
        await message.answer('У вас пока нет купленных контактов.')
        return
    text = f'📌 <b>Ваши покупки ({len(purchases)}):</b>\n\n'
    for v in purchases:
        text += f'• {v["city"]} — {v["job_type"]} | {v["salary"]}\n'
    await message.answer(text)

@router.message(F.text == 'ℹ️ О сервисе')
async def about(message: Message):
    await message.answer('🇰🇷 <b>KoreaJob AI</b>\n\nСервис для поиска работы в Корее.\n\n✅ Проверенные вакансии\n✅ Прямые контакты\n✅ Фильтр по городам\n\n💰 Стоимость контакта: 5 000 вон')

# ==============================
# ЗАПУСК
# ==============================
async def main():
    if not BOT_TOKEN:
        print('❌ BOT_TOKEN не найден!')
        return
    await init_db()
    bot = Bot(token=BOT_TOKEN, default=DefaultBotProperties(parse_mode=ParseMode.HTML))
    dp = Dispatcher()
    dp.include_router(router)
    print('✅ Бот запущен!')
    await dp.start_polling(bot, drop_pending_updates=True)

if __name__ == '__main__':
    asyncio.run(main())
