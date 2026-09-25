import type { Metadata } from "next";
import { ResidenceDetailDashboard } from "@/components/super-admin/residence-detail-dashboard";
import { getResidenceAnalytics } from "@/lib/actions/super-admin-analytics";
import { getSession } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Résidence — Super-admin",
  description: "Pulse détaillé d’une résidence partenaire.",
};

export default async function SuperAdminResidenceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/connexion");
  if (session.role !== Role.SUPER_ADMIN) redirect("/");

  const { id } = await params;
  const data = await getResidenceAnalytics(id);
  if (!data) notFound();

  return <ResidenceDetailDashboard data={data} />;
}
