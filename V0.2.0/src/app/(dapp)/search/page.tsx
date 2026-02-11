import Link from "next/link";
import { ideas, rounds } from "@/lib/dapp-mock";

function normalize(input: string) {
  return input.trim().toLowerCase();
}

function formatVotes(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const queryRaw = params.q ?? "";
  const q = normalize(queryRaw);

  const roundResults = !q
    ? []
    : rounds.filter((round) => String(round.id).includes(q));

  const ideaResults = !q
    ? []
    : ideas.filter((idea) => String(idea.id).includes(q) || idea.title.toLowerCase().includes(q));

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-[#2a2d3b] p-6 md:p-8">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Search</p>
        <h1 className="mt-3 font-[var(--font-display)] text-4xl text-white md:text-6xl">Results</h1>
        <p className="mt-2 text-sm text-slate-300">Query: {queryRaw || "empty"}</p>
      </div>

      {q ? (
        <>
          <div className="space-y-3">
            <h2 className="font-[var(--font-display)] text-3xl text-white">Rounds</h2>
            {roundResults.length === 0 ? (
              <p className="rounded-xl border border-white/10 bg-[#313443] px-4 py-3 text-sm text-slate-300">No rounds found.</p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {roundResults.map((round) => (
                  <Link
                    key={round.id}
                    href={`/rounds/${round.id}`}
                    className="rounded-xl border border-white/10 bg-[#313443] px-4 py-3 transition-colors hover:border-cyan-400/40"
                  >
                    <p className="text-xl font-semibold text-white">Round #{round.id}</p>
                    <p className="mt-1 text-sm text-slate-300">Votes: {formatVotes(round.totalVotes)}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <h2 className="font-[var(--font-display)] text-3xl text-white">Ideas</h2>
            {ideaResults.length === 0 ? (
              <p className="rounded-xl border border-white/10 bg-[#313443] px-4 py-3 text-sm text-slate-300">No ideas found.</p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {ideaResults.map((idea) => (
                  <Link
                    key={idea.id}
                    href={`/ideas/${idea.id}`}
                    className="rounded-xl border border-white/10 bg-[#313443] px-4 py-3 transition-colors hover:border-cyan-400/40"
                  >
                    <p className="text-xl font-semibold text-white">Idea #{idea.id}</p>
                    <p className="mt-1 text-sm text-slate-200">{idea.title}</p>
                    <p className="mt-1 text-xs text-slate-300">Votes: {formatVotes(idea.totalVotes)}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <p className="rounded-xl border border-white/10 bg-[#313443] px-4 py-3 text-sm text-slate-300">
          Enter an `id` or an idea title in the top search bar.
        </p>
      )}
    </section>
  );
}
