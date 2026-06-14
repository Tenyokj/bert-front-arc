"use client";

import { useEffect, useState } from "react";
import { formatUnits } from "viem";
import { usePublicClient } from "wagmi";
import {
  contracts,
  fundingPoolAbi,
  ideaRegistryAbi,
  votingSystemAbi,
} from "@/lib/contracts";
import { USDC_DECIMALS } from "@/lib/dapp-onchain";
import { fetchActiveRoundsPageFromSubgraph, fetchAllIdeasFromSubgraph, hasSubgraphConfigured } from "@/lib/subgraph";

type DashboardStats = {
  totalTreasury?: bigint;
  totalIdeas?: bigint;
  grantsDistributed?: bigint;
  successfulProjects?: bigint;
  activeRounds?: number;
};

function formatUsdc(value?: bigint) {
  if (value === undefined) return "...";
  const asNumber = Number(formatUnits(value, USDC_DECIMALS));
  if (!Number.isFinite(asNumber)) return `${formatUnits(value, USDC_DECIMALS)} USDC`;
  return `$${new Intl.NumberFormat("en-US", { maximumFractionDigits: asNumber >= 1000 ? 0 : 2 }).format(asNumber)}`;
}

function formatCount(value?: bigint | number) {
  if (value === undefined) return "...";
  return new Intl.NumberFormat("en-US").format(Number(value));
}

export function DappDashboardLiveStats() {
  const client = usePublicClient();
  const [stats, setStats] = useState<DashboardStats>({});

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!client) return;
      const readContract = (config: Record<string, unknown>) =>
        (client as { readContract: (arg: Record<string, unknown>) => Promise<unknown> }).readContract(config);

      const next: DashboardStats = {};
      let distributionCountValue: bigint | undefined;

      await Promise.all([
        (async () => {
          if (!contracts.fundingPool) return;
          try {
            const [poolBalance, distributionCount] = (await Promise.all([
              readContract({
                address: contracts.fundingPool,
                abi: fundingPoolAbi,
                functionName: "totalPoolBalance",
              }),
              readContract({
                address: contracts.fundingPool,
                abi: fundingPoolAbi,
                functionName: "getDistributionCount",
              }),
            ])) as [bigint, bigint];

            next.totalTreasury = poolBalance;
            next.successfulProjects = distributionCount;
            distributionCountValue = distributionCount;
          } catch {
            // Keep partial stats empty when live contracts are unavailable.
          }
        })(),
        (async () => {
          if (!contracts.votingSystem) return;
          try {
            if (hasSubgraphConfigured()) {
              const activeRows = await fetchActiveRoundsPageFromSubgraph(1000, 0);
              next.activeRounds = activeRows.length;
              return;
            }

            const currentRoundId = (await readContract({
              address: contracts.votingSystem,
              abi: votingSystemAbi,
              functionName: "currentRoundId",
            })) as bigint;

            const totalRounds = currentRoundId > 1n ? Number(currentRoundId - 1n) : 0;
            if (totalRounds > 0) {
              const infos = await Promise.all(
                Array.from({ length: totalRounds }, (_, idx) =>
                  readContract({
                    address: contracts.votingSystem!,
                    abi: votingSystemAbi,
                    functionName: "getRoundInfo",
                    args: [BigInt(idx + 1)],
                  })
                )
              );

              next.activeRounds = infos
                .map((row) => row as readonly [bigint, bigint[], bigint, bigint, boolean, boolean, bigint, bigint, bigint])
                .filter((row) => row[4] && !row[5]).length;
            } else {
              next.activeRounds = 0;
            }
          } catch {
            // Ignore live round stat failures.
          }
        })(),
        (async () => {
          if (!contracts.ideaRegistry) return;
          try {
            next.totalIdeas = (await readContract({
              address: contracts.ideaRegistry,
              abi: ideaRegistryAbi,
              functionName: "totalIdeas",
            })) as bigint;
          } catch {
            if (hasSubgraphConfigured()) {
              try {
                const ideas = await fetchAllIdeasFromSubgraph();
                next.totalIdeas = BigInt(ideas.length);
              } catch {
                // Ignore fallback failure.
              }
            }
          }
        })(),
      ]);

      if (!cancelled) setStats((prev) => ({ ...prev, ...next }));

      if (contracts.fundingPool && distributionCountValue && distributionCountValue > 0n) {
        try {
          const distributions = await Promise.all(
            Array.from({ length: Number(distributionCountValue) }, (_, i) =>
              readContract({
                address: contracts.fundingPool!,
                abi: fundingPoolAbi,
                functionName: "getDistribution",
                args: [BigInt(i)],
              }).catch(() => null)
            )
          );

          const paidOut = distributions.reduce((sum, distribution) => {
            if (!distribution) return sum;
            return sum + (distribution as readonly [bigint, bigint, bigint, bigint])[2];
          }, 0n);

          if (!cancelled) {
            setStats((prev) => ({ ...prev, grantsDistributed: paidOut }));
          }
        } catch {
          // Ignore slower payout aggregation failures.
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [client]);

  const cards = [
    {
      label: "Total Treasury",
      value: formatUsdc(stats.totalTreasury),
      helper: "Current live funding capacity",
    },
    {
      label: "Active Ideas",
      value: formatCount(stats.totalIdeas),
      helper: "Ideas tracked on-chain or via subgraph",
    },
    {
      label: "Grants Distributed",
      value: formatUsdc(stats.grantsDistributed),
      helper: "Released through funding distributions",
    },
    {
      label: "Successful Projects",
      value: formatCount(stats.successfulProjects),
      helper: `${formatCount(stats.activeRounds)} live rounds right now`,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(53,57,72,0.94),rgba(32,35,47,0.96))] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.24)]"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{card.label}</p>
          <p className="mt-4 font-[var(--font-display)] text-3xl text-white">{card.value}</p>
          <p className="mt-3 text-sm text-slate-300">{card.helper}</p>
        </div>
      ))}
    </div>
  );
}
