"""«Дом» — премиальный консьерж-сервис в Нячанге. Меню персонала Дома.

Запуск:  python main.py
"""
from datetime import datetime

import config
from agents.analyst.pricing import UNIT_NAMES
from agents.analyst import audit_providers, calculate_package, generate_usp, write_proposal
from agents.llm import AgentError, ask
from knowledge_base import all_providers, as_context, load_rooms, validate
from prompts import CONTENT_PROMPT, PLANNER_PROMPT

MENU = """
╔═══════════════════════════════════════════════╗
║                     Д О М                     ║
║        частная вилла · Нячанг · Вьетнам       ║
╚═══════════════════════════════════════════════╝
  Холл · Покои · Обеденный зал · Причал · Терраса

  Управляющий
   1. Обход Дома — аудит партнёров и рисков
   2. Собрать пребывание — цена B2B / B2C и маржа
   3. Предложение гостю — 3 варианта под запрос
  Мажордом
   4. Сценарий пребывания по дням
  Голос Дома
   5. Пост для соцсетей
  ─────────────────────────────────────────────
   6. Комнаты Дома и партнёры
   0. Закрыть дверь"""


def read_multiline(prompt: str) -> str:
    print(f"{prompt} (закончите пустой строкой):")
    lines = []
    while (line := input()).strip():
        lines.append(line)
    return "\n".join(lines)


def save_report(name: str, text: str) -> None:
    path = config.REPORTS_DIR / f"{datetime.now():%Y%m%d_%H%M%S}_{name}.md"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")
    print(f"\n✅ Сохранено: {path.relative_to(config.BASE_DIR)}")


def show_result(name: str, text: str) -> None:
    print("\n" + text)
    save_report(name, text)


def pick_input_file() -> str:
    """Предлагает выбрать файл с отзывами/логами из папки inputs/."""
    files = sorted(p for p in config.INPUTS_DIR.glob("*") if p.suffix in {".txt", ".md", ".csv", ".json"})
    if not files:
        return ""
    print("\nФайлы с отзывами и логами в папке inputs/:")
    for i, f in enumerate(files, 1):
        print(f"  {i}. {f.name}")
    choice = input("Номер файла для анализа (Enter — без файла): ").strip()
    if choice.isdigit() and 1 <= int(choice) <= len(files):
        return files[int(choice) - 1].read_text(encoding="utf-8")
    return ""


def show_rooms() -> None:
    for room in load_rooms():
        print(f"\n■ {room['room_name'].upper()} — {room['direction']}")
        print(f"  {room['room_description']}")
        for p in room["providers"]:
            b2b, b2c = p["pricing_b2b"], p["pricing_b2c"]
            mark = "" if p.get("price_verified") else "  (цена не подтверждена)"
            print(f"    {p['id']:<26} {p['provider_name']:<32} "
                  f"B2B {b2b['amount']:>6} / B2C {b2c['amount']:>6} {b2c['currency']} "
                  f"за {UNIT_NAMES.get(b2c['unit'], b2c['unit'])}{mark}")


def run_package() -> None:
    providers = all_providers()
    print("\nСоберите пребывание гостя из комнат Дома: <id> <количество>")
    print("Количество — в единицах прайса: ночи, часы, люди или поездки.")
    print("Пример:  amanoi-villa 5   |   maybach-transfer 2   |   cxr-fasttrack-arrival 2")
    print("Список id — пункт 6 «Комнаты Дома». Пустая строка — расчёт.")
    items = []
    while line := input("> ").strip():
        parts = line.split()
        if len(parts) != 2 or parts[0] not in providers:
            print("  ✗ Формат: <id> <количество>, id должен быть из базы")
            continue
        try:
            items.append((parts[0], float(parts[1].replace(",", "."))))
        except ValueError:
            print("  ✗ Количество должно быть числом")
    if not items:
        return

    package = calculate_package(items, providers)
    print("\n" + package.as_text())
    csv_path = package.save_csv(
        config.REPORTS_DIR / f"{datetime.now():%Y%m%d_%H%M%S}_package.csv")
    print(f"\n✅ Таблица для Excel: {csv_path.relative_to(config.BASE_DIR)}")

    if input("\nПодготовить приглашение в Дом (текст КП) через Claude? (y/n): ").strip().lower() in {"y", "д", "да"}:
        request = read_multiline("Кратко о госте и его пожеланиях")
        print("\n⏳ Управляющий готовит приглашение...")
        show_result("kp", write_proposal(package, request))


def main() -> None:
    errors = validate()
    if errors:
        print("⚠ Ошибки в описании комнат (data/):")
        for e in errors:
            print("  -", e)

    while True:
        print(MENU)
        choice = input("Выберите пункт: ").strip()
        try:
            if choice == "1":
                extra = pick_input_file()
                print("\n⏳ Управляющий обходит комнаты (1–3 минуты)...")
                show_result("audit", audit_providers(extra))
            elif choice == "2":
                run_package()
            elif choice == "3":
                request = read_multiline("\nОпишите запрос гостя: кто, сколько человек, даты, бюджет, пожелания")
                if request:
                    print("\n⏳ Управляющий готовит предложения...")
                    show_result("usp", generate_usp(request))
            elif choice == "4":
                request = read_multiline("\nЗапрос гостя для программы: даты, рейсы, состав, интересы")
                if request:
                    print("\n⏳ Мажордом составляет сценарий...")
                    show_result("plan", ask(PLANNER_PROMPT, as_context(), request))
            elif choice == "5":
                topic = read_multiline("\nТема поста (например: закатный круиз на яхте для пар)")
                if topic:
                    print("\n⏳ Голос Дома пишет пост...")
                    show_result("post", ask(CONTENT_PROMPT, as_context(), topic))
            elif choice == "6":
                show_rooms()
            elif choice == "0":
                print("\nДом ждёт гостей.")
                break
            else:
                print("Нет такого пункта")
        except AgentError as e:
            print(f"\n✗ {e}")
        except ValueError as e:
            print(f"\n✗ {e}")
        except KeyboardInterrupt:
            print("\n(отменено)")


if __name__ == "__main__":
    try:
        main()
    except (KeyboardInterrupt, EOFError):
        print()
