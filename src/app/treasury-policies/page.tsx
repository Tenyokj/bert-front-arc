"use client";

import Link from "next/link";
import { useReadContract } from "wagmi";
import { formatUnits } from "viem";
import {
  contracts,
  fundingPoolAbi,
  grantManagerAbi,
  usdcAbi,
} from "@/lib/contracts";
import SiteFooter from "@/components/SiteFooter";
import { USDC_DECIMALS } from "@/lib/dapp-onchain";

function formatUsdc(value?: bigint) {
  if (value === undefined) return "—";
  const num = Number(formatUnits(value, USDC_DECIMALS));
  if (!Number.isFinite(num)) return "—";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(num);
}

export default function TreasuryPoliciesPage() {
  const { data: totalPoolBalance } = useReadContract({
    address: contracts.fundingPool,
    abi: fundingPoolAbi,
    functionName: "totalPoolBalance",
    query: { enabled: Boolean(contracts.fundingPool) },
  });

  const { data: protocolReserve } = useReadContract({
    address: contracts.fundingPool,
    abi: fundingPoolAbi,
    functionName: "protocolReserve",
    query: { enabled: Boolean(contracts.fundingPool) },
  });

  const { data: authorSharePercent } = useReadContract({
    address: contracts.grantManager,
    abi: grantManagerAbi,
    functionName: "authorSharePercent",
    query: { enabled: Boolean(contracts.grantManager) },
  });

  const { data: tokenSupply } = useReadContract({
    address: contracts.usdc,
    abi: usdcAbi,
    functionName: "totalSupply",
    query: { enabled: Boolean(contracts.usdc) },
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
            <p className="text-xs uppercase tracking-[0.28em] text-teal-600">Treasury Policies</p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-900 dark:text-slate-100">Treasury Governance</h1>
            <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Canonical policy for funding sources, allocation limits, payout execution, reserve handling, and reporting standards.
            </p>

            <div className="mt-7 space-y-2 border-l border-white/20 pl-4 text-sm text-slate-600 dark:text-slate-300">
              <a href="#live" className="block hover:text-slate-900 dark:hover:text-white">Live Treasury Snapshot</a>
              <a href="#scope" className="block hover:text-slate-900 dark:hover:text-white">Scope & Objectives</a>
              <a href="#sources" className="block hover:text-slate-900 dark:hover:text-white">Treasury Sources</a>
              <a href="#allocation" className="block hover:text-slate-900 dark:hover:text-white">Allocation Rules</a>
              <a href="#workflow" className="block hover:text-slate-900 dark:hover:text-white">Distribution Workflow</a>
              <a href="#reserves" className="block hover:text-slate-900 dark:hover:text-white">Reserve & Risk Limits</a>
              <a href="#incident" className="block hover:text-slate-900 dark:hover:text-white">Incident Policy</a>
              <a href="#reporting" className="block hover:text-slate-900 dark:hover:text-white">Reporting & Transparency</a>
              <a href="#changes" className="block hover:text-slate-900 dark:hover:text-white">Change Management</a>
            </div>
          </aside>

          <main className="space-y-12 border-t border-white/12 pt-8">
            <section id="live" className="space-y-4">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Live Treasury Snapshot</h2>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                These values are read from active contracts and represent current treasury policy state at runtime.
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-xl border border-white/15 bg-white/[0.03] p-4 text-sm"><p className="text-slate-500">totalPoolBalance</p><p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{formatUsdc(totalPoolBalance as bigint | undefined)} USDC</p></div>
                <div className="rounded-xl border border-white/15 bg-white/[0.03] p-4 text-sm"><p className="text-slate-500">protocolReserve</p><p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{formatUsdc(protocolReserve as bigint | undefined)} USDC</p></div>
                <div className="rounded-xl border border-white/15 bg-white/[0.03] p-4 text-sm"><p className="text-slate-500">authorSharePercent</p><p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{authorSharePercent?.toString() ?? "—"}%</p></div>
                <div className="rounded-xl border border-white/15 bg-white/[0.03] p-4 text-sm"><p className="text-slate-500">USDC totalSupply</p><p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{formatUsdc(tokenSupply as bigint | undefined)} USDC</p></div>
                <div className="rounded-xl border border-white/15 bg-white/[0.03] p-4 text-sm"><p className="text-slate-500">Settlement asset</p><p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">USDC on Arc</p></div>
                <div className="rounded-xl border border-white/15 bg-white/[0.03] p-4 text-sm"><p className="text-slate-500">Access mode</p><p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">Direct wallet funding</p></div>
              </div>
            </section>

            <section id="scope" className="space-y-4">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Scope & Objectives</h2>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                Treasury policy in BERT exists to protect two things at the same time: <strong>capital safety</strong> and <strong>predictable execution</strong>.
                Safety without execution turns governance into dead process; execution without safety turns treasury into unbounded operational risk.
              </p>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                The policy therefore requires explicit funding rules, role boundaries, and verifiable state transitions for all treasury-affecting actions.
              </p>
            </section>

            <section id="sources" className="space-y-4">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Treasury Sources</h2>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                Primary treasury state is represented in <strong>Funding Pool</strong>. Sources may include proposal deposits,
                vote commitments, protocol-directed capital inflows, and admin-synchronized balance updates where explicitly allowed by contract policy.
              </p>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                Any source that changes effective pool balance should be traceable by event history and consistent with on-chain balances.
                If accounting and real token balances diverge, policy requires correction via authorized sync procedures before new distribution cycles.
              </p>
            </section>

            <section id="allocation" className="space-y-4">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Allocation Rules</h2>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                Allocation follows winner resolution from round settlement. Grant splits use protocol parameters such as <code>authorSharePercent</code>.
                Parameter changes are governance-sensitive and should be treated as policy-level updates, not routine UI edits.
              </p>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                Treasury policy should avoid hidden discretionary payouts. If a payout cannot be derived from round outcomes and configured rules,
                it should not be executed as standard treasury flow.
              </p>
            </section>

            <section id="workflow" className="space-y-4">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Distribution Workflow</h2>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                Standard workflow is: <strong>round settled -&gt; winner identified -&gt; grant eligibility validated -&gt; payout executed -&gt; status updated</strong>.
                Funding Pool and Grant Manager split responsibilities so balance custody and payout logic are not mixed in one contract.
              </p>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                After payout, project delivery should be closed by author completion marker. This links financial execution with delivery accountability,
                reducing ambiguity in grant lifecycle reporting.
              </p>
            </section>

            <section id="reserves" className="space-y-4">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Reserve & Risk Limits</h2>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                Treasury policy should preserve explicit reserve logic and avoid draining pool liquidity through aggressive payout cadence.
                If reserve utilization increases beyond expected bounds, policy recommends reducing payout aggressiveness until balance health normalizes.
              </p>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                High-impact parameter changes (stake thresholds, payout share, round size) should be evaluated against treasury sustainability,
                not only participation growth metrics.
              </p>
            </section>

            <section id="incident" className="space-y-4">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Incident Policy</h2>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                Incident sequence is mandatory: <strong>pause -&gt; diagnose -&gt; patch -&gt; verify -&gt; unpause</strong>. Treasury-affecting modules should remain paused
                until root cause is understood and post-patch verification confirms state integrity.
              </p>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                Emergency actions must be logged with reason, scope, and recovery steps. Policy violations in emergency handling should be treated as governance incidents.
              </p>
            </section>

            <section id="reporting" className="space-y-4">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Reporting & Transparency</h2>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                Minimum reporting set: current pool balance, payout totals, grant outcomes by round, reserve state, and failed treasury transactions.
                These reports should reference on-chain events and not rely solely on manual spreadsheet summaries.
              </p>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                Public dashboards may be used for readability, but the source of truth remains contract state and transaction history.
              </p>
            </section>

            <section id="changes" className="space-y-4">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Change Management</h2>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                Treasury policy updates should follow explicit process: proposal -&gt; review -&gt; test rollout -&gt; production apply -&gt; post-change verification.
                Each change should include intended impact, rollback strategy, and measurable validation criteria.
              </p>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                For major changes, publish policy version notes and effective date to avoid governance ambiguity.
              </p>
            </section>

            <section className="flex flex-wrap gap-2 border-t border-white/12 pt-6">
              <Link href="/policy-docs" className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100">Back to Policy Docs</Link>
              <Link href="/how-it-works" className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100">How it works</Link>
              <Link href="/rounds" className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white">Launch App</Link>
            </section>
          </main>
        </div>

                       <SiteFooter />
      </div>
    </div>
  );
}
