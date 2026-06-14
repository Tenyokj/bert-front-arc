"use client";

import Link from "next/link";
import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Pagination } from "@/components/Pagination";
import { ideas } from "@/lib/dapp-demo";

function DemoIdeasPageContent() {
  const searchParams = useSearchParams();
  const pageSize = 15;
  const requestedPage = Number(searchParams.get("page") ?? "1");
  const totalPages = Math.max(1, Math.ceil(ideas.length / pageSize));
  const currentPage = Number.isFinite(requestedPage)
    ? Math.min(Math.max(Math.floor(requestedPage), 1), totalPages)
    : 1;
  const start = (currentPage - 1) * pageSize;
  const visibleIdeas = useMemo(() => ideas.slice(start, start + pageSize), [start]);

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-[#2a2d3b] p-5 sm:p-6 md:p-8">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Idea Registry</p>
        <h1 className="mt-3 font-[var(--font-display)] text-3xl text-white sm:text-4xl md:text-6xl">Ideas</h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-300">
          These entries make the protocol legible right away: users can see proposal quality, vote traction, and round placement without preparing live test data.
        </p>
        <div className="mt-5 inline-flex rounded-full border border-cyan-300/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-200">
          Demo data only
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {visibleIdeas.map((idea) => (
          <Link
            key={idea.id}
            href={`/demo/ideas/${idea.id}`}
            className="rounded-2xl border border-white/10 bg-[#313443] p-4 sm:p-5 transition-colors duration-300 hover:border-cyan-400/40"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-slate-300">Idea #{idea.id}</p>
              <span className="rounded-full bg-cyan-500/15 px-2.5 py-1 text-xs font-semibold text-cyan-300">{idea.status}</span>
            </div>
            <h2 className="mt-3 text-xl font-semibold text-white sm:text-2xl">{idea.title}</h2>
            <p className="mt-2 line-clamp-2 text-sm text-slate-300">{idea.description}</p>
            <div className="mt-4 grid gap-2 text-xs text-slate-300 sm:grid-cols-2">
              <p className="rounded-lg border border-white/10 bg-[#262938] px-2.5 py-2">
                Total votes: {new Intl.NumberFormat("en-US").format(idea.totalVotes)} USDC
              </p>
              <p className="rounded-lg border border-white/10 bg-[#262938] px-2.5 py-2">Round: #{idea.roundId}</p>
            </div>
          </Link>
        ))}
      </div>

      <Pagination basePath="/demo/ideas" currentPage={currentPage} totalItems={ideas.length} pageSize={pageSize} />
    </section>
  );
}

export default function DemoIdeasPage() {
  return (
    <Suspense fallback={<p className="rounded-xl border border-white/10 bg-[#313443] px-4 py-3 text-sm text-slate-300">Loading ideas...</p>}>
      <DemoIdeasPageContent />
    </Suspense>
  );
}
