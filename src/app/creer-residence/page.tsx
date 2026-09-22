import type { Metadata } from "next";
import { CreateResidenceForm } from "@/components/landing/create-residence-form";
import { getPublicPricing } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Équiper ma résidence — Student-Connect",
  description:
    "Crée l’espace Student-Connect de ta résidence avec 14 jours d’essai.",
};

export default async function CreateResidencePage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const [pricing, params] = await Promise.all([
    getPublicPricing(),
    searchParams,
  ]);

  return (
    <div className="min-h-[100svh] bg-background">
      <CreateResidenceForm
        pricing={pricing}
        canceled={params.checkout === "cancel"}
      />
    </div>
  );
}
