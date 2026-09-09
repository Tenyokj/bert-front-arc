"use client";

import Link from "next/link";
import { useState } from "react";

import { ClientPagination } from "@/components/ClientPagination";
import { formatCommunityUsdc, formatProposalOrigin, formatProposalStatus } from "@/lib/community";

type Proposal = { id: number; origin: bigint; mode: bigint; status: bigint; title: string; description: string; yesVotes: bigint; noVotes: bigint; votingDeadline: bigint; accepted: boolean; settled: boolean };
type Filter = "all" | "admin" | "member";
const pageSize = 8;

/** Compact, paginated Binary proposal workspace driven by CommunityTypes.Proposal origin/mode. */
export function BinaryProposalWorkspace({ communityId, proposals }: { communityId: number; proposals: Proposal[] }) {
  const [filter, setFilter] = useState<Filter>("all"); const [page, setPage] = useState(1);
  const binary = proposals.filter((proposal) => Number(proposal.mode) === 0).filter((proposal) => filter === "all" || (filter === "admin" ? Number(proposal.origin) === 0 : Number(proposal.origin) === 1));
  const totalPages = Math.max(1, Math.ceil(binary.length / pageSize)); const currentPage = Math.min(page, totalPages); const visible = binary.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const choose = (next: Filter) => { setFilter(next); setPage(1); };
  return <section className="rounded-[28px] border border-white/10 bg-[#2a2d3b] p-6 sm:p-8"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Binary Proposals</p><h2 className="mt-2 text-3xl font-semibold text-white">Stake-backed YES / NO decisions.</h2></div><div className="flex rounded-xl border border-white/10 bg-slate-950/25 p-1">{(["all", "admin", "member"] as const).map((item) => <button key={item} onClick={() => choose(item)} className={filter === item ? "rounded-lg bg-cyan-300 px-3 py-2 text-xs font-bold uppercase text-slate-950" : "rounded-lg px-3 py-2 text-xs font-bold uppercase text-slate-400 hover:text-white"}>{item}</button>)}</div></div>{visible.length === 0 ? <p className="mt-6 rounded-2xl border border-white/10 bg-[#313443] p-5 text-sm text-slate-300">No binary proposals match this filter.</p> : <div className="mt-6 grid gap-4 xl:grid-cols-2">{visible.map((proposal) => <Link key={proposal.id} href={`/v3/communities/${communityId}/proposals/${proposal.id}`} className="rounded-2xl border border-white/10 bg-[#313443] p-5 transition hover:-translate-y-0.5 hover:border-cyan-300/35"><div className="flex items-center justify-between gap-3"><p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-200">#{proposal.id} · {formatProposalOrigin(proposal.origin)}</p><span className="rounded-full border border-white/10 px-2.5 py-1 text-xs font-semibold text-slate-300">{formatProposalStatus(proposal.status)}</span></div><h3 className="mt-3 text-xl font-semibold text-white">{proposal.title}</h3><p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-300">{proposal.description}</p><div className="mt-5 grid grid-cols-2 gap-3 text-sm"><p className="rounded-xl bg-emerald-400/8 p-3 text-emerald-100">YES <strong className="block mt-1 text-white">{formatCommunityUsdc(proposal.yesVotes)} USDC</strong></p><p className="rounded-xl bg-rose-400/8 p-3 text-rose-100">NO <strong className="block mt-1 text-white">{formatCommunityUsdc(proposal.noVotes)} USDC</strong></p></div></Link>)}</div>}<ClientPagination currentPage={currentPage} totalItems={binary.length} pageSize={pageSize} onPageChange={setPage} /></section>;
}
