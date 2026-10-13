import Link from "next/link";
import { Logo } from "@/lib/types";
import LogoCard from "./LogoCard";
import { SearchIcon } from "./icons";

export default function LogoGrid({ logos }: { logos: Logo[] }) {
  if (logos.length === 0) {
    return (
      <div className="panel flex flex-col items-center px-6 py-16 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gh-black/5 dark:bg-white/10">
          <SearchIcon size={22} />
        </div>
        <p className="font-semibold">No logos found</p>
        <p className="mt-1 text-sm text-gh-black/50 dark:text-white/40">
          Try a different search, category, or letter — or{" "}
          <Link href="/contribute" className="font-medium text-gh-green underline-offset-2 hover:underline dark:text-gh-gold">
            submit the logo
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {logos.map((logo) => (
        <LogoCard key={logo.slug} logo={logo} />
      ))}
    </div>
  );
}
