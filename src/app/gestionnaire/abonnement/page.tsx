import type { Metadata } from "next";
import { ManagerBilling } from "@/components/manager/manager-billing";
import { getBillingInfo } from "@/lib/actions/billing";
import { requireManagerContext } from "@/lib/manager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Offre — Gestionnaire",
  description: "Offre et phase pilote de ta résidence Student-Connect.",
};

export default async function ManagerBillingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  await requireManagerContext();
  const info = await getBillingInfo();
  const params = await searchParams;
  const checkoutFlash =
    params.checkout === "success"
      ? "success"
      : params.checkout === "cancel"
        ? "cancel"
        : null;

  if (!info) {
    return (
      <p className="text-sm text-muted">
        Aucune résidence liée à ce compte.
      </p>
    );
  }

  return <ManagerBilling initial={info} checkoutFlash={checkoutFlash} />;
}
