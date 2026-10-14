import Link from "next/link";
import ContributeForm from "@/components/ContributeForm";
import {
  ChartIcon,
  HeartIcon,
  PhoneIcon,
  ShieldIcon,
  UploadIcon,
  VectorIcon,
} from "@/components/icons";
import { CONTRIBUTOR_SHARE } from "@/lib/contributors";
import { getSessionAccount } from "@/lib/developer";
import { storeEnabled } from "@/lib/store";

export const dynamic = "force-dynamic";

const STEPS = [
  { icon: VectorIcon, text: "SVG preferred — official artwork from the brand's website or guidelines." },
  { icon: ShieldIcon, text: "Our team verifies every submission before it goes live." },
  { icon: HeartIcon, text: "Contributors are credited on the logo page." },
  {
    icon: ChartIcon,
    text: `Earn from downloads: ${CONTRIBUTOR_SHARE * 100}% of Premium revenue is shared among contributors every month.`,
  },
];

function Gate({ title, text, href, cta }: { title: string; text: string; href: string; cta: string }) {
  return (
    <div className="panel flex flex-col items-center p-8 text-center">
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gh-green/10 text-gh-green dark:bg-gh-gold/10 dark:text-gh-gold">
        <PhoneIcon size={24} />
      </span>
      <h2 className="font-display text-xl font-bold">{title}</h2>
      <p className="mt-2 text-sm text-gh-black/60 dark:text-white/50">{text}</p>
      <Link href={href} className="btn-primary mt-6">
        {cta}
      </Link>
    </div>
  );
}

export default async function ContributePage() {
  const account = storeEnabled ? await getSessionAccount() : null;

  return (
    <div className="mx-auto grid max-w-5xl gap-10 px-4 py-14 md:grid-cols-[1fr_1.2fr]">
      <div>
        <span className="eyebrow">
          <UploadIcon size={14} />
          Contribute
        </span>
        <h1 className="mt-5 font-display text-3xl font-extrabold tracking-tight md:text-4xl">
          Help grow Ghana&apos;s logo library
        </h1>
        <p className="mt-3 text-gh-black/60 dark:text-white/50">
          Know a Ghanaian brand that&apos;s missing? Submit its logo, we&apos;ll add it for
          everyone, and you earn when it&apos;s downloaded.{" "}
          <Link href="/contributors" className="font-semibold text-gh-green underline-offset-2 hover:underline dark:text-gh-gold">
            How earnings work
          </Link>
        </p>
        <ul className="mt-8 space-y-4">
          {STEPS.map(({ icon: Icon, text }) => (
            <li key={text} className="flex gap-3 text-sm">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gh-green/10 text-gh-green dark:bg-gh-gold/10 dark:text-gh-gold">
                <Icon size={18} />
              </span>
              <span className="pt-2 text-gh-black/70 dark:text-white/70">{text}</span>
            </li>
          ))}
        </ul>
      </div>

      {!storeEnabled ? (
        <Gate
          title="Submissions are coming soon"
          text="Accounts aren't available yet. Please try again later."
          href="/"
          cta="Back to the library"
        />
      ) : !account ? (
        <Gate
          title="Sign in to submit a logo"
          text="Contributors need a free account so we can credit you and pay your earnings."
          href="/login?next=%2Fcontribute"
          cta="Sign in or create an account"
        />
      ) : !account.payout ? (
        <Gate
          title="Add your Mobile Money number"
          text="We pay contributor earnings by Mobile Money. Add your number once, then submit as many logos as you like."
          href="/contributors/dashboard"
          cta="Add payout details"
        />
      ) : (
        <ContributeForm name={account.name} />
      )}
    </div>
  );
}
