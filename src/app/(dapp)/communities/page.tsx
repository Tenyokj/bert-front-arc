import Link from "next/link";
import { FaArrowRight, FaBuildingColumns, FaCheckDouble, FaUsers } from "react-icons/fa6";

import { CommunityDirectory } from "@/components/CommunityDirectory";

export default function CommunitiesPage() {
  return (
    <section className="space-y-6">
      <div className="relative overflow-hidden rounded-[32px] border border-cyan-300/16 bg-[linear-gradient(135deg,#162d38_0%,#20232f_48%,#313443_100%)] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.3)] sm:p-8 md:p-10">
        <div className="absolute -right-10 -top-16 h-72 w-72 rounded-full bg-cyan-300/10 blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="relative max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-200">BERT V3 / Community Layer</p>
          <h1 className="mt-4 font-[var(--font-display)] text-4xl leading-tight text-white sm:text-5xl md:text-6xl">Governance spaces with capital behind every decision.</h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
            Communities are independent on-chain rooms for members, validators, administrators, stake-backed proposals, and local USDC Treasury execution.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="#directory" className="rounded-full bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5">Browse communities</a>
            <Link href="/app" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/10">Back to V2 dashboard <FaArrowRight className="text-xs" /></Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[24px] border border-white/10 bg-[#2a2d3b] p-5"><FaUsers className="text-xl text-cyan-300" /><h2 className="mt-4 text-xl font-semibold text-white">Members stake to enter</h2><p className="mt-2 text-sm leading-relaxed text-slate-300">Entry stake makes governance participation intentional and unlocks member proposal rights.</p></div>
        <div className="rounded-[24px] border border-white/10 bg-[#2a2d3b] p-5"><FaCheckDouble className="text-xl text-emerald-300" /><h2 className="mt-4 text-xl font-semibold text-white">Validators filter quality</h2><p className="mt-2 text-sm leading-relaxed text-slate-300">Member proposals need validator approval before they can become community decisions.</p></div>
        <div className="rounded-[24px] border border-white/10 bg-[#2a2d3b] p-5"><FaBuildingColumns className="text-xl text-amber-200" /><h2 className="mt-4 text-xl font-semibold text-white">Treasury follows results</h2><p className="mt-2 text-sm leading-relaxed text-slate-300">Accepted capital becomes local execution funding under a community-admin quorum.</p></div>
      </div>

      <div id="directory" className="scroll-mt-28">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4 px-1"><div><p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">On-chain directory</p><h2 className="mt-2 font-[var(--font-display)] text-3xl text-white sm:text-4xl">CommunityFactory deployments</h2></div></div>
        <CommunityDirectory />
      </div>
    </section>
  );
}
