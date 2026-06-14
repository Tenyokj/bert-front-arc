import Link from "next/link";
import { notFound } from "next/navigation";
import { FaArrowLeft, FaExternalLinkAlt } from "react-icons/fa";
import { getIdeaById, getIdeaVoteEntries } from "@/lib/dapp-demo";

export default async function DemoIdeaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ideaId = Number(id);
  const idea = getIdeaById(ideaId);

  if (!idea) notFound();

  const votes = getIdeaVoteEntries(ideaId);

  return (
    <section className="space-y-6">
      <Link href="/demo/ideas" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white">
        <FaArrowLeft />
        Back to ideas
      </Link>

      <article className="rounded-[28px] border border-white/10 bg-[#313443] p-4 shadow-[0_14px_30px_rgba(0,0,0,0.3)] sm:p-5 md:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h1 className="font-[var(--font-display)] text-3xl text-white sm:text-4xl md:text-5xl">Idea #{idea.id}</h1>
            <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-xs font-semibold text-cyan-300">
              {idea.status}
            </span>
          </div>
          <p className="text-sm text-slate-300">Round #{idea.roundId}</p>
        </div>

        <p className="mt-3 text-xl font-semibold text-slate-100 sm:text-2xl">{idea.title}</p>
        <p className="mt-3 text-sm leading-relaxed text-slate-300">{idea.description}</p>

        <div className="mt-4 grid gap-2 text-xs text-slate-300 sm:grid-cols-2 xl:grid-cols-4">
          <p className="min-w-0 rounded-lg border border-white/10 bg-[#242735] px-3 py-2">Author: {idea.author}</p>
          <p className="min-w-0 rounded-lg border border-white/10 bg-[#242735] px-3 py-2">Created: {new Date(idea.createdAt).toLocaleString("en-US")}</p>
          <p className="min-w-0 rounded-lg border border-white/10 bg-[#242735] px-3 py-2">Total votes: {new Intl.NumberFormat("en-US").format(idea.totalVotes)} USDC</p>
          <p className="min-w-0 rounded-lg border border-white/10 bg-[#242735] px-3 py-2">Status code: {idea.statusCode}</p>
        </div>

        <div className="mt-5 rounded-2xl border border-white/10 bg-[#2a2d3a] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-white">Grant pipeline</h3>
            <span className="rounded-full border border-cyan-300/35 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-semibold text-cyan-200">
              Demo walkthrough
            </span>
          </div>

          <div className="mt-3 grid gap-2 text-xs text-slate-300 sm:grid-cols-3">
            <p className="rounded-lg border border-white/10 bg-[#232632] px-3 py-2">Initial 30%: {idea.status === "WonVoting" || idea.status === "Funded" || idea.status === "Completed" ? "Eligible" : "Pending"}</p>
            <p className="rounded-lg border border-white/10 bg-[#232632] px-3 py-2">In-process 40%: {idea.status === "Funded" || idea.status === "Completed" ? "Progressed" : "Locked"}</p>
            <p className="rounded-lg border border-white/10 bg-[#232632] px-3 py-2">Launch 30%: {idea.status === "Completed" ? "Paid" : "Locked"}</p>
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-[#232632] p-4">
            <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-100">Demo notes</h4>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              {idea.summary} This page stays read-only so someone can inspect proposal context, status transitions, and vote traction without touching live contract state.
            </p>
          </div>
        </div>

        {votes.length > 0 ? (
          <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-[#2a2d3a]">
            <div className="overflow-x-auto">
              <table className="min-w-[460px] w-full text-left text-sm">
                <thead className="border-b border-white/10 text-xs uppercase tracking-[0.13em] text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Voter</th>
                    <th className="px-4 py-3">Power</th>
                    <th className="px-4 py-3">Votes</th>
                  </tr>
                </thead>
                <tbody>
                  {votes.map((vote, index) => (
                    <tr key={`${vote.txHash}-${vote.address}-${index}`} className="border-b border-white/5 last:border-b-0">
                      <td className="px-4 py-3 font-semibold text-slate-100">{vote.address}</td>
                      <td className="px-4 py-3 text-slate-200">{vote.votingPower}</td>
                      <td className="px-4 py-3 text-slate-200">{vote.votes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {idea.link ? (
          <a
            href={idea.link}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex items-center gap-2 rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-200"
          >
            Open reference link
            <FaExternalLinkAlt className="text-xs" />
          </a>
        ) : null}
      </article>
    </section>
  );
}
