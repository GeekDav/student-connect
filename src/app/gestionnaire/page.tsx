import type { Metadata } from "next";
import { ManagerDashboard } from "@/components/manager/manager-dashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard gestionnaire — Student-Connect",
  description: "Tableau de bord de ta résidence sur Student-Connect.",
};

export default async function GestionnairePage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const params = await searchParams;
  return <ManagerDashboard welcome={params.welcome === "1"} />;
}
