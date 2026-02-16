import ParticleText from "@/components/ParticleText";
import Link from "next/link";
import { FaGithub, FaReddit, FaMailBulk } from "react-icons/fa";

const UPDATED_AT = "February 15, 2026";

export default function PrivacyNoticePage() {
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
            <p className="text-xs uppercase tracking-[0.28em] text-teal-600">Legal</p>
            <h1 className="mt-3 text-4xl font-semibold text-slate-900 dark:text-slate-100">Privacy Notice</h1>
            <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              This notice explains what data is processed when you use the BERT website and dApp interfaces.
            </p>
            <p className="mt-4 text-xs uppercase tracking-[0.15em] text-slate-500">Last updated: {UPDATED_AT}</p>
            <div className="mt-7 space-y-2 border-l border-white/20 pl-4 text-sm text-slate-600 dark:text-slate-300">
              <a href="#scope" className="block hover:text-slate-900 dark:hover:text-white">Scope</a>
              <a href="#data" className="block hover:text-slate-900 dark:hover:text-white">Data We Process</a>
              <a href="#usage" className="block hover:text-slate-900 dark:hover:text-white">How Data Is Used</a>
              <a href="#third-parties" className="block hover:text-slate-900 dark:hover:text-white">Third-Party Services</a>
              <a href="#storage" className="block hover:text-slate-900 dark:hover:text-white">Storage & Retention</a>
              <a href="#rights" className="block hover:text-slate-900 dark:hover:text-white">Your Rights</a>
              <a href="#contact" className="block hover:text-slate-900 dark:hover:text-white">Contact</a>
            </div>
          </aside>

          <section className="space-y-10 border-t border-white/12 pt-8">
            <section id="scope" className="space-y-3">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Scope</h2>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                This Privacy Notice applies to BERT web interfaces and related documentation pages. It covers interface-level
                data processing and does not alter public blockchain transparency.
              </p>
            </section>

            <section id="data" className="space-y-3">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Data We Process</h2>
              <ul className="list-disc space-y-2 pl-5 text-base text-slate-700 dark:text-slate-200">
                <li>Public wallet address when you connect a wallet.</li>
                <li>On-chain transaction and contract interaction data that is already public by blockchain design.</li>
                <li>Technical request metadata from RPC providers (for example IP address and request logs).</li>
                <li>Local browser state required for interface behavior (for example cached preferences).</li>
              </ul>
            </section>

            <section id="usage" className="space-y-3">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">How Data Is Used</h2>
              <ul className="list-disc space-y-2 pl-5 text-base text-slate-700 dark:text-slate-200">
                <li>To render balances, rounds, ideas, votes, and profile information in the dApp.</li>
                <li>To route signed transactions to blockchain nodes.</li>
                <li>To maintain basic reliability, security diagnostics, and operational monitoring.</li>
              </ul>
            </section>

            <section id="third-parties" className="space-y-3">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Third-Party Services</h2>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                Depending on your setup, the interface may rely on wallet providers, RPC endpoints, hosting infrastructure,
                and optional analytics/telemetry vendors. Those providers process data under their own privacy terms.
              </p>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                Indexed reads may be served via The Graph infrastructure. This does not change blockchain data visibility; it
                provides query indexing for public on-chain events.
              </p>
            </section>

            <section id="storage" className="space-y-3">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Storage & Retention</h2>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                Interface-level local data is kept in your browser and can be cleared at any time. On-chain records are
                permanent and publicly queryable by design.
              </p>
            </section>

            <section id="rights" className="space-y-3">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Your Rights</h2>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                You can disconnect your wallet, clear local browser storage, and stop using the interface at any time.
                Requests related to off-chain service logs should be directed to the respective third-party providers.
              </p>
            </section>

            <section id="contact" className="space-y-3 border-t border-white/12 pt-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Contact</h2>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                For privacy questions, contact: <strong>info@tenyokj</strong>
              </p>
              <div className="flex flex-wrap gap-2">
                <Link href="/policy-docs" className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100">
                  Policy Docs
                </Link>
                <Link href="/terms-of-use" className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100">
                  Terms of Use
                </Link>
                <Link href="/security-roadmap" className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100">
                  Security Roadmap
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
