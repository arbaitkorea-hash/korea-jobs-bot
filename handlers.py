from aiogram import Router, F
from aiogram.types import Message, CallbackQuery
from aiogram.filters import CommandStart
from bot.keyboards import (
    main_menu, cities_keyboard, vacancy_card_keyboard,
    confirm_payment_keyboard, vacancies_list_keyboard
)
from db.database import (
    get_vacancies, get_vacancy, register_user,
    has_purchased, add_purchase
)
import time

router = Router()

user_city_filter = {}
user_vacancies_cache = {}

# ==============================
# ЗАЩИТА ОТ ФЛУДА
# ==============================
flood_storage = {}
FLOOD_LIMIT = 1.5  # секунд между запросами

def is_flood(user_id: int) -> bool:
    now = time.time()
    last = flood_storage.get(user_id, 0)
    if now - last < FLOOD_LIMIT:
        return True
    flood_storage[user_id] = now
    return False

# ==============================
# ФОРМАТИРОВАНИЕ
# ==============================
def format_vacancy_card(v):
    housing = 'Жильё предоставляется' if v['has_housing'] else 'Жильё не предоставляется'
    foreigner = 'Подходит для иностранцев' if v['foreigner_ok'] else 'Уточняйте у работодателя'
    return (
        f"<b>{v['city']}</b>\n"
        f"<b>{v['job_type']}</b>\n\n"
        f"Зарплата: <b>{v['salary']}</b>\n"
        f"График: {v['schedule'] or 'не указан'}\n"
        f"Жильё: {housing}\n"
        f"Иностранцы: {foreigner}\n\n"
        f"{v['description'] or ''}\n\n"
        f"<i>Контакты скрыты. Стоимость: 5 000 вон</i>"
    )

def format_contacts(v, user_id: int):
    tag = f"ID:{user_id}"
    lines = [
        f'<b>Контакты работодателя</b>',
        f'<i>Выдано для пользователя {tag}</i>\n',
    ]
    if v['contact_phone']:
        lines.append(f'Телефон: <code>{v["contact_phone"]}</code>')
    if v['contact_kakao']:
        lines.append(f'KakaoTalk: <code>{v["contact_kakao"]}</code>')
    if v['contact_tg']:
        lines.append(f'Telegram: {v["contact_tg"]}')
    lines.append(f'\n{v["city"]} — {v["job_type"]}')
    lines.append(f'<i>Передача контактов третьим лицам запрещена.</i>')
    return '\n'.join(lines)

# ==============================
# КОМАНДЫ
# ==============================
@router.message(CommandStart())
async def cmd_start(message: Message):
    await register_user(
        message.from_user.id,
        message.from_user.username,
        message.from_user.first_name
    )
    name = message.from_user.first_name or 'друг'
    await message.answer(
        f'Привет, {name}!\n\n'
        f'<b>Работа в Южной Корее</b> — вакансии для иностранцев\n\n'
        f'Заводы, склады, производство.\n'
        f'Вакансии с жильём, без знания корейского.\n\n'
        f'Выбери нужный раздел:',
        reply_markup=main_menu(),
        parse_mode='HTML'
    )

@router.message(F.text.contains('вакансии') | F.text.contains('Вакансии'))
async def show_cities(message: Message):
    if is_flood(message.from_user.id):
        await message.answer('Подожди немного...')
        return
    await message.answer(
        'Выбери город или смотри все вакансии:',
        reply_markup=cities_keyboard()
    )

@router.message(F.text.contains('сервис') | F.text.contains('Сервис'))
async def about(message: Message):
    await message.answer(
        '<b>О сервисе</b>\n\n'
        'Актуальные вакансии для русскоязычных иностранцев в Корее.\n\n'
        'Заводы, склады, производство\n'
        'Вакансии с жильём\n'
        'Без знания корейского\n'
        'Прямые контакты работодателей\n\n'
        'Стоимость одного контакта: <b>5 000 вон</b>\n\n'
        'Вопросы? Напиши: @admin',
        parse_mode='HTML'
    )

@router.message(F.text.contains('покупки') | F.text.contains('Покупки'))
async def my_purchases(message: Message):
    from db.database import DB_PATH
    import aiosqlite
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute('''
            SELECT v.city, v.job_type, v.salary, v.contact_phone, v.contact_kakao, v.contact_tg
            FROM purchased p
            JOIN vacancies v ON p.vacancy_id = v.id
            WHERE p.user_id = ?
            ORDER BY p.purchased_at DESC
        ''', (message.from_user.id,))
        rows = await cursor.fetchall()

    if not rows:
        await message.answer('У тебя пока нет купленных контактов.\n\nНажми «Смотреть вакансии»')
        return

    text = '<b>Твои купленные контакты:</b>\n\n'
    for r in rows:
        text += f'{r["city"]} — {r["job_type"]} ({r["salary"]})\n'
        if r['contact_phone']: text += f'  Тел: {r["contact_phone"]}\n'
        if r['contact_kakao']: text += f'  Kakao: {r["contact_kakao"]}\n'
        if r['contact_tg']: text += f'  TG: {r["contact_tg"]}\n'
        text += '\n'
    await message.answer(text, parse_mode='HTML')

# ==============================
# CALLBACK КНОПКИ
# ==============================
@router.callback_query(F.data.startswith('city_'))
async def filter_by_city(callback: CallbackQuery):
    if is_flood(callback.from_user.id):
        await callback.answer('Подожди немного...')
        return
    city = callback.data.replace('city_', '')
    if city == 'all':
        city = None
    vacancies = await get_vacancies(city)
    user_city_filter[callback.from_user.id] = city
    user_vacancies_cache[callback.from_user.id] = vacancies
    if not vacancies:
        await callback.message.edit_text(
            'Вакансий по этому городу пока нет.\nПопробуй «Все города»',
            reply_markup=cities_keyboard()
        )
        return
    city_label = city if city else 'все города'
    await callback.message.edit_text(
        f'Найдено вакансий: <b>{len(vacancies)}</b> ({city_label})\n\nВыбери вакансию:',
        reply_markup=vacancies_list_keyboard(vacancies, 0),
        parse_mode='HTML'
    )

@router.callback_query(F.data == 'change_city')
async def change_city(callback: CallbackQuery):
    await callback.message.edit_text('Выбери город:', reply_markup=cities_keyboard())

@router.callback_query(F.data == 'back_to_list')
async def back_to_list(callback: CallbackQuery):
    vacancies = user_vacancies_cache.get(callback.from_user.id, [])
    if not vacancies:
        vacancies = await get_vacancies()
        user_vacancies_cache[callback.from_user.id] = vacancies
    await callback.message.edit_text(
        f'Вакансии ({len(vacancies)}):',
        reply_markup=vacancies_list_keyboard(vacancies, 0),
        parse_mode='HTML'
    )

@router.callback_query(F.data.startswith('page_'))
async def paginate(callback: CallbackQuery):
    if is_flood(callback.from_user.id):
        await callback.answer('Подожди немного...')
        return
    page = int(callback.data.replace('page_', ''))
    vacancies = user_vacancies_cache.get(callback.from_user.id, [])
    if not vacancies:
        vacancies = await get_vacancies()
    await callback.message.edit_text(
        f'Вакансии ({len(vacancies)}):',
        reply_markup=vacancies_list_keyboard(vacancies, page),
        parse_mode='HTML'
    )

@router.callback_query(F.data.startswith('vacancy_'))
async def show_vacancy(callback: CallbackQuery):
    if is_flood(callback.from_user.id):
        await callback.answer('Подожди немного...')
        return
    vacancy_id = int(callback.data.replace('vacancy_', ''))
    v = await get_vacancy(vacancy_id)
    if not v:
        await callback.answer('Вакансия не найдена')
        return
    purchased = await has_purchased(callback.from_user.id, vacancy_id)
    await callback.message.edit_text(
        format_vacancy_card(v),
        reply_markup=vacancy_card_keyboard(vacancy_id, purchased),
        parse_mode='HTML'
    )

@router.callback_query(F.data.startswith('buy_'))
async def buy_contacts(callback: CallbackQuery):
    if is_flood(callback.from_user.id):
        await callback.answer('Подожди немного...')
        return
    vacancy_id = int(callback.data.replace('buy_', ''))
    v = await get_vacancy(vacancy_id)
    await callback.message.edit_text(
        f'<b>Оплата контактов</b>\n\n'
        f'Вакансия: {v["city"]} — {v["job_type"]}\n'
        f'Стоимость: <b>5 000 вон</b>\n\n'
        f'Для оплаты напиши администратору: @admin\n'
        f'Укажи: вакансия #{vacancy_id}, {v["city"]}\n\n'
        f'После подтверждения оплаты контакты придут автоматически.',
        reply_markup=confirm_payment_keyboard(vacancy_id),
        parse_mode='HTML'
    )

@router.callback_query(F.data.startswith('confirm_'))
async def confirm_payment(callback: CallbackQuery):
    vacancy_id = int(callback.data.replace('confirm_', ''))
    await add_purchase(callback.from_user.id, vacancy_id)
    v = await get_vacancy(vacancy_id)
    await callback.message.edit_text(
        f'<b>Оплата подтверждена!</b>\n\n{format_contacts(v, callback.from_user.id)}',
        parse_mode='HTML'
    )

@router.callback_query(F.data.startswith('contacts_'))
async def show_contacts(callback: CallbackQuery):
    vacancy_id = int(callback.data.replace('contacts_', ''))
    v = await get_vacancy(vacancy_id)
    await callback.message.answer(
        format_contacts(v, callback.from_user.id),
        parse_mode='HTML'
    )
