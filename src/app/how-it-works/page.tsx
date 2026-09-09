"use client";

import Image from "next/image";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import {
  FaBook,
  FaExternalLinkAlt,
} from "react-icons/fa";

const pillars = [
  {
    label: "Proposal Deposit",
    value: "50 USDC",
    note: "Minimum author commitment to submit a live idea into the registry.",
  },
  {
    label: "Vote Commitment",
    value: "10 USDC",
    note: "Minimum onchain vote amount required to support an idea in an active round.",
  },
  {
    label: "Release Rail",
    value: "30 / 40 / 30",
    note: "Initial release, milestone release, and final release after reviewer validation.",
  },
  {
    label: "Verified Voting",
    value: "PoP + 10k cap",
    note: "Only human-verified wallets can vote, and each wallet is capped at 10,000 USDC per idea.",
  },
];

const flowSteps = [
  {
    title: "1. Builder submits an idea",
    body:
      "A builder creates an idea in IdeaRegistry and deposits at least 50 USDC. The deposit is locked in FundingPool and the idea enters the pipeline with clear onchain metadata and status.",
  },
  {
    title: "2. A voting round opens",
    body:
      "VotingSystem groups eligible ideas into a live round. Participants review the round and commit USDC directly onchain instead of relying on a separate governance asset.",
  },
  {
    title: "3. Voters prove personhood first",
    body:
      "Before voting, a wallet completes the World ID flow, the backend validates the proof, signs a BERT verification payload, and the wallet finalizes that proof onchain through PoPVerifierUpgradeable.",
  },
  {
    title: "4. USDC commitments accumulate in treasury",
    body:
      "Every valid vote routes committed USDC into the treasury path. Human-only gating reduces sybil pressure, and a per-wallet 10,000 USDC cap reduces single-wallet dominance over one idea.",
  },
  {
    title: "5. Winner enters grant execution",
    body:
      "After the round closes and settlement succeeds, the winning idea moves into GrantManager. At that point the protocol stops being only a voting system and becomes a capital release system.",
  },
  {
    title: "6. Milestones unlock funding",
    body:
      "Grant release is milestone-based. Builders claim the initial tranche, submit implementation proof, then submit final delivery proof. Reviewers validate each stage before the next release can execute.",
  },
];

const safetyChecks = [
  "USDC commitments use explicit allowance checks before protocol actions execute.",
  "Round voting enforces one vote per address per idea and blocks self-voting.",
  "Human-only voting requires an active proof-of-personhood verification before a wallet can vote.",
  "Per-idea vote size is capped at 10,000 USDC per wallet to reduce single-wallet control.",
  "Treasury release follows milestone state transitions instead of one-shot payouts.",
  "Pause controls remain available for incident handling and controlled rollout.",
  "Role-gated review and grant functions keep validator actions explicit and auditable.",
];

const communityModes = [
  {
    title: "Admin Binary",
    body: "An Admin proposes one decision and Members stake YES or NO. There is no validator review because the proposal is Administrator-originated. A YES settlement routes the voting capital to local execution.",
  },
  {
    title: "Member Binary",
    body: "A Member posts the configured bond, Validators approve or reject during the validation window, and only an approved proposal opens for Member voting. The settled path can allocate execution, validator rewards, and protocol reserve according to the Community configuration.",
  },
  {
    title: "Admin Slate",
    body: "Admins prepare several eligible options for a support-only round. Members select one proposal with one stake-backed round vote. The highest onchain total wins; a tie follows the deterministic contract proposal order.",
  },
  {
    title: "Member Slate",
    body: "Member ideas first earn validator approval, then an Admin builds a slate from contract-eligible proposals. The round picks one winning idea while keeping the selection rule and settlement history onchain.",
  },
];

const communityRoles = [
  {
    title: "Member",
    body: "Joins with a Community-specific entry stake, creates Member proposals, and participates in voting. Exit requires a cooldown, cleared vote locks, and no active Member proposal.",
  },
  {
    title: "Validator",
    body: "Reviews Member proposals and earns epoch rewards only for sufficient onchain activity. Validator rewards do not accrue from Admin-originated proposals because no validation work was required.",
  },
  {
    title: "Admin",
    body: "Creates Admin proposals, organizes Slate Rounds, manages the roster through quorum-protected requests, and manages execution withdrawals without unilateral access to Community funds.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto max-w-[1200px] px-6 py-8 md:px-10">
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
            <Link href="/rounds" className="transition-colors hover:text-slate-900">
              Active rounds
            </Link>
            <a href="https://bertdao-docs.vercel.app/" className="transition-colors hover:text-slate-900">
              Docs
            </a>
            <Link href="/policy-docs" className="transition-colors hover:text-slate-900">
              Policy docs
            </Link>
          </nav>
          <Link
            href="/ideas/new"
            className="rounded-full border border-white/60 bg-white/70 px-5 py-2 text-sm font-semibold text-slate-900 shadow-[0_12px_30px_rgba(15,23,42,0.08)] backdrop-blur transition hover:-translate-y-0.5"
          >
            Submit Idea
          </Link>
        </header>

        <main className="mt-10 space-y-12">
          <section className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-600">How It Works</p>
            <h1 className="max-w-5xl text-4xl font-semibold text-slate-900 dark:text-slate-100 md:text-5xl">
              BERT turns USDC commitments into transparent builder funding on Arc.
            </h1>
            <p className="max-w-4xl text-lg leading-relaxed text-slate-700 dark:text-slate-200">
              The protocol is a programmable capital allocation system: builders post a USDC-backed proposal deposit,
              contributors commit USDC votes, verified humans activate voting access onchain, treasury balances
              accumulate onchain, and winning proposals unlock milestone-based releases through validator review.
            </p>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {pillars.map((pillar) => (
              <div key={pillar.label} className="rounded-2xl border border-white/12 bg-white/[0.02] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-600">{pillar.label}</p>
                <p className="mt-3 text-3xl font-semibold text-slate-900 dark:text-slate-100">{pillar.value}</p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{pillar.note}</p>
              </div>
            ))}
          </section>

          <section className="rounded-3xl border border-white/15 bg-white/5 p-6 md:p-8">
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Funding flow</h2>
              <p className="max-w-4xl text-base leading-relaxed text-slate-700 dark:text-slate-200">
                BERT coordinates one continuous funding path. Proposal deposits filter out spam, round voting directs
                capital toward the strongest ideas, treasury accounting preserves visibility over committed and released
                balances, human verification limits sybil pressure, and milestone releases keep grant execution
                measurable.
              </p>
            </div>
            <div className="mt-6 overflow-hidden rounded-3xl border border-white/15 bg-black/10 p-3">
              <Image
                src="/illustrations/how-flow-arc.svg"
                alt="BERT Arc funding flow from proposal deposit to milestone-based USDC release"
                width={1600}
                height={760}
                className="h-auto w-full"
                priority
              />
            </div>
          </section>

          <section className="grid gap-5 lg:grid-cols-5">
            {flowSteps.map((step) => (
              <div key={step.title} className="rounded-2xl border border-white/12 bg-white/[0.02] p-5 lg:col-span-1">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-200">{step.body}</p>
              </div>
            ))}
          </section>

          <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-3xl border border-white/15 bg-white/5 p-6 md:p-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Human verification flow</h2>
              <div className="mt-5 space-y-4 text-base leading-relaxed text-slate-700 dark:text-slate-200">
                <p>
                  BERT still uses USDC-weighted voting, but now the protocol requires a proof-of-personhood activation
                  before that capital can be used in voting. This changes the attack surface from pure wallet count to
                  verified-human participation.
                </p>
                <p>
                  The frontend opens the World ID flow, the backend checks the proof and signs a short-lived BERT
                  payload, and the wallet submits that payload to <strong>PoPVerifierUpgradeable</strong>. Once that
                  transaction lands, the wallet can vote until the verification window expires.
                </p>
                <p>
                  The current verification window is <strong>14 days</strong>. After that, the wallet simply refreshes
                  its verification and continues using the same address.
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-white/15 bg-white/5 p-6 md:p-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Why the 10,000 USDC cap exists</h2>
              <div className="mt-5 space-y-4 text-base leading-relaxed text-slate-700 dark:text-slate-200">
                <p>
                  Human verification alone helps against sybil voting, but it does not limit how much influence a
                  single verified wallet can concentrate on one idea. The per-wallet cap closes that second gap.
                </p>
                <p>
                  BERT now limits each wallet to <strong>10,000 USDC per idea</strong>. Large participants can still
                  support the protocol, but one wallet cannot unilaterally overpower an idea round by sending an
                  outsized vote into a single target.
                </p>
                <p>
                  This keeps the system practical: capital still matters, but the protocol now asks for both
                  human-verification and bounded per-wallet influence before treasury allocation can happen.
                </p>
              </div>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-3xl border border-white/15 bg-white/5 p-6 md:p-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Milestone release logic</h2>
              <div className="mt-5 space-y-4 text-base leading-relaxed text-slate-700 dark:text-slate-200">
                <p>
                  Winning a round does not trigger a single lump-sum payout. GrantManager releases funding in a staged
                  sequence so capital follows proof of execution rather than hype.
                </p>
                <p>
                  The default rail is <strong>30% / 40% / 30%</strong>. The builder claims the first release, then submits
                  proof for the implementation milestone, then submits proof for the final launch milestone. Reviewers
                  confirm each stage before the next tranche can move.
                </p>
                <p>
                  That makes BERT useful as treasury infrastructure, not just proposal coordination. Capital remains
                  programmable until work is actually delivered.
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-white/15 bg-white/5 p-6 md:p-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Operator checklist</h2>
              <ul className="mt-5 list-disc space-y-3 pl-5 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                {safetyChecks.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </section>

          <section className="rounded-3xl border border-teal-400/20 bg-[linear-gradient(135deg,rgba(13,148,136,0.10),rgba(255,255,255,0.04))] p-6 md:p-8">
            <div className="max-w-4xl">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-500">BERT V3 Community Layer</p>
              <h2 className="mt-3 text-3xl font-semibold text-slate-900 dark:text-slate-100">A self-contained Community, connected to the BERT reserve.</h2>
              <p className="mt-4 text-base leading-relaxed text-slate-700 dark:text-slate-200">
                V3 adds stake-backed Community governance without replacing the V2 builder-grant rail above. Each
                Community receives an independent <strong>CommunityHub</strong> for roles, proposals, voting, active-time
                clock, and governance requests, plus a paired <strong>CommunityTreasury</strong> for escrow, execution
                capital, Validator rewards, refunds, and withdrawal approvals. Community-specific decisions remain local;
                configured protocol-reserve flows remain visible to the broader BERT FundingPool.
              </p>
            </div>
            <div className="mt-7 grid gap-4 md:grid-cols-3">
              {[
                ["1. Configure", "A creator sets immutable entry stake, proposal bond, vote floor, validator thresholds, Admin quorum, fees, reward share, and every local timing window."],
                ["2. Activate", "Factory reserves the Treasury, deploys the matching Hub, verifies the pair, and indexes a numeric Community ID with Hub, Treasury, creator, and metadata."],
                ["3. Govern", "Participants join locally, submit the supported proposal modes, validate Member ideas, vote with USDC, and move settled capital through transparent local accounting."],
              ].map(([title, body]) => (
                <div key={title} className="rounded-2xl border border-white/15 bg-slate-950/15 p-5">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-200">{body}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="rounded-3xl border border-white/15 bg-white/5 p-6 md:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-600">Roles are local</p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-900 dark:text-slate-100">One Community, clear responsibility boundaries.</h2>
              <p className="mt-4 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                V3 roles are not BERT V2 roles. A wallet’s permissions are evaluated separately inside each Community.
                Active governance roles are deliberately mutually exclusive, so the same wallet cannot be both the
                validator and the Member whose proposal it is reviewing.
              </p>
              <div className="mt-6 space-y-4">
                {communityRoles.map((role) => (
                  <div key={role.title} className="border-l-2 border-teal-400/60 pl-4">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">{role.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-700 dark:text-slate-200">{role.body}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/15 bg-white/5 p-6 md:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-600">Four proposal paths</p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-900 dark:text-slate-100">Choose a direct decision or a competitive round.</h2>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {communityModes.map((mode) => (
                  <div key={mode.title} className="rounded-2xl border border-white/12 bg-black/10 p-5">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{mode.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-200">{mode.body}</p>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                The interface only offers proposal and round actions that the current wallet can perform according to
                the Hub. Contract state decides eligibility, validation, settlement, and every USDC movement.
              </p>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-white/15 bg-white/5 p-6 md:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-600">Capital lifecycle</p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-900 dark:text-slate-100">Every bucket has a distinct purpose.</h2>
              <div className="mt-5 space-y-4 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                <p><strong>Membership stake</strong> stays locked to an active Member and returns only through the guarded exit flow. It is not a discretionary treasury balance.</p>
                <p><strong>Vote escrow</strong> is held until a binary proposal or Slate Round settles. When NO wins a binary vote, eligible NO voters claim their own stake once, less the Community&apos;s configured NO fee.</p>
                <p><strong>Execution treasury</strong> holds the local capital available for the Community to implement approved decisions. It can leave only through a request, the configured multi-Admin quorum, and execution.</p>
                <p><strong>Validator rewards</strong> accrue only from qualifying Member proposal flows, are finalized after an epoch ends, and are claimed individually by Validators who met the onchain activity threshold.</p>
                <p><strong>Protocol reserve</strong> is routed through the V2 FundingPool integration where the deployed Community settlement rule requires it, preserving V2 reserve accounting.</p>
              </div>
            </div>

            <div className="rounded-3xl border border-white/15 bg-white/5 p-6 md:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-600">Time, pause, and treasury safety</p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-900 dark:text-slate-100">A Community clock prevents silent deadlines during incidents.</h2>
              <div className="mt-5 space-y-4 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                <p>Validation, binary voting, Slate voting, reward epochs, exit cooldowns, and quorum-request expiry are measured in <strong>active Community time</strong>. A pause stops the Community clock; resume continues only the time remaining.</p>
                <p>Pause blocks governance-sensitive paths such as new proposals, votes, validation progression, and new execution withdrawals. It does not let the frontend bypass settled onchain claim rules.</p>
                <p>Execution funds are never released by a single arbitrary click. An Admin makes a request with recipient, amount, reason, and metadata; the amount is reserved; the required number of active Admins approve; only then is execution available.</p>
                <p>Adding or removing Admins, Validators, pausing, resuming, archiving, and cancelling a withdrawal are also quorum-protected requests. This prevents unilateral roster capture from becoming a treasury takeover.</p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-amber-300/25 bg-amber-300/5 p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700 dark:text-amber-200">Testing versus production</p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-900 dark:text-slate-100">Use the same contracts, with a clearly separate accelerated demo Community.</h2>
            <p className="mt-4 max-w-4xl text-sm leading-relaxed text-slate-700 dark:text-slate-200">
              Production-style Communities should use the intended day-scale validation, voting, exit, and reward windows.
              For a hackathon demo or judge walkthrough, deploy a separately labelled Community whose immutable settings
              use minute-scale windows. This is safer than adding an admin backdoor or a frontend-only timer override:
              the same contracts, permissions, settlement logic, and treasury accounting are demonstrated, but a full
              lifecycle can complete in minutes.
            </p>
            <Link href="/v3" className="mt-5 inline-flex rounded-full border border-amber-500/35 px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-200/20 dark:text-amber-100">
              Open Community Layer
            </Link>
          </section>

          <section className="rounded-3xl border border-white/15 bg-white/5 p-6 md:p-8">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Where to start</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                { href: "/ideas/new", label: "Create an idea", icon: FaExternalLinkAlt },
                { href: "/rounds", label: "Inspect live rounds", icon: FaBook },
                { href: "/policy-docs", label: "Read policy docs", icon: FaBook },
                { href: "/docs/ARCHITECTURE.md", label: "Open architecture docs", icon: FaBook },
              ].map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-2xl border border-white/15 bg-black/10 p-4 text-sm font-medium text-slate-700 transition hover:-translate-y-0.5 hover:text-slate-900 dark:text-slate-200 dark:hover:text-slate-100"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="text-teal-500" />
                      <span>{link.label}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        </main>

        <SiteFooter />
      </div>
    </div>
  );
}
