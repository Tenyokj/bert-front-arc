"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { formatUnits } from "viem";
import { useAccount, usePublicClient } from "wagmi";

import { Pagination } from "@/components/Pagination";
import { FaucetClaim } from "@/components/FaucetClaim";
import {
  contracts,
  governanceTokenAbi,
  ideaRegistryAbi,
  reputationSystemAbi,
  votingSystemAbi,
  voterProgressionAbi,
} from "@/lib/contracts";
import { formatTokenAmount, mapIdeaStatus } from "@/lib/dapp-onchain";
import { fetchIdeasByAuthorFromSubgraph, hasSubgraphConfigured } from "@/lib/subgraph";

type UserIdea = {
  id: number;
  title: string;
  description: string;
  totalVotes: bigint;
  statusCode: bigint;
};

function ProfilePageContent() {
  const { address, isConnected } = useAccount();
  const client = usePublicClient();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [ideas, setIdeas] = useState<UserIdea[]>([]);
  const [btkBalance, setBtkBalance] = useState("0");
  const [reputation, setReputation] = useState<bigint>(0n);
  const [wonIdeasCount, setWonIdeasCount] = useState(0);
  const [winningVotes, setWinningVotes] = useState<bigint>(0n);
  const [isCurator, setIsCurator] = useState(false);
  const [isReviewer, setIsReviewer] = useState(false);
  const [votesToCurator, setVotesToCurator] = useState<bigint>(0n);
  const [votesToReviewer, setVotesToReviewer] = useState<bigint>(0n);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const pageSize = 15;
  const totalVotes = ideas.reduce((sum, idea) => sum + idea.totalVotes, 0n);

  useEffect(() => {
    setMounted(true);
  }, []);

  const connected = mounted && isConnected;
  const displayAddress = mounted ? address : undefined;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!client || !displayAddress || !contracts.ideaRegistry) {
        setIdeas([]);
        setBtkBalance("0");
        setReputation(0n);
        setWonIdeasCount(0);
        setWinningVotes(0n);
        setIsCurator(false);
        setIsReviewer(false);
        setVotesToCurator(0n);
        setVotesToReviewer(0n);
        return;
      }
      const readContract = (config: Record<string, unknown>) =>
        (client as { readContract: (arg: Record<string, unknown>) => Promise<unknown> }).readContract(config);

      setIsLoading(true);
      setLoadError(null);

      try {
        let rows: UserIdea[] = [];
        if (hasSubgraphConfigured()) {
          try {
            const subgraphIdeas = await fetchIdeasByAuthorFromSubgraph(displayAddress, 2000, 0);
            rows = subgraphIdeas.map((idea) => ({
              id: Number(idea.id),
              title: idea.title,
              description: idea.description,
              totalVotes: BigInt(idea.totalVotes || "0"),
              statusCode: BigInt(idea.status || "0"),
            }));
          } catch {
            rows = [];
          }
        }

        if (!rows.length) {
          const ideaIds = (await readContract({
            address: contracts.ideaRegistry,
            abi: ideaRegistryAbi,
            functionName: "getIdeasByAuthor",
            args: [displayAddress],
          })) as bigint[];

          rows = await Promise.all(
            [...ideaIds].reverse().map(async (ideaId) => {
              const idea = (await readContract({
                address: contracts.ideaRegistry!,
                abi: ideaRegistryAbi,
                functionName: "getIdea",
                args: [ideaId],
              })) as readonly [bigint, string, string, string, string, bigint, bigint, bigint];

              return {
                id: Number(idea[0]),
                title: idea[2],
                description: idea[3],
                totalVotes: idea[6],
                statusCode: idea[7],
              } satisfies UserIdea;
            })
          );
        }
        rows.sort((a, b) => b.id - a.id);

        let nextBtk = "0";
        if (contracts.governanceToken) {
          const rawBalance = (await readContract({
            address: contracts.governanceToken,
            abi: governanceTokenAbi,
            functionName: "balanceOf",
            args: [displayAddress],
          })) as bigint;
          nextBtk = new Intl.NumberFormat("en-US", {
            maximumFractionDigits: 2,
          }).format(Number(formatUnits(rawBalance, 18)));
        }

        if (!cancelled) {
          setIdeas(rows);
          setBtkBalance(nextBtk);
        }

        if (contracts.votingSystem) {
          let nextWonIdeasCount = 0;
          const currentRoundId = (await readContract({
            address: contracts.votingSystem,
            abi: votingSystemAbi,
            functionName: "currentRoundId",
          })) as bigint;
          const roundCount = currentRoundId > 1n ? Number(currentRoundId - 1n) : 0;

          if (roundCount > 0) {
            const roundInfos = await Promise.all(
              Array.from({ length: roundCount }, (_, idx) =>
                readContract({
                  address: contracts.votingSystem!,
                  abi: votingSystemAbi,
                  functionName: "getRoundInfo",
                  args: [BigInt(idx + 1)],
                })
              )
            );

            const winningIds = new Set(
              roundInfos
                .map((row) => (row as readonly unknown[])[7] as bigint)
                .filter((id) => id > 0n)
                .map((id) => id.toString())
            );
            nextWonIdeasCount = rows.filter((idea) => winningIds.has(BigInt(idea.id).toString())).length;
          }

          if (!cancelled) setWonIdeasCount(nextWonIdeasCount);
        }

        if (contracts.reputationSystem) {
          const isInitialized = (await readContract({
            address: contracts.reputationSystem,
            abi: reputationSystemAbi,
            functionName: "isInitialized",
            args: [displayAddress],
          })) as boolean;
          const currentReputation = isInitialized
            ? ((await readContract({
                address: contracts.reputationSystem,
                abi: reputationSystemAbi,
                functionName: "getReputation",
                args: [displayAddress],
              })) as bigint)
            : 0n;
          if (!cancelled) setReputation(currentReputation);
        }

        if (contracts.voterProgression) {
          const progression = (await readContract({
            address: contracts.voterProgression,
            abi: voterProgressionAbi,
            functionName: "getProgressionStatus",
            args: [displayAddress],
          })) as readonly [bigint, boolean, boolean, bigint, bigint];
          if (!cancelled) {
            setWinningVotes(progression[0]);
            setIsCurator(progression[1]);
            setIsReviewer(progression[2]);
            setVotesToCurator(progression[3]);
            setVotesToReviewer(progression[4]);
          }
        }
      } catch (error) {
        if (!cancelled) setLoadError(error instanceof Error ? error.message : "Failed to load profile data");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [client, displayAddress]);

  const requestedPage = Number(searchParams.get("page") ?? "1");
  const totalPages = Math.max(1, Math.ceil(ideas.length / pageSize));
  const currentPage = Number.isFinite(requestedPage)
    ? Math.min(Math.max(Math.floor(requestedPage), 1), totalPages)
    : 1;
  const start = (currentPage - 1) * pageSize;
  const visibleIdeas = useMemo(() => ideas.slice(start, start + pageSize), [ideas, start]);

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-[#2a2d3b] p-6 md:p-8">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">User Cabinet</p>
        <h1 className="mt-3 font-[var(--font-display)] text-4xl text-white md:text-6xl">
          {connected && displayAddress ? "Connected Wallet" : "Profile"}
        </h1>
        <p className="mt-2 break-all text-sm text-slate-400">{displayAddress || "Wallet not connected"}</p>
      </div>

      {!connected ? (
        <p className="rounded-xl border border-amber-300/35 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          Connect wallet to load your profile and ideas.
        </p>
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-[#313443] p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Ideas submitted</p>
              <p className="mt-2 text-3xl font-semibold text-white">{ideas.length}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#313443] p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Connected</p>
              <p className="mt-2 text-3xl font-semibold text-white">Yes</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#313443] p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Total votes</p>
              <p className="mt-2 text-3xl font-semibold text-white">
                {formatTokenAmount(totalVotes)} BTK
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#313443] p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-400">BTK</p>
              <p className="mt-2 text-2xl font-semibold text-white">{btkBalance} BTK</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#313443] p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Reputation</p>
              <p className="mt-2 text-3xl font-semibold text-white">{reputation.toString()}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#313443] p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Winning ideas</p>
              <p className="mt-2 text-3xl font-semibold text-white">{wonIdeasCount}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#313443] p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Winning votes (as voter)</p>
              <p className="mt-2 text-3xl font-semibold text-white">{winningVotes.toString()}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#313443] p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Voter progression</p>
              <p className="mt-2 text-sm text-slate-200">
                Curator: {isCurator ? "Yes" : `${votesToCurator.toString()} left`}
              </p>
              <p className="mt-1 text-sm text-slate-200">
                Reviewer: {isReviewer ? "Yes" : `${votesToReviewer.toString()} left`}
              </p>
            </div>
          </div>

          <FaucetClaim />

          <div className="rounded-3xl border border-white/10 bg-[#2a2d3b] p-5 md:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-[var(--font-display)] text-3xl text-white">My ideas</h2>
              <Link href="/ideas/new" className="rounded-lg bg-[#3b82f6] px-4 py-2 text-sm font-semibold text-white">
                Create idea
              </Link>
            </div>

            {isLoading ? (
              <p className="mt-4 rounded-xl border border-white/10 bg-[#313443] px-4 py-3 text-sm text-slate-300">Loading on-chain ideas...</p>
            ) : loadError ? (
              <p className="mt-4 rounded-xl border border-rose-300/35 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{loadError}</p>
            ) : (
              <div className="mt-4 grid gap-3">
                {ideas.length === 0 ? (
                  <p className="rounded-xl border border-white/10 bg-[#313443] px-4 py-3 text-sm text-slate-300">No ideas yet.</p>
                ) : (
                  visibleIdeas.map((idea) => (
                    <Link
                      key={idea.id}
                      href={`/ideas/${idea.id}`}
                      className="rounded-xl border border-white/10 bg-[#313443] px-4 py-3 transition-colors hover:border-cyan-400/40"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-lg font-semibold text-white">{idea.title}</p>
                        <p className="rounded-full bg-cyan-500/10 px-2.5 py-1 text-xs font-semibold text-cyan-300">
                          Idea #{idea.id}
                        </p>
                      </div>
                      <div className="mt-2 grid gap-2 text-sm text-slate-300 md:grid-cols-2">
                        <p>Status: {mapIdeaStatus(idea.statusCode)}</p>
                        <p>Total votes: {formatTokenAmount(idea.totalVotes)} BTK</p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}

            <Pagination basePath="/profile" currentPage={currentPage} totalItems={ideas.length} pageSize={pageSize} />
          </div>
        </>
      )}
    </section>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<p className="rounded-xl border border-white/10 bg-[#313443] px-4 py-3 text-sm text-slate-300">Loading profile...</p>}>
      <ProfilePageContent />
    </Suspense>
  );
}
