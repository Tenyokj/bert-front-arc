"use client";

import { useEffect } from "react";
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";

import { communityHubAbi } from "@/lib/community-contracts";
import { communityErrorMessage, communityTechnicalError } from "@/lib/community-errors";
import { useCommunityClock } from "@/lib/use-community-clock";

/** Exposes lifecycle actions only when the pause-adjusted Community clock permits them. */
export function BinaryLifecycleActions({
  hub,
  proposalId,
  status,
  votingDeadline,
}: {
  hub: `0x${string}`;
  proposalId: bigint;
  status: number;
  votingDeadline: bigint;
}) {
  const { address, chainId } = useAccount();
  const write = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash: write.data });
  const { data: isAdmin } = useReadContract({
    address: hub,
    abi: communityHubAbi,
    functionName: "isAdminAccount",
    args: address ? [address] : undefined,
    chainId,
    query: { enabled: Boolean(address) },
  });
  const { communityTime, paused } = useCommunityClock(hub, chainId);
  const busy = write.isPending || receipt.isLoading;
  const settlementReady = communityTime !== undefined && communityTime >= votingDeadline;
  const remainingSeconds = communityTime !== undefined && communityTime < votingDeadline
    ? votingDeadline - communityTime
    : 0n;

  useEffect(() => {
    if (receipt.isSuccess) window.setTimeout(() => window.location.reload(), 400);
  }, [receipt.isSuccess]);

  if (status === 2 && isAdmin) {
    return <Action busy={busy} error={write.error} label="Open binary voting" onClick={() => write.writeContract({ address: hub, abi: communityHubAbi, functionName: "openBinaryVoting", args: [proposalId] })} />;
  }
  if (status === 4) {
    const label = paused
      ? "Settlement locked while Community is paused"
      : settlementReady
        ? "Settle binary proposal"
        : `Settlement available in ${formatRemaining(remainingSeconds)}`;
    return <Action busy={busy} disabled={!settlementReady || paused} error={write.error} label={label} onClick={() => write.writeContract({ address: hub, abi: communityHubAbi, functionName: "settleBinaryProposal", args: [proposalId] })} />;
  }
  return null;
}

function Action({
  label,
  busy,
  disabled,
  error,
  onClick,
}: {
  label: string;
  busy: boolean;
  disabled?: boolean;
  error?: unknown;
  onClick: () => void;
}) {
  const technical = communityTechnicalError(error);
  return <div className="mt-4">
    <button disabled={busy || disabled} onClick={onClick} className="rounded-full border border-cyan-300/40 px-4 py-2 text-sm font-bold text-cyan-100 disabled:opacity-40">{busy ? "Submitting..." : label}</button>
    {error ? <div className="mt-2 text-xs leading-relaxed text-rose-200"><p>{communityErrorMessage(error)}</p>{technical ? <details className="mt-1 text-slate-400"><summary className="cursor-pointer">Technical details</summary><p className="mt-1 break-all">{technical}</p></details> : null}</div> : null}
  </div>;
}

function formatRemaining(seconds: bigint) {
  return `${(seconds / 60n).toString()}m ${(seconds % 60n).toString()}s of active Community time`;
}
