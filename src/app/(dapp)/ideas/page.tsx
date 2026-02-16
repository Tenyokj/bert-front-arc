"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { usePublicClient } from "wagmi";

import { Pagination } from "@/components/Pagination";
import { AddressIdentity } from "@/components/AddressIdentity";
import { contracts, ideaRegistryAbi } from "@/lib/contracts";
import { formatTokenAmount, mapIdeaStatus } from "@/lib/dapp-onchain";
import { fetchIdeasPageFromSubgraph, hasSubgraphConfigured } from "@/lib/subgraph";

type OnChainIdea = {
  id: number;
  author: string;
  title: string;
  description: string;
  link: string;
  createdAt: bigint;
  totalVotes: bigint;
  statusCode: bigint;
};

export default function IdeasPage() {
  const client = usePublicClient();
  const searchParams = useSearchParams();
  const [ideas, setIdeas] = useState<OnChainIdea[]>([]);
  const [reviewedIdeas, setReviewedIdeas] = useState<Record<number, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const pageSize = 15;

  useEffect(() => {
    let cancelled = false;

    async function loadIdeas() {
      if (!client || !contracts.ideaRegistry) {
        setIdeas([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setLoadError(null);

      try {
        if (hasSubgraphConfigured()) {
          try {
            const subgraphRows = await fetchIdeasPageFromSubgraph(2000, 0);
            const mapped = subgraphRows.map((idea) => ({
              id: Number(idea.id),
              author: idea.author,
              title: idea.title,
              description: idea.description,
              link: idea.link,
              createdAt: BigInt(idea.createdAt || "0"),
              totalVotes: BigInt(idea.totalVotes || "0"),
              statusCode: BigInt(idea.status || "0"),
            })) satisfies OnChainIdea[];

            if (!cancelled) {
              setIdeas(
                mapped
                  .filter((entry) => Number.isFinite(entry.id) && entry.id > 0)
                  .sort((a, b) => b.id - a.id)
              );
            }
            return;
          } catch {
            // Subgraph fallback to direct RPC reads below.
          }
        }

        const total = (await client.readContract({
          address: contracts.ideaRegistry,
          abi: ideaRegistryAbi,
          functionName: "totalIdeas",
        })) as bigint;

        const count = Number(total);
        if (!Number.isFinite(count) || count <= 0) {
          if (!cancelled) setIdeas([]);
          return;
        }

        const ids = Array.from({ length: count }, (_, i) => i + 1).reverse();
        const results = await Promise.all(
          ids.map(async (id) => {
            const idea = (await client.readContract({
              address: contracts.ideaRegistry!,
              abi: ideaRegistryAbi,
              functionName: "getIdea",
              args: [BigInt(id)],
            })) as readonly [bigint, string, string, string, string, bigint, bigint, bigint];

            return {
              id: Number(idea[0]),
              author: idea[1],
              title: idea[2],
              description: idea[3],
              link: idea[4],
              createdAt: idea[5],
              totalVotes: idea[6],
              statusCode: idea[7],
            } satisfies OnChainIdea;
          })
        );

        if (!cancelled) setIdeas(results);
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : "Failed to load ideas");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadIdeas();
    return () => {
      cancelled = true;
    };
  }, [client]);

  const requestedPage = Number(searchParams.get("page") ?? "1");
  const totalPages = Math.max(1, Math.ceil(ideas.length / pageSize));
  const currentPage = Number.isFinite(requestedPage)
    ? Math.min(Math.max(Math.floor(requestedPage), 1), totalPages)
    : 1;
  const start = (currentPage - 1) * pageSize;

  const visibleIdeas = useMemo(
    () => ideas.slice(start, start + pageSize),
    [ideas, start]
  );

  useEffect(() => {
    let cancelled = false;

    async function loadReviewFlags() {
      if (!client || !contracts.ideaRegistry || visibleIdeas.length === 0) {
        if (!cancelled) setReviewedIdeas({});
        return;
      }

      const rows = await Promise.all(
        visibleIdeas.map(async (idea) => {
          try {
            const count = (await client.readContract({
              address: contracts.ideaRegistry!,
              abi: ideaRegistryAbi,
              functionName: "getReviewCount",
              args: [BigInt(idea.id)],
            })) as bigint;
            return [idea.id, count > 0n] as const;
          } catch {
            return [idea.id, false] as const;
          }
        })
      );

      if (!cancelled) {
        setReviewedIdeas(Object.fromEntries(rows));
      }
    }

    void loadReviewFlags();
    return () => {
      cancelled = true;
    };
  }, [client, visibleIdeas]);

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-[#2a2d3b] p-6 md:p-8">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Idea Registry</p>
        <h1 className="mt-3 font-[var(--font-display)] text-4xl text-white md:text-6xl">Ideas</h1>
      </div>

      {!contracts.ideaRegistry ? (
        <p className="rounded-xl border border-amber-300/35 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          Set <code>NEXT_PUBLIC_IDEA_REGISTRY_ADDRESS</code> in `.env` to load on-chain ideas.
        </p>
      ) : isLoading ? (
        <p className="rounded-xl border border-white/10 bg-[#313443] px-4 py-3 text-sm text-slate-300">Loading on-chain ideas...</p>
      ) : loadError ? (
        <p className="rounded-xl border border-rose-300/35 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{loadError}</p>
      ) : visibleIdeas.length === 0 ? (
        <p className="rounded-xl border border-white/10 bg-[#313443] px-4 py-3 text-sm text-slate-300">No ideas on-chain yet.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {visibleIdeas.map((idea) => (
            <Link
              key={idea.id}
              href={`/ideas/${idea.id}`}
              className="rounded-2xl border border-white/10 bg-[#313443] p-5 transition-colors duration-300 hover:border-cyan-400/40"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-slate-300">Idea #{idea.id}</p>
                <div className="flex items-center gap-1.5">
                  {reviewedIdeas[idea.id] && (
                    <span className="rounded-full border border-emerald-300/45 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-200">
                      Reviewed
                    </span>
                  )}
                  <span className="rounded-full bg-cyan-500/15 px-2.5 py-1 text-xs font-semibold text-cyan-300">
                    {mapIdeaStatus(idea.statusCode)}
                  </span>
                </div>
              </div>
              <h2 className="mt-3 text-2xl font-semibold text-white">{idea.title}</h2>
              <p className="mt-2 line-clamp-2 text-sm text-slate-300">{idea.description}</p>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-300">
                <p className="rounded-lg border border-white/10 bg-[#262938] px-2.5 py-2">
                  Total votes: {formatTokenAmount(idea.totalVotes)} BTK
                </p>
                <div className="rounded-lg border border-white/10 bg-[#262938] px-2.5 py-2">
                  <p className="mb-1 text-slate-300">Author:</p>
                  <AddressIdentity address={idea.author} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Pagination basePath="/ideas" currentPage={currentPage} totalItems={ideas.length} pageSize={pageSize} />
    </section>
  );
}
