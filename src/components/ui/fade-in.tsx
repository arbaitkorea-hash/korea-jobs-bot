"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Появление при скролле.
 *
 * Важно: контент НЕ скрыт в серверной разметке. Если бы мы отдавали opacity:0 и
 * ждали JS, то при отключённом или упавшем JS страница осталась бы пустой —
 * а тексты и работы это ровно то, ради чего сюда приходят. Поэтому прячем
 * элемент только после монтирования на клиенте и только если он ещё ниже
 * экрана; всё, что уже видно, показывается сразу и без анимации.
 */
export function FadeIn({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"static" | "hidden" | "visible">("static");

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Уважает системную настройку «уменьшить движение».
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const rect = node.getBoundingClientRect();
    if (rect.top < window.innerHeight) return; // уже на экране — не трогаем

    setState("hidden");

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState("visible");
          observer.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    observer.observe(node);

    // Страховка: если наблюдатель по какой-то причине не сработает, контент
    // всё равно покажется. Невидимые навсегда работы — цена, которую нельзя
    // платить ради анимации.
    const failsafe = window.setTimeout(() => setState("visible"), 4000);

    return () => {
      observer.disconnect();
      window.clearTimeout(failsafe);
    };
  }, []);

  return (
    <div
      ref={ref}
      style={state === "visible" ? { animationDelay: `${delay}ms` } : undefined}
      className={cn(
        state === "hidden" && "opacity-0",
        state === "visible" && "animate-fade-in",
        className,
      )}
    >
      {children}
    </div>
  );
}
