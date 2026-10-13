import Link from "next/link";
import Image from "next/image";
import { getCategories } from "@/lib/queries";
import { PARENT_COMPANY, PARENT_URL } from "@/lib/seo";
import { GithubIcon, MailIcon } from "./icons";

const RESOURCES = [
  { href: "/", label: "Browse all logos" },
  { href: "/categories", label: "All categories" },
  { href: "/premium", label: "Premium" },
  { href: "/developers", label: "Developer API" },
  { href: "/developers/docs", label: "API documentation" },
  { href: "/contribute", label: "Submit a logo" },
];

const COMPANY = [
  { href: "/about", label: "About GhanaLogos" },
  { href: "/terms", label: "Usage & trademarks" },
  { href: "/privacy", label: "Privacy policy" },
  { href: "mailto:hello@ghanalogos.com", label: "Contact" },
];

function Column({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-gh-black/40 dark:text-white/40">
        {title}
      </h2>
      <ul className="mt-4 space-y-2.5 text-sm">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-gh-black/70 transition-colors hover:text-gh-green dark:text-white/70 dark:hover:text-gh-gold"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function Footer() {
  const categories = await getCategories();

  return (
    <footer className="mt-24 border-t border-gh-black/10 bg-white dark:border-white/10 dark:bg-ink-950">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
        <div>
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo-mark.svg" alt="" width={34} height={34} />
            <span className="font-display text-xl font-extrabold">
              Ghana<span className="text-gh-red">Logos</span>
            </span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-gh-black/60 dark:text-white/50">
            The reference library of official Ghanaian brand logos — banks,
            telecoms, government, universities, media and more, in SVG and
            PNG. A product of{" "}
            <a
              href={PARENT_URL}
              target="_blank"
              rel="noopener"
              className="font-semibold text-gh-black underline-offset-2 hover:text-gh-green hover:underline dark:text-white dark:hover:text-gh-gold"
            >
              {PARENT_COMPANY}
            </a>
            .
          </p>
          <div className="mt-5 flex gap-2">
            <a
              href="mailto:hello@ghanalogos.com"
              aria-label="Email GhanaLogos"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-gh-black/10 transition-colors hover:border-gh-green hover:text-gh-green dark:border-white/15"
            >
              <MailIcon size={18} />
            </a>
            {process.env.NEXT_PUBLIC_GITHUB_URL && (
              <a
                href={process.env.NEXT_PUBLIC_GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GhanaLogos on GitHub"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-gh-black/10 transition-colors hover:border-gh-green hover:text-gh-green dark:border-white/15"
              >
                <GithubIcon size={18} />
              </a>
            )}
          </div>
        </div>

        <Column
          title="Popular categories"
          links={categories.slice(0, 6).map((c) => ({
            href: `/category/${c.slug}`,
            label: c.title,
          }))}
        />
        <Column title="Resources" links={RESOURCES} />
        <Column title="Company" links={COMPANY} />
      </div>

      <div className="border-t border-gh-black/5 dark:border-white/5">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-gh-black/50 sm:flex-row sm:items-center sm:justify-between dark:text-white/40">
          <p>
            © {new Date().getFullYear()} GhanaLogos, a trademark of{" "}
            <a href={PARENT_URL} target="_blank" rel="noopener" className="hover:text-gh-green hover:underline dark:hover:text-gh-gold">
              {PARENT_COMPANY}
            </a>
            . All rights reserved.
          </p>
          <p>
            All logos are trademarks of their respective owners and are
            provided for reference use.
          </p>
        </div>
      </div>
    </footer>
  );
}
