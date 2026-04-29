"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatUnits } from "viem";
import { useReadContract } from "wagmi";
import {
  contracts,
  brtfaucetAbi,
  fundingPoolAbi,
  governanceTokenAbi,
  grantManagerAbi,
  ideaRegistryAbi,
  votingSystemAbi,
} from "@/lib/contracts";
import ParticleText from "@/components/ParticleText";
import { FaGithub, FaReddit, FaMailBulk, FaTelegramPlane } from "react-icons/fa";
import { fetchAllIdeasFromSubgraph, hasSubgraphConfigured } from "@/lib/subgraph";

function formatBtk(value?: bigint) {
  if (value === undefined) return "—";
  const num = Number(formatUnits(value, 18));
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
    address: contracts.governanceToken,
    abi: governanceTokenAbi,
    functionName: "totalSupply",
    query: { enabled: Boolean(contracts.governanceToken) },
  });

  const { data: maxSupply } = useReadContract({
    address: contracts.governanceToken,
    abi: governanceTokenAbi,
    functionName: "maxSupply",
    query: { enabled: Boolean(contracts.governanceToken) },
  });

  const { data: claimAmount } = useReadContract({
    address: contracts.faucet,
    abi: brtfaucetAbi,
    functionName: "claimAmount",
    query: { enabled: Boolean(contracts.faucet) },
  });

  const { data: cooldown } = useReadContract({
    address: contracts.faucet,
    abi: brtfaucetAbi,
    functionName: "cooldown",
    query: { enabled: Boolean(contracts.faucet) },
  });

  const { data: faucetPaused } = useReadContract({
    address: contracts.faucet,
    abi: brtfaucetAbi,
    functionName: "isPaused",
    query: { enabled: Boolean(contracts.faucet) },
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
            <Link href="/faq" className="transition-colors hover:text-slate-900">
              Docs
            </Link>
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
              This page gives one operational view for DAO members and operators. It centralizes key read-only values from
              core contracts so you do not need to open each dApp screen to validate protocol state.
            </p>
            <p className="mt-2 max-w-4xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              Data source model: direct on-chain RPC reads plus indexed queries on pages that use <code>NEXT_PUBLIC_SUBGRAPH_URL</code>.
            </p>
          </section>

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <article className="rounded-xl border border-white/15 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Pool Balance</p>
              <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">{formatBtk(totalPoolBalance as bigint | undefined)} BTK</p>
              <p className="mt-1 text-xs text-slate-500">FundingPool.totalPoolBalance()</p>
            </article>
            <article className="rounded-xl border border-white/15 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Protocol Reserve</p>
              <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">{formatBtk(protocolReserve as bigint | undefined)} BTK</p>
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
              <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">{formatBtk(minStake as bigint | undefined)} BTK</p>
              <p className="mt-1 text-xs text-slate-500">VotingSystem.minStake()</p>
            </article>
          </section>

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <article className="rounded-xl border border-white/15 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Author Share</p>
              <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">{authorSharePercent?.toString() ?? "—"}%</p>
              <p className="mt-1 text-xs text-slate-500">GrantManager.authorSharePercent()</p>
            </article>
            <article className="rounded-xl border border-white/15 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">BTK Total Supply</p>
              <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">{formatBtk(totalSupply as bigint | undefined)} BTK</p>
              <p className="mt-1 text-xs text-slate-500">GovernanceToken.totalSupply()</p>
            </article>
            <article className="rounded-xl border border-white/15 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">BTK Max Supply</p>
              <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">{formatBtk(maxSupply as bigint | undefined)} BTK</p>
              <p className="mt-1 text-xs text-slate-500">GovernanceToken.maxSupply()</p>
            </article>
            <article className="rounded-xl border border-white/15 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Faucet Claim</p>
              <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">{formatBtk(claimAmount as bigint | undefined)} BTK</p>
              <p className="mt-1 text-xs text-slate-500">Faucet.claimAmount()</p>
            </article>
          </section>

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <article className="rounded-xl border border-white/15 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Faucet Cooldown</p>
              <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">{formatSeconds(cooldown as bigint | undefined)}</p>
              <p className="mt-1 text-xs text-slate-500">
                Faucet.cooldown() · {faucetPaused === undefined ? "—" : faucetPaused ? "Paused" : "Active"}
              </p>
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

                       <footer className="relative mt-32 border-t border-white/20 pb-16 pt-12">
                          <div className="pointer-events-none absolute -left-10 top-8 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.25),transparent_65%)] blur-2xl" />
                          <div className="pointer-events-none absolute right-[-3rem] top-16 h-52 w-52 rounded-full bg-[radial-gradient(circle,rgba(244,63,94,0.22),transparent_65%)] blur-2xl" />
                          <div className="text-sm text-slate-500">
                            Live metrics come from on-chain reads and indexed sources where available. Some roadmap sections describe planned protocol direction.
                          </div>
                
                          <div className="mt-10 grid gap-4 border-b border-white/20 pb-8 md:hidden">
                            <div className="flex flex-wrap gap-3 text-base text-slate-600 dark:text-slate-300">
                              <a className="footer-link" href="https://bertdao-docs.vercel.app/">Docs</a>
                              <a className="footer-link" href="/privacy-notice">Privacy Notice</a>
                              <a className="footer-link" href="/terms-of-use">Terms of Use</a>
                            </div>
                            <div className="flex items-center gap-5 text-slate-600 dark:text-slate-300">
                              <a href="https://github.com/tenyokj" aria-label="GitHub"><FaGithub className="text-2xl transition-transform duration-300 hover:-translate-y-1" /></a>
                              <a href="https://www.reddit.com/user/PralineSeparate5261/" aria-label="Reddit"><FaReddit className="text-2xl transition-transform duration-300 hover:-translate-y-1" /></a>
                              <a href="https://t.me/+8DEt_M62Db00NzYy" target="_blank" rel="noreferrer" aria-label="Telegram"><FaTelegramPlane className="text-2xl transition-transform duration-300 hover:-translate-y-1" /></a>
                              <a href="mailto:av7794257@gmail.com" aria-label="Email"><FaMailBulk className="text-2xl transition-transform duration-300 hover:-translate-y-1" /></a>
                            </div>
                          </div>

                          <div className="mt-10 hidden gap-10 border-b border-white/20 pb-10 md:grid lg:grid-cols-4">
                            <div>
                              <h4 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                                BERT Products
                              </h4>
                              <div className="mt-6 flex flex-col gap-3 text-lg text-slate-600 dark:text-slate-300">
                                <a className="footer-link" href="https://github.com/Tenyokj/bert-core/blob/main/contracts/BERT/docs_contracts/IdeaRegistryUpgradeable.md">Idea Registry</a>
                                <a className="footer-link" href="https://github.com/Tenyokj/bert-core/blob/main/contracts/BERT/docs_contracts/VotingSystemUpgradeable.md">Voting Rounds</a>
                                <a className="footer-link" href="https://github.com/Tenyokj/bert-core/blob/main/contracts/BERT/docs_contracts/GrantManagerUpgradeable.md">Grant Engine</a>
                                <a className="footer-link" href="https://github.com/Tenyokj/bert-core/blob/main/contracts/BERT/docs_contracts/ReputationSystemUpgradeable.md">Reputation Layer</a>
                                <a className="footer-link" href="https://github.com/Tenyokj/bert-core/blob/main/docs/UPGRADES.md">Upgrade Modules</a>
                              </div>
                            </div>
                
                            <div>
                              <h4 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                                BERT DAO
                              </h4>
                              <div className="mt-6 flex flex-col gap-3 text-lg text-slate-600 dark:text-slate-300">
                                <a className="footer-link" href="/governance-stack">Governance stack</a>
                                <a className="footer-link" href="/policy-docs">Policy docs</a>
                                <a className="footer-link" href="/on-chain-votes">On-chain votes</a>
                                <a className="footer-link" href="/treasury-policies">Treasury policies</a>
                              </div>
                            </div>
                
                            <div>
                              <h4 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                                Builders
                              </h4>
                              <div className="mt-6 flex flex-col gap-3 text-lg text-slate-600 dark:text-slate-300">
                                <a className="footer-link" href="https://bertdao-docs.vercel.app">Docs</a>
                                <a className="footer-link" href="/developer-guide">Developer guide</a>
                                <a className="footer-link" href="https://github.com/Tenyokj/bert-core/blob/main/docs/CONTRACTS.md">Smart contracts</a>
                              </div>
                            </div>
                
                            <div>
                              <h4 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                                Resources
                              </h4>
                              <div className="mt-6 flex flex-col gap-3 text-lg text-slate-600 dark:text-slate-300">
                                <a className="footer-link" href="/how-it-works">How it works</a>
                                <a className="footer-link" href="/faq">FAQ</a>
                                <a className="footer-link" href="/sepolia-guide">Sepolia guide</a>
                                <a className="footer-link" href="/press-kit">Press kit</a>
                                <a className="footer-link" href="/build-dapps">Build dApps</a>
                              </div>
                            </div>
                          </div>
                
                          <div className="mt-10 hidden gap-10 md:grid lg:grid-cols-4">
                            <div>
              <h4 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                Social Links
              </h4>
              <div className="mt-6 flex items-center gap-5 text-slate-600 dark:text-slate-300">
                <a href="https://github.com/tenyokj" aria-label="GitHub"><FaGithub className="text-2xl transition-transform duration-300 hover:-translate-y-1" /></a>
                <a href="https://www.reddit.com/user/PralineSeparate5261/" aria-label="Reddit"><FaReddit className="text-2xl transition-transform duration-300 hover:-translate-y-1" /></a>
                <a href="https://t.me/+8DEt_M62Db00NzYy" target="_blank" rel="noreferrer" aria-label="Telegram"><FaTelegramPlane className="text-2xl transition-transform duration-300 hover:-translate-y-1" /></a>
                <a href="mailto:av7794257@gmail.com" aria-label="Email"><FaMailBulk className="text-2xl transition-transform duration-300 hover:-translate-y-1" /></a>
              </div>
            </div>
            <div>
              <h4 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                Analytics
                              </h4>
                              <div className="mt-6 flex flex-col gap-3 text-lg text-slate-600 dark:text-slate-300">
                                <a className="footer-link" href="/protocol-stats">Protocol stats</a>
                                <a className="footer-link" href="/treasury-policies#reporting">Treasury metrics</a>
                              </div>
                            </div>
                            <div className="lg:col-span-2">
                              <div className="flex flex-col gap-3 text-lg text-slate-500 dark:text-slate-300 lg:flex-row lg:items-center lg:justify-end">
                                <a className="footer-link" href="/privacy-notice">Privacy Notice</a>
                                <a className="footer-link" href="/terms-of-use">Terms of Use</a>
                                <a className="footer-link" href="/security-roadmap">Security Roadmap</a>
                              </div>
                              <div className="mt-2 ml-auto w-fit">
                                <ParticleText text="BERT" width={680} height={160} />
                              </div>
                            </div>
                          </div>
                        </footer>
      </div>
    </div>
  );
}
