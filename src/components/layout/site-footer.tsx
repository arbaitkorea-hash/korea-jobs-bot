import Link from "next/link";
import { Container } from "@/components/ui/container";
import { siteConfig } from "@/lib/site-config";
import type { AppLocale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export function SiteFooter({ locale, dict }: { locale: AppLocale; dict: Dictionary }) {
  return (
    <footer className="mt-24 border-t border-border">
      <Container className="grid gap-10 py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-serif text-lg">JST ART</p>
          <p className="mt-3 text-sm text-fg-muted">{siteConfig.artistName}</p>
        </div>

        <nav aria-label={dict.footer.navigation} className="flex flex-col gap-2 text-sm">
          <Link href={`/${locale}/gallery`} className="text-fg-muted hover:text-fg">
            {dict.nav.gallery}
          </Link>
          <Link href={`/${locale}/collections`} className="text-fg-muted hover:text-fg">
            {dict.nav.collections}
          </Link>
          <Link href={`/${locale}/about`} className="text-fg-muted hover:text-fg">
            {dict.nav.about}
          </Link>
          <Link href={`/${locale}/exhibitions`} className="text-fg-muted hover:text-fg">
            {dict.nav.exhibitions}
          </Link>
          <Link href={`/${locale}/blog`} className="text-fg-muted hover:text-fg">
            {dict.nav.blog}
          </Link>
        </nav>

        <nav aria-label={dict.footer.info} className="flex flex-col gap-2 text-sm">
          <Link href={`/${locale}/shipping`} className="text-fg-muted hover:text-fg">
            {dict.nav.shipping}
          </Link>
          <Link href={`/${locale}/policies/returns`} className="text-fg-muted hover:text-fg">
            {dict.policies.returnsTitle}
          </Link>
          <Link href={`/${locale}/policies/privacy`} className="text-fg-muted hover:text-fg">
            {dict.policies.privacyTitle}
          </Link>
          <Link href={`/${locale}/contact`} className="text-fg-muted hover:text-fg">
            {dict.nav.contact}
          </Link>
        </nav>

        <div className="text-sm">
          <p className="text-fg-muted">{dict.footer.follow}</p>
          <a
            href={siteConfig.social.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-fg-muted hover:text-fg"
          >
            Instagram
          </a>
        </div>
      </Container>

      <Container className="border-t border-border py-6 text-xs text-fg-muted">
        © {new Date().getFullYear()} {siteConfig.name}. {dict.footer.rights}
      </Container>
    </footer>
  );
}
