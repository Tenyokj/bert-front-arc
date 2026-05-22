"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { usePublicClient } from "wagmi";

import { contracts, ideaRegistryAbi, votingSystemAbi } from "@/lib/contracts";
import { formatTokenAmount } from "@/lib/dapp-onchain";
import { hasSubgraphConfigured, searchSubgraph } from "@/lib/subgraph";

type SearchIdea = { id: number; title: string; totalVotes: bigint };
type SearchRound = { id: number; totalVotes: bigint };

function normalize(input: string) {
  return input.trim().toLowerCase();
}

function SearchPageContent() {
  const client = usePublicClient();
  const searchParams = useSearchParams();
  const queryRaw = searchParams.get("q") ?? "";
  const q = normalize(queryRaw);
  const [ideas, setIdeas] = useState<SearchIdea[]>([]);
  const [rounds, setRounds] = useState<SearchRound[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!q) {
        setIdeas([]);
        setRounds([]);
        return;
      }

      if (!client || !contracts.ideaRegistry || !contracts.votingSystem) {
        setIdeas([]);
        setRounds([]);
        return;
      }
      const readContract = (config: Record<string, unknown>) =>
        (client as { readContract: (arg: Record<string, unknown>) => Promise<unknown> }).readContract(config);

      try {
        if (hasSubgraphConfigured()) {
          try {
            const data = await searchSubgraph(q, 300);
            const subgraphIdeas: SearchIdea[] = data.ideas.map((entry) => ({
              id: Number(entry.id),
              title: entry.title,
              totalVotes: BigInt(entry.totalVotes || "0"),
            }));
            const subgraphRounds: SearchRound[] = data.rounds.map((entry) => ({
              id: Number(entry.id),
              totalVotes: BigInt(entry.totalVotes || "0"),
            }));

            if (!cancelled) {
              setIdeas(subgraphIdeas.filter((entry) => Number.isFinite(entry.id)));
              setRounds(subgraphRounds.filter((entry) => Number.isFinite(entry.id)));
            }
            return;
          } catch {
            // Subgraph fallback to direct RPC reads below.
          }
        }

        const [totalIdeas, currentRoundId] = (await Promise.all([
          readContract({
            address: contracts.ideaRegistry,
            abi: ideaRegistryAbi,
            functionName: "totalIdeas",
          }),
          readContract({
            address: contracts.votingSystem,
            abi: votingSystemAbi,
            functionName: "currentRoundId",
          }),
        ])) as [bigint, bigint];

        const ideaCount = Number(totalIdeas);
        const roundCount = Number(currentRoundId);

        const ideaResults = ideaCount
          ? await Promise.all(
              Array.from({ length: ideaCount }, (_, i) => i + 1).map(async (id) => {
                const row = (await readContract({
                  address: contracts.ideaRegistry!,
                  abi: ideaRegistryAbi,
                  functionName: "getIdea",
                  args: [BigInt(id)],
                })) as readonly [bigint, string, string, string, string, bigint, bigint, bigint];
                return { id: Number(row[0]), title: row[2], totalVotes: row[6] };
              })
            )
          : [];

        const roundResults = roundCount
          ? await Promise.all(
              Array.from({ length: roundCount }, (_, i) => i + 1).map(async (id) => {
                try {
                  const row = (await readContract({
                    address: contracts.votingSystem!,
                    abi: votingSystemAbi,
                    functionName: "getRoundInfo",
                    args: [BigInt(id)],
                  })) as readonly [bigint, bigint[], bigint, bigint, boolean, boolean, bigint, bigint, bigint];
                  if (row[0] === 0n) return null;
                  return { id: Number(row[0]), totalVotes: row[6] };
                } catch {
                  return null;
                }
              })
            )
          : [];

        if (!cancelled) {
          setIdeas(ideaResults);
          setRounds(roundResults.filter((entry): entry is SearchRound => entry !== null));
        }
      } catch {
        if (!cancelled) {
          setIdeas([]);
          setRounds([]);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [client, q]);

  const roundResults = useMemo(
    () => (!q ? [] : rounds.filter((round) => String(round.id).includes(q))),
    [q, rounds]
  );
  const ideaResults = useMemo(
    () =>
      !q
        ? []
        : ideas.filter(
            (idea) =>
              String(idea.id).includes(q) || idea.title.toLowerCase().includes(q)
          ),
    [q, ideas]
  );

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-[#2a2d3b] p-6 md:p-8">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Search</p>
        <h1 className="mt-3 font-[var(--font-display)] text-4xl text-white md:text-6xl">Results</h1>
        <p className="mt-2 text-sm text-slate-300">Query: {queryRaw || "empty"}</p>
      </div>

      {q ? (
        <>
          <div className="space-y-3">
            <h2 className="font-[var(--font-display)] text-3xl text-white">Rounds</h2>
            {roundResults.length === 0 ? (
              <p className="rounded-xl border border-white/10 bg-[#313443] px-4 py-3 text-sm text-slate-300">No rounds found.</p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {roundResults.map((round) => (
                  <Link
                    key={round.id}
                    href={`/rounds/${round.id}`}
                    className="rounded-xl border border-white/10 bg-[#313443] px-4 py-3 transition-colors hover:border-cyan-400/40"
                  >
                    <p className="text-xl font-semibold text-white">Round #{round.id}</p>
                    <p className="mt-1 text-sm text-slate-300">Votes: {formatTokenAmount(round.totalVotes)} USDC</p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <h2 className="font-[var(--font-display)] text-3xl text-white">Ideas</h2>
            {ideaResults.length === 0 ? (
              <p className="rounded-xl border border-white/10 bg-[#313443] px-4 py-3 text-sm text-slate-300">No ideas found.</p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {ideaResults.map((idea) => (
                  <Link
                    key={idea.id}
                    href={`/ideas/${idea.id}`}
                    className="rounded-xl border border-white/10 bg-[#313443] px-4 py-3 transition-colors hover:border-cyan-400/40"
                  >
                    <p className="text-xl font-semibold text-white">Idea #{idea.id}</p>
                    <p className="mt-1 text-sm text-slate-200">{idea.title}</p>
                    <p className="mt-1 text-xs text-slate-300">Votes: {formatTokenAmount(idea.totalVotes)} USDC</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <p className="rounded-xl border border-white/10 bg-[#313443] px-4 py-3 text-sm text-slate-300">
          Enter an `id` or an idea title in the top search bar.
        </p>
      )}
    </section>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<p className="rounded-xl border border-white/10 bg-[#313443] px-4 py-3 text-sm text-slate-300">Loading search...</p>}>
      <SearchPageContent />
    </Suspense>
  );
}
