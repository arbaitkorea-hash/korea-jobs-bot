import Link from "next/link";
import { Container } from "@/components/ui/container";
import { siteConfig } from "@/lib/site-config";

const POLICY_LINKS = [
  { href: "/policies/shipping", label: "Доставка" },
  { href: "/policies/returns", label: "Возврат" },
  { href: "/policies/privacy", label: "Конфиденциальность" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border mt-24">
      <Container className="grid gap-10 py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-serif text-lg">JST ART</p>
          <p className="mt-3 text-sm text-fg-muted">{siteConfig.artistName}</p>
        </div>

        <nav aria-label="Навигация" className="flex flex-col gap-2 text-sm">
          <Link href="/gallery" className="text-fg-muted hover:text-fg">Галерея</Link>
          <Link href="/collections" className="text-fg-muted hover:text-fg">Коллекции</Link>
          <Link href="/about" className="text-fg-muted hover:text-fg">О художнике</Link>
          <Link href="/blog" className="text-fg-muted hover:text-fg">Блог</Link>
        </nav>

        <nav aria-label="Информация" className="flex flex-col gap-2 text-sm">
          {POLICY_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="text-fg-muted hover:text-fg">
              {link.label}
            </Link>
          ))}
          <Link href="/contact" className="text-fg-muted hover:text-fg">Контакты</Link>
        </nav>

        <div className="text-sm text-fg-muted">
          <a href={siteConfig.social.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-fg">
            Instagram
          </a>
        </div>
      </Container>

      <Container className="border-t border-border py-6 text-xs text-fg-muted">
        © {new Date().getFullYear()} {siteConfig.name}. Все права защищены.
      </Container>
    </footer>
  );
}
