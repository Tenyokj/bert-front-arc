import Link from "next/link";
import { getIdeasByUser, userProfile } from "@/lib/dapp-mock";
import { Pagination } from "@/components/Pagination";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const myIdeas = getIdeasByUser(userProfile.address);
  const pageSize = 15;
  const requestedPage = Number(params.page ?? "1");
  const totalPages = Math.max(1, Math.ceil(myIdeas.length / pageSize));
  const currentPage = Number.isFinite(requestedPage)
    ? Math.min(Math.max(Math.floor(requestedPage), 1), totalPages)
    : 1;
  const start = (currentPage - 1) * pageSize;
  const visibleIdeas = myIdeas.slice(start, start + pageSize);

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-[#2a2d3b] p-6 md:p-8">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">User Cabinet</p>
        <h1 className="mt-3 font-[var(--font-display)] text-4xl text-white md:text-6xl">{userProfile.nickname}</h1>
        <p className="mt-2 text-sm text-slate-400">{userProfile.address}</p>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-[#313443] p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Reputation</p>
          <p className="mt-2 text-3xl font-semibold text-white">{userProfile.reputation}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#313443] p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Level</p>
          <p className="mt-2 text-3xl font-semibold text-white">{userProfile.level}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#313443] p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Votes Cast</p>
          <p className="mt-2 text-3xl font-semibold text-white">{userProfile.votesCast}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#313443] p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-slate-400">BTK</p>
          <p className="mt-2 text-2xl font-semibold text-white">{userProfile.btkBalance}</p>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-[#2a2d3b] p-5 md:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-[var(--font-display)] text-3xl text-white">My ideas</h2>
          <Link href="/ideas/new" className="rounded-lg bg-[#3b82f6] px-4 py-2 text-sm font-semibold text-white">
            Create idea
          </Link>
        </div>

        <div className="mt-4 grid gap-3">
          {myIdeas.length === 0 ? (
            <p className="rounded-xl border border-white/10 bg-[#313443] px-4 py-3 text-sm text-slate-300">No ideas yet.</p>
          ) : (
            visibleIdeas.map((idea) => (
              <Link
                key={idea.id}
                href={`/ideas/${idea.id}`}
                className="rounded-xl border border-white/10 bg-[#313443] px-4 py-3 transition-colors hover:border-cyan-400/40"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-lg font-semibold text-white">{idea.title}</p>
                  <p className="rounded-full bg-cyan-500/10 px-2.5 py-1 text-xs font-semibold text-cyan-300">Idea #{idea.id}</p>
                </div>
                <div className="mt-2 grid gap-2 text-sm text-slate-300 md:grid-cols-2">
                  <p>Status: {idea.status}</p>
                  <p>Round: #{idea.roundId}</p>
                  <p>Total votes: {new Intl.NumberFormat("en-US").format(idea.totalVotes)}</p>
                  <p>Category: {idea.category}</p>
                </div>
              </Link>
            ))
          )}
        </div>

        <Pagination basePath="/profile" currentPage={currentPage} totalItems={myIdeas.length} pageSize={pageSize} />
      </div>
    </section>
  );
}
