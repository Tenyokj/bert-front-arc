import ParticleText from "@/components/ParticleText";
import Link from "next/link";
import { FaGithub, FaReddit, FaMailBulk } from "react-icons/fa";

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
            <Link href="/faq" className="transition-colors hover:text-slate-900">
              Docs
            </Link>
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
                <strong>No bug bounty program is active at this time.</strong> Any future bounty will be announced publicly
                with explicit scope, rules, and rewards.
              </p>
            </section>

            <section id="phase-1" className="space-y-3">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Phase 1: Baseline Hardening</h2>
              <ul className="list-disc space-y-2 pl-5 text-base text-slate-700 dark:text-slate-200">
                <li>Contract-level role restrictions for critical setters and privileged flows.</li>
                <li>Pause controls for high-impact modules (Funding Pool, Voting, Grant Manager, Faucet).</li>
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
                <li>Potential launch of a responsible vulnerability rewards program (currently not active).</li>
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
                For responsible disclosure and security reports, contact: <strong>info@tenyokj</strong>.
                Include affected contract/module, reproduction path, impact estimate, and transaction references where relevant.
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
              </div>
            </section>
          </section>
        </main>

                                       <footer className="relative mt-32 border-t border-white/20 pb-16 pt-12">
                                          <div className="pointer-events-none absolute -left-10 top-8 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.25),transparent_65%)] blur-2xl" />
                                          <div className="pointer-events-none absolute right-[-3rem] top-16 h-52 w-52 rounded-full bg-[radial-gradient(circle,rgba(244,63,94,0.22),transparent_65%)] blur-2xl" />
                                          <div className="text-sm text-slate-500">
                                            Live metrics come from on-chain reads and indexed sources where available. Some roadmap sections describe planned protocol direction.
                                          </div>
                                
                                          <div className="mt-10 grid gap-10 border-b border-white/20 pb-10 lg:grid-cols-4">
                                            <div>
                                              <h4 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                                                BERT Products
                                              </h4>
                                              <div className="mt-6 flex flex-col gap-3 text-lg text-slate-600 dark:text-slate-300">
                                                <a className="footer-link" href="https://github.com/Tenyokj/bert-core/blob/main/contracts/BERT/docs_contracts/IdeaRegistryUpgradeable.md">Idea Registry</a>
                                                <a className="footer-link" href="https://github.com/Tenyokj/bert-core/blob/main/contracts/BERT/docs_contracts/VotingSystemUpgradeable.md">Voting Rounds</a>
                                                <a className="footer-link" href="https://github.com/Tenyokj/bert-core/blob/main/contracts/BERT/docs_contracts/GrantManagerUpgradeable.md">Grant Engine</a>
                                                <a className="footer-link" href="https://github.com/Tenyokj/bert-core/blob/main/contracts/BERT/docs_contracts/ReputationSystemUpgradeable.md">Reputation Layer</a>
                                                <a className="footer-link" href="https://github.com/Tenyokj/bert-core/blob/main/docs/UPGRADES.md">Upgrade Modules</a>
                                              </div>
                                            </div>
                                
                                            <div>
                                              <h4 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                                                BERT DAO
                                              </h4>
                                              <div className="mt-6 flex flex-col gap-3 text-lg text-slate-600 dark:text-slate-300">
                                                <a className="footer-link" href="#">Governance stack</a>
                                                <a className="footer-link" href="/policy-docs">Policy docs</a>
                                                <a className="footer-link" href="/on-chain-votes">On-chain votes</a>
                                                <a className="footer-link" href="#">Treasury policies</a>
                                              </div>
                                            </div>
                                
                                            <div>
                                              <h4 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                                                Builders
                                              </h4>
                                              <div className="mt-6 flex flex-col gap-3 text-lg text-slate-600 dark:text-slate-300">
                                                <a className="footer-link" href="/developer-guide">Docs</a>
                                                <a className="footer-link" href="/developer-guide">Developer guide</a>
                                                <a className="footer-link" href="https://github.com/Tenyokj/bert-core/blob/main/docs/CONTRACTS.md">Smart contracts</a>
                                              </div>
                                            </div>
                                
                                            <div>
                                              <h4 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                                                Resources
                                              </h4>
                                              <div className="mt-6 flex flex-col gap-3 text-lg text-slate-600 dark:text-slate-300">
                                                <a className="footer-link" href="/how-it-works">How it works</a>
                                                <a className="footer-link" href="/faq">FAQ</a>
                        <a className="footer-link" href="/sepolia-guide">Sepolia guide</a>
                                                <a className="footer-link" href="/press-kit">Press kit</a>
                        <a className="footer-link" href="/build-dapps">Build dApps</a>
                                              </div>
                                            </div>
                                          </div>
                                
                                          <div className="mt-10 grid gap-10 lg:grid-cols-4">
                                            <div>
                                              <h4 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                                                Social Links
                                              </h4>
                                              <div className="mt-6 flex items-center gap-5 text-slate-600 dark:text-slate-300">
                                                <a href="https://github.com/tenyokj"><FaGithub className="text-2xl transition-transform duration-300 hover:-translate-y-1" /></a>
                                                <a href="https://www.reddit.com/user/PralineSeparate5261/"><FaReddit className="text-2xl transition-transform duration-300 hover:-translate-y-1" /></a>
                                                <a href="mailto:av7794257@gmail.com"><FaMailBulk className="text-2xl transition-transform duration-300 hover:-translate-y-1" /></a>
                                              </div>
                                            </div>
                                            <div>
                                              <h4 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                                                Analytics
                                              </h4>
                                              <div className="mt-6 flex flex-col gap-3 text-lg text-slate-600 dark:text-slate-300">
                                                <a className="footer-link" href="/protocol-stats">Protocol stats</a>
                                                <a className="footer-link" href="#">Treasury metrics</a>
                                              </div>
                                            </div>
                                            <div className="lg:col-span-2">
                                              <div className="flex flex-col gap-3 text-lg text-slate-500 dark:text-slate-300 lg:flex-row lg:items-center lg:justify-end">
                                                <a className="footer-link" href="/privacy-notice">Privacy Notice</a>
                                                <a className="footer-link" href="/terms-of-use">Terms of Use</a>
                                                <a className="footer-link" href="/security-roadmap">Security Roadmap</a>
                                              </div>
                                              <div className="mt-2 ml-auto w-fit">
                                                <ParticleText text="BERT" width={680} height={160} />
                                              </div>
                                            </div>
                                          </div>
                                        </footer>
      </div>
    </div>
  );
}
