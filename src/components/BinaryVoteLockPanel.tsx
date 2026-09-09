"use client";

import { useEffect } from "react";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";

import { communityHubAbi } from "@/lib/community-contracts";
import { communityErrorMessage } from "@/lib/community-errors";

/** Releases the member-exit lock created by a settled binary vote. */
export function BinaryVoteLockPanel({
  hub,
  proposalId,
  settled,
  voteChoice,
}: {
  hub: `0x${string}`;
  proposalId: bigint;
  settled: boolean;
  voteChoice?: number;
}) {
  const write = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash: write.data });

  useEffect(() => {
    if (receipt.isSuccess) window.setTimeout(() => window.location.reload(), 400);
  }, [receipt.isSuccess]);

  if (!settled || !voteChoice) return null;

  return <div className="mt-4 rounded-xl border border-cyan-300/20 bg-cyan-400/5 p-4">
    <p className="text-sm font-semibold text-cyan-50">Membership exit lock</p>
    <p className="mt-1 text-xs leading-relaxed text-cyan-100">Your settled vote keeps membership stake locked until you explicitly clear this resolved governance lock.</p>
    <button disabled={write.isPending || receipt.isLoading} onClick={() => write.writeContract({ address: hub, abi: communityHubAbi, functionName: "clearSettledVoteLock", args: [proposalId] })} className="mt-3 rounded-full border border-cyan-300/40 px-4 py-2 text-sm font-bold text-cyan-100 disabled:opacity-40">{write.isPending || receipt.isLoading ? "Clearing lock..." : "Clear settled vote lock"}</button>
    {write.error ? <p className="mt-2 text-xs text-rose-200">{communityErrorMessage(write.error)}</p> : null}
    {receipt.isSuccess ? <p className="mt-2 text-xs text-emerald-200">Vote lock cleared. Your Membership panel will refresh.</p> : null}
  </div>;
}
