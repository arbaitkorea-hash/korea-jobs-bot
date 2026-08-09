"use client";

import { useEffect, useRef } from "react";
import { Bold, Italic, Heading2, List, Link2 } from "lucide-react";

/**
 * Минимальный WYSIWYG на contentEditable + execCommand — достаточно для статей
 * блога (жирный, курсив, заголовки, списки, ссылки). HTML всегда чистится
 * DOMPurify при сохранении (server action) и повторно при рендере на публичной
 * странице — contentEditable сам по себе не источник истины по безопасности.
 */
export function RichTextEditor({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);

  // Наполняем div только один раз при монтировании. Дальше DOM — источник
  // истины: если синхронизировать innerHTML с `value` на каждый ре-рендер,
  // курсор будет прыгать в начало при каждом нажатии клавиши.
  useEffect(() => {
    if (ref.current) ref.current.innerHTML = value;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function exec(command: string, arg?: string) {
    ref.current?.focus();
    document.execCommand(command, false, arg);
    if (ref.current) onChange(ref.current.innerHTML);
  }

  return (
    <div className="rounded border border-border">
      <div className="flex gap-1 border-b border-border p-2">
        <ToolbarButton onClick={() => exec("bold")} label="Жирный"><Bold size={14} /></ToolbarButton>
        <ToolbarButton onClick={() => exec("italic")} label="Курсив"><Italic size={14} /></ToolbarButton>
        <ToolbarButton onClick={() => exec("formatBlock", "H2")} label="Заголовок"><Heading2 size={14} /></ToolbarButton>
        <ToolbarButton onClick={() => exec("insertUnorderedList")} label="Список"><List size={14} /></ToolbarButton>
        <ToolbarButton
          onClick={() => {
            const url = prompt("URL ссылки");
            if (url) exec("createLink", url);
          }}
          label="Ссылка"
        >
          <Link2 size={14} />
        </ToolbarButton>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
        className="prose prose-neutral min-h-[300px] max-w-none px-4 py-3 focus:outline-none"
      />
    </div>
  );
}

function ToolbarButton({ onClick, label, children }: { onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="rounded p-2 text-fg-muted hover:bg-bg-elevated hover:text-fg"
    >
      {children}
    </button>
  );
}
