from flask import Flask, request, redirect, Response
import aiosqlite
import sqlite3
import os
import functools

app = Flask(__name__)

DB_PATH = 'jobs.db'
ADMIN_LOGIN = os.getenv('ADMIN_LOGIN', 'admin')
ADMIN_PASSWORD = os.getenv('ADMIN_PASSWORD', 'korea2024')

def check_auth(username, password):
    return username == ADMIN_LOGIN and password == ADMIN_PASSWORD

def requires_auth(f):
    @functools.wraps(f)
    def decorated(*args, **kwargs):
        auth = request.authorization
        if not auth or not check_auth(auth.username, auth.password):
            return Response('Введите логин и пароль', 401,
                {'WWW-Authenticate': 'Basic realm="Admin"'})
        return f(*args, **kwargs)
    return decorated

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

HTML = '''<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>KoreaJob — Админка</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,sans-serif;background:#f0f2f5;padding:20px}
h1{color:#1a1a2e;margin-bottom:20px;font-size:1.5em}
.stats{display:flex;gap:15px;margin-bottom:25px;flex-wrap:wrap}
.stat{background:white;padding:15px 20px;border-radius:10px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,0.1);flex:1;min-width:120px}
.stat .num{font-size:2em;font-weight:bold;color:#2196F3}
.stat .label{color:#666;font-size:0.85em;margin-top:4px}
.form-box{background:white;padding:20px;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,0.1);margin-bottom:25px}
.form-box h2{margin-bottom:15px;color:#333;font-size:1.1em}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.full{grid-column:1/-1}
label{display:block;font-size:0.8em;color:#666;margin-bottom:4px}
input,select,textarea{width:100%;padding:9px;border:1px solid #ddd;border-radius:6px;font-size:0.9em}
textarea{min-height:70px;resize:vertical}
.btn{padding:10px 20px;border:none;border-radius:6px;cursor:pointer;font-size:0.9em;font-weight:bold}
.btn-add{background:#4CAF50;color:white;margin-top:10px}
.btn-del{background:#f44336;color:white;padding:5px 10px;font-size:0.8em}
.btn-toggle{background:#FF9800;color:white;padding:5px 10px;font-size:0.8em}
table{width:100%;background:white;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,0.1);border-collapse:collapse}
th{background:#1a1a2e;color:white;padding:10px;text-align:left;font-size:0.85em}
td{padding:9px 10px;border-bottom:1px solid #f0f0f0;font-size:0.85em;vertical-align:middle}
tr:hover{background:#f9f9f9}
.badge{padding:2px 8px;border-radius:10px;font-size:0.75em;font-weight:bold}
.on{background:#e8f5e9;color:#4CAF50}
.off{background:#ffebee;color:#f44336}
.actions{display:flex;gap:5px}
@media(max-width:600px){.grid{grid-template-columns:1fr}.stats{flex-direction:column}}
</style>
</head>
<body>
<h1>🇰🇷 KoreaJob — Панель управления</h1>

<div class="stats">
  <div class="stat"><div class="num">{{v}}</div><div class="label">Активных вакансий</div></div>
  <div class="stat"><div class="num">{{u}}</div><div class="label">Пользователей</div></div>
  <div class="stat"><div class="num">{{p}}</div><div class="label">Покупок</div></div>
  <div class="stat"><div class="num">{{p*5000}} ₩</div><div class="label">Выручка</div></div>
</div>

<div class="form-box">
  <h2>➕ Добавить вакансию</h2>
  <form method="POST" action="/add">
    <div class="grid">
      <div><label>Город *</label>
        <select name="city" required>
          <option>Хвасон</option><option>Пхёнтэк</option><option>Сеул</option>
          <option>Инчхон</option><option>Асан</option><option>Другой</option>
        </select></div>
      <div><label>Тип работы *</label>
        <input type="text" name="job_type" placeholder="Завод / Склад / Сварка..." required></div>
      <div><label>Зарплата *</label>
        <input type="text" name="salary" placeholder="3 500 000 вон" required></div>
      <div><label>График</label>
        <input type="text" name="schedule" placeholder="5/2 день/ночь"></div>
      <div><label>Телефон</label>
        <input type="text" name="contact_phone" placeholder="+82-10-..."></div>
      <div><label>KakaoTalk ID</label>
        <input type="text" name="contact_kakao"></div>
      <div><label>Telegram</label>
        <input type="text" name="contact_tg" placeholder="@username"></div>
      <div><label>Жильё</label>
        <select name="has_housing">
          <option value="0">Нет</option>
          <option value="1">Есть</option>
        </select></div>
      <div class="full"><label>Описание</label>
        <textarea name="description" placeholder="Подробное описание..."></textarea></div>
    </div>
    <button type="submit" class="btn btn-add">✅ Добавить вакансию</button>
  </form>
</div>

<table>
  <thead><tr>
    <th>#</th><th>Город</th><th>Работа</th><th>Зарплата</th>
    <th>Жильё</th><th>Статус</th><th>Действия</th>
  </tr></thead>
  <tbody>
    {{rows}}
  </tbody>
</table>
</body></html>'''

def render_row(v):
    status = '<span class="badge on">Активна</span>' if v['is_active'] else '<span class="badge off">Скрыта</span>'
    housing = '✅' if v['has_housing'] else '❌'
    toggle_text = 'Скрыть' if v['is_active'] else 'Показать'
    return f'''<tr>
      <td>{v['id']}</td>
      <td>{v['city']}</td>
      <td>{v['job_type']}</td>
      <td>{v['salary']}</td>
      <td>{housing}</td>
      <td>{status}</td>
      <td><div class="actions">
        <form method="POST" action="/toggle/{v['id']}"><button class="btn btn-toggle">{toggle_text}</button></form>
        <form method="POST" action="/delete/{v['id']}" onsubmit="return confirm('Удалить?')"><button class="btn btn-del">Удалить</button></form>
      </div></td>
    </tr>'''

@app.route('/')
@requires_auth
def index():
    db = get_db()
    vacancies = db.execute('SELECT * FROM vacancies ORDER BY created_at DESC').fetchall()
    v = db.execute('SELECT COUNT(*) FROM vacancies WHERE is_active=1').fetchone()[0]
    u = db.execute('SELECT COUNT(*) FROM users').fetchone()[0]
    p = db.execute('SELECT COUNT(*) FROM purchases').fetchone()[0]
    rows = ''.join(render_row(dict(vac)) for vac in vacancies)
    html = HTML.replace('{{v}}', str(v)).replace('{{u}}', str(u)).replace('{{p}}', str(p)).replace('{{p*5000}}', str(p*5000)).replace('{{rows}}', rows)
    return html

@app.route('/add', methods=['POST'])
@requires_auth
def add():
    db = get_db()
    db.execute('''INSERT INTO vacancies (city,job_type,salary,schedule,has_housing,foreigner_ok,description,contact_phone,contact_kakao,contact_tg)
        VALUES (?,?,?,?,?,1,?,?,?,?)''', (
        request.form['city'], request.form['job_type'], request.form['salary'],
        request.form.get('schedule'), request.form.get('has_housing', 0),
        request.form.get('description'), request.form.get('contact_phone'),
        request.form.get('contact_kakao'), request.form.get('contact_tg')
    ))
    db.commit()
    return redirect('/')

@app.route('/delete/<int:vid>', methods=['POST'])
@requires_auth
def delete(vid):
    db = get_db()
    db.execute('DELETE FROM vacancies WHERE id=?', (vid,))
    db.commit()
    return redirect('/')

@app.route('/toggle/<int:vid>', methods=['POST'])
@requires_auth
def toggle(vid):
    db = get_db()
    db.execute('UPDATE vacancies SET is_active=1-is_active WHERE id=?', (vid,))
    db.commit()
    return redirect('/')

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=False)
