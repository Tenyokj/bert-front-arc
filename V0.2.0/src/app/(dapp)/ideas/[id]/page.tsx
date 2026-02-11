import Link from "next/link";
import { notFound } from "next/navigation";
import { FaArrowLeft, FaExternalLinkAlt } from "react-icons/fa";
import { getIdeaById, getIdeaVoteEntries } from "@/lib/dapp-mock";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatVotes(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export default async function IdeaDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ideaId = Number(id);
  const idea = Number.isNaN(ideaId) ? undefined : getIdeaById(ideaId);

  if (!idea) {
    notFound();
  }

  const voteEntries = getIdeaVoteEntries(idea.id);

  return (
    <section className="space-y-6">
      <Link href="/ideas" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white">
        <FaArrowLeft />
        Back to ideas
      </Link>

      <article className="rounded-[28px] border border-white/10 bg-[#313443] p-5 shadow-[0_14px_30px_rgba(0,0,0,0.3)] md:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h1 className="font-[var(--font-display)] text-4xl text-white md:text-5xl">Idea #{idea.id}</h1>
            <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-xs font-semibold text-cyan-300">{idea.status}</span>
          </div>
          <p className="text-sm text-slate-300">Round #{idea.roundId}</p>
        </div>

        <p className="mt-3 text-2xl font-semibold text-slate-100">{idea.title}</p>
        <p className="mt-3 text-sm leading-relaxed text-slate-300">{idea.description}</p>

        <div className="mt-4 grid gap-2 text-xs text-slate-300 md:grid-cols-2 xl:grid-cols-4">
          <p className="min-w-0 rounded-lg border border-white/10 bg-[#242735] px-3 py-2 break-all">
            Author: {idea.author}
          </p>
          <p className="min-w-0 rounded-lg border border-white/10 bg-[#242735] px-3 py-2">
            Created: {formatDateTime(idea.createdAt)}
          </p>
          <p className="min-w-0 rounded-lg border border-white/10 bg-[#242735] px-3 py-2">
            Total votes: {formatVotes(idea.totalVotes)}
          </p>
          <p className="min-w-0 rounded-lg border border-white/10 bg-[#242735] px-3 py-2">Status code: {idea.statusCode}</p>
        </div>

        <div className="mt-5 h-1.5 rounded-full bg-[#3c4052]">
          <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400" style={{ width: "100%" }} />
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-[#2a2d3a]">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/10 text-xs uppercase tracking-[0.13em] text-slate-400">
              <tr>
                <th className="px-4 py-3">Voter {voteEntries.length}</th>
                <th className="px-4 py-3">Voting Power</th>
              </tr>
            </thead>
            <tbody>
              {voteEntries.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-slate-300" colSpan={2}>
                    No votes yet for this idea.
                  </td>
                </tr>
              ) : (
                voteEntries.map((entry) => (
                  <tr key={`${entry.address}-${entry.txHash}`} className="border-b border-white/5 last:border-b-0">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-100">{entry.address}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-100">{entry.votingPower}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-5 space-y-1 text-sm text-slate-300">
          <p>
            Round: <span className="font-semibold text-slate-100">#{idea.roundId}</span>
          </p>
          <p>Category: {idea.category === "1" ? "1 - My Project" : "2 - Community Utility"}</p>
          <p>Round ID: {idea.roundId}</p>
        </div>

        <a
          href={idea.link}
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-flex items-center gap-2 rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-200"
        >
          Open reference
          <FaExternalLinkAlt className="text-xs" />
        </a>
      </article>
    </section>
  );
}
