import type { Metadata } from "next";
import { inter, playfair, notoSansKr, notoSerifKr } from "@/lib/fonts";
import { ThemeScript } from "@/components/layout/theme-script";
import "@/app/globals.css";

// Админка не индексируется и всегда на русском — язык владельца сайта.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: { default: "Админка | JST ART", template: "%s | JST ART" },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ru"
      suppressHydrationWarning
      className={`${playfair.variable} ${inter.variable} ${notoSerifKr.variable} ${notoSansKr.variable} h-full antialiased`}
    >
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-full flex flex-col bg-bg text-fg">{children}</body>
    </html>
  );
}
