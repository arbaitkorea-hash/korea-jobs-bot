from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, ReplyKeyboardMarkup, KeyboardButton

def main_menu():
    return ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text='📋 Смотреть вакансии')],
            [KeyboardButton(text='📌 Мои покупки'), KeyboardButton(text='ℹ️ О сервисе')],
        ],
        resize_keyboard=True
    )

def cities_keyboard():
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text='🗺 Все города', callback_data='city_all')],
        [
            InlineKeyboardButton(text='Сеул', callback_data='city_Сеул'),
            InlineKeyboardButton(text='Хвасон', callback_data='city_Хвасон'),
        ],
        [
            InlineKeyboardButton(text='Пхёнтэк', callback_data='city_Пхёнтэк'),
            InlineKeyboardButton(text='Инчхон', callback_data='city_Инчхон'),
        ],
        [
            InlineKeyboardButton(text='Асан', callback_data='city_Асан'),
            InlineKeyboardButton(text='Другой', callback_data='city_all'),
        ],
    ])

def vacancy_card_keyboard(vacancy_id, has_purchased=False):
    if has_purchased:
        return InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text='✅ Контакты получены', callback_data=f'contacts_{vacancy_id}')],
            [InlineKeyboardButton(text='◀️ Назад к списку', callback_data='back_to_list')],
        ])
    else:
        return InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text='📞 Получить контакты — 5 000 вон ⭐', callback_data=f'buy_{vacancy_id}')],
            [InlineKeyboardButton(text='◀️ Назад к списку', callback_data='back_to_list')],
        ])

def confirm_payment_keyboard(vacancy_id):
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text='✅ Я оплатил — выдать контакты', callback_data=f'confirm_{vacancy_id}')],
        [InlineKeyboardButton(text='❌ Отмена', callback_data=f'vacancy_{vacancy_id}')],
    ])

def vacancies_list_keyboard(vacancies, page=0):
    per_page = 5
    start = page * per_page
    end = start + per_page
    current = vacancies[start:end]

    buttons = []
    for v in current:
        housing = '🏠' if v['has_housing'] else '🚫'
        buttons.append([InlineKeyboardButton(
            text=f"📍{v['city']} | {v['job_type']} | {v['salary']} {housing}",
            callback_data=f"vacancy_{v['id']}"
        )])

    nav = []
    if page > 0:
        nav.append(InlineKeyboardButton(text='◀️', callback_data=f'page_{page-1}'))
    if end < len(vacancies):
        nav.append(InlineKeyboardButton(text='▶️', callback_data=f'page_{page+1}'))
    if nav:
        buttons.append(nav)

    buttons.append([InlineKeyboardButton(text='🔍 Сменить город', callback_data='change_city')])
    return InlineKeyboardMarkup(inline_keyboard=buttons)
