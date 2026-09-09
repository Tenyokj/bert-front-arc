"use client";

import { useState } from "react";
import { FaMagnifyingGlass } from "react-icons/fa6";

import { CommunityDirectory } from "@/components/CommunityDirectory";

export default function V3SearchPage() {
  const [query, setQuery] = useState("");
  return <section className="space-y-6"><div className="rounded-[32px] border border-white/10 bg-[#2a2d3b] p-7 sm:p-9"><p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-200">Community search</p><h1 className="mt-4 font-[var(--font-display)] text-4xl text-white sm:text-5xl">Search the on-chain directory.</h1><p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">Use a Community name, ID, creator, Hub or Treasury address. The search scans the 100 newest CommunityFactory deployments.</p><div className="relative mt-6 max-w-3xl"><FaMagnifyingGlass className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-cyan-200" /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Minecraft Community, #12 or 0x..." className="w-full rounded-2xl border border-cyan-300/20 bg-slate-950/35 py-4 pl-11 pr-4 text-base text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/60" /></div></div><CommunityDirectory query={query} basePath="/v3/communities" limit={100} /></section>;
}
