"""Общий вызов Claude для всех агентов."""
import anthropic

import config


class AgentError(Exception):
    """Понятная ошибка для вывода в CLI."""


def ask(system_prompt: str, knowledge: str, user_message: str) -> str:
    """Отправляет запрос агенту и возвращает текст ответа.

    База знаний идёт отдельным блоком system с кэшированием: повторные запросы
    в течение 5 минут читают её из кэша и стоят дешевле.
    """
    client = anthropic.Anthropic()
    system = [
        {"type": "text", "text": system_prompt},
        {
            "type": "text",
            "text": f"<knowledge_base>\n{knowledge}\n</knowledge_base>",
            "cache_control": {"type": "ephemeral"},
        },
    ]
    try:
        with client.beta.messages.stream(
            model=config.MODEL,
            max_tokens=64000,
            system=system,
            messages=[{"role": "user", "content": user_message}],
            thinking={"type": "adaptive"},
            output_config={"effort": config.EFFORT},
            # Если модель отклонит запрос, API сам повторит его на запасной модели
            betas=["server-side-fallback-2026-07-01"],
            fallbacks="default",
        ) as stream:
            response = stream.get_final_message()
    except anthropic.AuthenticationError:
        raise AgentError("Неверный ANTHROPIC_API_KEY. Проверьте файл .env")
    except anthropic.RateLimitError:
        raise AgentError("Превышен лимит запросов. Подождите минуту и повторите")
    except anthropic.APIStatusError as e:
        raise AgentError(f"Ошибка API ({e.status_code}): {e.message}")
    except anthropic.APIConnectionError:
        raise AgentError("Нет соединения с API. Проверьте интернет")
    except TypeError as e:
        if "authentication" not in str(e):
            raise
        raise AgentError("Не найден ANTHROPIC_API_KEY. Создайте файл .env по образцу .env.example")
    except anthropic.AnthropicError as e:
        raise AgentError(f"Не удалось вызвать Claude: {e}. Проверьте ANTHROPIC_API_KEY в .env")

    if response.stop_reason == "refusal":
        raise AgentError("Модель отклонила запрос. Переформулируйте задачу")

    text = "".join(b.text for b in response.content if b.type == "text").strip()
    if response.stop_reason == "max_tokens":
        text += "\n\n_(Ответ обрезан по лимиту длины.)_"
    return text
