import type { Metadata } from "next";
import { ManagerDashboard } from "@/components/manager/manager-dashboard";

export const metadata: Metadata = {
  title: "Dashboard gestionnaire — Student-Connect",
  description: "Tableau de bord de ta résidence sur Student-Connect.",
};

export default function GestionnairePage() {
  return <ManagerDashboard />;
}
