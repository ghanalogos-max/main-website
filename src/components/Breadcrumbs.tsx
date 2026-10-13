import Link from "next/link";
import JsonLd from "./JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo";

export default function Breadcrumbs({
  items,
}: {
  items: { name: string; path: string }[];
}) {
  const all = [{ name: "Home", path: "/" }, ...items];
  return (
    <nav aria-label="Breadcrumb" className="text-sm">
      <JsonLd data={breadcrumbJsonLd(all)} />
      <ol className="flex flex-wrap items-center gap-1.5 text-gh-black/50 dark:text-white/40">
        {all.map((item, i) => (
          <li key={item.path} className="flex items-center gap-1.5">
            {i > 0 && <span aria-hidden>/</span>}
            {i === all.length - 1 ? (
              <span aria-current="page" className="font-medium text-gh-black/80 dark:text-white/80">
                {item.name}
              </span>
            ) : (
              <Link href={item.path} className="hover:text-gh-green dark:hover:text-gh-gold">
                {item.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
