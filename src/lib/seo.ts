import { MIME_TYPES, type Logo } from "./types";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.ghanalogos.com"
).trim().replace(/\/+$/, "");
export const SITE_NAME = "GhanaLogos";
export const PARENT_COMPANY = "Celestial Web Solutions";
export const PARENT_URL = "https://celestialwebsolutions.net";

export const absoluteUrl = (path: string) =>
  path.startsWith("http") ? path : `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`;

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl("/logo-mark.svg"),
    email: "hello@ghanalogos.com",
    areaServed: "GH",
    parentOrganization: { "@type": "Organization", name: PARENT_COMPANY, url: PARENT_URL },
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: "en-GH",
    publisher: { "@id": `${SITE_URL}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function logoImageJsonLd(logo: Logo) {
  return {
    "@context": "https://schema.org",
    "@type": "ImageObject",
    name: `${logo.name} logo`,
    description: `Official ${logo.name} logo in ${logo.format.toUpperCase()} format.`,
    contentUrl: absoluteUrl(logo.imageUrl),
    url: absoluteUrl(`/logo/${logo.slug}`),
    encodingFormat: MIME_TYPES[logo.format],
    width: logo.width,
    height: logo.height,
    creditText: logo.name,
    creator: { "@type": "Organization", name: logo.name, url: logo.website },
    copyrightNotice: `${logo.name} logo is a trademark of its owner.`,
    license: absoluteUrl("/terms"),
    acquireLicensePage: absoluteUrl("/terms"),
  };
}

export function faqJsonLd(faqs: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export function itemListJsonLd(name: string, logos: Logo[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: logos.length,
    itemListElement: logos.map((l, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: absoluteUrl(`/logo/${l.slug}`),
      name: `${l.name} logo`,
    })),
  };
}
