import type { Metadata } from "next";
import { ResidencesList } from "@/components/super-admin/residences-list";
import { listPlatformResidences } from "@/lib/actions/super-admin";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Résidences — Super-admin",
  description: "Gère les résidences partenaires et les comptes gestionnaires.",
};

export default async function SuperAdminResidencesPage() {
  const session = await getSession();
  if (!session) redirect("/connexion");
  if (session.role !== Role.SUPER_ADMIN) redirect("/");

  const items = await listPlatformResidences();
  return <ResidencesList initialItems={items} />;
}
