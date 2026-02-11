import Link from "next/link";
import { getIdeaVoteEntries, ideas } from "@/lib/dapp-mock";
import { Pagination } from "@/components/Pagination";

function formatVotes(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export default async function IdeasPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const pageSize = 15;
  const requestedPage = Number(params.page ?? "1");
  const totalPages = Math.max(1, Math.ceil(ideas.length / pageSize));
  const currentPage = Number.isFinite(requestedPage)
    ? Math.min(Math.max(Math.floor(requestedPage), 1), totalPages)
    : 1;
  const start = (currentPage - 1) * pageSize;
  const visibleIdeas = ideas.slice(start, start + pageSize);

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-[#2a2d3b] p-6 md:p-8">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Idea Registry</p>
        <h1 className="mt-3 font-[var(--font-display)] text-4xl text-white md:text-6xl">Ideas</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {visibleIdeas.map((idea) => (
          <Link
            key={idea.id}
            href={`/ideas/${idea.id}`}
            className="rounded-2xl border border-white/10 bg-[#313443] p-5 transition-colors duration-300 hover:border-cyan-400/40"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-slate-300">Idea #{idea.id}</p>
              <span className="rounded-full bg-cyan-500/15 px-2.5 py-1 text-xs font-semibold text-cyan-300">{idea.status}</span>
            </div>
            <h2 className="mt-3 text-2xl font-semibold text-white">{idea.title}</h2>
            <p className="mt-2 line-clamp-2 text-sm text-slate-300">{idea.summary}</p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-300">
              <p className="rounded-lg border border-white/10 bg-[#262938] px-2.5 py-2">Total votes: {formatVotes(idea.totalVotes)}</p>
              <p className="rounded-lg border border-white/10 bg-[#262938] px-2.5 py-2">Voters: {getIdeaVoteEntries(idea.id).length}/30</p>
              <p className="rounded-lg border border-white/10 bg-[#262938] px-2.5 py-2 col-span-2">
                Category: {idea.category === "1" ? "1 - My Project" : "2 - Community Utility"}
              </p>
            </div>
          </Link>
        ))}
      </div>

      <Pagination basePath="/ideas" currentPage={currentPage} totalItems={ideas.length} pageSize={pageSize} />
    </section>
  );
}
