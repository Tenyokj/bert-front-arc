"use client";

import { useAccount, useReadContracts } from "wagmi";

import { communityTreasuryAbi } from "@/lib/community-contracts";
import { formatCommunityUsdc } from "@/lib/community";

/** Read-only accounting view that keeps each Community Treasury liability separate. */
export function CommunityTreasuryPanel({ treasury }: { treasury: `0x${string}` }) {
  const { chainId } = useAccount();
  const { data, isLoading, error } = useReadContracts({ chainId, contracts: ["executionBalance", "availableExecutionBalance", "validatorRewardBalance", "totalMembershipLocked", "totalProposalBondLocked", "totalRefundLiability"].map((functionName) => ({ address: treasury, abi: communityTreasuryAbi, functionName })) as never });
  if (isLoading) return <div className="rounded-[28px] border border-white/10 bg-[#2a2d3b] p-6 text-sm text-slate-300">Loading Treasury accounting...</div>;
  if (error) return <div className="rounded-[28px] border border-rose-300/30 bg-rose-400/10 p-6 text-sm text-rose-100">Could not load Treasury accounting.</div>;
  const values = (data ?? []).map((item) => item.result as bigint | undefined);
  const cards = [["Execution Treasury", values[0]], ["Available execution", values[1]], ["Validator rewards", values[2]], ["Membership locked", values[3]], ["Proposal bonds locked", values[4]], ["Refund liability", values[5]]];
  return <section className="rounded-[28px] border border-white/10 bg-[#2a2d3b] p-6"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Treasury accounting</p><h2 className="mt-2 text-2xl font-semibold text-white">Where Community USDC is held.</h2></div><p className="text-xs text-slate-400">Global BERT reserve is routed separately by settlement logic.</p></div><div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{cards.map(([label, value]) => <div key={label as string} className="rounded-xl border border-white/10 bg-slate-950/20 p-4"><p className="text-xs text-slate-500">{label as string}</p><p className="mt-2 text-lg font-semibold text-white">{formatCommunityUsdc(value as bigint | undefined)} USDC</p></div>)}</div></section>;
}
