import ParticleText from "@/components/ParticleText";
import Link from "next/link";
import { FaGithub, FaReddit, FaMailBulk, FaTelegramPlane } from "react-icons/fa";

export default function BuildDappsPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto max-w-[1240px] px-6 py-8 md:px-10">
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

        <main className="mt-10 space-y-12">
          <section className="relative overflow-hidden rounded-[36px] border border-white/20 bg-[linear-gradient(135deg,#042f2e_0%,#0f172a_55%,#1e293b_100%)] p-8 md:p-12">
            <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(20,184,166,0.45),transparent_70%)] blur-2xl" />
            <div className="pointer-events-none absolute -right-16 -bottom-20 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.45),transparent_70%)] blur-2xl" />

            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-200">Build with Ethereum</p>
            <h1 className="mt-4 max-w-4xl font-[var(--font-display)] text-4xl leading-tight text-white md:text-6xl">
              Want to build dApps like this one?
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-slate-200">
              Learn smart contracts, frontend integration, and real deployment workflows with structured tutorials.
              If you want to ship production-grade Web3 products, start from the same foundations used in BERT.
            </p>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-300">
              Web3 Studio focuses on practical implementation: contract architecture, security-aware patterns,
              wallet UX, indexing with The Graph, and deploy pipelines for Sepolia. The goal is not theory only,
              but repeatable workflows you can apply to your own product.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="https://tenyokj.github.io/web3-studio/"
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-teal-400 px-7 py-3 text-sm font-semibold text-slate-900 transition hover:-translate-y-0.5"
              >
                Open Web3 Studio
              </a>
              <Link
                href="/developer-guide"
                className="rounded-full border border-white/30 px-7 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5"
              >
                Read Developer Guide
              </Link>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-white/20 bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-teal-200">Track</p>
                <p className="mt-2 text-sm text-slate-100">Smart contracts, protocol logic, and upgrade-safe design.</p>
              </div>
              <div className="rounded-2xl border border-white/20 bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-blue-200">Track</p>
                <p className="mt-2 text-sm text-slate-100">Frontend integration with wallet flows and contract actions.</p>
              </div>
              <div className="rounded-2xl border border-white/20 bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-rose-200">Track</p>
                <p className="mt-2 text-sm text-slate-100">Testnet deployment, indexing, monitoring, and release checks.</p>
              </div>
            </div>
          </section>

          <section className="grid gap-5 md:grid-cols-3">
            <article className="rounded-3xl border border-white/15 bg-white/5 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-500">Step 01</p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-900 dark:text-slate-100">Write Contracts</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                Learn solidity basics, upgradeable patterns, role control, and safe storage layout decisions.
              </p>
            </article>
            <article className="rounded-3xl border border-white/15 bg-white/5 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">Step 02</p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-900 dark:text-slate-100">Connect Frontend</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                Use wagmi, viem, and clear status-driven UX so users can interact with contracts confidently.
              </p>
            </article>
            <article className="rounded-3xl border border-white/15 bg-white/5 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-500">Step 03</p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-900 dark:text-slate-100">Ship to Testnet</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                Deploy to Sepolia, index with The Graph, and run real smoke tests with wallet flows.
              </p>
            </article>
          </section>

          <section className="grid gap-5 md:grid-cols-2">
            <article className="rounded-3xl border border-white/15 bg-white/5 p-6 md:p-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Who it is for</h2>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                <li>Developers moving from frontend-only work into contract-integrated dApps.</li>
                <li>Builders who already write Solidity but want production-grade app architecture.</li>
                <li>Teams preparing testnet launches with clean deployment and verification flows.</li>
                <li>Founders who need end-to-end understanding before scaling contributors.</li>
              </ul>
            </article>
            <article className="rounded-3xl border border-white/15 bg-white/5 p-6 md:p-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">What you will build</h2>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                <li>Role-aware contracts with clear state transitions and admin boundaries.</li>
                <li>A React/Next.js interface connected through wagmi and viem.</li>
                <li>Indexed data layer with The Graph for history and analytics views.</li>
                <li>A deploy flow that runs on Sepolia and is ready for production hardening.</li>
              </ul>
            </article>
          </section>

          <section className="rounded-3xl border border-white/15 bg-white/5 p-6 md:p-8">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Start Learning Now</h2>
            <p className="mt-3 max-w-4xl text-base leading-relaxed text-slate-700 dark:text-slate-200">
              If you want to build DAO tooling, grant systems, voting apps, or any Ethereum-native product,
              Web3 Studio gives you a direct path from concept to working testnet release. Open the platform,
              choose a track, and start implementing step by step.
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              <a
                href="https://tenyokj.github.io/web3-studio/"
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-slate-900 px-7 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5"
              >
                Go to Web3 Studio
              </a>
              <Link
                href="/sepolia-guide"
                className="rounded-full border border-white/30 px-7 py-3 text-sm font-semibold text-slate-800 dark:text-slate-100 transition hover:-translate-y-0.5"
              >
                Sepolia onboarding
              </Link>
            </div>
          </section>
        </main>
                       <footer className="relative mt-32 border-t border-white/20 pb-16 pt-12">
                          <div className="pointer-events-none absolute -left-10 top-8 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.25),transparent_65%)] blur-2xl" />
                          <div className="pointer-events-none absolute right-[-3rem] top-16 h-52 w-52 rounded-full bg-[radial-gradient(circle,rgba(244,63,94,0.22),transparent_65%)] blur-2xl" />
                          <div className="text-sm text-slate-500">
                            Live metrics come from on-chain reads and indexed sources where available. Some roadmap sections describe planned protocol direction.
                          </div>
                
                          <div className="mt-10 grid gap-4 border-b border-white/20 pb-8 md:hidden">
                            <div className="flex flex-wrap gap-3 text-base text-slate-600 dark:text-slate-300">
                              <a className="footer-link" href="https://bertdao-docs.vercel.app/">Docs</a>
                              <a className="footer-link" href="/privacy-notice">Privacy Notice</a>
                              <a className="footer-link" href="/terms-of-use">Terms of Use</a>
                            </div>
                            <div className="flex items-center gap-5 text-slate-600 dark:text-slate-300">
                              <a href="https://github.com/tenyokj" aria-label="GitHub"><FaGithub className="text-2xl transition-transform duration-300 hover:-translate-y-1" /></a>
                              <a href="https://www.reddit.com/user/PralineSeparate5261/" aria-label="Reddit"><FaReddit className="text-2xl transition-transform duration-300 hover:-translate-y-1" /></a>
                              <a href="https://t.me/+8DEt_M62Db00NzYy" target="_blank" rel="noreferrer" aria-label="Telegram"><FaTelegramPlane className="text-2xl transition-transform duration-300 hover:-translate-y-1" /></a>
                              <a href="mailto:av7794257@gmail.com" aria-label="Email"><FaMailBulk className="text-2xl transition-transform duration-300 hover:-translate-y-1" /></a>
                            </div>
                          </div>

                          <div className="mt-10 hidden gap-10 border-b border-white/20 pb-10 md:grid lg:grid-cols-4">
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
                                <a className="footer-link" href="https://bertdao-docs.vercel.app/">Docs</a>
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
                
                          <div className="mt-10 hidden gap-10 md:grid lg:grid-cols-4">
                            <div>
              <h4 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                Social Links
              </h4>
              <div className="mt-6 flex items-center gap-5 text-slate-600 dark:text-slate-300">
                <a href="https://github.com/tenyokj" aria-label="GitHub"><FaGithub className="text-2xl transition-transform duration-300 hover:-translate-y-1" /></a>
                <a href="https://www.reddit.com/user/PralineSeparate5261/" aria-label="Reddit"><FaReddit className="text-2xl transition-transform duration-300 hover:-translate-y-1" /></a>
                <a href="https://t.me/+8DEt_M62Db00NzYy" target="_blank" rel="noreferrer" aria-label="Telegram"><FaTelegramPlane className="text-2xl transition-transform duration-300 hover:-translate-y-1" /></a>
                <a href="mailto:av7794257@gmail.com" aria-label="Email"><FaMailBulk className="text-2xl transition-transform duration-300 hover:-translate-y-1" /></a>
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
