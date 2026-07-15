"""The Fable 5 conductor: plans, delegates to specialists, synthesizes."""

from __future__ import annotations

import json
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, field

from .base import call_specialist, get_client
from .config import CONDUCTOR_FALLBACK_BETA, CONDUCTOR_FALLBACKS, CONDUCTOR_MODEL
from .specialists import SPECIALISTS

_SPECIALIST_KEYS = list(SPECIALISTS.keys())

_CONDUCTOR_SYSTEM_PROMPT = (
    "Ты — Дирижёр (Orchestrator) команды ИИ-агентов, которая продвигает "
    "Telegram-бота KoreaJob AI (поиск работы в Корее для русскоязычных "
    "мигрантов, монетизация — платный доступ к контактам работодателя). "
    "В команде: " + ", ".join(f"{SPECIALISTS[k].key} ({SPECIALISTS[k].title})" for k in _SPECIALIST_KEYS) + ". "
    "По бизнес-задаче от пользователя определи, каких специалистов "
    "привлечь и что именно каждому поручить — задавай только тех, кто "
    "реально нужен для этой задачи, не привлекай лишних. Бриф для каждого "
    "специалиста должен быть конкретным и самодостаточным (он не видит "
    "переписку с пользователем, только твой бриф)."
)

_PLAN_SCHEMA = {
    "type": "object",
    "properties": {
        "tasks": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "specialist": {"type": "string", "enum": _SPECIALIST_KEYS},
                    "brief": {"type": "string"},
                },
                "required": ["specialist", "brief"],
                "additionalProperties": False,
            },
        },
    },
    "required": ["tasks"],
    "additionalProperties": False,
}


@dataclass
class OrchestrationResult:
    goal: str
    tasks: list[dict] = field(default_factory=list)
    specialist_outputs: dict[str, str] = field(default_factory=dict)
    final: str = ""

    def to_dict(self) -> dict:
        return {
            "goal": self.goal,
            "tasks": self.tasks,
            "specialist_outputs": self.specialist_outputs,
            "final": self.final,
        }


def _conductor_call(user_message: str, *, structured: bool = False, max_tokens: int = 4000):
    client = get_client()
    kwargs = dict(
        model=CONDUCTOR_MODEL,
        max_tokens=max_tokens,
        betas=[CONDUCTOR_FALLBACK_BETA],
        fallbacks=CONDUCTOR_FALLBACKS,
        system=_CONDUCTOR_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_message}],
    )
    if structured:
        kwargs["output_config"] = {"format": {"type": "json_schema", "schema": _PLAN_SCHEMA}}
    else:
        kwargs["output_config"] = {"effort": "high"}
    return client.beta.messages.create(**kwargs)


def plan(goal: str) -> list[dict]:
    """Ask the conductor which specialists to involve and with what brief."""
    response = _conductor_call(f"Бизнес-задача: {goal}", structured=True)
    if response.stop_reason == "refusal":
        raise RuntimeError("Дирижёр (Fable 5) отказался планировать эту задачу.")
    text = next(block.text for block in response.content if block.type == "text")
    tasks = json.loads(text)["tasks"]
    if not tasks:
        raise RuntimeError("Дирижёр не выбрал ни одного специалиста для этой задачи.")
    return tasks


def dispatch(tasks: list[dict]) -> dict[str, str]:
    """Run every specialist task in parallel and collect their output."""
    results: dict[str, str] = {}
    with ThreadPoolExecutor(max_workers=max(len(tasks), 1)) as pool:
        futures = {
            pool.submit(
                call_specialist,
                SPECIALISTS[task["specialist"]].model,
                SPECIALISTS[task["specialist"]].system_prompt,
                task["brief"],
            ): task["specialist"]
            for task in tasks
        }
        for future in as_completed(futures):
            results[futures[future]] = future.result()
    return results


def synthesize(goal: str, tasks: list[dict], results: dict[str, str]) -> str:
    """Ask the conductor to combine specialist output into one deliverable."""
    briefed = "\n\n".join(
        f"### {SPECIALISTS[key].title} ({key})\n"
        f"Бриф: {next(t['brief'] for t in tasks if t['specialist'] == key)}\n\n"
        f"Результат:\n{output}"
        for key, output in results.items()
    )
    prompt = (
        f"Бизнес-задача: {goal}\n\n"
        f"Материалы от команды:\n\n{briefed}\n\n"
        "Сведи это в единый согласованный план действий: без противоречий "
        "между специалистами, с чёткими следующими шагами и приоритетами. "
        "Если материалы одного специалиста не нужны для итога — не включай их."
    )
    response = _conductor_call(prompt, max_tokens=8000)
    if response.stop_reason == "refusal":
        raise RuntimeError("Дирижёр (Fable 5) отказался сводить результаты.")
    return "".join(block.text for block in response.content if block.type == "text")


def run(goal: str) -> OrchestrationResult:
    """End-to-end: plan -> dispatch to specialists -> synthesize."""
    tasks = plan(goal)
    results = dispatch(tasks)
    final = synthesize(goal, tasks, results)
    return OrchestrationResult(goal=goal, tasks=tasks, specialist_outputs=results, final=final)
