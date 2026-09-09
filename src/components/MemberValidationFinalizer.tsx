"use client";

import { useEffect } from "react";
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from "wagmi";

import { communityHubAbi } from "@/lib/community-contracts";
import { communityErrorMessage } from "@/lib/community-errors";
import { useCommunityClock } from "@/lib/use-community-clock";

/** Lets any connected wallet resolve a Member validation case after its Community-clock deadline. */
export function MemberValidationFinalizer({ hub, proposalId, origin, status, validationDeadline }: { hub: `0x${string}`; proposalId: bigint; origin: number; status: number; validationDeadline: bigint }) {
  const { address, chainId } = useAccount();
  const { communityTime, paused } = useCommunityClock(hub, chainId);
  const write = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash: write.data });
  const busy = write.isPending || receipt.isLoading;
  const pendingMemberValidation = origin === 1 && status === 0;
  useEffect(() => {
    if (receipt.isSuccess) window.setTimeout(() => window.location.reload(), 400);
  }, [receipt.isSuccess]);
  if (!pendingMemberValidation) return null;

  const remaining = communityTime !== undefined && communityTime < validationDeadline ? validationDeadline - communityTime : 0n;
  const ready = communityTime !== undefined && remaining === 0n && !paused;

  return <article className="rounded-[28px] border border-amber-300/25 bg-amber-400/8 p-6">
    <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-100">Validation finalization</p>
    <h2 className="mt-2 text-2xl font-semibold text-white">Resolve an expired member review.</h2>
    <p className="mt-3 text-sm text-slate-300">Any connected wallet can finalize this proposal after its Community-clock deadline. The Hub uses its recorded approvals to approve or reject it and settles the proposal bond accordingly.</p>
    {!address ? <p className="mt-4 text-sm text-slate-300">Connect a wallet to submit the finalization transaction.</p> : paused ? <p className="mt-4 text-sm text-amber-100">Community is paused, so the validation clock and finalization are frozen.</p> : communityTime === undefined ? <p className="mt-4 text-sm text-slate-300">Reading the Community clock...</p> : ready ? <button disabled={busy} onClick={() => write.writeContract({ address: hub, abi: communityHubAbi, functionName: "finalizeMemberProposalValidation", args: [proposalId] })} className="mt-4 rounded-full bg-amber-300 px-4 py-2 text-sm font-bold text-slate-950 disabled:opacity-40">{busy ? "Finalizing..." : "Finalize expired validation"}</button> : <p className="mt-4 text-sm text-slate-300">Validation remains open for {formatRemaining(remaining)} of active Community time.</p>}
    {write.error ? <p className="mt-3 text-sm text-rose-200">{communityErrorMessage(write.error)}</p> : null}
    {receipt.isSuccess ? <p className="mt-3 text-sm text-emerald-200">Validation finalized. Refreshing the proposal state...</p> : null}
  </article>;
}

function formatRemaining(seconds: bigint) {
  return `${(seconds / 60n).toString()}m ${(seconds % 60n).toString()}s`;
}
