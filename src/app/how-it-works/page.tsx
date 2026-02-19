"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import ParticleText from "@/components/ParticleText";
import {
  FaGithub,
  FaMailBulk,
  FaExternalLinkAlt,
  FaBook,
  FaReddit,
} from "react-icons/fa";

type Topic = {
  id: "flow" | "token" | "roles" | "grants" | "safety" | "started";
  nav: string;
  title: string;
  intro: string;
  links: Array<{ href: string; label: string }>;
};

const topics: Topic[] = [
  {
    id: "flow",
    nav: "BERT Flow",
    title: "BERT Flow",
    intro:
      "How proposals move from idea to funded implementation in a deterministic on-chain lifecycle.",
    links: [
      { href: "/rounds", label: "Open Rounds" },
      { href: "/ideas/new", label: "Create Idea" },
      { href: "/docs/ARCHITECTURE.md", label: "Architecture" },
      { href: "/docs/OPERATIONS.md", label: "Operations" },
    ],
  },
  {
    id: "token",
    nav: "BERTToken",
    title: "BERTToken (BTK)",
    intro:
      "What BTK is, why it exists in the protocol, and how users actually interact with it.",
    links: [
      { href: "/profile", label: "Claim Test BTK" },
      { href: "/docs/CONFIG.md", label: "Token Config" },
      { href: "/docs/CONTRACTS.md", label: "GovernanceToken Docs" },
      { href: "/docs/SECURITY.md", label: "Security" },
    ],
  },
  {
    id: "roles",
    nav: "Roles & Reputation",
    title: "Roles & Reputation",
    intro:
      "BERT uses progression-based roles so moderation actions are not open to everyone by default.",
    links: [
      { href: "/profile", label: "Profile Progression" },
      { href: "/ideas", label: "Ideas Feed" },
      { href: "/docs/GLOSSARY.md", label: "Glossary" },
    ],
  },
  {
    id: "grants",
    nav: "Grant Lifecycle",
    title: "Grant Lifecycle",
    intro:
      "After voting, winning proposals move through payout and delivery stages with explicit status transitions.",
    links: [
      { href: "/rounds", label: "Round Outcomes" },
      { href: "/pool", label: "Funding Pool" },
      { href: "/admin", label: "Admin Controls" },
    ],
  },
  {
    id: "safety",
    nav: "Safety & Admin",
    title: "Safety & Admin Controls",
    intro:
      "Admin controls exist for incident handling and protocol maintenance, and should be operated with strict discipline.",
    links: [
      { href: "/admin", label: "Admin Panel" },
      { href: "/docs/SECURITY.md", label: "Security" },
      { href: "/docs/UPGRADES.md", label: "Upgrades" },
    ],
  },
  {
    id: "started",
    nav: "Get Started",
    title: "Get Started",
    intro:
      "Fast path for new users and contributors to start using BERT without guessing setup steps.",
    links: [
      { href: "/profile", label: "Connect Wallet" },
      { href: "/ideas/new", label: "Submit First Idea" },
      { href: "/docs/GETTING_STARTED.md", label: "Getting Started Docs" },
    ],
  },
];

function FlowContent() {
  return (
    <div className="space-y-8 overflow-x-hidden text-base leading-relaxed text-slate-700 dark:text-slate-200">
      <div className="space-y-4 rounded-2xl border border-white/12 bg-white/[0.02] p-5">
        <p>
          The flow starts in <strong>Idea Registry</strong>: an author submits a proposal, and the idea is stored with
          <strong> Pending</strong> status. This is the protocol entry point.
        </p>
        <p>
          A round can be started by <strong>any participant</strong>, but only when the contract checks pass. The key rule is:
          the amount of new ideas must reach <code>IDEAS_PER_ROUND</code>. If this condition is not met, round creation reverts.
        </p>
      </div>

      <div className="mx-auto w-full max-w-[1200px]">
        <Image
          src="/illustrations/how-flow-minimal.svg"
          alt="BERT flow: User, Faucet, Ideas, Voting, Pool, Grant Manager"
          width={1600}
          height={560}
          className="h-auto w-full"
          priority
        />
      </div>

      <section className="space-y-3">
        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Round Voting Logic</h3>
        <p>
          During voting, a user stakes <strong>BTK</strong> and votes in an active window. Contract checks enforce
          <strong> minimum stake</strong>, <strong>one vote per address per round</strong>, and
          <strong> no self-voting</strong>.
        </p>
        <p>
          This means governance is not a frontend convention. If a rule is violated, transaction fails on-chain and state
          remains unchanged.
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Winner, Funding, Completion</h3>
        <p>
          After round deadline, <strong>anyone</strong> can settle the round. The winner is selected by highest stake votes.
          Then, payout path is executed through <strong>Funding Pool</strong> and <strong>Grant Manager</strong>.
        </p>
        <p>
          Final step: only the idea author can mark the proposal as <strong>Completed</strong> when it is in
          <strong> Funded</strong> state. This closes the lifecycle with a public completion signal.
        </p>
      </section>

      <section className="space-y-3 rounded-2xl border border-white/12 bg-white/[0.02] p-5">
        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Why This Matters</h3>
        <p>
          BERT separates responsibilities clearly: <strong>Idea Registry</strong> for statuses, <strong>Voting System</strong>
          for rounds, <strong>Funding Pool</strong> for balances, and <strong>Grant Manager</strong> for distribution.
          This keeps governance predictable, auditable, and easier to operate.
        </p>
      </section>
    </div>
  );
}

function TokenContent() {
  return (
    <div className="space-y-8 text-base leading-relaxed text-slate-700 dark:text-slate-200">
      <section className="space-y-4 rounded-2xl border border-white/12 bg-white/[0.02] p-5">
        <p>
          <strong>BTK</strong> is BERT governance token. Technically, it is an <strong>ERC-20</strong> token
          implemented via <strong>GovernanceTokenUpgradeable</strong>.
        </p>
        <p>
          BTK is not a decorative token. It is the asset used for <strong>stake-backed voting</strong>. No BTK stake,
          no valid vote in a stake-required round.
        </p>
      </section>

      <section className="mx-auto w-full max-w-[560px]">
        <Image
          src="/btk_illustration.png"
          alt="Minimal BTK token illustration"
          width={1400}
          height={520}
          className="h-auto w-full"
        />
      </section>

      <section className="space-y-3">
        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Core Utility</h3>
        <p>
          The primary utility is participation in governance rounds. Users lock stake to vote, and voting outcomes drive
          grant distribution decisions.
        </p>
        <p>
          In practice: user gets BTK, approves spend, enters active round, and votes under contract constraints like
          <code> minStake</code> and valid time window.
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Supply and Control Boundaries</h3>
        <p>
          Token economics are controlled by protocol configuration, including <strong>maxSupply</strong>. Minting is
          permissioned and must remain under explicit role governance.
        </p>
        <p>
          Important operational point: trust in token policy depends on who controls admin and minter permissions.
          Publish these assumptions clearly.
        </p>
      </section>

      <section className="space-y-3 rounded-2xl border border-white/12 bg-white/[0.02] p-5">
        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Practical User Path</h3>
        <p>
          For local testing, users claim test BTK from faucet, then approve protocol spend, then vote. After settlement,
          they can verify outcomes on rounds and profile pages.
        </p>
        <p>
          For documentation, start with a <strong>Litepaper</strong> (utility, roles, governance flow), then publish a full
          <strong> Whitepaper</strong> before broad public scale.
        </p>
      </section>
    </div>
  );
}

function RolesContent() {
  return (
    <div className="space-y-8 text-base leading-relaxed text-slate-700 dark:text-slate-200">
      <section className="space-y-3 rounded-2xl border border-white/12 bg-white/[0.02] p-5">
        <p>
          Role model is tied to participation quality. <strong>Reviewer</strong> and <strong>Curator</strong> permissions
          are unlocked through progression logic, not manual UI toggles.
        </p>
        <p>
          This helps prevent random moderation actions and keeps governance signals tied to measurable user behavior.
        </p>
      </section>
      <section className="space-y-3">
        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Reviewer</h3>
        <p>
          Reviewer can add reviews while an idea is in <strong>Voting</strong> status. Reviews provide structured quality
          signal without replacing token voting.
        </p>
      </section>
      <section className="space-y-3">
        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Curator</h3>
        <p>
          Curator can mark low-quality ideas during <strong>Voting</strong>. This is visible context for voters and does not
          bypass winner logic by itself.
        </p>
      </section>
      <section className="space-y-3 rounded-2xl border border-white/12 bg-white/[0.02] p-5">
        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Progression and Reputation</h3>
        <p>
          Voting outcomes update progression counters and reputation paths. Winning participation helps unlock advanced roles,
          while poor outcomes can reduce profile quality signals depending on protocol rules.
        </p>
      </section>
    </div>
  );
}

function GrantsContent() {
  return (
    <div className="space-y-8 text-base leading-relaxed text-slate-700 dark:text-slate-200">
      <section className="space-y-3 rounded-2xl border border-white/12 bg-white/[0.02] p-5">
        <p>
          Grant lifecycle starts when a round is settled and a winning idea is identified. That outcome moves the proposal
          from voting phase to treasury execution phase.
        </p>
      </section>
      <section className="space-y-3">
        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Funding Path</h3>
        <p>
          <strong>Funding Pool</strong> holds balance state, while <strong>Grant Manager</strong> executes payout flow under
          role and eligibility checks.
        </p>
      </section>
      <section className="space-y-3">
        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Status Completion</h3>
        <p>
          After successful funding, the author can mark the idea as <strong>Completed</strong>. This gives a clear endpoint
          to proposal lifecycle and improves delivery transparency.
        </p>
      </section>
      <section className="space-y-3 rounded-2xl border border-white/12 bg-white/[0.02] p-5">
        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Edge Cases</h3>
        <p>
          If round has no valid winner signal, ideas may be rejected by settlement logic. If contract is paused, payout and
          state-changing flows stop until admin resumes operations.
        </p>
      </section>
    </div>
  );
}

function SafetyContent() {
  return (
    <div className="space-y-8 text-base leading-relaxed text-slate-700 dark:text-slate-200">
      <section className="space-y-3 rounded-2xl border border-white/12 bg-white/[0.02] p-5">
        <p>
          Admin powers should be treated as operational responsibility, not convenience tooling. Changes to parameters and
          contract wiring can materially impact fairness and uptime.
        </p>
      </section>
      <section className="space-y-3">
        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Pause Flow</h3>
        <p>
          Core incident sequence is <strong>pause -&gt; diagnose -&gt; patch -&gt; verify -&gt; unpause</strong>. This pattern limits
          blast radius during failures.
        </p>
      </section>
      <section className="space-y-3">
        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Config & Upgrades</h3>
        <p>
          Setter functions and proxy upgrades should always be validated on test environments first, then verified post-change
          with role checks and parameter snapshots.
        </p>
      </section>
    </div>
  );
}

function StartedContent() {
  return (
    <div className="space-y-8 text-base leading-relaxed text-slate-700 dark:text-slate-200">
      <section className="space-y-3 rounded-2xl border border-white/12 bg-white/[0.02] p-5">
        <p>
          This section is the practical onboarding path for developers, voters, and proposal authors. Follow these steps in
          order to avoid the most common setup failures.
        </p>
      </section>
      <section className="space-y-3">
        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Environment Checklist</h3>
        <p>
          1) Run the app and local node on the same network configuration. 2) Ensure wallet network matches the app RPC.
          3) Use the deployed proxy addresses from the same node session. 4) Confirm contracts are unpaused before interaction.
        </p>
        <p>
          If any of these four points are inconsistent, transactions usually fail before MetaMask confirmation or revert with
          network/internal errors.
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">First 5 Actions</h3>
        <p>
          <strong>Action 1:</strong> Connect wallet and verify address is shown on dApp pages.
        </p>
        <p>
          <strong>Action 2:</strong> Claim test BTK (faucet/local flow) and confirm token balance updates.
        </p>
        <p>
          <strong>Action 3:</strong> Approve BTK allowance for protocol action you are about to execute.
        </p>
        <p>
          <strong>Action 4:</strong> Either submit a new idea or join an active round as voter.
        </p>
        <p>
          <strong>Action 5:</strong> Track outcome on <code>/rounds</code>, <code>/ideas</code>, and <code>/profile</code>.
        </p>
      </section>

      <section className="space-y-3 rounded-2xl border border-white/12 bg-white/[0.02] p-5">
        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Path By Role</h3>
        <p>
          <strong>Builder path:</strong> submit idea -&gt; wait until round includes idea -&gt; if funded, deliver and mark
          completed.
        </p>
        <p>
          <strong>Voter path:</strong> get BTK -&gt; approve -&gt; vote in active round with valid stake -&gt; monitor settlement.
        </p>
        <p>
          <strong>Operator path:</strong> monitor pause status, role wiring, and critical parameters before enabling public usage.
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Troubleshooting baseline</h3>
        <p>
          If transactions fail, verify network alignment (RPC + wallet), contract addresses, pause status, and role conditions
          for the target action.
        </p>
        <p>
          If reads fail (for example <code>eth_call</code> on round data), check that RPC URL is reachable from browser context
          and not blocked by CORS/network mismatch.
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Recommended Next Step</h3>
        <p>
          After successful local flow, repeat the exact sequence on Sepolia with fresh deployed addresses. This catches
          environment-specific issues before production-like rollout.
        </p>
        <p>
          For indexed reads, configure <code>NEXT_PUBLIC_SUBGRAPH_URL</code> and monitor indexing status in{" "}
          <a href="https://thegraph.com/studio/subgraph/bert-sepolia" target="_blank" rel="noreferrer" className="text-teal-600 hover:underline">
            The Graph Studio
          </a>
          . Keep RPC fallback enabled for critical pages.
        </p>
      </section>
    </div>
  );
}

export default function HowItWorksPage() {
  const [activeId, setActiveId] = useState<Topic["id"]>("flow");
  const activeIndex = topics.findIndex((t) => t.id === activeId);
  const active = topics[activeIndex] ?? topics[0];
  const prev = activeIndex > 0 ? topics[activeIndex - 1] : null;
  const next = activeIndex < topics.length - 1 ? topics[activeIndex + 1] : null;

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto max-w-[1600px] px-6 py-8 md:px-10 lg:px-14">
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

        <div className="mt-8 grid gap-12 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-8 lg:h-[calc(100vh-70px)]">
            <p className="text-xs uppercase tracking-[0.28em] text-teal-600">How It Works</p>
            <h1 className="mt-3 text-2xl font-semibold text-slate-900 dark:text-slate-100">Topics</h1>
            <div className="mt-7 space-y-2 border-l border-white/20 pl-4">
              {topics.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => setActiveId(topic.id)}
                  className={`block w-full text-left text-sm transition ${
                    topic.id === activeId
                      ? "translate-x-1 font-semibold text-slate-900 dark:text-white"
                      : "text-slate-600 hover:translate-x-1 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                  }`}
                >
                  {topic.nav}
                </button>
              ))}
            </div>

            <div className="mt-8 border-t border-white/15 pt-5 text-sm">
              <Link href="https://github.com/Tenyokj/bert-core/blob/main/docs/ARCHITECTURE.md" className="inline-flex items-center gap-2 text-slate-700 dark:text-slate-200">
                <FaBook /> Architecture
              </Link>
              <br />
              <Link href="https://github.com/Tenyokj/bert-core/blob/main/docs/CONTRACTS.md" className="mt-3 inline-flex items-center gap-2 text-slate-700 dark:text-slate-200">
                <FaBook /> Contracts
              </Link>
            </div>
          </aside>

          <main>
            <section key={active.id} className="animate-[fadeIn_220ms_ease-out] space-y-6 border-t border-white/12 pt-8">
              <h2 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">{active.title}</h2>
              <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-200">{active.intro}</p>

              {active.id === "flow" ? <FlowContent /> : null}
              {active.id === "token" ? <TokenContent /> : null}
              {active.id === "roles" ? <RolesContent /> : null}
              {active.id === "grants" ? <GrantsContent /> : null}
              {active.id === "safety" ? <SafetyContent /> : null}
              {active.id === "started" ? <StartedContent /> : null}

              <div className="flex flex-wrap gap-2 pt-1">
                {active.links.map((link) => (
                  <Link
                    key={link.href + link.label}
                    href={link.href}
                    className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-slate-800 transition hover:-translate-y-0.5 dark:text-slate-100"
                  >
                    {link.label}
                    <FaExternalLinkAlt className="text-[10px]" />
                  </Link>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/12 pt-5">
                {prev ? (
                  <button
                    onClick={() => setActiveId(prev.id)}
                    className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-slate-800 transition hover:-translate-y-0.5 dark:text-slate-100"
                  >
                    ← Back to “{prev.nav}”
                  </button>
                ) : (
                  <span />
                )}

                {next ? (
                  <button
                    onClick={() => setActiveId(next.id)}
                    className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:-translate-y-0.5"
                  >
                    Next: “{next.nav}” →
                  </button>
                ) : null}
              </div>
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



      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
