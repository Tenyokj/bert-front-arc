import Link from "next/link";
import { FaArrowRight } from "react-icons/fa";
import { demoHighlights, demoStats, demoWalkthrough } from "@/lib/dapp-demo";

function formatMoney(value: number) {
  return `$${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value)}`;
}

export default function DemoHomePage() {
  const statCards = [
    { label: "Total Treasury", value: formatMoney(demoStats.totalTreasury) },
    { label: "Active Ideas", value: String(demoStats.activeIdeas) },
    { label: "Grants Distributed", value: formatMoney(demoStats.grantsDistributed) },
    { label: "Successful Projects", value: String(demoStats.successfulProjects) },
  ];

  return (
    <section className="space-y-6">
      <div className="rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,#31415a_0%,#22293a_55%,#17212f_100%)] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.34)] sm:p-8 md:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-300">BERT Demo dApp</p>
        <h1 className="mt-4 max-w-4xl font-[var(--font-display)] text-4xl leading-tight text-white sm:text-5xl md:text-6xl">
          Understand the whole protocol in under a minute.
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-relaxed text-slate-300 sm:text-lg">
          This is an isolated walkthrough environment with realistic fake rounds, ideas, vote activity, treasury signals,
          and profile reputation. No wallet writes. No live contract dependency.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/demo/rounds"
            className="inline-flex items-center gap-2 rounded-full bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5"
          >
            Open demo rounds
            <FaArrowRight className="text-xs" />
          </Link>
          <Link
            href="/app"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5"
          >
            Back to live app
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <div key={card.label} className="rounded-[24px] border border-white/10 bg-[#2a2d3b] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{card.label}</p>
            <p className="mt-4 font-[var(--font-display)] text-3xl text-white">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <div className="rounded-[28px] border border-white/10 bg-[#2a2d3b] p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">What BERT does</p>
          <div className="mt-6 grid gap-4">
            {demoHighlights.map((item) => (
              <div key={item.title} className="rounded-[24px] border border-white/10 bg-[#313443] p-5">
                <h2 className="text-xl font-semibold text-white">{item.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-[#2a2d3b] p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Suggested judge flow</p>
          <div className="mt-6 space-y-3">
            {demoWalkthrough.map((item, index) => (
              <div key={item} className="flex gap-4 rounded-[22px] border border-white/10 bg-[#313443] p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cyan-500/10 text-sm font-semibold text-cyan-300">
                  {index + 1}
                </div>
                <p className="text-sm leading-relaxed text-slate-300">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
