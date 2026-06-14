import { demoStats } from "@/lib/dapp-demo";

function formatMoney(value: number) {
  return `$${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value)}`;
}

export default function DemoPoolPage() {
  return (
    <section className="space-y-6">
      <div className="rounded-[34px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(250,204,21,0.18),transparent_45%),linear-gradient(180deg,rgba(42,45,59,0.98),rgba(26,29,39,0.98))] p-5 sm:p-6 md:p-8">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Funding Pool</p>
        <h1 className="mt-3 font-[var(--font-display)] text-3xl text-white sm:text-4xl md:text-6xl">Pool</h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-300">
          Treasury capital powers the grant side of BERT. In live mode this is on-chain USDC. Here the same screen is driven by mock treasury data.
        </p>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <article className="group rounded-2xl border border-white/10 bg-[#2a2d3b] p-5">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Contract state</p>
            <p className="mt-2 text-3xl font-semibold text-slate-100">Active</p>
            <p className="mt-2 text-sm text-slate-300">Source: demo treasury simulation</p>
            <div className="mt-4 h-2 rounded-full bg-slate-800">
              <div className="h-full w-[92%] rounded-full bg-gradient-to-r from-yellow-300 to-green-400" />
            </div>
          </article>

          <article className="group rounded-2xl border border-white/10 bg-[#2a2d3b] p-5">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Distribution count</p>
            <p className="mt-2 text-3xl font-semibold text-slate-100">{demoStats.successfulProjects}</p>
            <p className="mt-2 text-sm text-slate-300">Source: demo historical payouts</p>
            <div className="mt-4 inline-flex rounded-full border border-yellow-300/40 bg-yellow-300/10 px-3 py-1 text-xs font-semibold text-yellow-200">
              Total historical payouts
            </div>
          </article>

          <article className="group rounded-2xl border border-white/10 bg-[#2a2d3b] p-5">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Protocol reserve</p>
            <p className="mt-2 text-3xl font-semibold text-slate-100">{formatMoney(demoStats.totalTreasury - demoStats.grantsDistributed)}</p>
            <p className="mt-2 text-sm text-slate-300">Source: demo reserve model</p>
            <div className="mt-4 inline-flex rounded-full border border-yellow-300/40 bg-yellow-300/10 px-3 py-1 text-xs font-semibold text-yellow-200">
              Reserved liquidity buffer
            </div>
          </article>
        </div>
      </div>

      <article className="rounded-2xl border border-white/10 bg-[#2a2d3b] p-5">
        <header>
          <p className="text-xs uppercase tracking-[0.12em] text-slate-400">My Deposits</p>
          <h2 className="mt-2 font-[var(--font-display)] text-3xl text-slate-100">Wallet Contribution</h2>
          <p className="mt-1 text-sm text-slate-300">Source: demo donor balances + demo pool state</p>
        </header>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-black/15 p-4">
            <p className="text-xs uppercase tracking-[0.08em] text-slate-400">Your deposited USDC</p>
            <p className="mt-2 text-2xl font-semibold text-slate-100">$48,500</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/15 p-4">
            <p className="text-xs uppercase tracking-[0.08em] text-slate-400">Share of pool</p>
            <p className="mt-2 text-2xl font-semibold text-slate-100">7.21%</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/15 p-4">
            <p className="text-xs uppercase tracking-[0.08em] text-slate-400">Wallet</p>
            <p className="mt-2 break-all text-sm font-semibold text-slate-200">Demo wallet connected</p>
            <p className="mt-2 text-xs text-slate-400">Pool balance: {formatMoney(demoStats.totalTreasury)}</p>
          </div>
        </div>
      </article>

      <div className="rounded-3xl border border-white/10 bg-[#2a2d3b] p-5 md:p-6">
        <h2 className="font-[var(--font-display)] text-3xl text-white">Grant release flow</h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-300">
          Funded ideas move through a staged payout pipeline: 30% after grant claim, 40% after in-process proof approval, and the final 30% after launch proof approval.
        </p>
        <p className="mt-2 text-sm text-slate-400">
          In demo mode this is visual only, but it matches the same treasury story as the live dApp.
        </p>
      </div>
    </section>
  );
}
