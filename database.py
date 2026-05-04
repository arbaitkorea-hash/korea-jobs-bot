import aiosqlite
import os

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'jobs.db')

async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute('''
            CREATE TABLE IF NOT EXISTS vacancies (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                city TEXT NOT NULL,
                job_type TEXT NOT NULL,
                salary TEXT NOT NULL,
                schedule TEXT,
                has_housing INTEGER DEFAULT 0,
                foreigner_ok INTEGER DEFAULT 1,
                description TEXT,
                contact_phone TEXT,
                contact_kakao TEXT,
                contact_tg TEXT,
                is_active INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        await db.execute('''
            CREATE TABLE IF NOT EXISTS users (
                telegram_id INTEGER PRIMARY KEY,
                username TEXT,
                first_name TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        await db.execute('''
            CREATE TABLE IF NOT EXISTS payments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                vacancy_id INTEGER,
                amount INTEGER DEFAULT 5000,
                status TEXT DEFAULT 'pending',
                paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        await db.execute('''
            CREATE TABLE IF NOT EXISTS purchased (
                user_id INTEGER,
                vacancy_id INTEGER,
                purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (user_id, vacancy_id)
            )
        ''')
        # Добавим тестовые вакансии если база пустая
        count = await db.execute('SELECT COUNT(*) FROM vacancies')
        row = await count.fetchone()
        if row[0] == 0:
            sample_vacancies = [
                ('Хвасон', 'Завод автозапчастей', '3 500 000 вон', 'Ночные смены 12ч', 1, 1,
                 'Упаковка и сортировка автодеталей. Без знания корейского. Обучение на месте.',
                 '+82-10-1234-5678', 'kakao_hwaseong', '@hwaseong_hr'),
                ('Пхёнтэк', 'Склад Samsung', '3 200 000 вон', 'Дневные смены 8ч', 1, 1,
                 'Работа на складе электроники. Лёгкий физический труд. Жильё предоставляется.',
                 '+82-10-2345-6789', 'kakao_pyeongtaek', '@pyeongtaek_jobs'),
                ('Сеул', 'Ресторан / кухня', '2 800 000 вон', '6 дней в неделю', 0, 1,
                 'Помощник повара, мойщик посуды. Питание включено. Центр города.',
                 '+82-10-3456-7890', 'kakao_seoul_rest', '@seoul_kitchen'),
                ('Инчхон', 'Логистический центр', '3 000 000 вон', 'Сменный график', 1, 1,
                 'Погрузка/разгрузка товаров. Работа с техникой. Опыт не нужен.',
                 '+82-10-4567-8901', 'kakao_incheon', '@incheon_logistics'),
                ('Асан', 'Завод Hyundai (поставщик)', '3 700 000 вон', 'Ночные смены', 1, 1,
                 'Сборка автомобильных компонентов. Сверхурочные оплачиваются. Стабильный завод.',
                 '+82-10-5678-9012', 'kakao_asan', '@asan_factory'),
            ]
            await db.executemany('''
                INSERT INTO vacancies 
                (city, job_type, salary, schedule, has_housing, foreigner_ok, description, contact_phone, contact_kakao, contact_tg)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', sample_vacancies)
        await db.commit()

async def get_vacancies(city=None):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        if city and city != 'all':
            cursor = await db.execute(
                'SELECT * FROM vacancies WHERE is_active=1 AND city=? ORDER BY created_at DESC',
                (city,)
            )
        else:
            cursor = await db.execute(
                'SELECT * FROM vacancies WHERE is_active=1 ORDER BY created_at DESC'
            )
        return await cursor.fetchall()

async def get_vacancy(vacancy_id):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute('SELECT * FROM vacancies WHERE id=?', (vacancy_id,))
        return await cursor.fetchone()

async def register_user(telegram_id, username, first_name):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute('''
            INSERT OR IGNORE INTO users (telegram_id, username, first_name)
            VALUES (?, ?, ?)
        ''', (telegram_id, username, first_name))
        await db.commit()

async def has_purchased(user_id, vacancy_id):
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            'SELECT 1 FROM purchased WHERE user_id=? AND vacancy_id=?',
            (user_id, vacancy_id)
        )
        return await cursor.fetchone() is not None

async def add_purchase(user_id, vacancy_id):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            'INSERT OR IGNORE INTO purchased (user_id, vacancy_id) VALUES (?, ?)',
            (user_id, vacancy_id)
        )
        await db.execute(
            'INSERT INTO payments (user_id, vacancy_id, status) VALUES (?, ?, "paid")',
            (user_id, vacancy_id)
        )
        await db.commit()

async def get_stats():
    async with aiosqlite.connect(DB_PATH) as db:
        users = await (await db.execute('SELECT COUNT(*) FROM users')).fetchone()
        vacancies = await (await db.execute('SELECT COUNT(*) FROM vacancies WHERE is_active=1')).fetchone()
        sales = await (await db.execute('SELECT COUNT(*) FROM payments WHERE status="paid"')).fetchone()
        revenue = await (await db.execute('SELECT COUNT(*)*5000 FROM payments WHERE status="paid"')).fetchone()
        return {
            'users': users[0],
            'vacancies': vacancies[0],
            'sales': sales[0],
            'revenue': revenue[0]
        }
