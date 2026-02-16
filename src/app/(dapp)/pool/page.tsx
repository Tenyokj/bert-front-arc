import { FundingPoolHero } from "@/components/FundingPoolHero";
import { PoolStats } from "@/components/PoolStats";

export default function PoolPage() {
  return (
    <section className="space-y-8">
      <FundingPoolHero />
      <section id="pool-stats" className="scroll-mt-24">
        <PoolStats />
      </section>
    </section>
  );
}
