import { LandingPage } from "@/components/landing/landing-page";
import { getPublicPricing } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export default async function Home() {
  const pricing = await getPublicPricing();
  return <LandingPage pricing={pricing} />;
}
