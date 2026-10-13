import type { Metadata } from "next";
import { redirect } from "next/navigation";
import SignupForm from "@/components/auth/SignupForm";
import { oauthProviders, safeNext } from "@/lib/auth";
import { sessionName } from "@/lib/developer";

export const metadata: Metadata = {
  title: "Create an account",
  robots: { index: false, follow: true },
  alternates: { canonical: "/signup" },
};

export default function SignupPage({ searchParams }: { searchParams: { next?: string } }) {
  const next = safeNext(searchParams.next);
  if (sessionName()) redirect(next);

  return (
    <SignupForm
      providers={oauthProviders}
      next={next}
    />
  );
}
