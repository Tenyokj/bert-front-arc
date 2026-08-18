import Link from "next/link";
import { FaArrowRight, FaCircle, FaCompass, FaCoins, FaProjectDiagram, FaShieldAlt } from "react-icons/fa";
import { DappDashboardLiveStats } from "@/components/DappDashboardLiveStats";
import { HumanVerificationPanel } from "@/components/HumanVerificationPanel";
import { RoleBootstrapClaimPanel } from "@/components/RoleBootstrapClaimPanel";
import { RoleBootstrapAddressesShowcase } from "@/components/RoleBootstrapAddressesShowcase";

const concepts = [
  {
    title: "Ideas",
    description:
      "Builders submit proposals with context, links, and stake-backed intent before they can compete for treasury capital.",
    icon: FaCompass,
  },
  {
    title: "Voting Rounds",
    description:
      "Curated ideas are grouped into decision windows where the community allocates stablecoin voting power transparently.",
    icon: FaProjectDiagram,
  },
  {
    title: "Treasury + Milestones",
    description:
      "Winning ideas do not get one blind payout. Funding is released through milestone checks on a 30 / 40 / 30 rail.",
    icon: FaCoins,
  },
];

const flow = [
  "Submit an idea with execution context and required stake.",
  "Enter a round and compete for community-backed USDC voting.",
  "If the idea wins, unlock the grant through milestone proof and reviewer validation.",
];

const rolePaths = [
  {
    label: "Builder path",
    title: "I want to submit a proposal",
    description: "Start with the idea registry, then track whether your idea enters a live round and wins funding.",
    href: "/ideas/new",
  },
  {
    label: "Voter path",
    title: "I want to evaluate and vote",
    description: "Open live rounds, compare active ideas, and back the strongest proposal with stablecoin voting power.",
    href: "/rounds",
  },
  {
    label: "Judge path",
    title: "I want to understand the full loop quickly",
    description: "Use demo mode to inspect the same dApp flow with safe mock rounds, ideas, treasury, and milestone states.",
    href: "/demo",
  },
];

export default function DappDashboardPage() {
  return (
    <section className="space-y-6">
      <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,#2c3140_0%,#1d202b_55%,#17212f_100%)] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.34)] sm:p-8 md:p-10">
        <div className="absolute -left-8 top-0 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-emerald-400/10 blur-3xl" />

        <div className="relative flex flex-col gap-6 lg:gap-8 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-300">BERT dApp v1.1</p>
            <h1 className="mt-4 font-[var(--font-display)] text-4xl leading-tight text-white sm:text-5xl md:text-6xl">
              Fund builders with milestone-based grants, not opaque treasury decisions.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
              BERT is community-owned grant infrastructure. Ideas enter the registry, rounds batch governance,
              and winners unlock treasury capital through verifiable milestone proof.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/rounds"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5"
              >
                Explore live rounds
                <FaArrowRight className="text-xs" />
              </Link>
              <Link
                href="/demo"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/10"
              >
                Open demo dApp
                <FaArrowRight className="text-xs" />
              </Link>
            </div>
          </div>

          <div className="grid max-w-xl gap-3 text-sm text-slate-200 md:grid-cols-3 xl:max-w-md xl:grid-cols-1">
            {flow.map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="flex items-start gap-3">
                  <FaCircle className="mt-1 text-[9px] text-cyan-300" />
                  <p>{item}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <DappDashboardLiveStats />

      <HumanVerificationPanel />

      <RoleBootstrapClaimPanel />

      <RoleBootstrapAddressesShowcase variant="dashboard" />

      <div className="rounded-[28px] border border-white/10 bg-[#2a2d3b] p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Choose your path</p>
        <h2 className="mt-3 font-[var(--font-display)] text-3xl text-white sm:text-4xl">What should I do first?</h2>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {rolePaths.map((path) => (
            <Link
              key={path.title}
              href={path.href}
              className="rounded-[24px] border border-white/10 bg-[#313443] p-5 transition hover:-translate-y-0.5 hover:border-cyan-400/40"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">{path.label}</p>
              <h3 className="mt-3 text-xl font-semibold text-white">{path.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">{path.description}</p>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[28px] border border-white/10 bg-[#2a2d3b] p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">60-second walkthrough</p>
          <h2 className="mt-3 font-[var(--font-display)] text-3xl text-white sm:text-4xl">
            What the user is actually looking at
          </h2>
          <div className="mt-8 grid gap-4">
            {concepts.map(({ title, description, icon: Icon }) => (
              <div key={title} className="rounded-[24px] border border-white/10 bg-[#313443] p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-300">
                    <Icon className="text-lg" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">{title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-300">{description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[28px] border border-emerald-300/20 bg-[linear-gradient(180deg,rgba(14,116,144,0.14),rgba(22,101,52,0.12))] p-6 sm:p-7">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-200">
                <FaShieldAlt className="text-lg" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-200/80">Why it matters</p>
                <h2 className="mt-3 text-2xl font-semibold text-white">BERT shows funding decisions, payout logic, and validation state in one place.</h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-200">
                  That means judges and users can understand the full loop: proposal intake, round competition, treasury release,
                  and milestone review.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-[#2a2d3b] p-6 sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Need a guided demo?</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Use the isolated demo environment.</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              Demo mode mirrors the dApp structure with fake rounds, ideas, treasury activity, and profile data, so someone can
              understand BERT without touching live contracts.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/demo"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5"
              >
                View demo
                <FaArrowRight className="text-xs" />
              </Link>
              <Link
                href="/how-it-works"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5"
              >
                Read protocol flow
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
