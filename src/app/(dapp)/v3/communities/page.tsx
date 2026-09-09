import Link from "next/link";
import { FaArrowRight, FaPlus } from "react-icons/fa6";

import { CommunityDirectory } from "@/components/CommunityDirectory";

export default function V3CommunitiesPage() {
  return <section className="space-y-6"><div className="rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,#273c47,#20232f_54%,#313443)] p-7 sm:p-9"><p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-200">Community directory</p><div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><h1 className="font-[var(--font-display)] text-4xl text-white sm:text-5xl">Find a governance world.</h1><p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">Every activated CommunityHub and its Treasury are indexed by CommunityFactory. Search by a Community name, ID or deployment address.</p></div><div className="flex flex-wrap gap-3"><Link href="/v3/search" className="rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white">Open search <FaArrowRight className="ml-1 inline" /></Link><Link href="/v3/create" className="rounded-full bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-slate-950"><FaPlus className="mr-1 inline" /> Create</Link></div></div></div><CommunityDirectory basePath="/v3/communities" /></section>;
}
