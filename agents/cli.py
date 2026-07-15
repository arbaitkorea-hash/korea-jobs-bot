"""CLI entry point: python -m agents.cli "бизнес-задача"."""

from __future__ import annotations

import argparse
import json
import sys

from dotenv import load_dotenv

from .conductor import run
from .specialists import SPECIALISTS


def main() -> None:
    load_dotenv()
    parser = argparse.ArgumentParser(
        description="Оркестратор ИИ-агентов KoreaJob AI (дирижёр — Fable 5, "
        "специалисты — Sonnet/Opus).",
    )
    parser.add_argument("goal", nargs="?", help="Бизнес-задача (или передай через stdin)")
    parser.add_argument("--json", action="store_true", help="Вывести результат как JSON")
    args = parser.parse_args()

    goal = args.goal or sys.stdin.read().strip()
    if not goal:
        parser.error("Укажи задачу аргументом или подай через stdin.")

    result = run(goal)

    if args.json:
        print(json.dumps(result.to_dict(), ensure_ascii=False, indent=2))
        return

    print("=== ПЛАН ДИРИЖЁРА ===")
    for task in result.tasks:
        title = SPECIALISTS[task["specialist"]].title
        print(f"- {title}: {task['brief']}")

    print("\n=== ОТВЕТЫ СПЕЦИАЛИСТОВ ===")
    for key, output in result.specialist_outputs.items():
        print(f"\n--- {SPECIALISTS[key].title} ---\n{output}")

    print("\n=== ИТОГОВЫЙ ПЛАН ===")
    print(result.final)


if __name__ == "__main__":
    main()
