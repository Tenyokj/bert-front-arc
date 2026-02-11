import Link from "next/link";
import { notFound } from "next/navigation";
import { FaArrowLeft } from "react-icons/fa";
import { getIdeaVoteEntries, getIdeasByRoundId, getRoundById, getRoundVoteEntries } from "@/lib/dapp-mock";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatVotes(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export default async function RoundDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const roundId = Number(id);
  const round = Number.isNaN(roundId) ? undefined : getRoundById(roundId);

  if (!round) {
    notFound();
  }

  const ideas = getIdeasByRoundId(round.id);
  const voteEntries = getRoundVoteEntries(round.id);

  return (
    <section className="space-y-6">
      <Link href="/rounds" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white">
        <FaArrowLeft />
        Back to rounds
      </Link>

      <article className="rounded-[28px] border border-white/10 bg-[#313443] p-5 shadow-[0_14px_30px_rgba(0,0,0,0.3)] md:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h1 className="font-[var(--font-display)] text-4xl text-white md:text-5xl">Round #{round.id}</h1>
            <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">{round.status}</span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                round.ended ? "bg-rose-500/15 text-rose-300" : "bg-cyan-500/15 text-cyan-300"
              }`}
            >
              {round.ended ? "Ended" : "Live"}
            </span>
          </div>
          <p className="text-sm text-slate-300">Ends {formatDate(round.endsAt)}</p>
        </div>

        <p className="mt-2 text-sm text-slate-400">Voting window: {formatDateTime(round.startsAt)} - {formatDateTime(round.endsAt)}</p>

        <div className="mt-5 flex items-center gap-3">
          <p className="text-sm text-slate-200">Total votes: {formatVotes(round.totalVotes)}</p>
          <button className="rounded-lg bg-emerald-500/90 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-500">
            Claim Grant
          </button>
        </div>
        <div className="mt-2 h-1.5 rounded-full bg-[#3c4052]">
          <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400" style={{ width: "100%" }} />
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-[#2a2d3a]">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/10 text-xs uppercase tracking-[0.13em] text-slate-400">
              <tr>
                <th className="px-4 py-3">Voter {voteEntries.length}</th>
                <th className="px-4 py-3">Idea ID</th>
                <th className="px-4 py-3">Voting Power</th>
              </tr>
            </thead>
            <tbody>
              {voteEntries.slice(0, 6).map((entry) => (
                <tr key={`${entry.address}-${entry.txHash}`} className="border-b border-white/5 last:border-b-0">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-100">{entry.address}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-200">#{entry.ideaId}</td>
                  <td className="px-4 py-3 font-semibold text-slate-100">{entry.votingPower}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <section className="rounded-[28px] border border-white/10 bg-[#313443] p-5 shadow-[0_14px_30px_rgba(0,0,0,0.28)] md:p-7">
        <h2 className="font-[var(--font-display)] text-3xl text-white md:text-4xl">Ideas in this round</h2>
        <p className="mt-2 text-sm text-slate-300">Card view for `ideaIds`: {round.ideaIds.join(", ")}</p>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {ideas.map((idea) => (
            <Link
              key={idea.id}
              href={`/ideas/${idea.id}`}
              className="rounded-2xl border border-white/10 bg-[#292c39] p-4 transition-colors duration-300 hover:border-cyan-400/40"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xl font-semibold text-white">Idea #{idea.id}</h3>
                <span className="rounded-full bg-cyan-500/10 px-2.5 py-1 text-xs font-semibold text-cyan-300">{idea.status}</span>
              </div>
              <p className="mt-2 text-base text-slate-100">{idea.title}</p>
              <p className="mt-2 line-clamp-2 text-sm text-slate-300">{idea.summary}</p>

              <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-300">
                <p className="rounded-lg border border-white/10 bg-[#232632] px-2.5 py-2">Voters: {getIdeaVoteEntries(idea.id).length}/30</p>
                <p className="rounded-lg border border-white/10 bg-[#232632] px-2.5 py-2">Total votes: {formatVotes(idea.totalVotes)}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </section>
  );
}
