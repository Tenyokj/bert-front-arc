import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";

const UPDATED_AT = "February 15, 2026";

export default function SecurityRoadmapPage() {
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

        <main className="mt-10 grid gap-12 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-8 lg:h-[calc(100vh-72px)] lg:overflow-y-auto">
            <p className="text-xs uppercase tracking-[0.28em] text-teal-600">Security</p>
            <h1 className="mt-3 text-4xl font-semibold text-slate-900 dark:text-slate-100">Security Roadmap</h1>
            <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Planned hardening milestones for contracts, operations, and incident response.
            </p>
            <p className="mt-4 text-xs uppercase tracking-[0.15em] text-slate-500">Last updated: {UPDATED_AT}</p>
            <div className="mt-7 space-y-2 border-l border-white/20 pl-4 text-sm text-slate-600 dark:text-slate-300">
              <a href="#status" className="block hover:text-slate-900 dark:hover:text-white">Current Status</a>
              <a href="#phase-1" className="block hover:text-slate-900 dark:hover:text-white">Phase 1: Baseline</a>
              <a href="#phase-2" className="block hover:text-slate-900 dark:hover:text-white">Phase 2: Audits</a>
              <a href="#phase-3" className="block hover:text-slate-900 dark:hover:text-white">Phase 3: Runtime Security</a>
              <a href="#phase-4" className="block hover:text-slate-900 dark:hover:text-white">Phase 4: Program Launches</a>
              <a href="#incident" className="block hover:text-slate-900 dark:hover:text-white">Incident Response</a>
              <a href="#disclosure" className="block hover:text-slate-900 dark:hover:text-white">Disclosure Policy</a>
            </div>
          </aside>

          <section className="space-y-10 border-t border-white/12 pt-8">
            <section id="status" className="space-y-3">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Current Status</h2>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                External audits are <strong>planned</strong> but not completed yet. Current security posture is based on
                internal testing, role-gated access controls, pause/unpause safety controls, and manual operational checks.
              </p>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                A <strong>testnet responsible-disclosure program is active</strong>. It covers the open BERT core,
                backend and frontend while the protocol is hardened before mainnet. Scope, safe-harbor rules and the
                Validator nomination reward are published in the <Link href="/testnet-information#bug-bounty" className="font-semibold text-cyan-700 underline underline-offset-4 dark:text-cyan-200">Testnet Guide</Link>.
              </p>
            </section>

            <section id="phase-1" className="space-y-3">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Phase 1: Baseline Hardening</h2>
              <ul className="list-disc space-y-2 pl-5 text-base text-slate-700 dark:text-slate-200">
                <li>Contract-level role restrictions for critical setters and privileged flows.</li>
                <li>Pause controls for high-impact modules (Funding Pool, Voting, Grant Manager, and registry dependencies).</li>
                <li>Unit/integration tests for core lifecycle: idea, round, vote, payout, completion.</li>
                <li>Clear error surfacing in frontend for role/status/revert conditions.</li>
              </ul>
            </section>

            <section id="phase-2" className="space-y-3">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Phase 2: External Audits (Planned)</h2>
              <ul className="list-disc space-y-2 pl-5 text-base text-slate-700 dark:text-slate-200">
                <li>Scope audit for core contracts: VotingSystem, IdeaRegistry, FundingPool, GrantManager, token extensions.</li>
                <li>Pre-audit freeze: no new features during audit cycle.</li>
                <li>Post-audit remediation with documented fix list and re-test evidence.</li>
                <li>Public summary with findings severity and mitigation status.</li>
              </ul>
            </section>

            <section id="phase-3" className="space-y-3">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Phase 3: Runtime Security Controls</h2>
              <ul className="list-disc space-y-2 pl-5 text-base text-slate-700 dark:text-slate-200">
                <li>Automated monitoring for abnormal pause events and failed transaction patterns.</li>
                <li>Upgrade runbook with explicit preflight and post-deploy verification steps.</li>
                <li>Operator key policy hardening (separation of duties, restricted admin paths).</li>
              </ul>
            </section>

            <section id="phase-4" className="space-y-3">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Phase 4: Program Launches (Planned)</h2>
              <ul className="list-disc space-y-2 pl-5 text-base text-slate-700 dark:text-slate-200">
                <li>Maintain the testnet responsible-disclosure program through the mainnet readiness review.</li>
                <li>Formalized disclosure SLAs for critical and high severity reports.</li>
                <li>Security KPIs published with regular status updates.</li>
              </ul>
            </section>

            <section id="incident" className="space-y-3">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Incident Response Baseline</h2>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                Default response flow: <strong>pause -&gt; isolate -&gt; diagnose -&gt; patch -&gt; verify -&gt; unpause</strong>.
                No production resume before root-cause verification and regression checks.
              </p>
            </section>

            <section id="disclosure" className="space-y-3 border-t border-white/12 pt-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Security Disclosure Policy</h2>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                Submit vulnerabilities through a private GitHub Security Advisory for the core repository. Include the
                affected module, reproduction path, impact estimate, and transaction references where relevant. Do not
                post exploitable details in public issues.
              </p>
              <div className="flex flex-wrap gap-2">
                <Link href="/privacy-notice" className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100">
                  Privacy Notice
                </Link>
                <Link href="/terms-of-use" className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100">
                  Terms of Use
                </Link>
                <Link href="/policy-docs" className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100">
                  Policy Docs
                </Link>
                <a href="https://github.com/Tenyokj/bert-core-arc/security/advisories/new" target="_blank" rel="noreferrer" className="rounded-full border border-cyan-300/35 px-4 py-2 text-xs font-semibold text-cyan-700 dark:text-cyan-200">
                  Private security advisory
                </a>
              </div>
            </section>
          </section>
        </main>

                       <SiteFooter />
      </div>
    </div>
  );
}
