import ParticleText from "@/components/ParticleText";
import Link from "next/link";
import { FaGithub, FaReddit, FaMailBulk } from "react-icons/fa";

export default function GovernanceStackPage() {
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

        <div className="mt-9 grid gap-12 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-8 lg:h-[calc(100vh-72px)] lg:overflow-y-auto">
            <p className="text-xs uppercase tracking-[0.28em] text-teal-600">Governance Stack</p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-900 dark:text-slate-100">Protocol Architecture</h1>
            <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Technical map of governance modules: decision flow, permissions, execution path, and trust boundaries.
            </p>
            <div className="mt-7 space-y-2 border-l border-white/20 pl-4 text-sm text-slate-600 dark:text-slate-300">
              <a href="#overview" className="block hover:text-slate-900 dark:hover:text-white">Stack Overview</a>
              <a href="#core" className="block hover:text-slate-900 dark:hover:text-white">Core Contracts</a>
              <a href="#control" className="block hover:text-slate-900 dark:hover:text-white">Control Layer</a>
              <a href="#reputation" className="block hover:text-slate-900 dark:hover:text-white">Reputation Layer</a>
              <a href="#execution" className="block hover:text-slate-900 dark:hover:text-white">Execution Layer</a>
              <a href="#upgrade" className="block hover:text-slate-900 dark:hover:text-white">Upgrade Layer</a>
              <a href="#trust" className="block hover:text-slate-900 dark:hover:text-white">Trust Boundaries</a>
            </div>
          </aside>

          <main className="space-y-12 border-t border-white/12 pt-8">
            <section id="overview" className="space-y-4">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Stack Overview</h2>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                BERT governance stack is split into independent modules so policy, decision-making, and treasury execution are not tightly coupled.
                This separation improves auditability and allows controlled upgrades without rewriting the full protocol.
              </p>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                Conceptually, the stack has three big phases: <strong>state intake</strong> (ideas and votes), <strong>decision settlement</strong> (winner resolution),
                and <strong>execution</strong> (grant distribution and completion tracking).
              </p>
            </section>

            <section id="core" className="space-y-4">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Core Contracts</h2>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                <strong>IdeaRegistry</strong> is the source of truth for proposal metadata and statuses. <strong>VotingSystem</strong> owns round lifecycle,
                vote accounting, and winner resolution. <strong>FundingPool</strong> maintains treasury balances and stake-linked accounting. <strong>GrantManager</strong>
                applies payout logic from settled governance outcomes. <strong>GovernanceToken</strong> provides ERC-20 stake asset behavior.
              </p>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                Each core contract has clear scope to reduce hidden side effects and simplify reasoning about failures.
              </p>
            </section>

            <section id="control" className="space-y-4">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Control Layer</h2>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                Permission model is centralized through <strong>RolesRegistry</strong>. Contracts that need privileged actions receive dedicated system roles,
                while user capabilities are granted through progression pathways.
              </p>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                Admin controls (setters, pause/unpause, dependency rewiring) are powerful by design and must be operated under strict key and review policy.
              </p>
            </section>

            <section id="reputation" className="space-y-4">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Reputation & Progression Layer</h2>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                <strong>ReputationSystem</strong> tracks contributor quality signals tied to outcomes. <strong>VoterProgression</strong> records winning participation and grants
                role eligibility (for example reviewer/curator paths) through policy logic.
              </p>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                This layer is intentionally separated from raw vote counting so social signal mechanics can evolve without breaking core vote accounting.
              </p>
            </section>

            <section id="execution" className="space-y-4">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Execution Layer</h2>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                Governance execution starts only after round settlement. Winner result feeds into payout workflow where treasury movement is validated,
                executed, and reflected in status updates. Final closure is author-driven completion marker on funded idea.
              </p>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                The design goal is that every meaningful execution step is externally verifiable through state and events.
              </p>
            </section>

            <section id="upgrade" className="space-y-4">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Upgrade Layer</h2>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                Core modules are deployed behind transparent proxies. Upgrade authority is administrative and therefore a major trust boundary.
                Safe upgrade policy requires storage compatibility checks, staging rehearsal, and post-upgrade verification.
              </p>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                Upgrades should be treated as governance events with explicit review notes, rollback planning, and audit trail.
              </p>
            </section>

            <section id="trust" className="space-y-4">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Trust Boundaries</h2>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                Trust-minimized parts: vote accounting, status transitions, and payout execution logic once valid calls are made. Admin-trusted parts:
                parameter tuning, pause controls, dependency rewiring, and upgrades.
              </p>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                Production governance maturity depends on reducing single-key assumptions and publishing these boundaries transparently to participants.
              </p>
            </section>

            <section className="flex flex-wrap gap-2 border-t border-white/12 pt-6">
              <Link href="/policy-docs" className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100">Policy Docs</Link>
              <Link href="/treasury-policies" className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100">Treasury Policies</Link>
              <Link href="/rounds" className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white">Launch App</Link>
            </section>
          </main>
        </div>
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
                                        <a className="footer-link" href="/governance-stack">Governance stack</a>
                                        <a className="footer-link" href="/policy-docs">Policy docs</a>
                                        <a className="footer-link" href="/on-chain-votes">On-chain votes</a>
                                        <a className="footer-link" href="/treasury-policies">Treasury policies</a>
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
                                        <a className="footer-link" href="/treasury-policies#reporting">Treasury metrics</a>
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
