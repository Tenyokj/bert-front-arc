"use client";

import { IdeaSummaryCard, utcDate } from "@/components/dapp/ProtocolCards";
import { CollectionFilter } from "@/components/dapp/CollectionFilter";
import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { usePublicClient } from "wagmi";

import { Pagination } from "@/components/Pagination";
import { AddressIdentity } from "@/components/AddressIdentity";
import { contracts, ideaRegistryAbi } from "@/lib/contracts";
import { formatTokenAmount, mapIdeaStatus } from "@/lib/dapp-onchain";
import { fetchIdeasPageFromSubgraph, hasSubgraphConfigured } from "@/lib/subgraph";
import { defaultChain } from "@/lib/web3";

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

function IdeasPageContent() {
  const client = usePublicClient({ chainId: defaultChain.id });
  const searchParams = useSearchParams();
  const [ideas, setIdeas] = useState<OnChainIdea[]>([]);
  const [totalIdeasCount, setTotalIdeasCount] = useState(0);
  const [reviewedIdeas, setReviewedIdeas] = useState<Record<number, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dataWarning, setDataWarning] = useState<string | null>(null);
  const pageSize = 15;
  const requestedPage = Number(searchParams.get("page") ?? "1");
  const safeRequestedPage = Number.isFinite(requestedPage) ? Math.max(Math.floor(requestedPage), 1) : 1;
  const start = (safeRequestedPage - 1) * pageSize;

  useEffect(() => {
    let cancelled = false;

    async function loadIdeas() {
      if (!client || !contracts.ideaRegistry) {
        setIdeas([]);
        setIsLoading(false);
        return;
      }
      const readContract = (config: Record<string, unknown>) =>
        (client as { readContract: (arg: Record<string, unknown>) => Promise<unknown> }).readContract(config);

      setIsLoading(true);
      setLoadError(null);
      setDataWarning(null);

      try {
        const totalPromise = readContract({
          address: contracts.ideaRegistry,
          abi: ideaRegistryAbi,
          functionName: "totalIdeas",
        }) as Promise<bigint>;

        if (hasSubgraphConfigured()) {
          try {
            const [totalIdeas, subgraphRows] = await Promise.all([
              totalPromise,
              fetchIdeasPageFromSubgraph(pageSize, start),
            ]);
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
              setTotalIdeasCount(Number(totalIdeas));
              setIdeas(
                mapped
                  .filter((entry) => Number.isFinite(entry.id) && entry.id > 0)
                  .sort((a, b) => b.id - a.id)
              );
            }
            return;
          } catch (error) {
            if (!cancelled) {
              setDataWarning(`Indexer unavailable. Loading this page directly from the configured chain RPC. ${error instanceof Error ? error.message : "Subgraph request failed."}`);
            }
          }
        }

        const total = await totalPromise;

        const count = Number(total);
        if (!cancelled) setTotalIdeasCount(count);
        if (!Number.isFinite(count) || count <= 0) {
          if (!cancelled) setIdeas([]);
          return;
        }

        const ids = Array.from(
          { length: Math.min(pageSize, Math.max(count - start, 0)) },
          (_, i) => count - start - i
        ).filter((id) => id > 0);
        const results = await Promise.all(
          ids.map(async (id) => {
            const idea = (await readContract({
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
  }, [client, pageSize, start]);

  const totalPages = Math.max(1, Math.ceil(totalIdeasCount / pageSize));
  const currentPage = Math.min(safeRequestedPage, totalPages);

  const visibleIdeas = useMemo(() => ideas, [ideas]);

  useEffect(() => {
    let cancelled = false;

    async function loadReviewFlags() {
      if (!client || !contracts.ideaRegistry || visibleIdeas.length === 0) {
        if (!cancelled) setReviewedIdeas({});
        return;
      }
      const readContract = (config: Record<string, unknown>) =>
        (client as { readContract: (arg: Record<string, unknown>) => Promise<unknown> }).readContract(config);

      const rows = await Promise.all(
        visibleIdeas.map(async (idea) => {
          try {
            const count = (await readContract({
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
      <div className="rounded-3xl border border-white/10 bg-[#2a2d3b] p-5 sm:p-6 md:p-8">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Idea Registry</p>
        <h1 className="mt-3 font-[var(--font-display)] text-3xl text-white sm:text-4xl md:text-6xl">Ideas</h1>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-300">
          This is the proposal intake layer of BERT. Browse submissions, inspect authors and vote traction,
          then decide which ideas deserve treasury support in a live round.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/ideas/new"
            className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5"
          >
            Submit an idea
          </Link>
          <Link
            href="/rounds"
            className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5"
          >
            See live rounds
          </Link>
        </div>
      </div>

      {dataWarning && <p role="status" className="rounded-xl border border-amber-300/35 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">{dataWarning}</p>}
      {!contracts.ideaRegistry ? (
        <p className="rounded-xl border border-amber-300/35 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          Set <code>NEXT_PUBLIC_IDEA_REGISTRY_ADDRESS</code> in `.env` to load on-chain ideas.
        </p>
      ) : isLoading ? (
        <p className="rounded-xl border border-white/10 bg-[#313443] px-4 py-3 text-sm text-slate-300">Loading on-chain ideas...</p>
      ) : loadError ? (
        <p className="rounded-xl border border-rose-300/35 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{loadError}</p>
      ) : visibleIdeas.length === 0 ? (
        <div className="rounded-[24px] border border-white/10 bg-[#313443] p-5 sm:p-6">
          <p className="text-lg font-semibold text-white">No ideas on-chain yet.</p>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">
            Live idea intake is empty at the moment. To understand how proposals look inside BERT, open the demo registry with realistic sample ideas.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/demo/ideas"
              className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5"
            >
              View demo ideas
            </Link>
            <Link
              href="/app"
              className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5"
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      ) : (
        <CollectionFilter key={currentPage} items={visibleIdeas} getTitle={(idea) => idea.title} getStatus={(idea) => mapIdeaStatus(idea.statusCode)} renderItem={(idea) => (
          <IdeaSummaryCard key={idea.id} id={idea.id} href={`/ideas/${idea.id}`} title={idea.title} description={idea.description} status={mapIdeaStatus(idea.statusCode)} votes={formatTokenAmount(idea.totalVotes)} reviewed={reviewedIdeas[idea.id]} details={<><div><dt>Author</dt><dd><AddressIdentity address={idea.author} /></dd></div><div><dt>Created</dt><dd>{utcDate(idea.createdAt)}</dd></div></>} />
        )} />
      )}

      <Pagination basePath="/ideas" currentPage={currentPage} totalItems={totalIdeasCount} pageSize={pageSize} />
    </section>
  );
}

export default function IdeasPage() {
  return (
    <Suspense fallback={<p className="rounded-xl border border-white/10 bg-[#313443] px-4 py-3 text-sm text-slate-300">Loading ideas...</p>}>
      <IdeasPageContent />
    </Suspense>
  );
}
