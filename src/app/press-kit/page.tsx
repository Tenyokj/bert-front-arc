import ParticleText from "@/components/ParticleText";
import Image from "next/image";
import Link from "next/link";
import { FaGithub, FaReddit, FaMailBulk } from "react-icons/fa";

const keyFacts = [
  "Protocol type: Upgradeable DAO voting and grants system",
  "Core flow: Ideas -> Voting -> Funding -> Distribution",
  "Token: BTK (ERC-20 governance token)",
  "Permission model: Role-based access control for critical actions",
  "Transparency: On-chain state transitions and auditable grant outcomes",
];

const messaging = [
  "BERT converts proposals into funded outcomes with clear on-chain rules.",
  "Stake-backed voting aligns participation with responsibility.",
  "Reputation and progression reward consistent, high-quality contributors.",
  "Upgradeable modules support long-term protocol evolution.",
];

const dappScreens = [
  "Screenshot 2026-02-14 at 19.33.03.png",
  "Screenshot 2026-02-14 at 19.35.36.png",
  "Screenshot 2026-02-14 at 19.48.01.png",
  "Screenshot 2026-02-14 at 19.52.16.png",
  "Screenshot 2026-02-14 at 19.52.29.png",
  "Screenshot 2026-02-14 at 19.53.04.png",
  "Screenshot 2026-02-14 at 19.53.18.png",
  "Screenshot 2026-02-14 at 19.53.36.png",
  "Screenshot 2026-02-14 at 19.54.58.png",
  "Screenshot 2026-02-14 at 19.55.10.png",
  "Screenshot 2026-02-14 at 19.55.24.png",
];

export default function PressKitPage() {
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

        <main className="mt-10 grid gap-10 lg:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-8 lg:h-[calc(100vh-72px)] lg:overflow-y-auto">
            <p className="text-xs uppercase tracking-[0.28em] text-teal-600">Press Kit</p>
            <h1 className="mt-3 text-4xl font-semibold text-slate-900 dark:text-slate-100">BERT Media Assets</h1>
            <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Official materials for media, partners, and ecosystem pages. Use this page as the reference source for
              project description, brand wording, and links.
            </p>
            <div className="mt-7 space-y-2 border-l border-white/20 pl-4 text-sm text-slate-600 dark:text-slate-300">
              <a href="#about" className="block hover:text-slate-900 dark:hover:text-white">About BERT</a>
              <a href="#facts" className="block hover:text-slate-900 dark:hover:text-white">Key Facts</a>
              <a href="#brand" className="block hover:text-slate-900 dark:hover:text-white">Brand Assets</a>
              <a href="#messaging" className="block hover:text-slate-900 dark:hover:text-white">Messaging</a>
              <a href="#screenshots" className="block hover:text-slate-900 dark:hover:text-white">Screenshots</a>
              <a href="#links" className="block hover:text-slate-900 dark:hover:text-white">Official Links</a>
              <a href="#legal" className="block hover:text-slate-900 dark:hover:text-white">Legal & Contact</a>
            </div>
          </aside>

          <section className="space-y-12 border-t border-white/12 pt-8">
            <section id="about" className="space-y-4">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">About BERT</h2>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                BERT is an upgradeable DAO voting and grant system that turns community proposals into funded outcomes.
                Users submit ideas, vote with stake, and see transparent on-chain grant distribution.
              </p>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                The protocol combines Idea Registry, structured voting rounds, Funding Pool, and Grant Manager into one
                deterministic lifecycle. Reputation and progression mechanics reward consistent contributors, while role-gated
                permissions protect critical operations.
              </p>
            </section>

            <section id="facts" className="space-y-4">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Key Facts</h2>
              <ul className="list-disc space-y-2 pl-5 text-base text-slate-700 dark:text-slate-200">
                {keyFacts.map((fact) => (
                  <li key={fact}>{fact}</li>
                ))}
              </ul>
            </section>

            <section id="brand" className="space-y-5">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Brand Assets</h2>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                Official banner/logo preview:
              </p>
              <div className="rounded-2xl border border-white/15 bg-white/5 p-4">
                <Image
                  src="/banner.png"
                  alt="BERT brand banner"
                  width={1600}
                  height={700}
                  className="h-auto w-full rounded-xl"
                  priority
                />
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Brand usage rules: do not distort proportions, do not rotate marks, and keep clear spacing around the logo.
              </p>
            </section>

            <section id="messaging" className="space-y-4">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Approved Messaging</h2>
              <ul className="list-disc space-y-2 pl-5 text-base text-slate-700 dark:text-slate-200">
                {messaging.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </section>

            <section id="screenshots" className="space-y-4">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Suggested Screenshots</h2>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                Current dApp screenshots are embedded below from <code>/public/screens</code>.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {dappScreens.map((file) => (
                  <div key={file} className="rounded-2xl border border-white/15 bg-white/5 p-3">
                    <Image
                      src={`/screens/${file.replaceAll(" ", "%20")}`}
                      alt={file}
                      width={1400}
                      height={900}
                      className="h-auto w-full rounded-lg border border-white/10"
                    />
                  </div>
                ))}
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/5 p-4 text-sm text-slate-700 dark:text-slate-200">
                Keep screenshots recent and consistent with deployed network state to avoid stale UI in press materials.
              </div>
            </section>

            <section id="links" className="space-y-4">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Official Links</h2>
              <ul className="list-disc space-y-2 pl-5 text-base text-slate-700 dark:text-slate-200">
                <li>
                  Core contracts repository:{" "}
                  <a href="https://github.com/Tenyokj/bert-core" className="text-teal-600 hover:underline">
                    github.com/Tenyokj/bert-core
                  </a>
                </li>
                <li>
                  Contracts documentation:{" "}
                  <a href="https://github.com/Tenyokj/bert-core/blob/main/docs/CONTRACTS.md" className="text-teal-600 hover:underline">
                    docs/CONTRACTS.md
                  </a>
                </li>
                <li>
                  Protocol docs: Architecture, Security, Upgrades, Config, Operations, FAQ, Glossary, Getting Started.
                </li>
              </ul>
            </section>

            <section id="legal" className="space-y-4 border-t border-white/12 pt-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Legal & Contact</h2>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                This repository contains core smart contracts and may evolve rapidly. Always reference the latest docs for
                integration accuracy.
              </p>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                License: GNU GPL v3 (or later). Contact: <strong>info@tenyokj</strong>
              </p>
              <div className="flex flex-wrap gap-2">
                <Link href="/policy-docs" className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100">
                  Policy Docs
                </Link>
                <Link href="/developer-guide" className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100">
                  Developer Guide
                </Link>
                <Link href="/how-it-works" className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white">
                  How It Works
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
                                <a className="footer-link" href="https://bertdao-docs.vercel.app">Docs</a>
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
