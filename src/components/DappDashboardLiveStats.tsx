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
import {
  fetchActiveRoundsPageFromSubgraph,
  fetchAllIdeasFromSubgraph,
  fetchProtocolStatsFromSubgraph,
  hasSubgraphConfigured,
} from "@/lib/subgraph";

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
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    const scheduleRetry = () => {
      if (cancelled || retryTimer) return;
      retryTimer = setTimeout(() => {
        retryTimer = null;
        void load();
      }, 10_000);
    };

    async function load() {
      if (!client) return;
      const readContract = (config: Record<string, unknown>) =>
        (client as { readContract: (arg: Record<string, unknown>) => Promise<unknown> }).readContract(config);
      const readWithRetry = async (config: Record<string, unknown>, retries = 2) => {
        for (let attempt = 0; attempt <= retries; attempt += 1) {
          try {
            return await readContract(config);
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            const isRateLimited =
              message.includes("rate limited") || message.includes("request limit reached");
            if (!isRateLimited || attempt === retries) throw error;
            await delay(750 * (attempt + 1));
          }
        }
        throw new Error("Failed to read contract");
      };

      const next: DashboardStats = {};
      let distributionCountValue: bigint | undefined;
      let hasFreshData = false;

      await Promise.all([
        (async () => {
          if (hasSubgraphConfigured()) {
            try {
              const stats = await fetchProtocolStatsFromSubgraph();
              if (stats) {
                next.totalTreasury = BigInt(stats.totalTreasury || "0");
                next.successfulProjects = BigInt(stats.distributionCount || "0");
                next.grantsDistributed = BigInt(stats.totalDistributed || "0");
                hasFreshData = true;
                return;
              }
            } catch {
              // Fallback to direct RPC reads below.
            }
          }

          if (!contracts.fundingPool) return;
          try {
            const [poolBalance, distributionCount] = (await Promise.all([
              readWithRetry({
                address: contracts.fundingPool,
                abi: fundingPoolAbi,
                functionName: "totalPoolBalance",
              }),
              readWithRetry({
                address: contracts.fundingPool,
                abi: fundingPoolAbi,
                functionName: "getDistributionCount",
              }),
            ])) as [bigint, bigint];

            next.totalTreasury = poolBalance;
            next.successfulProjects = distributionCount;
            distributionCountValue = distributionCount;
            hasFreshData = true;
            if (distributionCount === 0n) {
              next.grantsDistributed = 0n;
            }
          } catch {
            // Keep partial stats empty when live contracts are unavailable.
          }
        })(),
        (async () => {
          if (hasSubgraphConfigured()) {
            try {
              const stats = await fetchProtocolStatsFromSubgraph();
              if (stats) {
                next.activeRounds = Number(stats.activeRounds || "0");
                hasFreshData = true;
                return;
              }
            } catch {
              // Fallback to current subgraph query or RPC below.
            }
          }

          if (!contracts.votingSystem) return;
          try {
            if (hasSubgraphConfigured()) {
              const activeRows = await fetchActiveRoundsPageFromSubgraph(1000, 0);
              next.activeRounds = activeRows.length;
              hasFreshData = true;
              return;
            }

            const currentRoundId = (await readWithRetry({
              address: contracts.votingSystem,
              abi: votingSystemAbi,
              functionName: "currentRoundId",
            })) as bigint;

            if (currentRoundId <= 0n) {
              next.activeRounds = 0;
              return;
            }

            const currentRound = (await readWithRetry({
              address: contracts.votingSystem,
              abi: votingSystemAbi,
              functionName: "getRoundInfo",
              args: [currentRoundId],
            })) as readonly [bigint, bigint[], bigint, bigint, boolean, boolean, bigint, bigint, bigint];

            next.activeRounds = currentRound[0] > 0n && currentRound[4] && !currentRound[5] ? 1 : 0;
            hasFreshData = true;
          } catch {
            // Ignore live round stat failures.
          }
        })(),
        (async () => {
          if (hasSubgraphConfigured()) {
            try {
              const stats = await fetchProtocolStatsFromSubgraph();
              if (stats) {
                next.totalIdeas = BigInt(stats.totalIdeas || "0");
                hasFreshData = true;
                return;
              }
            } catch {
              // Fallback to direct read / broad subgraph query below.
            }
          }

          if (!contracts.ideaRegistry) return;
          try {
            next.totalIdeas = (await readWithRetry({
              address: contracts.ideaRegistry,
              abi: ideaRegistryAbi,
              functionName: "totalIdeas",
            })) as bigint;
            hasFreshData = true;
          } catch {
            if (hasSubgraphConfigured()) {
              try {
                const ideas = await fetchAllIdeasFromSubgraph();
                next.totalIdeas = BigInt(ideas.length);
                hasFreshData = true;
              } catch {
                // Ignore fallback failure.
              }
            }
          }
        })(),
      ]);

      if (!cancelled && Object.keys(next).length > 0) {
        setStats((prev) => ({ ...prev, ...next }));
      }

      if (contracts.fundingPool && distributionCountValue && distributionCountValue > 0n) {
        try {
          const distributions = await Promise.all(
            Array.from({ length: Number(distributionCountValue) }, (_, i) =>
              readWithRetry({
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
          hasFreshData = true;
        } catch {
          // Ignore slower payout aggregation failures.
        }
      }

      if (!hasFreshData) {
        scheduleRetry();
      }
    }

    void load();
    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
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
