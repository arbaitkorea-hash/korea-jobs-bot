"use client";

import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import { parseTags } from "@/lib/utils";

/**
 * Редактор ключевых слов / хэштегов. Внутри — обычная строка через запятую
 * (так же хранится в БД), снаружи — привычные «чипсы» с крестиком.
 */
export function TagInput({
  value,
  onChange,
  placeholder,
  prefix = "",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** "#" для хэштегов — добавляется автоматически, вводить не нужно. */
  prefix?: string;
}) {
  const [draft, setDraft] = useState("");
  const tags = parseTags(value);

  function commit(raw: string) {
    const cleaned = raw
      .split(",")
      .map((t) => t.trim().replace(/^#/, ""))
      .filter(Boolean);
    if (cleaned.length === 0) return;

    const next = [...tags];
    for (const tag of cleaned) {
      if (!next.some((t) => t.toLowerCase() === tag.toLowerCase())) next.push(tag);
    }
    onChange(next.join(", "));
    setDraft("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit(draft);
    } else if (e.key === "Backspace" && !draft && tags.length > 0) {
      onChange(tags.slice(0, -1).join(", "));
    }
  }

  return (
    <div className="mt-1 rounded border border-border bg-bg-elevated px-2 py-2">
      {tags.length > 0 && (
        <ul className="mb-2 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <li
              key={tag}
              className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs"
            >
              {prefix}
              {tag}
              <button
                type="button"
                onClick={() => onChange(tags.filter((t) => t !== tag).join(", "))}
                aria-label={`Удалить ${tag}`}
                className="text-fg-muted hover:text-danger"
              >
                <X size={11} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => commit(draft)}
        placeholder={placeholder}
        className="w-full bg-transparent px-1 py-1 text-sm outline-none"
      />
    </div>
  );
}
