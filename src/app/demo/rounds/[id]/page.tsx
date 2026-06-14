import Link from "next/link";
import { notFound } from "next/navigation";
import { FaArrowLeft } from "react-icons/fa";
import { getIdeasByRoundId, getRoundById, getRoundVoteEntries } from "@/lib/dapp-demo";

export default async function DemoRoundDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const roundId = Number(id);
  const round = getRoundById(roundId);

  if (!round) notFound();

  const relatedIdeas = getIdeasByRoundId(roundId);
  const votes = getRoundVoteEntries(roundId);

  return (
    <section className="space-y-6">
      <Link href="/demo/rounds" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white">
        <FaArrowLeft />
        Back to rounds
      </Link>

      <article className="rounded-[28px] border border-white/10 bg-[#313443] p-4 shadow-[0_14px_30px_rgba(0,0,0,0.3)] sm:p-5 md:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h1 className="font-[var(--font-display)] text-3xl text-white sm:text-4xl md:text-5xl">Round #{round.id}</h1>
            <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-xs font-semibold text-cyan-300">
              {round.ended ? "Ended" : round.active ? "Live" : "Scheduled"}
            </span>
          </div>
        </div>

        <p className="mt-2 text-sm text-slate-400">
          Voting window: {new Date(round.startsAt).toLocaleString("en-US")} - {new Date(round.endsAt).toLocaleString("en-US")}
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <p className="text-sm text-slate-200">Total votes: {new Intl.NumberFormat("en-US").format(round.totalVotes)} USDC</p>
          {round.winningIdeaId ? (
            <span className="rounded-full border border-emerald-300/40 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
              Winner: Idea #{round.winningIdeaId}
            </span>
          ) : null}
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">
            Demo read-only
          </span>
        </div>

        <p className="mt-2 text-xs text-slate-300">
          New payout flow: claim 30% first, then approve milestone proofs for the 40% in-process and final 30% release.
        </p>

        <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-[#2a2d3a]">
          <div className="overflow-x-auto">
            <table className="min-w-[460px] w-full text-left text-sm">
              <thead className="border-b border-white/10 text-xs uppercase tracking-[0.13em] text-slate-400">
                <tr>
                  <th className="px-4 py-3">Voter {votes.length}</th>
                  <th className="px-4 py-3">Idea ID</th>
                </tr>
              </thead>
              <tbody>
                {votes.length === 0 ? (
                  <tr>
                    <td className="px-4 py-4 text-slate-300" colSpan={2}>
                      No demo voters yet.
                    </td>
                  </tr>
                ) : (
                  votes.map((vote, index) => (
                    <tr key={`${vote.txHash}-${vote.address}-${index}`} className="border-b border-white/5 last:border-b-0">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-100">{vote.address}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-200">#{vote.ideaId}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </article>

      <section className="rounded-[28px] border border-white/10 bg-[#313443] p-4 shadow-[0_14px_30px_rgba(0,0,0,0.28)] sm:p-5 md:p-7">
        <h2 className="font-[var(--font-display)] text-2xl text-white sm:text-3xl md:text-4xl">Ideas in this round</h2>
        <p className="mt-2 text-sm text-slate-300">Demo `ideaIds`: {round.ideaIds.join(", ") || "-"}</p>

        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          {relatedIdeas.map((idea) => (
            <div
              key={idea.id}
              className="rounded-2xl border border-white/10 bg-[#292c39] p-4 transition-colors duration-300 hover:border-cyan-400/40"
            >
              <Link href={`/demo/ideas/${idea.id}`} className="block">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-xl font-semibold text-white">Idea #{idea.id}</h3>
                  <span className="rounded-full bg-cyan-500/10 px-2.5 py-1 text-xs font-semibold text-cyan-300">
                    {idea.status}
                  </span>
                </div>
                <p className="mt-2 text-base text-slate-100">{idea.title}</p>
                <p className="mt-2 line-clamp-2 text-sm text-slate-300">{idea.description}</p>

                <div className="mt-4 grid gap-2 text-xs text-slate-300 sm:grid-cols-2">
                  <p className="rounded-lg border border-white/10 bg-[#232632] px-2.5 py-2">
                    Round votes: {new Intl.NumberFormat("en-US").format(idea.totalVotes)}
                  </p>
                  <p className="rounded-lg border border-white/10 bg-[#232632] px-2.5 py-2">
                    Round ID: {idea.roundId}
                  </p>
                  <p className="col-span-2 rounded-lg border border-white/10 bg-[#232632] px-2.5 py-2">
                    Summary: {idea.summary}
                  </p>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}
