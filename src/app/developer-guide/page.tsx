import ParticleText from "@/components/ParticleText";
import Link from "next/link";
import { FaGithub, FaReddit, FaMailBulk } from "react-icons/fa";

export default function DeveloperGuidePage() {
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
            <p className="text-xs uppercase tracking-[0.28em] text-teal-600">Developer Guide</p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-900 dark:text-slate-100">Build, Integrate, Operate</h1>
            <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Practical integration guide for frontend contributors, protocol integrators, and operators running BERT flows.
            </p>
            <div className="mt-7 space-y-2 border-l border-white/20 pl-4 text-sm text-slate-600 dark:text-slate-300">
              <a href="#quickstart" className="block hover:text-slate-900 dark:hover:text-white">Quick Start (5 min)</a>
              <a href="#entry" className="block hover:text-slate-900 dark:hover:text-white">Architecture Entry Points</a>
              <a href="#setup" className="block hover:text-slate-900 dark:hover:text-white">Local Setup</a>
              <a href="#integration" className="block hover:text-slate-900 dark:hover:text-white">Contract Integration</a>
              <a href="#subgraph" className="block hover:text-slate-900 dark:hover:text-white">The Graph Integration</a>
              <a href="#wallet" className="block hover:text-slate-900 dark:hover:text-white">Wallet & RPC Alignment</a>
              <a href="#state" className="block hover:text-slate-900 dark:hover:text-white">State & Status Model</a>
              <a href="#errors" className="block hover:text-slate-900 dark:hover:text-white">Error Handling UX</a>
              <a href="#admin" className="block hover:text-slate-900 dark:hover:text-white">Admin & Safety</a>
              <a href="#testing" className="block hover:text-slate-900 dark:hover:text-white">Testing Workflow</a>
              <a href="#checks" className="block hover:text-slate-900 dark:hover:text-white">Release Checklist</a>
              <a href="#release" className="block hover:text-slate-900 dark:hover:text-white">Production Readiness</a>
            </div>
          </aside>

          <main className="space-y-12 border-t border-white/12 pt-8">
            <section id="quickstart" className="space-y-4">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Quick Start (5 min)</h2>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                This is the shortest reliable flow to run BERT locally and submit real transactions from the UI.
                Use one terminal for Hardhat node and another for frontend.
              </p>
              <div className="rounded-2xl border border-white/15 bg-white/5 p-4">
                <pre className="overflow-x-auto text-sm leading-relaxed text-slate-800 dark:text-slate-200">
{`# Terminal A
npx hardhat node

# Terminal B (core/deploy)
npx hardhat run scripts/deploy/deploy-proxies.ts --network localhost
npx hardhat run scripts/deploy/deploy-faucet.ts --network localhost

# Terminal C (frontend)
npm run dev`}
                </pre>
              </div>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                Then copy deployed proxy addresses into <code>.env</code> and keep
                <code> NEXT_PUBLIC_HARDHAT_RPC_URL=http://127.0.0.1:8545</code> if frontend runs on the same machine/browser profile.
              </p>
            </section>

            <section id="entry" className="space-y-4">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Architecture Entry Points</h2>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                Start from contract boundaries, not UI screens. For proposal data read <strong>IdeaRegistry</strong>; for rounds and vote constraints read
                <strong> VotingSystem</strong>; for balances and stake accounting read <strong>FundingPool</strong>; for payout execution read
                <strong> GrantManager</strong>; for permissions read <strong>RolesRegistry</strong>.
              </p>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                Frontend integration root is <code>src/lib/contracts.ts</code> (ABI + addresses) and <code>src/lib/web3.ts</code> (wagmi config).
                If a view breaks, first verify these two files and environment variables.
              </p>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                Treat <strong>events</strong> as the source for history screens and <strong>view calls</strong> as source for live state.
                This avoids stale UI when users refresh during active voting windows.
              </p>
            </section>

            <section id="setup" className="space-y-4">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Local Setup</h2>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                Recommended startup order: run local node, deploy proxies, deploy faucet, copy deployed addresses into frontend env, then run frontend.
                Keep one deployment session per test cycle; restarting node invalidates old addresses.
              </p>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                Most common integration bug is network mismatch: wallet on one RPC, frontend on another. Confirm chain ID and RPC host alignment before debugging contract logic.
              </p>
            </section>

            <section id="integration" className="space-y-4">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Contract Integration</h2>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                Core write flows are: <code>createIdea</code>, <code>startVotingRound</code>, <code>vote</code>, <code>endVotingRound</code>,
                grant execution path, and author completion marker. Always surface readable pre-check errors in UI before opening wallet prompt.
              </p>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                For token-based actions, sequence matters: ensure user balance, then approval, then protocol write call. Failed approvals or stale allowance are frequent root causes.
              </p>
            </section>

            <section id="subgraph" className="space-y-4">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">The Graph Integration</h2>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                BERT frontend supports hybrid reads: direct on-chain RPC plus indexed reads from The Graph.
                Set <code>NEXT_PUBLIC_SUBGRAPH_URL</code> to enable indexed queries for rounds, ideas, and votes pages.
              </p>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                Production recommendation: keep subgraph start blocks close to deployment blocks, monitor indexing status in Studio,
                and keep RPC fallback enabled for critical reads.
              </p>
            </section>

            <section id="wallet" className="space-y-4">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Wallet & RPC Alignment</h2>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                Most transaction issues are not Solidity bugs. They are RPC mismatches between wallet, frontend transport, and node host.
                Keep all three on the same chain ID (<code>31337</code> for local Hardhat) and same reachable RPC endpoint.
              </p>
              <div className="rounded-2xl border border-white/15 bg-white/5 p-4">
                <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700 dark:text-slate-200">
                  <li><code>curl</code> check RPC chainId before opening frontend.</li>
                  <li>Use one wallet account for admin tests and a separate account for non-admin UX checks.</li>
                  <li>Disable conflicting wallet extensions in test profile to reduce provider collisions.</li>
                </ul>
              </div>
            </section>

            <section id="state" className="space-y-4">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">State & Status Model</h2>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                Idea lifecycle is policy-critical: <code>Pending -&gt; Voting -&gt; WonVoting/Rejected -&gt; Funded -&gt; Completed</code>.
                If a write action fails, verify status first. Many operations are deliberately stage-restricted.
              </p>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                Review/curation permissions are also status-bound and role-bound. Keep client-side validation aligned with contract guards to avoid confusing raw revert output.
              </p>
            </section>

            <section id="errors" className="space-y-4">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Error Handling UX</h2>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                Never show raw wallet/viem payloads as final user message. Decode and map known errors into actionable UI text.
                Example: instead of <code>Internal error</code>, show <strong>“Action available only in Voting status.”</strong>
              </p>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                Keep two layers: <strong>pre-flight validation</strong> (client-side checks before signature) and
                <strong> post-tx parsing</strong> (friendly fallback if chain call still reverts).
              </p>
            </section>

            <section id="admin" className="space-y-4">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Admin & Safety</h2>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                Admin setters are powerful and must be treated as governance-level changes. Parameter updates can alter fairness, treasury behavior, and user eligibility.
              </p>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                Incident policy is explicit: <strong>pause -&gt; diagnose -&gt; patch -&gt; verify -&gt; unpause</strong>. Never resume writes before post-fix verification of roles and parameters.
              </p>
            </section>

            <section id="testing" className="space-y-4">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Testing Workflow</h2>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                Minimum pre-merge checks: contract tests pass, critical UI writes tested end-to-end (idea creation, voting, payout path), and regression of role/status guards.
              </p>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                For frontend stability, verify hydration-sensitive pages and wallet-connected pages in a clean browser profile to reduce extension noise during debugging.
              </p>
            </section>

            <section id="checks" className="space-y-4">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Release Checklist</h2>
              <div className="rounded-2xl border border-white/15 bg-white/5 p-4">
                <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700 dark:text-slate-200">
                  <li>All proxy addresses in <code>.env</code> match latest deploy output.</li>
                  <li>Roles are wired: voting, grant, distributor, registry, reputation, progression.</li>
                  <li>Pause states are correct for FundingPool / VotingSystem / GrantManager.</li>
                  <li>Critical parameters validated: <code>minStake</code>, <code>IDEAS_PER_ROUND</code>, payout shares, faucet limits.</li>
                  <li>Smoke test done from non-admin wallet: claim faucet, create idea, vote, close round.</li>
                </ul>
              </div>
            </section>

            <section id="release" className="space-y-4">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Production Readiness</h2>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                Before Sepolia/public rollout: verify addresses, verify role wiring, verify pause state, verify key parameters, and run smoke transactions from non-admin user.
              </p>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                Keep deployment manifests, tx hashes, and policy snapshots versioned. This makes incidents diagnosable and changes auditable.
              </p>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                For each release, keep a short changelog entry with: changed contracts, changed UI flows, migration steps, rollback plan, and operator owner.
              </p>
            </section>

            <section className="flex flex-wrap gap-2 border-t border-white/12 pt-6">
              <Link href="/policy-docs" className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100">Policy Docs</Link>
              <Link href="/governance-stack" className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100">Governance Stack</Link>
              <Link href="/rounds" className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white">Go to dApp</Link>
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
                                <a className="footer-link" href="https://docs.bert.fi">Docs</a>
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
