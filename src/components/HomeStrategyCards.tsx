"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatUnits } from "viem";
import { usePublicClient } from "wagmi";

import { contracts, fundingPoolAbi, votingSystemAbi } from "@/lib/contracts";
import { USDC_DECIMALS } from "@/lib/dapp-onchain";
import { fetchActiveRoundsPageFromSubgraph, hasSubgraphConfigured } from "@/lib/subgraph";

type StrategyStats = {
  poolBalance?: bigint;
  distributionCount?: bigint;
  paidOutTotal?: bigint;
  activeRounds?: number;
  activeVoters?: number;
};

function formatUsdc(value?: bigint, maxFractionDigits = 2) {
  if (value === undefined) return "...";
  const asNumber = Number(formatUnits(value, USDC_DECIMALS));
  if (!Number.isFinite(asNumber)) return formatUnits(value, USDC_DECIMALS);
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: asNumber >= 1000 ? Math.min(maxFractionDigits, 0) : maxFractionDigits,
  }).format(asNumber);
}

export function HomeStrategyCards() {
  const client = usePublicClient();
  const [stats, setStats] = useState<StrategyStats>({});

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!client) return;
      const readContract = (config: Record<string, unknown>) =>
        (client as { readContract: (arg: Record<string, unknown>) => Promise<unknown> }).readContract(config);
      const next: StrategyStats = {};
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

            next.poolBalance = poolBalance;
            next.distributionCount = distributionCount;
            distributionCountValue = distributionCount;
          } catch {
            // keep defaults
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

              const active = infos
                .map((row) => row as readonly [bigint, bigint[], bigint, bigint, boolean, boolean, bigint, bigint, bigint])
                .filter((row) => row[4] && !row[5]);
              next.activeRounds = active.length;
            } else {
              next.activeRounds = 0;
            }
          } catch {
            // keep defaults
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
            setStats((prev) => ({ ...prev, paidOutTotal: paidOut }));
          }
        } catch {
          // keep defaults
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [client]);

  return (
    <div className="mt-14 grid gap-6 lg:grid-cols-3 lg:gap-10">
      <div className="group relative overflow-hidden rounded-[32px] border border-white/70 bg-white/80 p-6 shadow-[0_28px_70px_rgba(15,23,42,0.12)] backdrop-blur sm:p-8 xl:p-11">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_55%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        <div className="relative flex h-full flex-col gap-7">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-900/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-700">
              Strategy
            </span>
          </div>
          <h3 className="font-[var(--font-display)] text-[28px] font-semibold leading-tight text-slate-900 sm:text-[32px] xl:text-[34px]">Community Grants</h3>
          <p className="text-base text-slate-600 sm:text-lg">
            Route stake into high-signal proposals. Structured scoring, transparent quorum, and milestone-based payouts.
          </p>
          <div className="rounded-2xl border border-slate-200/60 bg-white/70 p-5 sm:p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Total pool</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl xl:text-5xl">{formatUsdc(stats.poolBalance)} USDC</p>
            <p className="mt-1 text-xs text-slate-500">Available across active rounds</p>
          </div>
          <Link href="/pool" className="mt-auto w-fit rounded-full bg-slate-900 px-7 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-white">
            Deposit
          </Link>
        </div>
      </div>

      <div className="group relative overflow-hidden rounded-[32px] border border-white/60 bg-white/80 p-6 shadow-[0_28px_70px_rgba(15,23,42,0.12)] backdrop-blur sm:p-8 xl:p-11">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.2),transparent_60%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        <div className="relative flex h-full flex-col gap-7">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2 rounded-full bg-teal-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-teal-700">
              Rewards
            </span>
          </div>
          <h3 className="font-[var(--font-display)] text-[28px] font-semibold leading-tight text-slate-900 sm:text-[32px] xl:text-[34px]">Voter Yield</h3>
          <p className="text-base text-slate-600 sm:text-lg">
            Earn reputation boosts and voter rewards for consistent, high-quality participation across rounds.
          </p>
          <div className="rounded-2xl border border-slate-200/60 bg-white/70 p-5 sm:p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Active rounds</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl xl:text-5xl">
              {stats.activeRounds === undefined ? "..." : new Intl.NumberFormat("en-US").format(stats.activeRounds)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Live rounds open for community voting right now
            </p>
          </div>
          <Link href="/rounds" className="mt-auto w-fit rounded-full bg-slate-900 px-7 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-white">
            Start voting
          </Link>
        </div>
      </div>

      <div className="group relative overflow-hidden rounded-[32px] border border-white/60 bg-white/80 p-6 shadow-[0_28px_70px_rgba(15,23,42,0.12)] backdrop-blur sm:p-8 xl:p-11">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(248,113,113,0.18),transparent_60%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        <div className="relative flex h-full flex-col gap-7">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2 rounded-full bg-rose-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-rose-700">
              Treasury
            </span>
          </div>
          <h3 className="font-[var(--font-display)] text-[28px] font-semibold leading-tight text-slate-900 sm:text-[32px] xl:text-[34px]">Grant Treasury</h3>
          <p className="text-base text-slate-600 sm:text-lg">
            Consolidated funding pool with transparent distribution, milestone-based releases, and full audit history.
          </p>
          <div className="rounded-2xl border border-slate-200/60 bg-white/70 p-5 sm:p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Paid out</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl xl:text-5xl">{formatUsdc(stats.paidOutTotal)} USDC</p>
            <p className="mt-1 text-xs text-slate-500">
              Across {stats.distributionCount === undefined ? "..." : stats.distributionCount.toString()} funded proposals
            </p>
          </div>
          <Link href="/pool" className="mt-auto w-fit rounded-full bg-slate-900 px-7 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-white">
            View treasury
          </Link>
        </div>
      </div>
    </div>
  );
}
