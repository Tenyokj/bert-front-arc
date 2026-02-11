import Link from "next/link";
import { FaCheckCircle, FaClock } from "react-icons/fa";
import { rounds } from "@/lib/dapp-mock";
import { Pagination } from "@/components/Pagination";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function durationHours(startsAt: string, endsAt: string) {
  const diffMs = new Date(endsAt).getTime() - new Date(startsAt).getTime();
  return Math.max(Math.round(diffMs / (1000 * 60 * 60)), 0);
}

function formatVotes(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

const statusConfig = {
  active: {
    label: "Live",
    className: "bg-emerald-500/10 text-emerald-300 border-emerald-400/30",
    icon: <FaClock className="text-[10px]" />,
  },
  scheduled: {
    label: "Scheduled",
    className: "bg-sky-500/10 text-sky-300 border-sky-400/30",
    icon: <FaClock className="text-[10px]" />,
  },
  finalized: {
    label: "Passed",
    className: "bg-teal-500/10 text-teal-300 border-teal-400/30",
    icon: <FaCheckCircle className="text-[10px]" />,
  },
} as const;

export default async function RoundsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const pageSize = 30;
  const requestedPage = Number(params.page ?? "1");
  const totalPages = Math.max(1, Math.ceil(rounds.length / pageSize));
  const currentPage = Number.isFinite(requestedPage)
    ? Math.min(Math.max(Math.floor(requestedPage), 1), totalPages)
    : 1;
  const start = (currentPage - 1) * pageSize;
  const visibleRounds = rounds.slice(start, start + pageSize);

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-[#2a2d3b] p-6 md:p-8">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">BERT Governance</p>
        <h1 className="mt-3 font-[var(--font-display)] text-4xl text-white md:text-6xl">Voting Rounds</h1>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {visibleRounds.map((round) => {
          const config = statusConfig[round.status];
          const hours = durationHours(round.startsAt, round.endsAt);

          return (
            <Link
              key={round.id}
              href={`/rounds/${round.id}`}
              className="group rounded-[22px] border border-white/10 bg-[#313443] p-4 shadow-[0_14px_30px_rgba(0,0,0,0.26)] transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/40"
            >
              <div className="flex items-center justify-between gap-2">
                <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${config.className}`}>
                  {config.icon}
                  {config.label}
                </span>
                <span className="text-xs text-slate-400">{formatDate(round.endsAt)}</span>
              </div>

              <h2 className="mt-4 text-2xl font-semibold text-white">Round #{round.id}</h2>

              <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-slate-300">
                <div className="rounded-lg border border-white/10 bg-[#262938] px-2.5 py-2">Votes: {formatVotes(round.totalVotes)}</div>
                <div className="rounded-lg border border-white/10 bg-[#262938] px-2.5 py-2">Ideas: 30 (fixed)</div>
                <div className="rounded-lg border border-white/10 bg-[#262938] px-2.5 py-2">{hours}h window</div>
              </div>

              <div className="mt-4 h-1.5 rounded-full bg-[#3a3e4f]">
                <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400" style={{ width: "100%" }} />
              </div>

              <p className="mt-3 text-sm font-semibold text-cyan-300 transition-colors group-hover:text-cyan-200">Open round details</p>
            </Link>
          );
        })}
      </div>

      <Pagination basePath="/rounds" currentPage={currentPage} totalItems={rounds.length} pageSize={pageSize} />
    </section>
  );
}
