"use client";

import Link from "next/link";
import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { FaCheckCircle, FaClock } from "react-icons/fa";
import { Pagination } from "@/components/Pagination";
import { rounds } from "@/lib/dapp-demo";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

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

      <div className="grid gap-5 xl:grid-cols-2 2xl:grid-cols-3">
        {visibleRounds.map((round) => {
          const isFinalized = round.ended;
          const isActive = !round.ended && round.active;
          const label = isFinalized ? "Passed" : isActive ? "Live" : "Scheduled";
          const badgeClass = isFinalized
            ? "bg-teal-500/10 text-teal-300 border-teal-400/30"
            : isActive
              ? "bg-emerald-500/10 text-emerald-300 border-emerald-400/30"
              : "bg-sky-500/10 text-sky-300 border-sky-400/30";
          const Icon = isFinalized ? FaCheckCircle : FaClock;

          return (
            <Link
              key={round.id}
              href={`/demo/rounds/${round.id}`}
              className="group rounded-[22px] border border-white/10 bg-[#313443] p-4 shadow-[0_14px_30px_rgba(0,0,0,0.26)] transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/40"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${badgeClass}`}>
                  <Icon className="text-[10px]" />
                  {label}
                </span>
                <span className="text-xs text-slate-400">{formatDate(round.endsAt)}</span>
              </div>

              <h2 className="mt-4 text-xl font-semibold text-white sm:text-2xl">Round #{round.id}</h2>

              <div className="mt-4 grid gap-2 text-xs text-slate-300 sm:grid-cols-3">
                <div className="rounded-lg border border-white/10 bg-[#262938] px-2.5 py-2">Votes: {new Intl.NumberFormat("en-US").format(round.totalVotes)} USDC</div>
                <div className="rounded-lg border border-white/10 bg-[#262938] px-2.5 py-2">Ideas: {round.ideaIds.length}</div>
                <div className="rounded-lg border border-white/10 bg-[#262938] px-2.5 py-2">Stake: {round.totalStake}</div>
              </div>

              <div className="mt-4 h-1.5 rounded-full bg-[#3a3e4f]">
                <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400" style={{ width: "100%" }} />
              </div>

              <p className="mt-4 text-sm font-semibold text-cyan-300 transition-colors group-hover:text-cyan-200">Open round details</p>
            </Link>
          );
        })}
      </div>

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
