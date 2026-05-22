"use client";

import Image from "next/image";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import {
  FaBook,
  FaExternalLinkAlt,
} from "react-icons/fa";

const pillars = [
  {
    label: "Proposal Deposit",
    value: "50 USDC",
    note: "Minimum author commitment to submit a live idea into the registry.",
  },
  {
    label: "Vote Commitment",
    value: "10 USDC",
    note: "Minimum onchain vote amount required to support an idea in an active round.",
  },
  {
    label: "Release Rail",
    value: "30 / 40 / 30",
    note: "Initial release, milestone release, and final release after reviewer validation.",
  },
];

const flowSteps = [
  {
    title: "1. Builder submits an idea",
    body:
      "A builder creates an idea in IdeaRegistry and deposits at least 50 USDC. The deposit is locked in FundingPool and the idea enters the pipeline with clear onchain metadata and status.",
  },
  {
    title: "2. A voting round opens",
    body:
      "VotingSystem groups eligible ideas into a live round. Participants review the round and commit USDC directly onchain instead of relying on a separate governance asset.",
  },
  {
    title: "3. USDC commitments accumulate in treasury",
    body:
      "Every valid vote routes committed USDC into the treasury path. The pool tracks committed capital, protocol reserve balances, and the amount attached to each winning proposal.",
  },
  {
    title: "4. Winner enters grant execution",
    body:
      "After the round closes and settlement succeeds, the winning idea moves into GrantManager. At that point the protocol stops being only a voting system and becomes a capital release system.",
  },
  {
    title: "5. Milestones unlock funding",
    body:
      "Grant release is milestone-based. Builders claim the initial tranche, submit implementation proof, then submit final delivery proof. Reviewers validate each stage before the next release can execute.",
  },
];

const safetyChecks = [
  "USDC commitments use explicit allowance checks before protocol actions execute.",
  "Round voting enforces one vote per address per round and blocks self-voting.",
  "Treasury release follows milestone state transitions instead of one-shot payouts.",
  "Pause controls remain available for incident handling and controlled rollout.",
  "Role-gated review and grant functions keep validator actions explicit and auditable.",
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto max-w-[1200px] px-6 py-8 md:px-10">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-teal-400 to-blue-600 shadow-[0_8px_24px_rgba(37,99,235,0.35)]" />
            <span className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-600">
              <Link href="/" className="transition-colors hover:text-slate-900">
                BERT
              </Link>
            </span>
          </div>
          <nav className="hidden items-center gap-8 text-sm text-slate-600 md:flex">
            <Link href="/rounds" className="transition-colors hover:text-slate-900">
              Active rounds
            </Link>
            <a href="https://bertdao-docs.vercel.app/" className="transition-colors hover:text-slate-900">
              Docs
            </a>
            <Link href="/policy-docs" className="transition-colors hover:text-slate-900">
              Policy docs
            </Link>
          </nav>
          <Link
            href="/ideas/new"
            className="rounded-full border border-white/60 bg-white/70 px-5 py-2 text-sm font-semibold text-slate-900 shadow-[0_12px_30px_rgba(15,23,42,0.08)] backdrop-blur transition hover:-translate-y-0.5"
          >
            Submit Idea
          </Link>
        </header>

        <main className="mt-10 space-y-12">
          <section className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-600">How It Works</p>
            <h1 className="max-w-5xl text-4xl font-semibold text-slate-900 dark:text-slate-100 md:text-5xl">
              BERT turns USDC commitments into transparent builder funding on Arc.
            </h1>
            <p className="max-w-4xl text-lg leading-relaxed text-slate-700 dark:text-slate-200">
              The protocol is a programmable capital allocation system: builders post a USDC-backed proposal deposit,
              contributors commit USDC votes, treasury balances accumulate onchain, and winning proposals unlock
              milestone-based releases through validator review.
            </p>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            {pillars.map((pillar) => (
              <div key={pillar.label} className="rounded-2xl border border-white/12 bg-white/[0.02] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-600">{pillar.label}</p>
                <p className="mt-3 text-3xl font-semibold text-slate-900 dark:text-slate-100">{pillar.value}</p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{pillar.note}</p>
              </div>
            ))}
          </section>

          <section className="rounded-3xl border border-white/15 bg-white/5 p-6 md:p-8">
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Funding flow</h2>
              <p className="max-w-4xl text-base leading-relaxed text-slate-700 dark:text-slate-200">
                BERT coordinates one continuous funding path. Proposal deposits filter out spam, round voting directs
                capital toward the strongest ideas, treasury accounting preserves visibility over committed and released
                balances, and milestone releases keep grant execution measurable.
              </p>
            </div>
            <div className="mt-6 overflow-hidden rounded-3xl border border-white/15 bg-black/10 p-3">
              <Image
                src="/illustrations/how-flow-arc.svg"
                alt="BERT Arc funding flow from proposal deposit to milestone-based USDC release"
                width={1600}
                height={760}
                className="h-auto w-full"
                priority
              />
            </div>
          </section>

          <section className="grid gap-5 lg:grid-cols-5">
            {flowSteps.map((step) => (
              <div key={step.title} className="rounded-2xl border border-white/12 bg-white/[0.02] p-5 lg:col-span-1">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-200">{step.body}</p>
              </div>
            ))}
          </section>

          <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-3xl border border-white/15 bg-white/5 p-6 md:p-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Milestone release logic</h2>
              <div className="mt-5 space-y-4 text-base leading-relaxed text-slate-700 dark:text-slate-200">
                <p>
                  Winning a round does not trigger a single lump-sum payout. GrantManager releases funding in a staged
                  sequence so capital follows proof of execution rather than hype.
                </p>
                <p>
                  The default rail is <strong>30% / 40% / 30%</strong>. The builder claims the first release, then submits
                  proof for the implementation milestone, then submits proof for the final launch milestone. Reviewers
                  confirm each stage before the next tranche can move.
                </p>
                <p>
                  That makes BERT useful as treasury infrastructure, not just proposal coordination. Capital remains
                  programmable until work is actually delivered.
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-white/15 bg-white/5 p-6 md:p-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Operator checklist</h2>
              <ul className="mt-5 list-disc space-y-3 pl-5 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                {safetyChecks.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </section>

          <section className="rounded-3xl border border-white/15 bg-white/5 p-6 md:p-8">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Where to start</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                { href: "/ideas/new", label: "Create an idea", icon: FaExternalLinkAlt },
                { href: "/rounds", label: "Inspect live rounds", icon: FaBook },
                { href: "/policy-docs", label: "Read policy docs", icon: FaBook },
                { href: "/docs/ARCHITECTURE.md", label: "Open architecture docs", icon: FaBook },
              ].map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-2xl border border-white/15 bg-black/10 p-4 text-sm font-medium text-slate-700 transition hover:-translate-y-0.5 hover:text-slate-900 dark:text-slate-200 dark:hover:text-slate-100"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="text-teal-500" />
                      <span>{link.label}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        </main>

        <SiteFooter />
      </div>
    </div>
  );
}
