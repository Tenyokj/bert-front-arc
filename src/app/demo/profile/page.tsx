import Link from "next/link";
import { ideas, userProfile } from "@/lib/dapp-demo";

export default function DemoProfilePage() {
  const totalVotes = ideas.reduce((sum, idea) => sum + idea.totalVotes, 0);
  const activeGrantIdeas = ideas.filter((idea) => idea.status === "Funded").length;
  const completedGrantIdeas = ideas.filter((idea) => idea.status === "Completed").length;

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-[#2a2d3b] p-5 sm:p-6 md:p-8">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">User Cabinet</p>
        <h1 className="mt-3 font-[var(--font-display)] text-3xl text-white sm:text-4xl md:text-6xl">Connected Wallet</h1>
        <p className="mt-2 break-all text-sm text-slate-400">{userProfile.address}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-[#313443] p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Ideas submitted</p>
          <p className="mt-2 text-3xl font-semibold text-white">{userProfile.ideasSubmitted}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#313443] p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Connected</p>
          <p className="mt-2 text-3xl font-semibold text-white">Yes</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#313443] p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Total votes</p>
          <p className="mt-2 text-3xl font-semibold text-white">{new Intl.NumberFormat("en-US").format(totalVotes)} USDC</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#313443] p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-slate-400">USDC</p>
          <p className="mt-2 text-2xl font-semibold text-white">{userProfile.usdcBalance}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#313443] p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Reputation</p>
          <p className="mt-2 text-3xl font-semibold text-white">{userProfile.reputation}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#313443] p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Winning ideas</p>
          <p className="mt-2 text-3xl font-semibold text-white">{userProfile.ideasFunded}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#313443] p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Winning votes (as voter)</p>
          <p className="mt-2 text-3xl font-semibold text-white">146</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#313443] p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Voter progression</p>
          <p className="mt-2 text-sm text-slate-200">Curator: Yes</p>
          <p className="mt-1 text-sm text-slate-200">Reviewer: Yes</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#313443] p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Required idea stake</p>
          <p className="mt-2 text-2xl font-semibold text-white">50 USDC</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#313443] p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Locked stake</p>
          <p className="mt-2 text-2xl font-semibold text-white">150 USDC</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#313443] p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Grants in progress</p>
          <p className="mt-2 text-3xl font-semibold text-white">{activeGrantIdeas}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#313443] p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Completed grants</p>
          <p className="mt-2 text-3xl font-semibold text-white">{completedGrantIdeas}</p>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-[#2a2d3b] p-5 md:p-6">
        <h2 className="font-[var(--font-display)] text-3xl text-white">Grant release flow</h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-300">
          Funded ideas now move through a staged payout pipeline: 30% after grant claim, 40% after in-process proof approval, and the final 30% after launch proof approval.
        </p>
        <p className="mt-2 text-sm text-slate-400">
          Demo mode keeps this read-only, but the structure matches the same grant story as the live protocol.
        </p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-[#2a2d3b] p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-[var(--font-display)] text-2xl text-white sm:text-3xl">My ideas</h2>
          <span className="rounded-lg bg-[#3b82f6] px-4 py-2 text-sm font-semibold text-white">Demo mode</span>
        </div>

        <div className="mt-4 grid gap-3">
          {ideas
            .filter((idea) => idea.author === userProfile.address)
            .slice(0, 6)
            .map((idea) => (
              <Link
                key={idea.id}
                href={`/demo/ideas/${idea.id}`}
                className="rounded-xl border border-white/10 bg-[#313443] px-4 py-3 transition-colors hover:border-cyan-400/40"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-lg font-semibold text-white">{idea.title}</p>
                  <p className="rounded-full bg-cyan-500/10 px-2.5 py-1 text-xs font-semibold text-cyan-300">Idea #{idea.id}</p>
                </div>
                <div className="mt-2 grid gap-2 text-sm text-slate-300 xl:grid-cols-3">
                  <p>Status: {idea.status}</p>
                  <p>Total votes: {new Intl.NumberFormat("en-US").format(idea.totalVotes)} USDC</p>
                  <p>Track: {idea.category}</p>
                </div>
              </Link>
            ))}
        </div>
      </div>
    </section>
  );
}
