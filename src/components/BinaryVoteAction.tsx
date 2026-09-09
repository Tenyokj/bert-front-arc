"use client";

import { useEffect, useState } from "react";
import { formatUnits, parseUnits } from "viem";
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";

import { usdcAbi } from "@/lib/contracts";
import { communityHubAbi, communityTreasuryAbi } from "@/lib/community-contracts";
import { communityErrorMessage, communityTechnicalError } from "@/lib/community-errors";

const BINARY_VOTING = 4;

/** Sends an exact USDC approval to the Treasury before casting a binary CommunityHub vote. */
export function BinaryVoteAction({ hub, treasury, proposalId, proposalStatus, proposalCreator, existingChoice }: { hub: `0x${string}`; treasury: `0x${string}`; proposalId: bigint; proposalStatus: number; proposalCreator: `0x${string}`; existingChoice?: number }) {
  const { address, chainId } = useAccount();
  const [choice, setChoice] = useState<1 | 2>(1);
  const [amount, setAmount] = useState("");
  const { data: member } = useReadContract({ address: hub, abi: communityHubAbi, functionName: "getMember", args: address ? [address] : undefined, chainId, query: { enabled: Boolean(address) } });
  const { data: minimum } = useReadContract({ address: hub, abi: communityHubAbi, functionName: "voteMinStakeUSDC", chainId });
  const { data: usdc } = useReadContract({ address: treasury, abi: communityTreasuryAbi, functionName: "usdc", chainId });
  const parsed = (() => { try { return amount.trim() ? parseUnits(amount, 6) : 0n; } catch { return -1n; } })();
  const { data: allowance, refetch: refetchAllowance } = useReadContract({ address: usdc, abi: usdcAbi, functionName: "allowance", args: address && usdc ? [address, treasury] : undefined, chainId, query: { enabled: Boolean(address && usdc) } });
  const { data: balance } = useReadContract({ address: usdc, abi: usdcAbi, functionName: "balanceOf", args: address && usdc ? [address] : undefined, chainId, query: { enabled: Boolean(address && usdc) } });
  const approval = useWriteContract(); const approvalReceipt = useWaitForTransactionReceipt({ hash: approval.data });
  const vote = useWriteContract(); const voteReceipt = useWaitForTransactionReceipt({ hash: vote.data });
  useEffect(() => { if (approvalReceipt.isSuccess) void refetchAllowance(); }, [approvalReceipt.isSuccess, refetchAllowance]);
  if (!address) return <p className="mt-4 text-sm text-slate-300">Connect a wallet to vote.</p>;
  if (proposalStatus !== BINARY_VOTING) return <p className="mt-4 text-sm text-slate-300">Voting is not open for this proposal.</p>;
  if (address.toLowerCase() === proposalCreator.toLowerCase()) return <p className="mt-4 rounded-xl border border-amber-300/20 bg-amber-400/5 p-3 text-sm text-amber-100">Proposal authors cannot vote on their own binary proposal.</p>;
  if (existingChoice) return <p className="mt-4 text-sm text-slate-300">Your vote is already recorded on-chain. Each member may vote once.</p>;
  if (!(member as { active?: boolean } | undefined)?.active) return <p className="mt-4 text-sm text-amber-100">Join this Community before voting.</p>;
  const min = minimum as bigint | undefined; const hasValidAmount = parsed > 0n && (min === undefined || parsed >= min) && parsed <= 10_000_000_000n; const approved = hasValidAmount && (allowance as bigint | undefined) !== undefined && (allowance as bigint) >= parsed; const balanceEnough = parsed > 0n && ((balance as bigint | undefined) ?? 0n) >= parsed;
  const error = approval.error ?? vote.error;
  const technical = communityTechnicalError(error);
  return <div className="mt-4 border-t border-white/10 pt-4"><p className="text-sm font-semibold text-white">Cast your vote</p><p className="mt-1 text-xs text-slate-400">Minimum: {min === undefined ? "Loading" : `${formatUnits(min, 6)} USDC`} · Maximum: 10,000 USDC</p><div className="mt-3 flex gap-2"><button type="button" onClick={() => setChoice(1)} className={choice === 1 ? "rounded-full bg-cyan-300 px-3 py-2 text-xs font-bold text-slate-950" : "rounded-full border border-white/10 px-3 py-2 text-xs font-bold text-slate-300"}>YES</button><button type="button" onClick={() => setChoice(2)} className={choice === 2 ? "rounded-full border border-white/10 bg-rose-400/10 px-3 py-2 text-xs font-bold text-rose-100" : "rounded-full border border-white/10 px-3 py-2 text-xs font-bold text-slate-300"}>NO</button></div><input value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="USDC stake" inputMode="decimal" className="mt-3 w-full rounded-xl border border-white/10 bg-slate-950/30 px-3 py-2.5 text-sm text-white outline-none" />{parsed > 0n && !balanceEnough ? <p className="mt-2 text-xs text-rose-200">Insufficient USDC balance.</p> : null}{parsed > 0n && min !== undefined && parsed < min ? <p className="mt-2 text-xs text-rose-200">Stake is below the Community minimum.</p> : null}<div className="mt-3 flex flex-wrap gap-2">{!approved ? <button disabled={!usdc || !hasValidAmount || !balanceEnough || approval.isPending || approvalReceipt.isLoading} onClick={() => { if (usdc && hasValidAmount) approval.writeContract({ address: usdc, abi: usdcAbi, functionName: "approve", args: [treasury, parsed] }); }} className="rounded-full border border-cyan-300/40 px-4 py-2 text-sm font-bold text-cyan-100 disabled:opacity-40">{approval.isPending || approvalReceipt.isLoading ? "Approving..." : "1. Approve stake"}</button> : null}<button disabled={!approved || vote.isPending || voteReceipt.isLoading} onClick={() => vote.writeContract({ address: hub, abi: communityHubAbi, functionName: "castBinaryVote", args: [proposalId, choice, parsed] })} className="rounded-full bg-cyan-300 px-4 py-2 text-sm font-bold text-slate-950 disabled:opacity-40">{vote.isPending || voteReceipt.isLoading ? "Voting..." : `2. Vote ${choice === 1 ? "YES" : "NO"}`}</button></div>{error ? <div className="mt-2 text-xs text-rose-200"><p>{communityErrorMessage(error)}</p>{technical ? <details className="mt-1 text-slate-400"><summary className="cursor-pointer">Technical details</summary><p className="mt-1 break-all">{technical}</p></details> : null}</div> : null}{voteReceipt.isSuccess ? <p className="mt-2 text-xs text-emerald-200">Vote confirmed. Refresh this page to load the updated result.</p> : null}</div>;
}
