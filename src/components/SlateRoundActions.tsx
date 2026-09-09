"use client";

import { useEffect, useState } from "react";
import { parseUnits } from "viem";
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";

import { usdcAbi } from "@/lib/contracts";
import { communityHubAbi, communityTreasuryAbi } from "@/lib/community-contracts";
import { communityErrorMessage } from "@/lib/community-errors";

type SlateCandidate = {
  id: bigint;
  creator: string;
  title: string;
};

type MemberInfo = {
  active: boolean;
  exitRequestedAt: bigint;
};

/** Direct on-chain Slate Round voting and settlement controls. */
export function SlateRoundActions({
  hub,
  treasury,
  roundId,
  candidates,
  settled,
}: {
  hub: `0x${string}`;
  treasury: `0x${string}`;
  roundId: bigint;
  candidates: SlateCandidate[];
  settled: boolean;
}) {
  const { address, chainId } = useAccount();
  const [selected, setSelected] = useState<bigint>(candidates[0]?.id ?? 0n);
  const [amount, setAmount] = useState("");
  const memberRead = useReadContract({ address: hub, abi: communityHubAbi, functionName: "getMember", args: address ? [address] : undefined, chainId, query: { enabled: Boolean(address) } });
  const selectedVoteRead = useReadContract({ address: hub, abi: communityHubAbi, functionName: "selectedProposalByRound", args: address ? [roundId, address] : undefined, chainId, query: { enabled: Boolean(address) } });
  const minRead = useReadContract({ address: hub, abi: communityHubAbi, functionName: "voteMinStakeUSDC", chainId });
  const usdcRead = useReadContract({ address: treasury, abi: communityTreasuryAbi, functionName: "usdc", chainId });
  const allowanceRead = useReadContract({ address: usdcRead.data, abi: usdcAbi, functionName: "allowance", args: address && usdcRead.data ? [address, treasury] : undefined, chainId, query: { enabled: Boolean(address && usdcRead.data) } });
  const balanceRead = useReadContract({ address: usdcRead.data, abi: usdcAbi, functionName: "balanceOf", args: address && usdcRead.data ? [address] : undefined, chainId, query: { enabled: Boolean(address && usdcRead.data) } });
  const approval = useWriteContract();
  const vote = useWriteContract();
  const settle = useWriteContract();
  const approvalReceipt = useWaitForTransactionReceipt({ hash: approval.data });
  const voteReceipt = useWaitForTransactionReceipt({ hash: vote.data });
  const settleReceipt = useWaitForTransactionReceipt({ hash: settle.data });

  const selectedCandidate = candidates.find((candidate) => candidate.id === selected);
  const selfSelected = Boolean(address && selectedCandidate && selectedCandidate.creator.toLowerCase() === address.toLowerCase());

  useEffect(() => {
    if (!address || !selfSelected) return;
    const alternative = candidates.find((candidate) => candidate.creator.toLowerCase() !== address.toLowerCase());
    if (alternative) setSelected(alternative.id);
  }, [address, candidates, selfSelected]);

  useEffect(() => {
    if (approvalReceipt.isSuccess) void allowanceRead.refetch();
  }, [allowanceRead, approvalReceipt.isSuccess]);

  if (settled) return null;

  const minimum = minRead.data as bigint | undefined;
  const balance = balanceRead.data as bigint | undefined;
  const allowance = allowanceRead.data as bigint | undefined;
  const parsed = (() => {
    try { return amount ? parseUnits(amount, 6) : 0n; } catch { return -1n; }
  })();
  const amountInRange = parsed > 0n && (minimum === undefined || parsed >= minimum) && parsed <= 10_000_000_000n;
  const balanceEnough = parsed > 0n && balance !== undefined && balance >= parsed;
  const approved = amountInRange && (allowance ?? 0n) >= parsed;
  const member = memberRead.data as MemberInfo | undefined;
  const activeMember = Boolean(member?.active);
  const exitRequested = member?.exitRequestedAt !== undefined && member.exitRequestedAt !== 0n;
  const alreadyVoted = (selectedVoteRead.data as bigint | undefined ?? 0n) !== 0n;
  const canApprove = Boolean(usdcRead.data && amountInRange && balanceEnough && !selfSelected);
  const canVote = approved && activeMember && !exitRequested && !selfSelected && !alreadyVoted;
  const error = approval.error ?? vote.error ?? settle.error;

  return <section className="mt-6 rounded-2xl border border-cyan-300/15 bg-cyan-400/5 p-4">
    <p className="font-semibold text-white">Vote in this Slate Round</p>
    {!address ? <p className="mt-2 text-sm text-slate-300">Connect a wallet to vote or settle.</p> : alreadyVoted ? <p className="mt-2 rounded-xl border border-cyan-300/20 bg-cyan-400/10 p-3 text-sm text-cyan-100">Your vote for proposal #{(selectedVoteRead.data as bigint).toString()} is already recorded on-chain. Each Member can vote once per Slate Round.</p> : !activeMember ? <p className="mt-2 text-sm text-amber-100">Join the Community to vote.</p> : exitRequested ? <p className="mt-2 rounded-xl border border-amber-300/25 bg-amber-400/10 p-3 text-sm text-amber-100">This wallet has requested membership exit and cannot create another voting obligation.</p> : <>
      <select value={selected.toString()} onChange={(event) => setSelected(BigInt(event.target.value))} className="mt-3 w-full rounded-xl border border-white/10 bg-slate-950/30 px-3 py-2.5 text-sm text-white">
        {candidates.map((candidate) => {
          const ownProposal = candidate.creator.toLowerCase() === address.toLowerCase();
          return <option key={candidate.id.toString()} value={candidate.id.toString()} disabled={ownProposal}>#{candidate.id.toString()} · {candidate.title}{ownProposal ? " (your proposal)" : ""}</option>;
        })}
      </select>
      {selfSelected ? <p className="mt-2 rounded-xl border border-amber-300/25 bg-amber-400/10 p-3 text-xs text-amber-100">Proposal authors cannot select their own Slate proposal. Choose another candidate to vote.</p> : null}
      <input value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="USDC stake" inputMode="decimal" className="mt-3 w-full rounded-xl border border-white/10 bg-slate-950/30 px-3 py-2.5 text-sm text-white outline-none" />
      {parsed > 0n && !balanceEnough ? <p className="mt-2 text-xs text-rose-200">Insufficient USDC balance.</p> : null}
      {parsed > 0n && minimum !== undefined && parsed < minimum ? <p className="mt-2 text-xs text-rose-200">Stake is below the Community minimum.</p> : null}
      {parsed > 10_000_000_000n ? <p className="mt-2 text-xs text-rose-200">A single vote cannot exceed 10,000 USDC.</p> : null}
      <div className="mt-3 flex flex-wrap gap-2">
        {!approved ? <button disabled={!canApprove || approval.isPending || approvalReceipt.isLoading} onClick={() => { if (usdcRead.data && canApprove) approval.writeContract({ address: usdcRead.data, abi: usdcAbi, functionName: "approve", args: [treasury, parsed] }); }} className="rounded-full border border-cyan-300/40 px-4 py-2 text-sm font-bold text-cyan-100 disabled:opacity-40">{approval.isPending || approvalReceipt.isLoading ? "Approving..." : "1. Approve stake"}</button> : null}
        <button disabled={!canVote || vote.isPending || voteReceipt.isLoading} onClick={() => vote.writeContract({ address: hub, abi: communityHubAbi, functionName: "castSlateRoundVote", args: [roundId, selected, parsed] })} className="rounded-full bg-cyan-300 px-4 py-2 text-sm font-bold text-slate-950 disabled:opacity-40">{vote.isPending || voteReceipt.isLoading ? "Voting..." : "2. Vote"}</button>
      </div>
    </>}
    <button disabled={settle.isPending || settleReceipt.isLoading} onClick={() => settle.writeContract({ address: hub, abi: communityHubAbi, functionName: "settleSlateRound", args: [roundId] })} className="mt-3 rounded-full border border-white/10 px-4 py-2 text-sm font-bold text-slate-200 disabled:opacity-40">Settle after on-chain deadline</button>
    {error ? <p className="mt-3 rounded-xl border border-rose-300/30 bg-rose-400/10 p-3 text-sm text-rose-100">{communityErrorMessage(error)}</p> : null}
    {voteReceipt.isSuccess || settleReceipt.isSuccess ? <p className="mt-3 text-sm text-emerald-100">Transaction confirmed. Refresh the round to load the current on-chain state.</p> : null}
  </section>;
}
