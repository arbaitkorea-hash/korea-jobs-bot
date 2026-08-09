import { Inter, Playfair_Display, Noto_Sans_KR, Noto_Serif_KR } from "next/font/google";

export const playfair = Playfair_Display({
  subsets: ["latin", "cyrillic"],
  variable: "--font-playfair",
  display: "swap",
});

export const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

// Корейские глиф-наборы отсутствуют в Playfair/Inter — подключаем как fallback
// в той же CSS-переменной, чтобы корейский текст рендерился без "тофу"-квадратов.
export const notoSerifKr = Noto_Serif_KR({
  // Корейские глифы у Noto *_KR включены всегда — subsets управляет только
  // дополнительными (не-корейскими) диапазонами.
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-serif-kr",
  display: "swap",
});

export const notoSansKr = Noto_Sans_KR({
  // Корейские глифы у Noto *_KR включены всегда — subsets управляет только
  // дополнительными (не-корейскими) диапазонами.
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-sans-kr",
  display: "swap",
});
