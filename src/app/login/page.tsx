import type { Metadata } from "next";
import { redirect } from "next/navigation";
import LoginForm from "@/components/auth/LoginForm";
import { oauthProviders, safeNext } from "@/lib/auth";
import { sessionName } from "@/lib/developer";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: true },
  alternates: { canonical: "/login" },
};

function loginMethod(value: string | undefined): "password" | "receipt" | "magic" {
  if (value === "receipt") return "receipt";
  if (value === "magic") return "magic";
  return "password";
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string; error?: string; method?: string };
}) {
  const next = safeNext(searchParams.next);
  if (sessionName() && !searchParams.error) redirect(next);

  return (
    <LoginForm
      providers={oauthProviders}
      next={next}
      error={searchParams.error?.slice(0, 200) ?? null}
      method={loginMethod(searchParams.method)}
    />
  );
}
