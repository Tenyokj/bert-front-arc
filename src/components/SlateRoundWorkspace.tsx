"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePublicClient } from "wagmi";

import { ClientPagination } from "@/components/ClientPagination";
import { formatCommunityUsdc, formatProposalOrigin } from "@/lib/community";
import { communityHubAbi } from "@/lib/community-contracts";
import { formatDateTimeFromUnix } from "@/lib/dapp-onchain";

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
export function SlateRoundWorkspace({ communityId, hub }: { communityId: number; hub: `0x${string}` }) {
  const client = usePublicClient();
  const [rounds, setRounds] = useState<Round[]>([]);
  const [filter, setFilter] = useState<"all" | "admin" | "member">("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let dead = false;
    async function load() {
      if (!client) return;
      const read = (value: Record<string, unknown>) => (client as { readContract: (request: Record<string, unknown>) => Promise<unknown> }).readContract(value);
      const count = await read({ address: hub, abi: communityHubAbi, functionName: "roundCount" }) as bigint;
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
    }
    void load();
    return () => { dead = true; };
  }, [client, hub]);

  const filtered = rounds.filter((round) => filter === "all" || (filter === "admin" ? round.origin === 0 : round.origin === 1));
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const chooseFilter = (next: "all" | "admin" | "member") => { setFilter(next); setPage(1); };

  return <section className="rounded-[28px] border border-white/10 bg-[#2a2d3b] p-6 sm:p-8">
    <div className="flex flex-wrap justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Slate Rounds</p><h2 className="mt-2 text-3xl font-semibold text-white">Choose one proposal.</h2></div><div className="flex rounded-xl border border-white/10 bg-slate-950/20 p-1">{(["all", "admin", "member"] as const).map((item) => <button key={item} onClick={() => chooseFilter(item)} className={filter === item ? "rounded-lg bg-cyan-300 px-3 py-2 text-xs font-bold uppercase text-slate-950" : "rounded-lg px-3 py-2 text-xs font-bold uppercase text-slate-400"}>{item}</button>)}</div></div>
    {visible.length === 0 ? <p className="mt-6 rounded-2xl border border-white/10 bg-[#313443] p-5 text-sm text-slate-300">No Slate Rounds match this filter.</p> : <div className="mt-6 grid gap-4 xl:grid-cols-2">{visible.map((round) => <Link key={round.id} href={`/v3/communities/${communityId}/rounds/${round.id}`} className="rounded-2xl border border-white/10 bg-[#313443] p-5 transition hover:border-cyan-300/35"><p className="text-xs font-bold uppercase tracking-[0.15em] text-cyan-200">Round #{round.id} · {formatProposalOrigin(round.origin)}</p><h3 className="mt-3 text-xl font-semibold text-white">{round.settled ? `Winner #${round.winningProposalId}` : "Voting round"}</h3><div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-300"><p>Proposals <strong className="block text-white">{round.proposalIds.length}</strong></p><p>Total stake <strong className="block text-white">{formatCommunityUsdc(round.totalVotes)} USDC</strong></p><p>{round.settled ? "Settled" : "Ends"}<strong className="block text-white">{round.settled ? formatCommunityUsdc(round.winningVotes) : formatDateTimeFromUnix(round.endTime)}</strong></p></div></Link>)}</div>}
    <ClientPagination currentPage={currentPage} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
  </section>;
}
