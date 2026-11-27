"use client";

import { RoundSummaryCard } from "@/components/dapp/ProtocolCards";
import { CollectionFilter } from "@/components/dapp/CollectionFilter";
import { formatTokenAmount } from "@/lib/dapp-onchain";
import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Pagination } from "@/components/Pagination";
import { rounds } from "@/lib/dapp-demo";

function DemoRoundsPageContent() {
  const searchParams = useSearchParams();
  const pageSize = 30;
  const requestedPage = Number(searchParams.get("page") ?? "1");
  const totalPages = Math.max(1, Math.ceil(rounds.length / pageSize));
  const currentPage = Number.isFinite(requestedPage)
    ? Math.min(Math.max(Math.floor(requestedPage), 1), totalPages)
    : 1;
  const start = (currentPage - 1) * pageSize;
  const visibleRounds = useMemo(() => rounds.slice(start, start + pageSize), [start]);

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-[#2a2d3b] p-5 sm:p-6 md:p-8">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Stablecoin Voting</p>
        <h1 className="mt-3 font-[var(--font-display)] text-3xl text-white sm:text-4xl md:text-6xl">Rounds</h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-300">
          These rounds are fake but structured to show the same BERT flow as the live app: live competition, finalized outcomes, and scheduled next windows.
        </p>
        <div className="mt-5 inline-flex rounded-full border border-cyan-300/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-200">
          Demo data only
        </div>
      </div>

      <CollectionFilter key={currentPage} items={visibleRounds} getTitle={(round) => `Round #${round.id}`} getStatus={(round) => round.ended ? "Finalized" : round.active ? "Voting enabled" : "Inactive / scheduled"} renderItem={(round) => (
          <RoundSummaryCard key={round.id} id={round.id} href={`/demo/rounds/${round.id}`} startsAt={round.startsAt} endsAt={round.endsAt} active={round.active} ended={round.ended} votes={formatTokenAmount(round.totalVotes)} ideas={round.ideaIds.length} demo extra={<div><dt>Illustrative stake</dt><dd>{round.totalStake}</dd></div>} />
        )} />

      <Pagination basePath="/demo/rounds" currentPage={currentPage} totalItems={rounds.length} pageSize={pageSize} />
    </section>
  );
}

export default function DemoRoundsPage() {
  return (
    <Suspense fallback={<p className="rounded-xl border border-white/10 bg-[#313443] px-4 py-3 text-sm text-slate-300">Loading rounds...</p>}>
      <DemoRoundsPageContent />
    </Suspense>
  );
}
