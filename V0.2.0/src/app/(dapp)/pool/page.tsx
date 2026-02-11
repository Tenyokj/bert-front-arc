import { FundingPoolHero } from "@/components/FundingPoolHero";
import { PoolStats } from "@/components/PoolStats";

export default function PoolPage() {
  return (
    <section className="space-y-8">
      <FundingPoolHero />
      <PoolStats />
    </section>
  );
}
