import Link from "next/link";
import { SearchIcon } from "@/components/icons";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-28 text-center">
      <p className="font-display text-7xl font-extrabold text-gh-gold">404</p>
      <h1 className="mt-4 font-display text-2xl font-bold">Logo not found</h1>
      <p className="mt-2 text-gh-black/60 dark:text-white/50">
        The page you&apos;re looking for doesn&apos;t exist or has moved.
      </p>
      <Link href="/" className="btn-dark mt-6">
        <SearchIcon size={16} />
        Browse all logos
      </Link>
    </div>
  );
}
