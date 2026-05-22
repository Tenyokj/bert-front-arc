import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";

export default function OnChainVotesPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto max-w-[1450px] px-6 py-8 md:px-10 lg:px-14">
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
            <Link href="/how-it-works" className="transition-colors hover:text-slate-900">
              How it works
            </Link>
            <Link href="/rounds" className="transition-colors hover:text-slate-900">
              Active rounds
            </Link>
            <a href="https://bertdao-docs.vercel.app/" className="transition-colors hover:text-slate-900">
              Docs
            </a>
          </nav>
          <Link
            href="/rounds"
            className="rounded-full border border-white/60 bg-white/70 px-5 py-2 text-sm font-semibold text-slate-900 shadow-[0_12px_30px_rgba(15,23,42,0.08)] backdrop-blur transition hover:-translate-y-0.5"
          >
            Launch App
          </Link>
        </header>

        <div className="mt-9 grid gap-12 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-8 lg:h-[calc(100vh-72px)] lg:overflow-y-auto">
            <p className="text-xs uppercase tracking-[0.28em] text-teal-600">On-chain Votes</p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-900 dark:text-slate-100">Voting Execution</h1>
            <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              This document explains how votes are validated and settled directly in BERT smart contracts.
            </p>
            <div className="mt-7 space-y-2 border-l border-white/20 pl-4 text-sm text-slate-600 dark:text-slate-300">
              <a href="#definition" className="block hover:text-slate-900 dark:hover:text-white">What On-chain Means</a>
              <a href="#tx" className="block hover:text-slate-900 dark:hover:text-white">Vote Transaction Flow</a>
              <a href="#checks" className="block hover:text-slate-900 dark:hover:text-white">Validation Rules</a>
              <a href="#settlement" className="block hover:text-slate-900 dark:hover:text-white">Round Settlement</a>
              <a href="#difference" className="block hover:text-slate-900 dark:hover:text-white">On-chain vs Off-chain</a>
              <a href="#security" className="block hover:text-slate-900 dark:hover:text-white">Security Notes</a>
            </div>
          </aside>

          <main className="space-y-12 border-t border-white/12 pt-8">
            <section id="definition" className="space-y-4">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">What “On-chain Votes” Means</h2>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                In BERT, a vote is an on-chain state change, not a signed message stored in an external service. The voter sends a real transaction,
                and contract logic decides whether it is valid. If checks fail, transaction reverts and no vote is recorded.
              </p>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                This gives strong auditability: all accepted votes, timestamps, and outcomes are visible in blockchain state and events.
              </p>
            </section>

            <section id="tx" className="space-y-4">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Vote Transaction Flow</h2>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                Standard path is: user prepares amount -&gt; wallet signs transaction -&gt; <code>vote(roundId, ideaId, amount)</code> is executed
                in <strong>VotingSystem</strong> -&gt; stake transfer path is routed through <strong>FundingPool</strong> -&gt; vote totals update.
              </p>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                Because this is transaction-based, users pay gas for execution attempts. Failed checks still consume gas, so UI should validate obvious constraints early.
              </p>
            </section>

            <section id="checks" className="space-y-4">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Validation Rules (Contract-side)</h2>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                A vote must satisfy all of the following protocol rules: round exists, round is active, current time is inside voting window,
                voter has not voted in this round, amount is at least <code>minStake</code>, and idea belongs to the round.
              </p>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                Additional anti-abuse constraints include self-vote prohibition and max-voters-per-idea limit (when configured).
                These checks are enforced by contract and cannot be bypassed by custom frontend clients.
              </p>
            </section>

            <section id="settlement" className="space-y-4">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Round Settlement & Finality</h2>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                After round deadline, anyone can call <code>endVotingRound(roundId)</code>. The system computes winner by highest votes,
                updates proposal statuses, and triggers downstream progression/reputation logic according to configured rules.
              </p>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                Settlement is deterministic from chain state. If two interfaces show different visuals, canonical truth is contract data.
              </p>
            </section>

            <section id="difference" className="space-y-4">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">On-chain vs Off-chain Voting</h2>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                On-chain voting has direct execution guarantees and full traceability, but costs gas and depends on chain availability.
                Off-chain voting is cheaper and faster for signaling, but execution still needs trusted bridge logic or separate on-chain confirmation.
              </p>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                BERT governance-critical decisions are designed to be on-chain so treasury-impacting outcomes are enforceable without external trust assumptions.
              </p>
            </section>

            <section id="security" className="space-y-4">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Security Notes</h2>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                Operators should monitor failed vote transactions, unusual stake concentration, and parameter changes affecting vote economics.
                During incidents, pause flow (<strong>pause -&gt; diagnose -&gt; patch -&gt; verify -&gt; unpause</strong>) remains the default control policy.
              </p>
            </section>

            <section className="flex flex-wrap gap-2 border-t border-white/12 pt-6">
              <Link href="/policy-docs#voting" className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100">Voting Policy</Link>
              <Link href="/governance-stack" className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100">Governance Stack</Link>
              <Link href="/rounds" className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white">Go to Rounds</Link>
            </section>
          </main>
        </div>

                       <SiteFooter />
      </div>
    </div>
  );
}
