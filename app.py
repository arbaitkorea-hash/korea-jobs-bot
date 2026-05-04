from flask import Flask, render_template_string, request, redirect
import sqlite3
import os

app = Flask(__name__)
DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'jobs.db')

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

TEMPLATE = '''
<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<title>Админ — Работа в Корее</title>
<style>
  body { font-family: Arial; max-width: 1100px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
  h1 { color: #333; }
  .stats { display: flex; gap: 20px; margin-bottom: 30px; }
  .stat { background: white; padding: 20px; border-radius: 8px; text-align: center; flex: 1; box-shadow: 0 2px 6px rgba(0,0,0,0.1); }
  .stat h2 { margin: 0; font-size: 2em; color: #2196F3; }
  table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 6px rgba(0,0,0,0.1); }
  th { background: #2196F3; color: white; padding: 12px; text-align: left; }
  td { padding: 10px 12px; border-bottom: 1px solid #eee; }
  tr:hover { background: #f9f9f9; }
  .btn { padding: 6px 12px; border: none; border-radius: 4px; cursor: pointer; text-decoration: none; font-size: 13px; }
  .btn-red { background: #f44336; color: white; }
  .btn-blue { background: #2196F3; color: white; }
  .btn-green { background: #4CAF50; color: white; }
  .form-section { background: white; padding: 20px; border-radius: 8px; margin-top: 30px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); }
  input, textarea, select { width: 100%; padding: 8px; margin: 5px 0 15px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
  label { font-weight: bold; font-size: 13px; color: #555; }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .badge { padding: 3px 8px; border-radius: 12px; font-size: 12px; }
  .badge-green { background: #e8f5e9; color: #2e7d32; }
  .badge-red { background: #ffebee; color: #c62828; }
</style>
</head>
<body>
<h1>🇰🇷 Панель администратора</h1>

<div class="stats">
  <div class="stat"><h2>{{ stats.users }}</h2><p>Пользователей</p></div>
  <div class="stat"><h2>{{ stats.vacancies }}</h2><p>Вакансий</p></div>
  <div class="stat"><h2>{{ stats.sales }}</h2><p>Продаж</p></div>
  <div class="stat"><h2>{{ stats.revenue }}</h2><p>₩ Выручка</p></div>
</div>

<h2>📋 Вакансии</h2>
<table>
  <tr>
    <th>#</th><th>Город</th><th>Работа</th><th>Зарплата</th><th>Жильё</th><th>Активна</th><th>Действия</th>
  </tr>
  {% for v in vacancies %}
  <tr>
    <td>{{ v.id }}</td>
    <td>{{ v.city }}</td>
    <td>{{ v.job_type }}</td>
    <td>{{ v.salary }}</td>
    <td>{{ '✅' if v.has_housing else '❌' }}</td>
    <td><span class="badge {{ 'badge-green' if v.is_active else 'badge-red' }}">{{ 'Активна' if v.is_active else 'Скрыта' }}</span></td>
    <td>
      <a href="/toggle/{{ v.id }}" class="btn btn-blue">{{ 'Скрыть' if v.is_active else 'Показать' }}</a>
      <a href="/delete/{{ v.id }}" class="btn btn-red" onclick="return confirm('Удалить?')">Удалить</a>
    </td>
  </tr>
  {% endfor %}
</table>

<div class="form-section">
  <h2>➕ Добавить вакансию</h2>
  <form method="POST" action="/add">
  <div class="grid2">
    <div>
      <label>Город</label>
      <input name="city" placeholder="Хвасон" required>
      <label>Тип работы</label>
      <input name="job_type" placeholder="Завод автозапчастей" required>
      <label>Зарплата</label>
      <input name="salary" placeholder="3 500 000 вон" required>
      <label>График</label>
      <input name="schedule" placeholder="Ночные смены 12ч">
    </div>
    <div>
      <label>Телефон работодателя</label>
      <input name="contact_phone" placeholder="+82-10-1234-5678">
      <label>KakaoTalk ID</label>
      <input name="contact_kakao" placeholder="kakao_id">
      <label>Telegram</label>
      <input name="contact_tg" placeholder="@username">
      <label>Жильё предоставляется</label>
      <select name="has_housing">
        <option value="1">✅ Да</option>
        <option value="0">❌ Нет</option>
      </select>
    </div>
  </div>
  <label>Описание (2–3 строки)</label>
  <textarea name="description" rows="3" placeholder="Описание работы на русском языке"></textarea>
  <button type="submit" class="btn btn-green" style="width:100%;padding:12px;font-size:16px;">➕ Добавить вакансию</button>
  </form>
</div>

</body>
</html>
'''

@app.route('/')
def index():
    db = get_db()
    vacancies = db.execute('SELECT * FROM vacancies ORDER BY created_at DESC').fetchall()
    users = db.execute('SELECT COUNT(*) as c FROM users').fetchone()['c']
    vac_count = db.execute('SELECT COUNT(*) as c FROM vacancies WHERE is_active=1').fetchone()['c']
    sales = db.execute('SELECT COUNT(*) as c FROM payments WHERE status="paid"').fetchone()['c']
    revenue = sales * 5000
    stats = {'users': users, 'vacancies': vac_count, 'sales': sales, 'revenue': f'{revenue:,}'}
    return render_template_string(TEMPLATE, vacancies=vacancies, stats=stats)

@app.route('/add', methods=['POST'])
def add_vacancy():
    db = get_db()
    db.execute('''
        INSERT INTO vacancies (city, job_type, salary, schedule, has_housing, contact_phone, contact_kakao, contact_tg, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        request.form['city'], request.form['job_type'], request.form['salary'],
        request.form.get('schedule'), request.form.get('has_housing', 0),
        request.form.get('contact_phone'), request.form.get('contact_kakao'),
        request.form.get('contact_tg'), request.form.get('description')
    ))
    db.commit()
    return redirect('/')

@app.route('/delete/<int:vid>')
def delete_vacancy(vid):
    db = get_db()
    db.execute('DELETE FROM vacancies WHERE id=?', (vid,))
    db.commit()
    return redirect('/')

@app.route('/toggle/<int:vid>')
def toggle_vacancy(vid):
    db = get_db()
    db.execute('UPDATE vacancies SET is_active = 1 - is_active WHERE id=?', (vid,))
    db.commit()
    return redirect('/')

if __name__ == '__main__':
    app.run(debug=True, port=5001)
