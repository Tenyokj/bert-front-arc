"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatUnits } from "viem";
import { useReadContract } from "wagmi";
import {
  contracts,
  fundingPoolAbi,
  grantManagerAbi,
  ideaRegistryAbi,
  usdcAbi,
  votingSystemAbi,
} from "@/lib/contracts";
import SiteFooter from "@/components/SiteFooter";
import { fetchAllIdeasFromSubgraph, hasSubgraphConfigured } from "@/lib/subgraph";
import { USDC_DECIMALS } from "@/lib/dapp-onchain";

function formatUsdc(value?: bigint) {
  if (value === undefined) return "—";
  const num = Number(formatUnits(value, USDC_DECIMALS));
  if (!Number.isFinite(num)) return "—";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(num);
}

function formatInt(value?: bigint) {
  if (value === undefined) return "—";
  return new Intl.NumberFormat("en-US").format(Number(value));
}

function formatSeconds(value?: bigint) {
  if (value === undefined) return "—";
  const sec = Number(value);
  if (!Number.isFinite(sec)) return "—";
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  const rem = sec % 60;
  if (min < 60) return rem ? `${min}m ${rem}s` : `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export default function ProtocolStatsPage() {
  const [subgraphIdeaCount, setSubgraphIdeaCount] = useState<bigint | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSubgraphIdeaCount() {
      if (!hasSubgraphConfigured()) {
        if (!cancelled) setSubgraphIdeaCount(null);
        return;
      }

      try {
        const ideas = await fetchAllIdeasFromSubgraph();
        if (!cancelled) setSubgraphIdeaCount(BigInt(ideas.length));
      } catch {
        if (!cancelled) setSubgraphIdeaCount(null);
      }
    }

    void loadSubgraphIdeaCount();
    return () => {
      cancelled = true;
    };
  }, []);

  const { data: totalPoolBalance } = useReadContract({
    address: contracts.fundingPool,
    abi: fundingPoolAbi,
    functionName: "totalPoolBalance",
    query: { enabled: Boolean(contracts.fundingPool) },
  });

  const { data: protocolReserve } = useReadContract({
    address: contracts.fundingPool,
    abi: fundingPoolAbi,
    functionName: "protocolReserve",
    query: { enabled: Boolean(contracts.fundingPool) },
  });

  const { data: distributionCount } = useReadContract({
    address: contracts.fundingPool,
    abi: fundingPoolAbi,
    functionName: "getDistributionCount",
    query: { enabled: Boolean(contracts.fundingPool) },
  });

  const { data: poolPaused } = useReadContract({
    address: contracts.fundingPool,
    abi: fundingPoolAbi,
    functionName: "isPaused",
    query: { enabled: Boolean(contracts.fundingPool) },
  });

  const { data: currentRoundId } = useReadContract({
    address: contracts.votingSystem,
    abi: votingSystemAbi,
    functionName: "currentRoundId",
    query: { enabled: Boolean(contracts.votingSystem) },
  });

  const { data: ideasPerRound } = useReadContract({
    address: contracts.votingSystem,
    abi: votingSystemAbi,
    functionName: "IDEAS_PER_ROUND",
    query: { enabled: Boolean(contracts.votingSystem) },
  });

  const { data: votingDuration } = useReadContract({
    address: contracts.votingSystem,
    abi: votingSystemAbi,
    functionName: "VOTING_DURATION",
    query: { enabled: Boolean(contracts.votingSystem) },
  });

  const { data: minStake } = useReadContract({
    address: contracts.votingSystem,
    abi: votingSystemAbi,
    functionName: "minStake",
    query: { enabled: Boolean(contracts.votingSystem) },
  });

  const { data: votingPaused } = useReadContract({
    address: contracts.votingSystem,
    abi: votingSystemAbi,
    functionName: "isPaused",
    query: { enabled: Boolean(contracts.votingSystem) },
  });

  const { data: humanOnlyVoting } = useReadContract({
    address: contracts.votingSystem,
    abi: votingSystemAbi,
    functionName: "humanOnlyVoting",
    query: { enabled: Boolean(contracts.votingSystem) },
  });

  const { data: maxVoteAmount } = useReadContract({
    address: contracts.votingSystem,
    abi: votingSystemAbi,
    functionName: "maxVoteAmount",
    query: { enabled: Boolean(contracts.votingSystem) },
  });

  const { data: totalIdeas } = useReadContract({
    address: contracts.ideaRegistry,
    abi: ideaRegistryAbi,
    functionName: "totalIdeas",
    query: { enabled: Boolean(contracts.ideaRegistry) },
  });

  const { data: authorSharePercent } = useReadContract({
    address: contracts.grantManager,
    abi: grantManagerAbi,
    functionName: "authorSharePercent",
    query: { enabled: Boolean(contracts.grantManager) },
  });

  const { data: grantPaused } = useReadContract({
    address: contracts.grantManager,
    abi: grantManagerAbi,
    functionName: "isPaused",
    query: { enabled: Boolean(contracts.grantManager) },
  });

  const { data: totalSupply } = useReadContract({
    address: contracts.usdc,
    abi: usdcAbi,
    functionName: "totalSupply",
    query: { enabled: Boolean(contracts.usdc) },
  });
  const currentRoundIdValue = currentRoundId as bigint | undefined;
  const totalIdeasValue =
    (totalIdeas as bigint | undefined) ?? subgraphIdeaCount ?? undefined;
  const totalRounds = currentRoundIdValue !== undefined && currentRoundIdValue > 1n ? currentRoundIdValue - 1n : 0n;

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto max-w-[1450px] px-6 py-8 md:px-10 lg:px-14">
            <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-teal-400 to-blue-600 shadow-[0_8px_24px_rgba(37,99,235,0.35)]" />
            <span className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-600">
              <Link href="/" className="transition-colors hover:text-slate-900">
              BERT
            </Link>
            </span>
          </div>
          <nav className="hidden items-center gap-8 text-sm text-slate-600 md:flex">
            <Link href="/how-it-works" className="transition-colors hover:text-slate-900">
              How it works
            </Link>
            <Link href="/rounds" className="transition-colors hover:text-slate-900">
              Active rounds
            </Link>
            <a href="https://bertdao-docs.vercel.app/" className="transition-colors hover:text-slate-900">
              Docs
            </a>
          </nav>
          <Link
            href="/rounds"
            className="rounded-full border border-white/60 bg-white/70 px-5 py-2 text-sm font-semibold text-slate-900 shadow-[0_12px_30px_rgba(15,23,42,0.08)] backdrop-blur transition hover:-translate-y-0.5"
          >
            Launch App
          </Link>
        </header>

        <main className="mt-10 space-y-8">
          <section>
            <p className="text-xs uppercase tracking-[0.28em] text-teal-600">Protocol Stats</p>
            <h1 className="mt-3 text-4xl font-semibold text-slate-900 dark:text-slate-100">Live On-Chain Metrics</h1>
            <p className="mt-4 max-w-4xl text-base leading-relaxed text-slate-600 dark:text-slate-300">
              This page gives one operational view for protocol operators and contributors. It centralizes key read-only values from
              core contracts so you do not need to open each dApp screen to validate protocol state.
            </p>
            <p className="mt-2 max-w-4xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              Data source model: direct on-chain RPC reads plus indexed queries on pages that use <code>NEXT_PUBLIC_SUBGRAPH_URL</code>.
            </p>
          </section>

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <article className="rounded-xl border border-white/15 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Pool Balance</p>
              <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">{formatUsdc(totalPoolBalance as bigint | undefined)} USDC</p>
              <p className="mt-1 text-xs text-slate-500">FundingPool.totalPoolBalance()</p>
            </article>
            <article className="rounded-xl border border-white/15 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Protocol Reserve</p>
              <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">{formatUsdc(protocolReserve as bigint | undefined)} USDC</p>
              <p className="mt-1 text-xs text-slate-500">FundingPool.protocolReserve()</p>
            </article>
            <article className="rounded-xl border border-white/15 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Distributions</p>
              <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">{formatInt(distributionCount as bigint | undefined)}</p>
              <p className="mt-1 text-xs text-slate-500">FundingPool.getDistributionCount()</p>
            </article>
            <article className="rounded-xl border border-white/15 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Total Ideas</p>
              <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">{formatInt(totalIdeasValue)}</p>
              <p className="mt-1 text-xs text-slate-500">{totalIdeas ? "IdeaRegistry.totalIdeas()" : "Subgraph IdeaCreated index"}</p>
            </article>
          </section>

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <article className="rounded-xl border border-white/15 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Total Rounds</p>
              <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">{formatInt(totalRounds)}</p>
              <p className="mt-1 text-xs text-slate-500">VotingSystem.currentRoundId()</p>
            </article>
            <article className="rounded-xl border border-white/15 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Ideas Per Round</p>
              <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">{formatInt(ideasPerRound as bigint | undefined)}</p>
              <p className="mt-1 text-xs text-slate-500">VotingSystem.IDEAS_PER_ROUND()</p>
            </article>
            <article className="rounded-xl border border-white/15 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Voting Duration</p>
              <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">{formatSeconds(votingDuration as bigint | undefined)}</p>
              <p className="mt-1 text-xs text-slate-500">VotingSystem.VOTING_DURATION()</p>
            </article>
            <article className="rounded-xl border border-white/15 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Min Stake</p>
              <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">{formatUsdc(minStake as bigint | undefined)} USDC</p>
              <p className="mt-1 text-xs text-slate-500">VotingSystem.minStake()</p>
            </article>
          </section>

          <section className="grid gap-3 sm:grid-cols-2">
            <article className="rounded-xl border border-amber-200/30 bg-[linear-gradient(180deg,rgba(120,53,15,0.12),rgba(51,24,12,0.18))] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-amber-300">Max vote per idea</p>
              <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">
                {formatUsdc(maxVoteAmount as bigint | undefined)} USDC
              </p>
              <p className="mt-1 text-xs text-slate-500">Per-wallet influence cap applied to each idea in a round</p>
            </article>
            <article className="rounded-xl border border-teal-200/30 bg-[linear-gradient(180deg,rgba(13,148,136,0.12),rgba(15,23,42,0.14))] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-teal-300">Human-only voting</p>
              <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">
                {humanOnlyVoting === undefined ? "—" : humanOnlyVoting ? "Enabled" : "Disabled"}
              </p>
              <p className="mt-1 text-xs text-slate-500">Voting access requires an active onchain verification record</p>
            </article>
          </section>

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <article className="rounded-xl border border-white/15 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Author Share</p>
              <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">{authorSharePercent?.toString() ?? "—"}%</p>
              <p className="mt-1 text-xs text-slate-500">GrantManager.authorSharePercent()</p>
            </article>
            <article className="rounded-xl border border-white/15 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">USDC Total Supply</p>
              <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">{formatUsdc(totalSupply as bigint | undefined)} USDC</p>
              <p className="mt-1 text-xs text-slate-500">USDC.totalSupply()</p>
            </article>
            <article className="rounded-xl border border-white/15 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Settlement Asset</p>
              <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">USDC</p>
              <p className="mt-1 text-xs text-slate-500">Stablecoin-native funding flow</p>
            </article>
            <article className="rounded-xl border border-white/15 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Funding Mode</p>
              <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">Arc + USDC</p>
              <p className="mt-1 text-xs text-slate-500">Direct wallet funding model</p>
            </article>
          </section>

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <article className="rounded-xl border border-white/15 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Chain Profile</p>
              <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">Arc</p>
              <p className="mt-1 text-xs text-slate-500">Stablecoin settlement environment</p>
            </article>
            <article className="rounded-xl border border-white/15 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Funding Pool State</p>
              <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">{poolPaused === undefined ? "—" : poolPaused ? "Paused" : "Active"}</p>
              <p className="mt-1 text-xs text-slate-500">FundingPool.isPaused()</p>
            </article>
            <article className="rounded-xl border border-white/15 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Voting State</p>
              <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">{votingPaused === undefined ? "—" : votingPaused ? "Paused" : "Active"}</p>
              <p className="mt-1 text-xs text-slate-500">VotingSystem.isPaused()</p>
            </article>
            <article className="rounded-xl border border-white/15 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Grant Manager State</p>
              <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">{grantPaused === undefined ? "—" : grantPaused ? "Paused" : "Active"}</p>
              <p className="mt-1 text-xs text-slate-500">GrantManager.isPaused()</p>
            </article>
          </section>

          <section className="flex flex-wrap gap-2">
            <Link href="/rounds" className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100">Rounds</Link>
            <Link href="/pool" className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100">Pool</Link>
            <Link href="/policy-docs" className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100">Policy Docs</Link>
            <Link href="/on-chain-votes" className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white">On-chain Votes</Link>
          </section>
        </main>

                       <SiteFooter />
      </div>
    </div>
  );
}
