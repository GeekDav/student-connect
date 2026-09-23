import type { Metadata } from "next";
import { MarketplaceBoard } from "@/components/app/marketplace-board";
import { listResidenceMarket } from "@/lib/actions/marketplace";
import { requireActiveStudent } from "@/lib/student";

export const metadata: Metadata = {
  title: "Recyclerie — Student-Connect",
  description:
    "Dons et ventes entre étudiants de la même résidence.",
};

export default async function RecycleriePage() {
  const ctx = await requireActiveStudent();
  const items = await listResidenceMarket();
  return <MarketplaceBoard initialItems={items} readOnly={!ctx.isResident} />;
}
