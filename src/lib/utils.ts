import type { AppLocale } from "@/lib/i18n/config";

type ClassValue = string | number | null | undefined | false | ClassValue[];

export function cn(...inputs: ClassValue[]): string {
  const out: (string | number)[] = [];
  const walk = (value: ClassValue) => {
    if (Array.isArray(value)) {
      value.forEach(walk);
    } else if (value) {
      out.push(value);
    }
  };
  inputs.forEach(walk);
  return out.join(" ");
}

const INTL_LOCALE: Record<AppLocale, string> = {
  ru: "ru-RU",
  en: "en-US",
  ko: "ko-KR",
};

export function formatPrice(cents: number, currency = "KRW", locale: AppLocale = "ru") {
  return new Intl.NumberFormat(INTL_LOCALE[locale], {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "KRW" ? 0 : 2,
  }).format(cents / 100);
}

export function formatDate(date: Date, locale: AppLocale = "ru") {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

/** "масло, пейзаж, закат" → ["масло","пейзаж","закат"] */
export function parseTags(value: string): string[] {
  return value
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}
