import type { Metadata } from "next";
import Link from "next/link";
import ContactForm from "@/components/ContactForm";
import { BookIcon, CodeIcon, MailIcon, ShieldIcon } from "@/components/icons";
import { isContactTopic } from "@/lib/contact";
import { getSessionAccount } from "@/lib/developer";
import { PARENT_COMPANY } from "@/lib/seo";
import { storeEnabled } from "@/lib/store";

export const metadata: Metadata = {
  title: "Contact GhanaLogos",
  description:
    "Get in touch with the GhanaLogos team about logo requests, removals, the developer API, Premium or partnerships.",
  alternates: { canonical: "/contact" },
};

export const dynamic = "force-dynamic";

const HELP = [
  {
    icon: ShieldIcon,
    title: "Brand owners",
    text: "Choose “Update or remove a logo” and we'll act on it quickly.",
  },
  {
    icon: CodeIcon,
    title: "Developers",
    text: "Most API questions are answered in the documentation.",
    href: "/developers/docs",
    cta: "Read the docs",
  },
  {
    icon: BookIcon,
    title: "Usage & trademarks",
    text: "How you may use the logos on GhanaLogos.",
    href: "/terms",
    cta: "Read the terms",
  },
];

export default async function ContactPage({ searchParams }: { searchParams: { topic?: string } }) {
  const account = storeEnabled ? await getSessionAccount().catch(() => null) : null;
  const phone = account?.phone?.startsWith("233") ? `0${account.phone.slice(3)}` : undefined;

  return (
    <div className="mx-auto grid max-w-5xl gap-10 px-4 py-14 md:grid-cols-[1fr_1.4fr]">
      <div>
        <span className="eyebrow">
          <MailIcon size={14} />
          Contact
        </span>
        <h1 className="mt-5 font-display text-3xl font-extrabold tracking-tight md:text-4xl">
          Get in touch
        </h1>
        <p className="mt-3 text-gh-black/60 dark:text-white/50">
          Questions, logo requests, removals or partnerships — send us a message and the{" "}
          {PARENT_COMPANY} team will get back to you, usually within one to two working days.
        </p>
        <p className="mt-4 text-sm text-gh-black/60 dark:text-white/50">
          Prefer email?{" "}
          <a href="mailto:hello@ghanalogos.com" className="font-semibold text-gh-green underline-offset-2 hover:underline dark:text-gh-gold">
            hello@ghanalogos.com
          </a>
        </p>

        <ul className="mt-8 space-y-4">
          {HELP.map(({ icon: Icon, title, text, href, cta }) => (
            <li key={title} className="flex gap-3 text-sm">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gh-green/10 text-gh-green dark:bg-gh-gold/10 dark:text-gh-gold">
                <Icon size={18} />
              </span>
              <span className="pt-1">
                <span className="block font-semibold">{title}</span>
                <span className="text-gh-black/60 dark:text-white/50">
                  {text}{" "}
                  {href && (
                    <Link href={href} className="font-semibold text-gh-green hover:underline dark:text-gh-gold">
                      {cta}
                    </Link>
                  )}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <ContactForm
        initial={{
          name: account?.name,
          email: account?.email,
          phone,
          topic: isContactTopic(searchParams.topic) ? searchParams.topic : undefined,
        }}
      />
    </div>
  );
}
