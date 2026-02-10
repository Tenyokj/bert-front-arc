import HeroLogo3D from "@/components/HeroLogo3D";
import ParticleText from "@/components/ParticleText";
import {
  FaGithub,
  FaShieldAlt,
  FaLayerGroup,
  FaNetworkWired,
  FaCompass,
  FaSitemap,
  FaGavel,
  FaChartLine,
  FaUsers,
} from "react-icons/fa";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      <div className="hero-ambient absolute inset-0" />
      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-6 pb-20 pt-0">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-teal-400 to-blue-600 shadow-[0_8px_24px_rgba(37,99,235,0.35)]" />
            <span className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-600">
              BERT
            </span>
          </div>
          <nav className="hidden items-center gap-8 text-sm text-slate-600 md:flex">
            <span className="cursor-pointer transition-colors hover:text-slate-900">
              How it works
            </span>
            <span className="cursor-pointer transition-colors hover:text-slate-900">
              Active rounds
            </span>
            <span className="cursor-pointer transition-colors hover:text-slate-900">
              Docs
            </span>
          </nav>
          <button className="rounded-full border border-white/60 bg-white/70 px-5 py-2 text-sm font-semibold text-slate-900 shadow-[0_12px_30px_rgba(15,23,42,0.08)] backdrop-blur transition hover:-translate-y-0.5">
            Launch App
          </button>
        </header>

        <main className="mt-14 grid flex-1 items-center gap-14 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div className="order-2 flex items-center justify-center lg:order-1 lg:justify-left">
            <div className="relative">
              <HeroLogo3D />
              <div className="absolute -bottom-6 left-1/2 flex -translate-x-1/2 gap-3 rounded-full border border-white/60 bg-white/80 px-4 py-2 text-xs font-semibold text-slate-700 shadow-[0_12px_30px_rgba(15,23,42,0.12)]">
                <span className="text-teal-600">Live</span>
                <span>Transparent distribution</span>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-teal-600">
              DAO grants engine
            </p>
            <h1 className="mt-4 font-[var(--font-display)] text-5xl font-semibold leading-tight text-slate-900 dark:text-slate-100 sm:text-6xl lg:text-7xl">
              Turn community proposals into funded outcomes with verifiable
              voting.
            </h1>
            <p className="mt-6 max-w-xl text-xl text-slate-600 dark:text-slate-300">
              BERT orchestrates the full grant flow—idea registry, structured
              voting rounds, and on-chain distribution—so contributors can trust
              every step.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <button className="rounded-full bg-slate-900 px-7 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(15,23,42,0.25)] transition hover:-translate-y-0.5">
                Launch App
              </button>
              <button className="rounded-full border border-slate-200 bg-white/70 px-7 py-3 text-sm font-semibold text-slate-900 backdrop-blur transition hover:-translate-y-0.5">
                How it works
              </button>
            </div>

            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Total in POOL
                </p>
                <p className="mt-3 text-3xl font-semibold text-slate-900">
                  $1.9M
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Across 124 funded proposals
                </p>
              </div>
              <div className="rounded-2xl border border-white/50 bg-gradient-to-br from-white/80 to-slate-100/80 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Active rounds
                </p>
                <p className="mt-3 text-3xl font-semibold text-slate-900">
                  57 live
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  1,742 voters participating
                </p>
              </div>
              <div className="rounded-2xl border border-white/50 bg-gradient-to-br from-white/80 to-slate-100/80 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Total Ideas
                </p>
                <p className="mt-3 text-3xl font-semibold text-slate-900">
                  8,688  
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  1,023 received grants
                </p>
              </div>
              <div className="rounded-2xl border border-white/50 bg-gradient-to-br from-white/80 to-slate-100/80 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Tokens
                </p>
                <p className="mt-3 text-3xl font-semibold text-slate-900">
                  BTK - BERT governance tokens
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  800M BTK in circulation
                </p>
              </div>
            </div>
          </div>
        </main>

        <section className="mt-32">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.34em] text-teal-600">
                Funding Strategies
              </p>
              <h2 className="mt-5 font-[var(--font-display)] text-6xl font-semibold text-slate-900 dark:text-slate-100 sm:text-7xl">
                BERT strategies package community capital into clear, measurable
                outcomes.
              </h2>
              <p className="mt-6 max-w-2xl text-2xl text-slate-600 dark:text-slate-300">
                Each strategy combines the Idea Registry, voting logic, and
                on-chain distribution into a single flow. Contributors see where
                funds go, voters see impact, and DAO operators get a trusted
                execution layer.
              </p>
            </div>
            <button className="w-fit rounded-full bg-slate-900 px-7 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white shadow-[0_16px_36px_rgba(15,23,42,0.22)] transition hover:-translate-y-0.5">
              View strategies
            </button>
          </div>

          <div className="mt-14 grid gap-10 lg:grid-cols-3">
            <div className="group relative overflow-hidden rounded-[32px] border border-white/70 bg-white/80 p-11 shadow-[0_28px_70px_rgba(15,23,42,0.12)] backdrop-blur">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_55%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <div className="relative flex h-full flex-col gap-7">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 rounded-full bg-slate-900/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-700">
                    Strategy
                  </span>
                  <div className="grid h-16 w-16 grid-cols-2 gap-1.5 rounded-2xl bg-white/80 p-1.5 shadow-[0_12px_26px_rgba(59,130,246,0.25)]">
                    <img src="/illustrations/pool.svg" alt="" className="h-full w-full rounded-lg" />
                    <img src="/illustrations/idea.svg" alt="" className="h-full w-full rounded-lg" />
                    <img src="/illustrations/vote.svg" alt="" className="h-full w-full rounded-lg" />
                    <img src="/illustrations/reward.svg" alt="" className="h-full w-full rounded-lg" />
                  </div>
                </div>
                <h3 className="font-[var(--font-display)] text-[34px] font-semibold leading-tight text-slate-900">
                  Community Grants
                </h3>
                <p className="text-lg text-slate-600">
                  Route stake into high-signal proposals. Structured scoring,
                  transparent quorum, and milestone-based payouts.
                </p>
                <div className="rounded-2xl border border-slate-200/60 bg-white/70 p-6">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    Total pool
                  </p>
                  <p className="mt-3 text-5xl font-semibold text-slate-900">
                    $1.9M
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Available across active rounds
                  </p>
                </div>
                <button className="mt-auto w-fit rounded-full bg-slate-900 px-7 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-white">
                  Deposit
                </button>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-[32px] border border-white/60 bg-white/80 p-11 shadow-[0_28px_70px_rgba(15,23,42,0.12)] backdrop-blur">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.2),transparent_60%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <div className="relative flex h-full flex-col gap-7">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 rounded-full bg-teal-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-teal-700">
                    Rewards
                  </span>
                  <div className="grid h-16 w-16 grid-cols-2 gap-1.5 rounded-2xl bg-white/80 p-1.5 shadow-[0_12px_26px_rgba(20,184,166,0.25)]">
                    <img src="/illustrations/reward.svg" alt="" className="h-full w-full rounded-lg" />
                    <img src="/illustrations/vote.svg" alt="" className="h-full w-full rounded-lg" />
                    <img src="/illustrations/rep.svg" alt="" className="h-full w-full rounded-lg" />
                    <img src="/illustrations/pool.svg" alt="" className="h-full w-full rounded-lg" />
                  </div>
                </div>
                <h3 className="font-[var(--font-display)] text-[34px] font-semibold leading-tight text-slate-900">
                  Voter Yield
                </h3>
                <p className="text-lg text-slate-600">
                  Earn reputation boosts and voter rewards for consistent,
                  high-quality participation across rounds.
                </p>
                <div className="rounded-2xl border border-slate-200/60 bg-white/70 p-6">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    APY + Rep
                  </p>
                  <p className="mt-3 text-5xl font-semibold text-slate-900">
                    3.3%
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Plus reputation multipliers
                  </p>
                </div>
                <button className="mt-auto w-fit rounded-full bg-slate-900 px-7 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-white">
                  Start voting
                </button>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-[32px] border border-white/60 bg-white/80 p-11 shadow-[0_28px_70px_rgba(15,23,42,0.12)] backdrop-blur">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(248,113,113,0.18),transparent_60%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <div className="relative flex h-full flex-col gap-7">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 rounded-full bg-rose-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-rose-700">
                    Treasury
                  </span>
                  <div className="grid h-16 w-16 grid-cols-2 gap-1.5 rounded-2xl bg-white/80 p-1.5 shadow-[0_12px_26px_rgba(248,113,113,0.25)]">
                    <img src="/illustrations/treasury.svg" alt="" className="h-full w-full rounded-lg" />
                    <img src="/illustrations/pool.svg" alt="" className="h-full w-full rounded-lg" />
                    <img src="/illustrations/idea.svg" alt="" className="h-full w-full rounded-lg" />
                    <img src="/illustrations/reward.svg" alt="" className="h-full w-full rounded-lg" />
                  </div>
                </div>
                <h3 className="font-[var(--font-display)] text-[34px] font-semibold leading-tight text-slate-900">
                  Grant Treasury
                </h3>
                <p className="text-lg text-slate-600">
                  Consolidated funding pool with transparent distribution,
                  milestone-based releases, and full audit history.
                </p>
                <div className="rounded-2xl border border-slate-200/60 bg-white/70 p-6">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    Paid out
                  </p>
                  <p className="mt-3 text-5xl font-semibold text-slate-900">
                    $5.4M
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Across 124 funded proposals
                  </p>
                </div>
                <button className="mt-auto w-fit rounded-full bg-slate-900 px-7 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-white">
                  View treasury
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-32 grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-teal-600">
              BERT Grant Engine
            </p>
            <h2 className="mt-5 font-[var(--font-display)] text-6xl font-normal leading-tight text-slate-900 dark:text-slate-100 sm:text-8xl">
              A transparent funding layer for DAOs, built to scale outcomes.
            </h2>
            <p className="mt-6 max-w-2xl text-2xl text-slate-600 dark:text-slate-300">
              From proposal intake to on-chain payouts, BERT keeps every step
              verifiable. Governance teams get modular controls, communities get
              clarity, and builders get funded faster.
            </p>
          </div>

          <div className="relative h-[700px] overflow-hidden">
            <div className="h-full overflow-y-auto pr-2 no-scrollbar">
              <div className="flex flex-col gap-10">
                <div className="border-b border-white/30 pb-10">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Transparent outcomes
                  </p>
                  <p className="mt-4 text-5xl text-slate-700 dark:text-slate-200">
                    Every vote, quorum, and payout is recorded on-chain. No black
                    boxes, just proof.
                  </p>
                  <button className="mt-5 rounded-full bg-slate-900 px-6 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white">
                    See proofs
                  </button>
                </div>
                <div className="border-b border-white/30 pb-10">
                  <div className="flex items-baseline justify-between">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Ecosystem ready
                    </p>
                    <span className="text-6xl font-semibold text-slate-900 dark:text-slate-100">
                      +32
                    </span>
                  </div>
                  <p className="mt-2 text-sm uppercase tracking-[0.2em] text-slate-400">
                    Integrations
                  </p>
                  <p className="mt-4 text-5xl text-slate-700 dark:text-slate-200">
                    Available wherever you need it with integrations across DAO
                    stacks, treasury tooling, and governance dashboards.
                  </p>
                  <button className="mt-5 rounded-full bg-slate-900 px-6 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white">
                    View ecosystem
                  </button>
                </div>
                <div className="border-b border-white/30 pb-10">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Competitive distribution
                  </p>
                  <p className="mt-4 text-5xl text-slate-700 dark:text-slate-200">
                    Weighted voting and milestone payouts keep incentives aligned
                    from proposal to delivery.
                  </p>
                  <button className="mt-5 rounded-full bg-slate-900 px-6 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white">
                    View policy
                  </button>
                </div>
                <div className="border-b border-white/30 pb-10">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Modular governance
                  </p>
                  <p className="mt-4 text-5xl text-slate-700 dark:text-slate-200">
                    Role-based permissions, upgradeable modules, and policy
                    controls tailored to your DAO’s risk profile.
                  </p>
                  <button className="mt-5 rounded-full bg-slate-900 px-6 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white">
                    Learn more
                  </button>
                </div>
                <div className="border-b border-white/30 pb-10">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Treasury automation
                  </p>
                  <p className="mt-4 text-5xl text-slate-700 dark:text-slate-200">
                    Schedule distributions, set safeguards, and track outcomes
                    across grant cycles with full audit trails.
                  </p>
                  <button className="mt-5 rounded-full bg-slate-900 px-6 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white">
                    Open treasury
                  </button>
                </div>
                <div className="pb-8">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Configurable access
                  </p>
                  <p className="mt-4 text-5xl text-slate-700 dark:text-slate-200">
                    Create tailored grant windows, eligibility rules, and
                    permissioned roles without redeploys.
                  </p>
                  <button className="mt-5 rounded-full bg-slate-900 px-6 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white">
                    Configure
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative mt-32">
          <div className="pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.35),transparent_60%)] blur-3xl" />
          <div className="pointer-events-none absolute right-[-6rem] top-[-3rem] h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(244,63,94,0.35),transparent_60%)] blur-3xl" />
          <div className="pointer-events-none absolute left-1/3 top-1/2 h-56 w-56 rounded-[32px] border border-white/30 bg-white/10 shadow-[0_20px_50px_rgba(15,23,42,0.12)] backdrop-blur" />
          <div className="pointer-events-none absolute left-2/3 top-[65%] h-48 w-48 rotate-12 rounded-[28px] border border-white/30 bg-white/10 shadow-[0_18px_40px_rgba(15,23,42,0.12)] backdrop-blur" />

          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-teal-600">
              Trust by Design
            </p>
            <h2 className="mt-5 font-[var(--font-display)] text-6xl font-semibold leading-tight text-slate-900 dark:text-slate-100 sm:text-7xl lg:text-8xl">
              Uncompromised transparency for DAO‑grade grants.
            </h2>
            <p className="mt-6 max-w-2xl text-2xl text-slate-700 dark:text-slate-200">
              BERT is engineered for verifiable governance. Every action is
              traceable, every payout is provable, and critical controls are
              explicitly permissioned.
            </p>
          </div>

          <div className="relative mt-12 overflow-hidden rounded-[36px] border border-white/40 bg-white/30 p-10 shadow-[0_30px_80px_rgba(15,23,42,0.16)] backdrop-blur sm:p-14">
            <div className="grid gap-10 lg:grid-cols-4">
              <div className="border-r border-white/20 pr-6">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                  <span className="inline-flex items-center gap-3 text-slate-500">
                    <FaShieldAlt className="text-3xl text-slate-200" />
                    On-chain verifiability
                  </span>
                </p>
                <p className="mt-4 text-3xl text-slate-700 dark:text-slate-200">
                  All proposals, votes, and distributions are recorded on-chain
                  for independent auditability.
                </p>
                <button className="mt-5 rounded-full bg-slate-900 px-6 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white">
                  View contracts
                </button>
              </div>
              <div className="border-r border-white/20 px-6">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                  <span className="inline-flex items-center gap-3 text-slate-500">
                    <FaLayerGroup className="text-3xl text-slate-200" />
                    Role-protected actions
                  </span>
                </p>
                <p className="mt-4 text-3xl text-slate-700 dark:text-slate-200">
                  Critical actions are gated by role permissions with clear
                  accountability.
                </p>
                <button className="mt-5 rounded-full bg-slate-900 px-6 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white">
                  Access control
                </button>
              </div>
              <div className="border-r border-white/20 px-6">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                  <span className="inline-flex items-center gap-3 text-slate-500">
                    <FaNetworkWired className="text-3xl text-slate-200" />
                    Upgradeable core
                  </span>
                </p>
                <p className="mt-4 text-3xl text-slate-700 dark:text-slate-200">
                  Modules evolve via governance without breaking protocol rules
                  or data integrity.
                </p>
                <button className="mt-5 rounded-full bg-slate-900 px-6 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white">
                  Upgrade policy
                </button>
              </div>
              <div className="pl-6">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                  <span className="inline-flex items-center gap-3 text-slate-500">
                    <FaCompass className="text-3xl text-slate-200" />
                    Security roadmap
                  </span>
                </p>
                <p className="mt-4 text-3xl text-slate-700 dark:text-slate-200">
                  Audits and bounties are planned as the next milestone.
                </p>
                <button className="mt-5 rounded-full bg-slate-900 px-6 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white">
                  Roadmap
                </button>
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-8 sm:grid-cols-2">
            <div className="rounded-[28px] border border-white/30 bg-white/20 p-6 shadow-[0_20px_50px_rgba(15,23,42,0.12)] backdrop-blur">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                <span className="inline-flex items-center gap-3 text-slate-500">
                  <FaGithub className="text-3xl text-slate-200" />
                  Open sourced
                </span>
              </p>
              <p className="mt-3 text-lg text-slate-700 dark:text-slate-200">
                Allowing continuous peer reviews and enhancements from developers
                worldwide.
              </p>
              <button className="mt-4 rounded-full bg-slate-900 px-5 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white">
                GitHub
              </button>
            </div>
            <div className="rounded-[28px] border border-white/30 bg-white/20 p-6 shadow-[0_20px_50px_rgba(15,23,42,0.12)] backdrop-blur">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                <span className="inline-flex items-center gap-3 text-slate-500">
                  <FaLayerGroup className="text-3xl text-slate-200" />
                  Governance policies
                </span>
              </p>
              <p className="mt-3 text-lg text-slate-700 dark:text-slate-200">
                Configure proposal rules, voting windows, and payout thresholds
                without redeploys.
              </p>
              <button className="mt-4 rounded-full bg-slate-900 px-5 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white">
                Policy docs
              </button>
            </div>
          </div>
        </section>

        <section className="mt-32">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.15fr_0.75fr] lg:items-stretch">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.34em] text-teal-600">
                Governance Framework
              </p>
              <h2 className="mt-6 font-[var(--font-display)] text-7xl font-normal leading-tight text-slate-900 dark:text-slate-100 sm:text-8xl">
                Governed by the community, executed on‑chain.
              </h2>
              <p className="mt-8 text-3xl text-slate-700 dark:text-slate-200">
                BERT aligns decision‑making with stake, reputation, and transparent
                execution. Every proposal follows a clear path from voting to
                payout, with role‑based safeguards for critical actions.
              </p>
            </div>

            <div className="relative hidden items-center justify-center lg:flex">
              <div className="absolute bottom-0 top-0 left-1/2 w-px -translate-x-1/2 bg-white/40" />
              <div className="flex flex-col items-center gap-40">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/70 text-slate-700 shadow-[0_14px_30px_rgba(15,23,42,0.12)]">
                  <FaSitemap className="text-2xl" />
                </div>
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/70 text-slate-700 shadow-[0_14px_30px_rgba(15,23,42,0.12)]">
                  <FaGavel className="text-2xl" />
                </div>
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/70 text-slate-700 shadow-[0_14px_30px_rgba(15,23,42,0.12)]">
                  <FaChartLine className="text-2xl" />
                </div>
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/70 text-slate-700 shadow-[0_14px_30px_rgba(15,23,42,0.12)]">
                  <FaUsers className="text-2xl" />
                </div>
              </div>
            </div>

            <div className="relative h-[700px] overflow-hidden">
              <div className="h-full overflow-y-auto pr-2 no-scrollbar">
                <div className="flex flex-col gap-10">
                  <div className="border-b border-white/30 pb-10">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Stake‑weighted votes
                    </p>
                    <p className="mt-4 text-3xl text-slate-700 dark:text-slate-200">
                      Voting power reflects commitment, while reputation rewards
                      consistent contributors.
                    </p>
                    <button className="mt-5 rounded-full bg-slate-900 px-6 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white">
                      Voting rules
                    </button>
                  </div>
                  <div className="border-b border-white/30 pb-10">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Transparent execution
                    </p>
                    <p className="mt-4 text-3xl text-slate-700 dark:text-slate-200">
                      Every proposal, vote, and grant payout is traceable on-chain.
                    </p>
                    <button className="mt-5 rounded-full bg-slate-900 px-6 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white">
                      View proofs
                    </button>
                  </div>
                  <div className="border-b border-white/30 pb-10">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Role‑gated actions
                    </p>
                    <p className="mt-4 text-3xl text-slate-700 dark:text-slate-200">
                      Critical operations are protected by explicit permissions.
                    </p>
                    <button className="mt-5 rounded-full bg-slate-900 px-6 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white">
                      Access control
                    </button>
                  </div>
                  <div className="border-b border-white/30 pb-10">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Upgradeable by design
                    </p>
                    <p className="mt-4 text-3xl text-slate-700 dark:text-slate-200">
                      Core modules evolve through governance without breaking protocol history.
                    </p>
                    <button className="mt-5 rounded-full bg-slate-900 px-6 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white">
                      Upgrade policy
                    </button>
                  </div>
                  <div className="pb-10">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Security roadmap
                    </p>
                    <p className="mt-4 text-3xl text-slate-700 dark:text-slate-200">
                      Audits and bounties are planned as the next milestone.
                    </p>
                    <button className="mt-5 rounded-full bg-slate-900 px-6 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white">
                      Roadmap
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-32">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.34em] text-teal-600">
                Ecosystem Roadmap
              </p>
              <h2 className="mt-6 font-[var(--font-display)] text-6xl font-semibold leading-tight text-slate-900 dark:text-slate-100 sm:text-7xl">
                Integration phases for a DAO‑native stack.
              </h2>
              <p className="mt-6 text-2xl text-slate-700 dark:text-slate-200">
                We’re rolling out integrations in waves. Each phase unlocks new
                capabilities for contributors, treasury operators, and governance
                teams without locking us into specific partners too early.
              </p>
            </div>
            <button className="w-fit rounded-full bg-slate-900 px-7 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-white">
              Join integrations
            </button>
          </div>

          <div className="mt-12">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Horizontal roadmap
              </p>
              <p className="text-xs text-slate-400">Scroll →</p>
            </div>
            <div className="mt-6 overflow-x-auto pb-4 no-scrollbar">
              <div className="flex min-w-[1200px] gap-6">
                <div className="w-[360px] shrink-0 rounded-[28px] border border-white/30 bg-white/20 p-7 shadow-[0_18px_44px_rgba(15,23,42,0.12)] backdrop-blur">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Phase 01
                  </p>
                  <h3 className="mt-4 font-[var(--font-display)] text-3xl font-semibold text-slate-900 dark:text-slate-100">
                    Wallet + Voting
                  </h3>
                  <p className="mt-4 text-lg text-slate-700 dark:text-slate-200">
                    Core wallet onboarding, stake‑weighted voting, and proposal
                    submission flows.
                  </p>
                  <div className="mt-6 rounded-2xl border border-white/30 bg-white/30 p-4 text-sm text-slate-600 dark:text-slate-300">
                    Goal: frictionless participation
                  </div>
                </div>
                <div className="w-[360px] shrink-0 rounded-[28px] border border-white/30 bg-white/20 p-7 shadow-[0_18px_44px_rgba(15,23,42,0.12)] backdrop-blur">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Phase 02
                  </p>
                  <h3 className="mt-4 font-[var(--font-display)] text-3xl font-semibold text-slate-900 dark:text-slate-100">
                    Treasury + Payouts
                  </h3>
                  <p className="mt-4 text-lg text-slate-700 dark:text-slate-200">
                    Treasury management, milestone releases, and distribution
                    tooling for grants.
                  </p>
                  <div className="mt-6 rounded-2xl border border-white/30 bg-white/30 p-4 text-sm text-slate-600 dark:text-slate-300">
                    Goal: safe capital execution
                  </div>
                </div>
                <div className="w-[360px] shrink-0 rounded-[28px] border border-white/30 bg-white/20 p-7 shadow-[0_18px_44px_rgba(15,23,42,0.12)] backdrop-blur">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Phase 03
                  </p>
                  <h3 className="mt-4 font-[var(--font-display)] text-3xl font-semibold text-slate-900 dark:text-slate-100">
                    Analytics + Dashboards
                  </h3>
                  <p className="mt-4 text-lg text-slate-700 dark:text-slate-200">
                    Governance analytics, impact tracking, and community reporting
                    layers.
                  </p>
                  <div className="mt-6 rounded-2xl border border-white/30 bg-white/30 p-4 text-sm text-slate-600 dark:text-slate-300">
                    Goal: measurable outcomes
                  </div>
                </div>
                <div className="w-[360px] shrink-0 rounded-[28px] border border-white/30 bg-white/20 p-7 shadow-[0_18px_44px_rgba(15,23,42,0.12)] backdrop-blur">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Phase 04
                  </p>
                  <h3 className="mt-4 font-[var(--font-display)] text-3xl font-semibold text-slate-900 dark:text-slate-100">
                    Grants Ecosystem
                  </h3>
                  <p className="mt-4 text-lg text-slate-700 dark:text-slate-200">
                    Partner rails for hackathons, builder programs, and external
                    grant platforms.
                  </p>
                  <div className="mt-6 rounded-2xl border border-white/30 bg-white/30 p-4 text-sm text-slate-600 dark:text-slate-300">
                    Goal: broad adoption
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="relative mt-32 border-t border-white/20 pb-16 pt-12">
          <div className="pointer-events-none absolute -left-10 top-8 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.25),transparent_65%)] blur-2xl" />
          <div className="pointer-events-none absolute right-[-3rem] top-16 h-52 w-52 rounded-full bg-[radial-gradient(circle,rgba(244,63,94,0.22),transparent_65%)] blur-2xl" />
          <div className="text-sm text-slate-500">
            *All metrics are illustrative placeholders for design only. Figures are not guaranteed and may change with network conditions.
          </div>

          <div className="mt-10 grid gap-10 border-b border-white/20 pb-10 lg:grid-cols-4">
            <div>
              <h4 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                BERT Products
              </h4>
              <div className="mt-6 flex flex-col gap-3 text-lg text-slate-600 dark:text-slate-300">
                <a className="footer-link" href="#">Idea Registry</a>
                <a className="footer-link" href="#">Voting Rounds</a>
                <a className="footer-link" href="#">Grant Engine</a>
                <a className="footer-link" href="#">Reputation Layer</a>
                <a className="footer-link" href="#">Upgrade Modules</a>
              </div>
            </div>

            <div>
              <h4 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                BERT DAO
              </h4>
              <div className="mt-6 flex flex-col gap-3 text-lg text-slate-600 dark:text-slate-300">
                <a className="footer-link" href="#">Governance stack</a>
                <a className="footer-link" href="#">Policy docs</a>
                <a className="footer-link" href="#">On-chain votes</a>
                <a className="footer-link" href="#">Off-chain votes</a>
                <a className="footer-link" href="#">Treasury policies</a>
              </div>
            </div>

            <div>
              <h4 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                Builders
              </h4>
              <div className="mt-6 flex flex-col gap-3 text-lg text-slate-600 dark:text-slate-300">
                <a className="footer-link" href="#">Docs</a>
                <a className="footer-link" href="#">Developer guide</a>
                <a className="footer-link" href="#">Smart contracts</a>
                <a className="footer-link" href="#">Integration guide</a>
                <a className="footer-link" href="#">Developer guide</a>
              </div>
            </div>

            <div>
              <h4 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                Resources
              </h4>
              <div className="mt-6 flex flex-col gap-3 text-lg text-slate-600 dark:text-slate-300">
                <a className="footer-link" href="#">How it works</a>
                <a className="footer-link" href="#">FAQ</a>
                <a className="footer-link" href="#">Press kit</a>
                <a className="footer-link" href="#">Brand assets</a>
                <a className="footer-link" href="#">Support</a>
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-10 lg:grid-cols-4">
            <div>
              <h4 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                Community
              </h4>
              <div className="mt-6 flex items-center gap-5 text-slate-600 dark:text-slate-300">
                <FaGithub className="text-2xl transition-transform duration-300 hover:-translate-y-1" />
                <FaUsers className="text-2xl transition-transform duration-300 hover:-translate-y-1" />
                <FaNetworkWired className="text-2xl transition-transform duration-300 hover:-translate-y-1" />
              </div>
            </div>
            <div>
              <h4 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                Analytics
              </h4>
              <div className="mt-6 flex flex-col gap-3 text-lg text-slate-600 dark:text-slate-300">
                <a className="footer-link" href="#">Protocol stats</a>
                <a className="footer-link" href="#">Governance insights</a>
                <a className="footer-link" href="#">Treasury metrics</a>
              </div>
            </div>
            <div className="lg:col-span-2">
              <div className="flex flex-col gap-3 text-lg text-slate-500 dark:text-slate-300 lg:flex-row lg:items-center lg:justify-end">
                <a className="footer-link" href="#">Privacy Notice</a>
                <a className="footer-link" href="#">Terms of Use</a>
                <a className="footer-link" href="#">Security Roadmap</a>
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
