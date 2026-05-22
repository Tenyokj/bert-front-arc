"use client";

import Link from "next/link";
import { useReadContract } from "wagmi";
import { formatUnits } from "viem";
import {
  contracts,
  votingSystemAbi,
  grantManagerAbi,
  fundingPoolAbi,
} from "@/lib/contracts";
import { USDC_DECIMALS } from "@/lib/dapp-onchain";
import { FaExternalLinkAlt } from "react-icons/fa";
import SiteFooter from "@/components/SiteFooter";

function formatUsdc(value?: bigint) {
  if (value === undefined) return "—";
  const num = Number(formatUnits(value, USDC_DECIMALS));
  if (!Number.isFinite(num)) return "—";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(num);
}

function formatSeconds(value?: bigint) {
  if (value === undefined) return "—";
  const sec = Number(value);
  if (!Number.isFinite(sec)) return "—";
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  const rem = sec % 60;
  if (min < 60) return rem ? `${min}m ${rem}s` : `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export default function PolicyDocsPage() {
  const { data: ideasPerRound } = useReadContract({
    address: contracts.votingSystem,
    abi: votingSystemAbi,
    functionName: "IDEAS_PER_ROUND",
    query: { enabled: Boolean(contracts.votingSystem) },
  });

  const { data: votingDuration } = useReadContract({
    address: contracts.votingSystem,
    abi: votingSystemAbi,
    functionName: "VOTING_DURATION",
    query: { enabled: Boolean(contracts.votingSystem) },
  });

  const { data: minStake } = useReadContract({
    address: contracts.votingSystem,
    abi: votingSystemAbi,
    functionName: "minStake",
    query: { enabled: Boolean(contracts.votingSystem) },
  });

  const { data: maxVotersPerIdea } = useReadContract({
    address: contracts.votingSystem,
    abi: votingSystemAbi,
    functionName: "MAX_VOTERS_PER_IDEA",
    query: { enabled: Boolean(contracts.votingSystem) },
  });

  const { data: authorSharePercent } = useReadContract({
    address: contracts.grantManager,
    abi: grantManagerAbi,
    functionName: "authorSharePercent",
    query: { enabled: Boolean(contracts.grantManager) },
  });

  const { data: totalPoolBalance } = useReadContract({
    address: contracts.fundingPool,
    abi: fundingPoolAbi,
    functionName: "totalPoolBalance",
    query: { enabled: Boolean(contracts.fundingPool) },
  });

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

        <div className="mt-9 grid gap-12 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-8 lg:h-[calc(100vh-72px)] lg:overflow-y-auto">
            <p className="text-xs uppercase tracking-[0.28em] text-teal-600">Policy Docs</p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-900 dark:text-slate-100">Governance Policies</h1>
            <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Canonical operating rules for proposal lifecycle, voting constraints, role permissions, and payout controls.
            </p>

            <div className="mt-7 space-y-2 border-l border-white/20 pl-4 text-sm text-slate-600 dark:text-slate-300">
              <a href="#snapshot" className="block hover:text-slate-900 dark:hover:text-white">Live Snapshot</a>
              <a href="#governance" className="block hover:text-slate-900 dark:hover:text-white">Governance Rules</a>
              <a href="#voting" className="block hover:text-slate-900 dark:hover:text-white">Voting Rules</a>
              <a href="#proposal" className="block hover:text-slate-900 dark:hover:text-white">Proposal Lifecycle</a>
              <a href="#grants" className="block hover:text-slate-900 dark:hover:text-white">Grant Policy</a>
              <a href="#roles" className="block hover:text-slate-900 dark:hover:text-white">Roles & Moderation</a>
              <a href="#safety" className="block hover:text-slate-900 dark:hover:text-white">Safety & Upgrades</a>
              <a href="#started" className="block hover:text-slate-900 dark:hover:text-white">Get Started Policy</a>
            </div>
          </aside>

          <main className="space-y-12 border-t border-white/12 pt-8">
            <section id="snapshot" className="space-y-4">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Live Policy Snapshot</h2>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                These values are read from the currently configured contracts and represent effective runtime policy, not static documentation text.
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-xl border border-white/15 bg-white/[0.03] p-4 text-sm"><p className="text-slate-500">IDEAS_PER_ROUND</p><p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{ideasPerRound?.toString() ?? "—"}</p></div>
                <div className="rounded-xl border border-white/15 bg-white/[0.03] p-4 text-sm"><p className="text-slate-500">VOTING_DURATION</p><p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{formatSeconds(votingDuration as bigint | undefined)}</p></div>
                <div className="rounded-xl border border-white/15 bg-white/[0.03] p-4 text-sm"><p className="text-slate-500">minStake</p><p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{formatUsdc(minStake as bigint | undefined)} USDC</p></div>
                <div className="rounded-xl border border-white/15 bg-white/[0.03] p-4 text-sm"><p className="text-slate-500">MAX_VOTERS_PER_IDEA</p><p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{maxVotersPerIdea?.toString() ?? "—"}</p></div>
                <div className="rounded-xl border border-white/15 bg-white/[0.03] p-4 text-sm"><p className="text-slate-500">authorSharePercent</p><p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{authorSharePercent?.toString() ?? "—"}%</p></div>
                <div className="rounded-xl border border-white/15 bg-white/[0.03] p-4 text-sm"><p className="text-slate-500">Pool Balance</p><p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{formatUsdc(totalPoolBalance as bigint | undefined)} USDC</p></div>
              </div>
            </section>

            <section id="governance" className="space-y-4">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Governance Rules</h2>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                Round orchestration in BERT is permissionless by design: users do not wait for a centralized operator to advance governance state. A round starts only when protocol preconditions are satisfied, and it can be ended by anyone after the configured deadline.
              </p>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                Winner selection is deterministic and contract-level. This means disagreements about results should be resolved by chain state inspection, not by interface screenshots or off-chain claims.
              </p>
            </section>

            <section id="voting" className="space-y-4">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Voting Rules</h2>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                Voting is stake-backed. A vote is accepted only if all guardrails pass: active round, valid time window, <code>minStake</code> threshold, idea included in that round, and no self-voting. One address can vote once per round.
              </p>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                This policy intentionally makes governance expensive to spam while keeping it open to any participant with the required stake.
              </p>
            </section>

            <section id="proposal" className="space-y-4">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Proposal Lifecycle Policy</h2>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                Canonical status path is: <code>Pending -&gt; Voting -&gt; WonVoting/Rejected -&gt; Funded -&gt; Completed</code>. Each transition is explicit and role/status guarded.
              </p>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                Moderation actions (review and low-quality marker) are intentionally constrained to <strong>Voting</strong> stage so they inform active decision-making without corrupting historical state.
              </p>
            </section>

            <section id="grants" className="space-y-4">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Grant Distribution Policy</h2>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                Treasury flow is separated by responsibility: Funding Pool holds accounting state and Grant Manager executes distribution under eligibility checks. Author payout ratio is controlled by <code>authorSharePercent</code> and can be tuned via admin setter policy.
              </p>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                The protocol policy is to prefer explicit payout traceability over implicit off-chain accounting. Every critical transfer path should remain externally auditable.
              </p>
              <Link href="/treasury-policies" className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100">
                Read Treasury Policies <FaExternalLinkAlt className="text-[10px]" />
              </Link>
            </section>

            <section id="roles" className="space-y-4">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Roles & Moderation Policy</h2>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                Roles are not pure UI badges. Reviewer and Curator capabilities are bound to progression and registry checks. This policy reduces arbitrary moderation and keeps privileged actions tied to measurable participation.
              </p>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                System roles should remain contract-assigned where possible, while high-impact admin privileges should be operated through hardened key policy.
              </p>
            </section>

            <section id="safety" className="space-y-4">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Safety & Upgrade Policy</h2>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                Incident flow: <strong>pause -&gt; diagnose -&gt; patch -&gt; verify -&gt; unpause</strong>. This is the default operational policy for protecting treasury and governance integrity.
              </p>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                Upgrade operations require post-upgrade verification: proxy owner checks, implementation checks, role wiring checks, and parameter checks. No policy change should be treated as complete until verification succeeds.
              </p>
            </section>

            <section id="started" className="space-y-4">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Get Started Policy</h2>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                First-time user sequence: connect wallet, verify network, fund the wallet with test USDC, approve USDC spending, then create an idea or vote in an active round. If transactions fail, troubleshoot in this order: network alignment, addresses, pause state, role constraints.
              </p>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                Team policy for rollout: prove flows locally first, then repeat on Arc testnet with fresh addresses from one deployment session before wider release.
              </p>
            </section>

            <section className="flex flex-wrap gap-2 border-t border-white/12 pt-6">
              <Link href="/how-it-works" className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100">How it works <FaExternalLinkAlt className="text-[10px]" /></Link>
              <Link href="/faq" className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100">FAQ <FaExternalLinkAlt className="text-[10px]" /></Link>
              <Link href="/docs/OPERATIONS.md" className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100">Operations <FaExternalLinkAlt className="text-[10px]" /></Link>
            </section>
          </main>
        </div>
                        <SiteFooter />
      </div>
    </div>
  );
}
