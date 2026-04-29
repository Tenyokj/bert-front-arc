"use client";

import { useEffect, useState } from "react";
import { formatUnits } from "viem";
import { usePublicClient } from "wagmi";

import {
  contracts,
  fundingPoolAbi,
  governanceTokenAbi,
  votingSystemAbi,
  ideaRegistryAbi,
} from "@/lib/contracts";
import { fetchAllIdeasFromSubgraph, hasSubgraphConfigured } from "@/lib/subgraph";

type HomeStats = {
  poolBalance?: bigint;
  fundedProposals?: bigint;
  activeRounds?: number;
  activeVoters?: number;
  totalIdeas?: bigint;
  ideasWithGrant?: bigint;
  tokenSymbol?: string;
  tokenSupply?: bigint;
};

function formatBtk(value?: bigint, maxFractionDigits = 2) {
  if (value === undefined) return "...";
  const asNumber = Number(formatUnits(value, 18));
  if (!Number.isFinite(asNumber)) return formatUnits(value, 18);
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: asNumber >= 1000 ? Math.min(maxFractionDigits, 0) : maxFractionDigits,
  }).format(asNumber);
}

export function HomeLiveStats() {
  const client = usePublicClient();
  const [stats, setStats] = useState<HomeStats>({});

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!client) return;
      const readContract = (config: Record<string, unknown>) =>
        (client as { readContract: (arg: Record<string, unknown>) => Promise<unknown> }).readContract(config);

      const next: HomeStats = {};

      if (contracts.fundingPool) {
        try {
          const [poolBalance, fundedProposals] = (await Promise.all([
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
          next.fundedProposals = fundedProposals;
          next.ideasWithGrant = fundedProposals;
        } catch {
          // keep defaults
        }
      }

      if (contracts.votingSystem) {
        try {
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

            const voterSet = new Set<string>();
            for (const round of active) {
              for (const ideaId of round[1]) {
                try {
                  const voters = (await readContract({
                    address: contracts.votingSystem!,
                    abi: votingSystemAbi,
                    functionName: "getVotersForIdea",
                    args: [round[0], ideaId],
                  })) as string[];
                  for (const voter of voters) {
                    voterSet.add(voter.toLowerCase());
                  }
                } catch {
                  // ignore per idea errors
                }
              }
            }
            next.activeVoters = voterSet.size;
          } else {
            next.activeRounds = 0;
            next.activeVoters = 0;
          }
        } catch {
          // keep defaults
        }
      }

      if (contracts.ideaRegistry) {
        try {
          const totalIdeas = (await readContract({
            address: contracts.ideaRegistry,
            abi: ideaRegistryAbi,
            functionName: "totalIdeas",
          })) as bigint;
          next.totalIdeas = totalIdeas;
        } catch {
          if (hasSubgraphConfigured()) {
            try {
              const ideas = await fetchAllIdeasFromSubgraph();
              next.totalIdeas = BigInt(ideas.length);
            } catch {
              // keep defaults
            }
          }
        }
      }

      if (contracts.governanceToken) {
        try {
          const [tokenSymbol, tokenSupply] = (await Promise.all([
            readContract({
              address: contracts.governanceToken,
              abi: governanceTokenAbi,
              functionName: "symbol",
            }),
            readContract({
              address: contracts.governanceToken,
              abi: governanceTokenAbi,
              functionName: "totalSupply",
            }),
          ])) as [string, bigint];
          next.tokenSymbol = tokenSymbol;
          next.tokenSupply = tokenSupply;
        } catch {
          // keep defaults
        }
      }

      if (!cancelled) setStats(next);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [client]);

  return (
    <div className="mt-10 grid gap-6 sm:grid-cols-2">
      <div className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Total in POOL</p>
        <p className="mt-3 text-3xl font-semibold text-slate-900">{formatBtk(stats.poolBalance)} BTK</p>
        <p className="mt-2 text-sm text-slate-500">
          Across {stats.fundedProposals === undefined ? "..." : stats.fundedProposals.toString()} funded proposals
        </p>
      </div>

      <div className="rounded-2xl border border-white/50 bg-gradient-to-br from-white/80 to-slate-100/80 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Active rounds</p>
        <p className="mt-3 text-3xl font-semibold text-slate-900">
          {stats.activeRounds === undefined ? "..." : `${stats.activeRounds} live`}
        </p>
        <p className="mt-2 text-sm text-slate-500">
          {stats.activeVoters === undefined ? "..." : new Intl.NumberFormat("en-US").format(stats.activeVoters)} voters participating
        </p>
      </div>

      <div className="rounded-2xl border border-white/50 bg-gradient-to-br from-white/80 to-slate-100/80 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Total Ideas</p>
        <p className="mt-3 text-3xl font-semibold text-slate-900">
          {stats.totalIdeas === undefined ? "..." : new Intl.NumberFormat("en-US").format(Number(stats.totalIdeas))}
        </p>
        <p className="mt-2 text-sm text-slate-500">
          {stats.ideasWithGrant === undefined ? "..." : stats.ideasWithGrant.toString()} received grants
        </p>
      </div>

      <div className="rounded-2xl border border-white/50 bg-gradient-to-br from-white/80 to-slate-100/80 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Tokens</p>
        <p className="mt-3 text-3xl font-semibold text-slate-900">
          {stats.tokenSymbol ?? "BTK"} - BERT governance tokens
        </p>
        <p className="mt-2 text-sm text-slate-500">{formatBtk(stats.tokenSupply, 0)} {stats.tokenSymbol ?? "BTK"} in circulation</p>
      </div>
    </div>
  );
}
