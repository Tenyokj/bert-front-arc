import ParticleText from "@/components/ParticleText";
import Link from "next/link";
import { FaGithub, FaReddit, FaMailBulk } from "react-icons/fa";

const UPDATED_AT = "February 15, 2026";

export default function TermsOfUsePage() {
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
            <h1 className="mt-3 text-4xl font-semibold text-slate-900 dark:text-slate-100">Terms of Use</h1>
            <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Contractual terms governing access to and use of BERT websites, interfaces, and protocol interaction tools.
            </p>
            <p className="mt-4 text-xs uppercase tracking-[0.15em] text-slate-500">Last updated: {UPDATED_AT}</p>

            <div className="mt-7 space-y-2 border-l border-white/20 pl-4 text-sm text-slate-600 dark:text-slate-300">
              <a href="#acceptance" className="block hover:text-slate-900 dark:hover:text-white">Acceptance</a>
              <a href="#eligibility" className="block hover:text-slate-900 dark:hover:text-white">Eligibility</a>
              <a href="#service" className="block hover:text-slate-900 dark:hover:text-white">Service Scope</a>
              <a href="#wallet" className="block hover:text-slate-900 dark:hover:text-white">Wallet & Keys</a>
              <a href="#risks" className="block hover:text-slate-900 dark:hover:text-white">Risk Disclosures</a>
              <a href="#prohibited" className="block hover:text-slate-900 dark:hover:text-white">Prohibited Use</a>
              <a href="#ip" className="block hover:text-slate-900 dark:hover:text-white">Intellectual Property</a>
              <a href="#disclaimer" className="block hover:text-slate-900 dark:hover:text-white">Disclaimers</a>
              <a href="#liability" className="block hover:text-slate-900 dark:hover:text-white">Limitation of Liability</a>
              <a href="#indemnity" className="block hover:text-slate-900 dark:hover:text-white">Indemnity</a>
              <a href="#changes" className="block hover:text-slate-900 dark:hover:text-white">Changes</a>
              <a href="#law" className="block hover:text-slate-900 dark:hover:text-white">Governing Law</a>
              <a href="#contact" className="block hover:text-slate-900 dark:hover:text-white">Contact</a>
            </div>
          </aside>

          <section className="space-y-10 border-t border-white/12 pt-8">
            <section id="acceptance" className="space-y-3">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">1. Acceptance of Terms</h2>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                By accessing or using BERT websites, documentation, and dApp interfaces, you agree to these Terms of Use.
                If you do not agree, do not use the service.
              </p>
            </section>

            <section id="eligibility" className="space-y-3">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">2. Eligibility</h2>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                You represent that you are legally capable of entering binding terms and that your use of the service is
                permitted in your jurisdiction. You are responsible for compliance with local laws, regulations, and tax rules.
              </p>
            </section>

            <section id="service" className="space-y-3">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">3. Service Scope</h2>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                BERT provides non-custodial software interfaces for interacting with blockchain smart contracts. BERT does not
                take custody of your private keys or digital assets. Smart contract execution is determined by on-chain logic.
              </p>
            </section>

            <section id="wallet" className="space-y-3">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">4. Wallets, Accounts, and Private Keys</h2>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                You are solely responsible for your wallet security, recovery phrases, private keys, device security, and
                transaction approvals. Transactions submitted from your wallet are treated as authorized by you.
              </p>
            </section>

            <section id="risks" className="space-y-3">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">5. Risk Disclosures</h2>
              <ul className="list-disc space-y-2 pl-5 text-base text-slate-700 dark:text-slate-200">
                <li>Blockchain transactions are irreversible and may fail for reasons outside interface control.</li>
                <li>Network congestion, oracle issues, RPC failures, and smart contract vulnerabilities may cause losses.</li>
                <li>Token values may be volatile, and governance outcomes are not guaranteed.</li>
                <li>BERT content is not investment, legal, accounting, or tax advice.</li>
              </ul>
            </section>

            <section id="prohibited" className="space-y-3">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">6. Prohibited Use</h2>
              <ul className="list-disc space-y-2 pl-5 text-base text-slate-700 dark:text-slate-200">
                <li>Use of the service for unlawful, fraudulent, abusive, or sanctioned activity.</li>
                <li>Attempts to exploit, disrupt, reverse engineer, or interfere with service infrastructure.</li>
                <li>Misrepresentation of affiliation, identity, or rights in connection with protocol usage.</li>
              </ul>
            </section>

            <section id="ip" className="space-y-3">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">7. Intellectual Property</h2>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                Site content, branding, and documentation are protected by applicable intellectual property laws. Open-source
                components remain governed by their respective licenses, including GPL terms where applicable.
              </p>
            </section>

            <section id="disclaimer" className="space-y-3">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">8. Disclaimers</h2>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                The service is provided on an <strong>“AS IS”</strong> and <strong>“AS AVAILABLE”</strong> basis, without warranties of any
                kind, express or implied, including merchantability, fitness for a particular purpose, non-infringement,
                uninterrupted availability, or error-free operation.
              </p>
            </section>

            <section id="liability" className="space-y-3">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">9. Limitation of Liability</h2>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                To the maximum extent permitted by law, BERT and its contributors are not liable for indirect, incidental,
                consequential, special, exemplary, or punitive damages, or for loss of profits, revenue, data, goodwill, or
                digital assets arising out of or related to your use of the service.
              </p>
            </section>

            <section id="indemnity" className="space-y-3">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">10. Indemnification</h2>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                You agree to defend, indemnify, and hold harmless BERT, maintainers, and contributors from claims, liabilities,
                damages, losses, and expenses arising from your use of the service or your violation of these Terms.
              </p>
            </section>

            <section id="changes" className="space-y-3">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">11. Service Changes and Term Changes</h2>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                BERT may modify, suspend, or discontinue any part of the interface at any time. Terms may be updated from time
                to time. Continued use after updates constitutes acceptance of revised Terms.
              </p>
            </section>

            <section id="law" className="space-y-3">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">12. Governing Law and Disputes</h2>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                These Terms are governed by applicable laws of the operator’s principal jurisdiction, without regard to conflict
                of law rules, unless mandatory local law requires otherwise. Any dispute shall be brought in courts of competent
                jurisdiction in that location unless otherwise agreed in writing.
              </p>
            </section>

            <section id="contact" className="space-y-3 border-t border-white/12 pt-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">13. Contact</h2>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                Questions about these Terms: <strong>info@tenyokj</strong>
              </p>
              <div className="flex flex-wrap gap-2">
                <Link href="/privacy-notice" className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100">
                  Privacy Notice
                </Link>
                <Link href="/policy-docs" className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100">
                  Policy Docs
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

