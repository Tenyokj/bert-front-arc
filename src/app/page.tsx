import Link from "next/link";
import HeroLogo3DClient from "@/components/HeroLogo3DClient";
import { HomeLiveStats } from "@/components/HomeLiveStats";
import { HomeStrategyCards } from "@/components/HomeStrategyCards";
import SiteFooter from "@/components/SiteFooter";
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
  FaLock,
  FaCoins,
  FaCheckCircle,
  FaRocket,
} from "react-icons/fa";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      <div className="hero-ambient absolute inset-0" />
      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-4 pb-16 pt-8 sm:px-6 sm:pb-20">
        <header className="flex items-center justify-between gap-3">
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
            className="rounded-full border border-white/60 bg-white/70 px-4 py-2 text-xs font-semibold text-slate-900 shadow-[0_12px_30px_rgba(15,23,42,0.08)] backdrop-blur transition hover:-translate-y-0.5 sm:px-5 sm:text-sm"
          >
            Launch App
          </Link>
        </header>

        <main className="mt-10 grid flex-1 items-center gap-10 lg:mt-14 lg:gap-14 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div className="order-2 flex items-center justify-center lg:order-1 lg:justify-left">
            <div className="relative">
              <HeroLogo3DClient />
              <div className="absolute -bottom-4 left-1/2 flex w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 gap-2 rounded-full border border-white/60 bg-white/80 px-3 py-2 text-[11px] font-semibold text-slate-700 shadow-[0_12px_30px_rgba(15,23,42,0.12)] sm:-bottom-6 sm:gap-3 sm:px-4 sm:text-xs">
                <span className="text-teal-600">Live</span>
                <span>Transparent distribution</span>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-teal-600">
              BERT Protocol on Arc
            </p>
            <h1 className="mt-4 font-[var(--font-display)] text-4xl font-normal leading-tight text-slate-900 dark:text-slate-100 sm:text-5xl lg:text-7xl">
              Turn community proposals into funded outcomes with verifiable
              voting.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-slate-600 dark:text-slate-300 sm:mt-6 sm:text-xl">
              BERT is programmable USDC-native funding infrastructure for Arc.
              It combines stake-backed proposal intake, stablecoin voting, and
              milestone-based grant release inside a modular upgradeable stack.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/rounds"
                className="rounded-full border bg-slate-900 px-7 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(15,23,42,0.25)] backdrop-blur transition hover:-translate-y-0.5"
              >
                Launch App
              </Link>
              <Link
                href="/how-it-works"
                className="rounded-full border border-slate-200 bg-white/70 px-7 py-3 text-sm font-semibold text-slate-900 backdrop-blur transition hover:-translate-y-0.5"
              >
                How it works
              </Link>
            </div>

            <HomeLiveStats />
          </div>
        </main>

        <section className="mt-24 sm:mt-32">
          <div className="rounded-[30px] border border-white/30 bg-white/25 p-5 shadow-[0_22px_55px_rgba(15,23,42,0.12)] backdrop-blur sm:rounded-[36px] sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.34em] text-teal-600">
                  V2 Upgrade
                </p>
                <h2 className="mt-4 font-[var(--font-display)] text-4xl font-semibold text-slate-900 dark:text-slate-100 sm:text-5xl lg:text-6xl">
                  What changed in BERT Protocol V2
                </h2>
                <p className="mt-5 max-w-2xl text-lg text-slate-700 dark:text-slate-200">
                  Proposal funding now runs on a stablecoin-native execution
                  path: <span className="font-semibold text-slate-900">50 USDC</span> to create,
                  <span className="font-semibold text-slate-900"> 10 USDC</span> minimum to vote,
                  and a <span className="font-semibold text-slate-900">30 / 40 / 30</span> release rail with validator checkpoints.
                </p>
              </div>
              <Link
                href="/how-it-works"
                className="w-fit rounded-full bg-slate-900 px-7 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white shadow-[0_16px_36px_rgba(15,23,42,0.22)] transition hover:-translate-y-0.5"
              >
                Explore V2 flow
              </Link>
            </div>

            <div className="mt-12 grid gap-6 xl:grid-cols-[0.72fr_1.18fr]">
              <div className="grid gap-6">
                <div className="rounded-[28px] border border-white/30 bg-white/35 p-6 shadow-[0_16px_36px_rgba(15,23,42,0.08)]">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-[0_12px_30px_rgba(15,23,42,0.16)]">
                      <FaLock className="text-lg" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Proposal entry
                      </p>
                      <h3 className="mt-2 text-2xl font-semibold text-slate-900">
                        Minimum idea deposit is now 50 USDC
                      </h3>
                      <p className="mt-3 text-base text-slate-700 dark:text-slate-200">
                        New ideas must be backed by real stake before they ever reach a round.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[28px] border border-white/30 bg-white/35 p-6 shadow-[0_16px_36px_rgba(15,23,42,0.08)]">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-500 text-white shadow-[0_12px_30px_rgba(20,184,166,0.24)]">
                      <FaCoins className="text-lg" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Grant release
                      </p>
                      <h3 className="mt-2 text-2xl font-semibold text-slate-900">
                        Funding now moves in 30 / 40 / 30
                      </h3>
                      <p className="mt-3 text-base text-slate-700 dark:text-slate-200">
                        Winning ideas enter a staged release rail instead of a single treasury payout.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[28px] border border-white/30 bg-white/35 p-6 shadow-[0_16px_36px_rgba(15,23,42,0.08)]">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-[0_12px_30px_rgba(37,99,235,0.24)]">
                      <FaCheckCircle className="text-lg" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Validator control
                      </p>
                      <h3 className="mt-2 text-2xl font-semibold text-slate-900">
                        The last 70% unlocks only after proof
                      </h3>
                      <p className="mt-3 text-base text-slate-700 dark:text-slate-200">
                        Progress proof unlocks 40%. Launch proof unlocks the final 30%.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-[32px] border border-slate-200/70 bg-[linear-gradient(160deg,rgba(255,255,255,0.82),rgba(226,232,240,0.72))] p-6 shadow-[0_24px_60px_rgba(15,23,42,0.12)]">
                <div className="absolute -left-10 top-10 h-32 w-32 rounded-full bg-cyan-300/30 blur-3xl" />
                <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-blue-300/20 blur-3xl" />
                <div className="absolute bottom-0 right-10 h-32 w-32 rounded-full bg-teal-300/30 blur-3xl" />

                <div className="relative">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                        Release Rail
                      </p>
                      <h3 className="mt-2 font-[var(--font-display)] text-3xl font-semibold text-slate-900">
                        V2 payout logic
                      </h3>
                    </div>
                    <div className="rounded-full border border-white/70 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
                      Milestones
                    </div>
                  </div>

                  <div className="mt-8 rounded-[28px] border border-white/70 bg-white/70 p-5 sm:p-6">
                    <div className="flex flex-col gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 sm:flex-row sm:items-center sm:justify-between">
                      <span>Winning idea</span>
                      <span>Launch verified</span>
                    </div>

                    <div className="relative mt-6">
                      <div className="absolute left-[1.8rem] right-[1.8rem] top-6 hidden h-[2px] bg-gradient-to-r from-slate-300 via-teal-400 to-blue-500 2xl:block" />
                      <div className="grid gap-2 lg:grid-cols-2 2xl:grid-cols-3">
                        <div className="relative rounded-[24px] border border-slate-200/80 bg-white p-5 sm:p-6 shadow-[0_14px_28px_rgba(15,23,42,0.08)]">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-500 text-lg font-semibold text-white">
                            30
                          </div>
                          <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Upfront
                          </p>
                          <p className="mt-2 max-w-[10ch] text-[1.35rem] font-semibold leading-[1.08] text-slate-900 sm:text-[1.5rem] 2xl:text-[1.65rem]">
                            Claim anytime after win
                          </p>
                          <p className="mt-3 max-w-[20ch] text-sm leading-7 text-slate-600">
                            First tranche for the winning author to start execution.
                          </p>
                        </div>

                        <div className="relative rounded-[24px] border border-slate-200/80 bg-white p-5 sm:p-6 shadow-[0_14px_28px_rgba(15,23,42,0.08)]">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500 text-lg font-semibold text-white">
                            40
                          </div>
                          <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Checkpoint one
                          </p>
                          <p className="mt-2 max-w-[10ch] text-[1.35rem] font-semibold leading-[1.08] text-slate-900 sm:text-[1.5rem] 2xl:text-[1.65rem]">
                            Validators confirm progress
                          </p>
                          <p className="mt-3 max-w-[20ch] text-sm leading-7 text-slate-600">
                            Unlocked only after proof that the build is actively in progress.
                          </p>
                        </div>

                        <div className="relative rounded-[24px] border border-slate-200/80 bg-white p-5 sm:p-6 shadow-[0_14px_28px_rgba(15,23,42,0.08)] lg:col-span-2 2xl:col-span-1">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-lg font-semibold text-white">
                            30
                          </div>
                          <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Final checkpoint
                          </p>
                          <p className="mt-2 max-w-[10ch] text-[1.35rem] font-semibold leading-[1.08] text-slate-900 sm:text-[1.5rem] 2xl:text-[1.65rem]">
                            Validators confirm launch
                          </p>
                          <p className="mt-3 max-w-[24ch] text-sm leading-7 text-slate-600">
                            The last tranche unlocks only after the project is live
                            and working in production.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between rounded-[24px] border border-white/70 bg-slate-900 px-5 py-4 text-white shadow-[0_18px_40px_rgba(15,23,42,0.18)]">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-white/60">
                        Net effect
                      </p>
                      <p className="mt-1 text-lg font-semibold">
                        Less spam at entry, more accountability after funding
                      </p>
                    </div>
                    <div className="hidden h-14 w-14 items-center justify-center rounded-2xl bg-white/10 sm:flex">
                      <FaRocket className="text-xl text-cyan-300" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

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
                funds go, voters see impact, and treasury operators get a trusted
                execution layer.
              </p>
            </div>
            <Link
              href="/how-it-works"
              className="w-fit rounded-full bg-slate-900 px-7 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white shadow-[0_16px_36px_rgba(15,23,42,0.22)] transition hover:-translate-y-0.5"
            >
              View strategies
            </Link>
          </div>

          <HomeStrategyCards />
        </section>

        <section className="mt-24 grid gap-10 lg:mt-32 lg:gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-teal-600">
              BERT Grant Engine
            </p>
            <h2 className="mt-5 font-[var(--font-display)] text-4xl font-normal leading-tight text-slate-900 dark:text-slate-100 sm:text-6xl lg:text-8xl">
              A transparent funding layer for onchain builder programs, built to scale outcomes.
            </h2>
            <p className="mt-6 max-w-2xl text-lg text-slate-600 dark:text-slate-300 sm:text-xl lg:text-2xl">
              From proposal intake to on-chain payouts, BERT keeps every step
              verifiable. Governance teams get modular controls, communities get
              clarity, and builders get funded faster.
            </p>
          </div>

          <div className="relative overflow-hidden lg:h-[700px]">
            <div className="h-full overflow-visible pr-0 lg:overflow-y-auto lg:pr-2 no-scrollbar">
              <div className="flex flex-col gap-10">
                <div className="border-b border-white/30 pb-10">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Transparent outcomes
                  </p>
                  <p className="mt-4 text-3xl text-slate-700 dark:text-slate-200 sm:text-4xl lg:text-5xl">
                    Every vote, quorum, and payout is recorded on-chain. No black
                    boxes, just proof.
                  </p>
                  <Link href="/on-chain-votes" className="mt-5 inline-block rounded-full bg-slate-900 px-6 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white">
                    See proofs
                  </Link>
                </div>
                <div className="border-b border-white/30 pb-10">
                  <div className="flex items-baseline justify-between">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Ecosystem ready
                    </p>
                    <span className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                      Multi-stack
                    </span>
                  </div>
                  <p className="mt-2 text-sm uppercase tracking-[0.2em] text-slate-400">
                    Integrations
                  </p>
                  <p className="mt-4 text-3xl text-slate-700 dark:text-slate-200 sm:text-4xl lg:text-5xl">
                    Available wherever you need it with integrations across
                    treasury tooling, builder workflows, and governance dashboards.
                  </p>
                  <Link href="/how-it-works" className="mt-5 inline-block rounded-full bg-slate-900 px-6 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white">
                    View ecosystem
                  </Link>
                </div>
                <div className="border-b border-white/30 pb-10">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Competitive distribution
                  </p>
                  <p className="mt-4 text-3xl text-slate-700 dark:text-slate-200 sm:text-4xl lg:text-5xl">
                    Weighted voting and milestone payouts keep incentives aligned
                    from proposal to delivery.
                  </p>
                  <Link href="/policy-docs" className="mt-5 inline-block rounded-full bg-slate-900 px-6 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white">
                    View policy
                  </Link>
                </div>
                <div className="border-b border-white/30 pb-10">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Modular governance
                  </p>
                  <p className="mt-4 text-3xl text-slate-700 dark:text-slate-200 sm:text-4xl lg:text-5xl">
                    Role-based permissions, upgradeable modules, and policy
                    controls tailored to your program’s risk profile.
                  </p>
                  <Link href="/governance-stack" className="mt-5 inline-block rounded-full bg-slate-900 px-6 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white">
                    Learn more
                  </Link>
                </div>
                <div className="border-b border-white/30 pb-10">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Treasury automation
                  </p>
                  <p className="mt-4 text-3xl text-slate-700 dark:text-slate-200 sm:text-4xl lg:text-5xl">
                    Schedule distributions, set safeguards, and track outcomes
                    across grant cycles with full audit trails.
                  </p>
                  <Link href="/treasury-policies" className="mt-5 inline-block rounded-full bg-slate-900 px-6 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white">
                    Open treasury
                  </Link>
                </div>
                <div className="pb-8">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Configurable access
                  </p>
                  <p className="mt-4 text-3xl text-slate-700 dark:text-slate-200 sm:text-4xl lg:text-5xl">
                    Create tailored grant windows, eligibility rules, and
                    permissioned roles without redeploys.
                  </p>
                  <Link href="/admin" className="mt-5 inline-block rounded-full bg-slate-900 px-6 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white">
                    Configure
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative mt-24 sm:mt-32">
          <div className="pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.35),transparent_60%)] blur-3xl" />
          <div className="pointer-events-none absolute right-[-6rem] top-[-3rem] h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(244,63,94,0.35),transparent_60%)] blur-3xl" />
          <div className="pointer-events-none absolute left-1/3 top-1/2 h-56 w-56 rounded-[32px] border border-white/30 bg-white/10 shadow-[0_20px_50px_rgba(15,23,42,0.12)] backdrop-blur" />
          <div className="pointer-events-none absolute left-2/3 top-[65%] h-48 w-48 rotate-12 rounded-[28px] border border-white/30 bg-white/10 shadow-[0_18px_40px_rgba(15,23,42,0.12)] backdrop-blur" />

          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-teal-600">
              Trust by Design
            </p>
            <h2 className="mt-5 font-[var(--font-display)] text-4xl font-semibold leading-tight text-slate-900 dark:text-slate-100 sm:text-6xl lg:text-8xl">
              Uncompromised transparency for stablecoin-native grants.
            </h2>
            <p className="mt-6 max-w-2xl text-lg text-slate-700 dark:text-slate-200 sm:text-xl lg:text-2xl">
              BERT is engineered for verifiable governance. Every action is
              traceable, every payout is provable, and critical controls are
              explicitly permissioned.
            </p>
          </div>

          <div className="relative mt-12 overflow-hidden rounded-[30px] border border-white/40 bg-white/30 p-5 shadow-[0_30px_80px_rgba(15,23,42,0.16)] backdrop-blur sm:rounded-[36px] sm:p-10 lg:p-14">
            <div className="grid gap-10 lg:grid-cols-4">
              <div className="border-b border-white/20 pb-8 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-6">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                  <span className="inline-flex items-center gap-3 text-slate-500">
                    <FaShieldAlt className="text-3xl text-slate-200" />
                    On-chain verifiability
                  </span>
                </p>
                <p className="mt-4 text-2xl text-slate-700 dark:text-slate-200 sm:text-3xl">
                  All proposals, votes, and distributions are recorded on-chain
                  for independent auditability.
                </p>
                <a
                  href="https://github.com/Tenyokj/bert-core/blob/main/docs/CONTRACTS.md"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-block rounded-full bg-slate-900 px-6 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white"
                >
                  View contracts
                </a>
              </div>
              <div className="border-b border-white/20 pb-8 lg:border-b-0 lg:border-r lg:px-6 lg:pb-0">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                  <span className="inline-flex items-center gap-3 text-slate-500">
                    <FaLayerGroup className="text-3xl text-slate-200" />
                    Role-protected actions
                  </span>
                </p>
                <p className="mt-4 text-2xl text-slate-700 dark:text-slate-200 sm:text-3xl">
                  Critical actions are gated by role permissions with clear
                  accountability.
                </p>
                <Link href="/governance-stack" className="mt-5 inline-block rounded-full bg-slate-900 px-6 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white">
                  Access control
                </Link>
              </div>
              <div className="border-b border-white/20 pb-8 lg:border-b-0 lg:border-r lg:px-6 lg:pb-0">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                  <span className="inline-flex items-center gap-3 text-slate-500">
                    <FaNetworkWired className="text-3xl text-slate-200" />
                    Upgradeable core
                  </span>
                </p>
                <p className="mt-4 text-2xl text-slate-700 dark:text-slate-200 sm:text-3xl">
                  Modules evolve via governance without breaking protocol rules
                  or data integrity.
                </p>
                <Link href="/security-roadmap" className="mt-5 inline-block rounded-full bg-slate-900 px-6 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white">
                  Upgrade policy
                </Link>
              </div>
              <div className="lg:pl-6">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                  <span className="inline-flex items-center gap-3 text-slate-500">
                    <FaCompass className="text-3xl text-slate-200" />
                    Security roadmap
                  </span>
                </p>
                <p className="mt-4 text-2xl text-slate-700 dark:text-slate-200 sm:text-3xl">
                  External audits are planned next. Public bug bounty is not active yet.
                </p>
                <Link href="/security-roadmap" className="mt-5 inline-block rounded-full bg-slate-900 px-6 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white">
                  Roadmap
                </Link>
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
              <a
                href="https://github.com/tenyokj/bert-core"
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-block rounded-full bg-slate-900 px-5 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white"
              >
                GitHub
              </a>
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
              <Link href="/policy-docs" className="mt-4 inline-block rounded-full bg-slate-900 px-5 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white">
                Policy docs
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-24 sm:mt-32">
          <div className="grid gap-10 lg:gap-12 lg:grid-cols-[1.1fr_0.15fr_0.75fr] lg:items-stretch">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.34em] text-teal-600">
                Governance Framework
              </p>
              <h2 className="mt-6 font-[var(--font-display)] text-4xl font-normal leading-tight text-slate-900 dark:text-slate-100 sm:text-6xl lg:text-8xl">
                Governed by the community, executed on‑chain.
              </h2>
              <p className="mt-8 text-lg text-slate-700 dark:text-slate-200 sm:text-xl lg:text-3xl">
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

            <div className="relative overflow-hidden lg:h-[700px]">
              <div className="h-full overflow-visible pr-0 lg:overflow-y-auto lg:pr-2 no-scrollbar">
                <div className="flex flex-col gap-10">
                  <div className="border-b border-white/30 pb-10">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Stake‑weighted votes
                    </p>
                    <p className="mt-4 text-2xl text-slate-700 dark:text-slate-200 sm:text-3xl">
                      Voting power reflects commitment, while reputation rewards
                      consistent contributors.
                    </p>
                    <Link href="/on-chain-votes" className="mt-5 inline-block rounded-full bg-slate-900 px-6 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white">
                      Voting rules
                    </Link>
                  </div>
                  <div className="border-b border-white/30 pb-10">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Transparent execution
                    </p>
                    <p className="mt-4 text-2xl text-slate-700 dark:text-slate-200 sm:text-3xl">
                      Every proposal, vote, and grant payout is traceable on-chain.
                    </p>
                    <Link href="/protocol-stats" className="mt-5 inline-block rounded-full bg-slate-900 px-6 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white">
                      View proofs
                    </Link>
                  </div>
                  <div className="border-b border-white/30 pb-10">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Role‑gated actions
                    </p>
                    <p className="mt-4 text-2xl text-slate-700 dark:text-slate-200 sm:text-3xl">
                      Critical operations are protected by explicit permissions.
                    </p>
                    <Link href="/governance-stack" className="mt-5 inline-block rounded-full bg-slate-900 px-6 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white">
                      Access control
                    </Link>
                  </div>
                  <div className="border-b border-white/30 pb-10">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Upgradeable by design
                    </p>
                    <p className="mt-4 text-2xl text-slate-700 dark:text-slate-200 sm:text-3xl">
                      Core modules evolve through governance without breaking protocol history.
                    </p>
                    <Link href="/security-roadmap" className="mt-5 inline-block rounded-full bg-slate-900 px-6 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white">
                      Upgrade policy
                    </Link>
                  </div>
                  <div className="pb-10">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Security roadmap
                    </p>
                    <p className="mt-4 text-2xl text-slate-700 dark:text-slate-200 sm:text-3xl">
                      External audits are planned next. Public bug bounty is not active yet.
                    </p>
                    <Link href="/security-roadmap" className="mt-5 inline-block rounded-full bg-slate-900 px-6 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white">
                      Roadmap
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-24 sm:mt-32">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.34em] text-teal-600">
                Ecosystem Roadmap
              </p>
              <h2 className="mt-6 font-[var(--font-display)] text-4xl font-semibold leading-tight text-slate-900 dark:text-slate-100 sm:text-5xl lg:text-7xl">
                Integration phases for a stablecoin-native funding stack.
              </h2>
              <p className="mt-6 text-lg text-slate-700 dark:text-slate-200 sm:text-xl lg:text-2xl">
                We’re rolling out integrations in waves. Each phase unlocks new
                capabilities for contributors, treasury operators, and grant
                teams without locking us into specific partners too early.
              </p>
            </div>
            <Link
              href="/how-it-works"
              className="w-fit rounded-full bg-slate-900 px-7 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-white"
            >
              How it works
            </Link>
          </div>

          <div className="mt-12">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Horizontal roadmap
              </p>
              <p className="text-xs text-slate-400">Scroll →</p>
            </div>
            <div className="mt-6 overflow-x-auto pb-4 no-scrollbar">
              <div className="flex min-w-[960px] gap-4 sm:min-w-[1100px] sm:gap-6">
                <div className="w-[280px] shrink-0 rounded-[28px] border border-white/30 bg-white/20 p-5 shadow-[0_18px_44px_rgba(15,23,42,0.12)] backdrop-blur sm:w-[320px] sm:p-6 lg:w-[360px] lg:p-7">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Phase 01
                  </p>
                  <h3 className="mt-4 font-[var(--font-display)] text-2xl font-semibold text-slate-900 dark:text-slate-100 sm:text-3xl">
                    Wallet + Voting
                  </h3>
                  <p className="mt-4 text-base text-slate-700 dark:text-slate-200 sm:text-lg">
                    Core wallet onboarding, USDC-weighted voting, and proposal
                    submission flows.
                  </p>
                  <div className="mt-6 rounded-2xl border border-white/30 bg-white/30 p-4 text-sm text-slate-600 dark:text-slate-300">
                    Goal: frictionless participation
                  </div>
                </div>
                <div className="w-[280px] shrink-0 rounded-[28px] border border-white/30 bg-white/20 p-5 shadow-[0_18px_44px_rgba(15,23,42,0.12)] backdrop-blur sm:w-[320px] sm:p-6 lg:w-[360px] lg:p-7">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Phase 02
                  </p>
                  <h3 className="mt-4 font-[var(--font-display)] text-2xl font-semibold text-slate-900 dark:text-slate-100 sm:text-3xl">
                    Treasury + Payouts
                  </h3>
                  <p className="mt-4 text-base text-slate-700 dark:text-slate-200 sm:text-lg">
                    Treasury management, milestone releases, and distribution
                    tooling for grants.
                  </p>
                  <div className="mt-6 rounded-2xl border border-white/30 bg-white/30 p-4 text-sm text-slate-600 dark:text-slate-300">
                    Goal: safe capital execution
                  </div>
                </div>
                <div className="w-[280px] shrink-0 rounded-[28px] border border-white/30 bg-white/20 p-5 shadow-[0_18px_44px_rgba(15,23,42,0.12)] backdrop-blur sm:w-[320px] sm:p-6 lg:w-[360px] lg:p-7">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Phase 03
                  </p>
                  <h3 className="mt-4 font-[var(--font-display)] text-2xl font-semibold text-slate-900 dark:text-slate-100 sm:text-3xl">
                    Analytics + Dashboards
                  </h3>
                  <p className="mt-4 text-base text-slate-700 dark:text-slate-200 sm:text-lg">
                    Governance analytics, impact tracking, and community reporting
                    layers.
                  </p>
                  <div className="mt-6 rounded-2xl border border-white/30 bg-white/30 p-4 text-sm text-slate-600 dark:text-slate-300">
                    Goal: measurable outcomes
                  </div>
                </div>
                <div className="w-[280px] shrink-0 rounded-[28px] border border-white/30 bg-white/20 p-5 shadow-[0_18px_44px_rgba(15,23,42,0.12)] backdrop-blur sm:w-[320px] sm:p-6 lg:w-[360px] lg:p-7">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Phase 04
                  </p>
                  <h3 className="mt-4 font-[var(--font-display)] text-2xl font-semibold text-slate-900 dark:text-slate-100 sm:text-3xl">
                    Grants Ecosystem
                  </h3>
                  <p className="mt-4 text-base text-slate-700 dark:text-slate-200 sm:text-lg">
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

        <SiteFooter />
      </div>
    </div>
  );
}
