import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Urbanist } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import DownloadProvider from "@/components/DownloadProvider";
import JsonLd from "@/components/JsonLd";
import {
  PARENT_COMPANY,
  SITE_NAME,
  SITE_URL,
  organizationJsonLd,
  websiteJsonLd,
} from "@/lib/seo";

const sans = Urbanist({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const DEFAULT_TITLE = "GhanaLogos — Official Ghanaian Company Logos in SVG & PNG";
const DEFAULT_DESCRIPTION =
  "Download official logos of Ghanaian banks, telecoms, government agencies, universities, football clubs, media and brands in high quality SVG and PNG. Search Ghana logos free.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: DEFAULT_TITLE, template: "%s | GhanaLogos" },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  publisher: PARENT_COMPANY,
  creator: PARENT_COMPANY,
  keywords: [
    "Ghana logos",
    "Ghanaian company logos",
    "Ghana logo png",
    "Ghana logo svg",
    "Ghana bank logos",
    "Ghana government logos",
    "Ghana university logos",
    "Ghana football club logos",
    "vector logos Ghana",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    type: "website",
    locale: "en_GH",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: DEFAULT_TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: ["/og.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
    other: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION
      ? { "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION }
      : undefined,
  },
  category: "design",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAFAF7" },
    { media: "(prefers-color-scheme: dark)", color: "#07090A" },
  ],
};

// Google Analytics 4. Only loads in production builds so local testing isn't counted.
const GA_ID =
  process.env.NODE_ENV === "production"
    ? process.env.NEXT_PUBLIC_GA_ID || "G-LKCB4EZWB9"
    : "";

const themeInitScript = `
(function() {
  try {
    var stored = localStorage.getItem('theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var isDark = stored ? stored === 'dark' : prefersDark;
    if (isDark) document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en-GH"
      suppressHydrationWarning
      className={`${sans.variable} ${display.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
      </head>
      <body className="min-h-screen font-sans text-gh-black antialiased transition-colors dark:text-white">
        <div className="site-bg" aria-hidden />
        <DownloadProvider>
          <Header />
          <main>{children}</main>
          <Footer />
          <ScrollToTop />
        </DownloadProvider>
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
