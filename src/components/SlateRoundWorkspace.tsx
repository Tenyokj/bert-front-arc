"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePublicClient } from "wagmi";

import { ClientPagination } from "@/components/ClientPagination";
import { formatCommunityUsdc, formatProposalOrigin } from "@/lib/community";
import { communityHubAbi, communityVotingModuleAbi } from "@/lib/community-contracts";
import { getCommunityModules } from "@/lib/community-v3";
import { formatDateTimeFromUnix } from "@/lib/dapp-onchain";
import { useCommunityClock } from "@/lib/use-community-clock";
import { slatePhase } from "@/lib/protocol-status";
import { StatusBadge } from "@/components/dapp/StatusBadge";

const PAGE_SIZE = 8;

type Round = {
  id: number;
  origin: number;
  startTime: bigint;
  endTime: bigint;
  totalVotes: bigint;
  winningProposalId: bigint;
  winningVotes: bigint;
  settled: boolean;
  proposalIds: bigint[];
};

/** Paginated Slate Round directory backed directly by the CommunityHub. */
export function SlateRoundWorkspace({ communityId, hub }: { communityId: string; hub: `0x${string}` }) {
  const client = usePublicClient();
  const { communityTime, paused } = useCommunityClock(hub);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [filter, setFilter] = useState<"all" | "admin" | "member">("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let dead = false;
    async function load() {
      if (!client) return;
      setLoading(true); setError(null); setRounds([]);
      try {
      const read = (value: Record<string, unknown>) => (client as { readContract: (request: Record<string, unknown>) => Promise<unknown> }).readContract(value);
      const modules = await getCommunityModules(client, hub);
      const count = await read({ address: modules.voting, abi: communityVotingModuleAbi, functionName: "roundCount" }) as bigint;
      const ids = Array.from({ length: Math.min(Number(count), 120) }, (_, index) => BigInt(Number(count) - index));
      const rows = await Promise.all(ids.map(async (id) => {
        const [raw, proposalIds] = await Promise.all([
          read({ address: hub, abi: communityHubAbi, functionName: "getRound", args: [id] }),
          read({ address: hub, abi: communityHubAbi, functionName: "getRoundProposalIds", args: [id] }),
        ]);
        const round = raw as Record<string, unknown>;
        return {
          id: Number(id), origin: Number(round.origin), startTime: round.startTime as bigint, endTime: round.endTime as bigint,
          totalVotes: round.totalVotes as bigint, winningProposalId: round.winningProposalId as bigint,
          winningVotes: round.winningVotes as bigint, settled: round.settled as boolean, proposalIds: [...(proposalIds as bigint[])],
        } satisfies Round;
      }));
      if (!dead) setRounds(rows);
      } catch (reason) {
        if (!dead) setError(reason instanceof Error ? reason.message : "Could not load Slate rounds.");
      } finally {
        if (!dead) setLoading(false);
      }
    }
    void load();
    return () => { dead = true; };
  }, [client, hub, refresh]);

  const filtered = rounds.filter((round) => filter === "all" || (filter === "admin" ? round.origin === 0 : round.origin === 1));
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const chooseFilter = (next: "all" | "admin" | "member") => { setFilter(next); setPage(1); };

  return <section className="rounded-[28px] border border-white/10 bg-[#2a2d3b] p-6 sm:p-8">
    <div className="flex flex-wrap justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Slate Rounds</p><h2 className="mt-2 text-3xl font-semibold text-white">Choose one proposal.</h2><p className="mt-3 text-sm text-slate-300">Latest 120 rounds maximum. Selection, execution review and payment are separate steps.</p></div><div className="flex flex-wrap rounded-xl border border-white/10 bg-slate-950/20 p-1">{(["all", "admin", "member"] as const).map((item) => <button key={item} type="button" aria-pressed={filter === item} onClick={() => chooseFilter(item)} className={filter === item ? "rounded-lg bg-cyan-300 px-3 py-2 text-xs font-bold uppercase text-slate-950" : "rounded-lg px-3 py-2 text-xs font-bold uppercase text-slate-400"}>{item}</button>)}</div></div>
    {paused && <p className="mt-4 text-sm text-amber-200">Community paused: active-time voting windows are frozen.</p>}
    {loading ? <p role="status" className="mt-6 text-sm text-slate-300">Loading Slate rounds...</p> : error ? <div role="alert" className="mt-6 text-sm text-rose-200"><p className="break-words">{error}</p><button type="button" onClick={() => setRefresh((value) => value + 1)} className="mt-3 rounded-xl border border-cyan-300/30 px-4 py-2 text-cyan-100">Retry read-only</button></div> : visible.length === 0 ? <p className="mt-6 rounded-2xl border border-white/10 bg-[#313443] p-5 text-sm text-slate-300">No Slate Rounds match this filter in the loaded sample.</p> : <div className="mt-6 grid gap-4 xl:grid-cols-2">{visible.map((round) => {
      const phase = slatePhase(round, communityTime);
      return <Link key={round.id} href={`/v3/communities/${communityId}/rounds/${round.id}`} className="min-w-0 rounded-2xl border border-white/10 bg-[#313443] p-5 transition hover:border-cyan-300/35"><div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs font-bold uppercase tracking-[0.15em] text-cyan-200">Round #{round.id} · {formatProposalOrigin(round.origin)}</p><StatusBadge tone={phase.tone}>{phase.label}</StatusBadge></div>
        <h3 className="mt-3 text-xl font-semibold text-white">{round.settled ? round.winningProposalId > 0n ? `Winner #${round.winningProposalId}` : "No winner recorded" : "Compare the candidates"}</h3>
        <div className="mt-4 grid gap-3 text-sm text-slate-300 sm:grid-cols-2"><p>Proposals <strong className="block text-white">{round.proposalIds.length}</strong></p><p>Total stake <strong className="block break-words text-white">{formatCommunityUsdc(round.totalVotes)} USDC</strong></p><p>{round.settled ? "Winning stake (USDC)" : "Community-clock deadline"}<strong className="block text-white">{round.settled ? formatCommunityUsdc(round.winningVotes) : formatDateTimeFromUnix(round.endTime)}</strong></p></div><p className="mt-4 text-sm leading-relaxed text-slate-300">{phase.next}</p>
      </Link>;
    })}</div>}
    {!loading && !error && <ClientPagination currentPage={currentPage} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />}
  </section>;
}
