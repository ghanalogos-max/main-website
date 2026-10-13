import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Submit a Ghanaian Company Logo",
  description:
    "Missing a Ghanaian brand? Submit its official logo to GhanaLogos for review and help grow the library.",
  alternates: { canonical: "/contribute" },
};

export default function ContributeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
