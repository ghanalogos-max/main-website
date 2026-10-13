import type { Metadata } from "next";
import { redirect } from "next/navigation";
import DeveloperDashboard from "@/components/DeveloperDashboard";
import { getSessionAccount } from "@/lib/developer";
import { storeEnabled } from "@/lib/store";

export const metadata: Metadata = {
  title: "Developer Dashboard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { status?: string; message?: string };
}) {
  if (storeEnabled && !(await getSessionAccount())) {
    redirect("/login?next=%2Fdevelopers%2Fdashboard");
  }
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <DeveloperDashboard status={searchParams.status} message={searchParams.message} />
    </div>
  );
}
