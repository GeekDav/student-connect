import type { Metadata } from "next";
import { CreateResidenceForm } from "@/components/super-admin/create-residence-form";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";

export const metadata: Metadata = {
  title: "Nouvelle résidence — Super-admin",
};

export default async function NouvelleResidencePage() {
  const session = await getSession();
  if (!session) redirect("/connexion");
  if (session.role !== Role.SUPER_ADMIN) redirect("/");

  return <CreateResidenceForm />;
}
