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

export function formatPrice(cents: number, currency: string = "KRW") {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "KRW" ? 0 : 2,
  }).format(cents / 100);
}
