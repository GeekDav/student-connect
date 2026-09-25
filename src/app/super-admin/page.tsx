import type { Metadata } from "next";
import { PlatformDashboard } from "@/components/super-admin/platform-dashboard";
import { getPlatformDashboard } from "@/lib/actions/super-admin-analytics";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Vue d’ensemble — Super-admin",
  description:
    "Cockpit plateforme : activité étudiante et charge gestionnaire par résidence.",
};

export default async function SuperAdminPage() {
  const session = await getSession();
  if (!session) redirect("/connexion");
  if (session.role !== Role.SUPER_ADMIN) redirect("/");

  const data = await getPlatformDashboard();
  if (!data) redirect("/");

  return <PlatformDashboard data={data} />;
}
