"use client";

import { useEffect } from "react";
import { useAccount, useReadContract, useReadContracts, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { communityHubAbi, communityMilestoneAbi } from "@/lib/community-contracts";
import { communityErrorMessage } from "@/lib/community-errors";
import { formatCommunityUsdc } from "@/lib/community";
import { formatDateTimeFromUnix } from "@/lib/dapp-onchain";
import { useCommunityClock } from "@/lib/use-community-clock";

type Terms = { amount: bigint; readyAt: bigint; expiresAt: bigint; approvalThreshold: bigint; paid: boolean };

/** Payment authorizations are separate from supporter proof reviews and ordinary withdrawals. */
export function CommunityTranchePayment({ hub, manager, planId }: { hub: `0x${string}`; manager: `0x${string}`; planId: bigint }) {
  const { address, chainId } = useAccount();
  const { communityTime, paused } = useCommunityClock(hub, chainId);
  const stageRead = useReadContract({ address: manager, abi: communityMilestoneAbi, functionName: "pendingTrancheByPlan", args: [planId], chainId });
  const stage = stageRead.data;
  const termsRead = useReadContract({ address: manager, abi: communityMilestoneAbi, functionName: "getExecutionTranche", args: [planId, stage ?? 0], chainId, query: { enabled: stage !== undefined } });
  const approversRead = useReadContract({ address: manager, abi: communityMilestoneAbi, functionName: "getExecutionTrancheApprovers", args: [planId, stage ?? 0], chainId, query: { enabled: stage !== undefined } });
  const adminRead = useReadContract({ address: hub, abi: communityHubAbi, functionName: "isAdminAccount", args: address ? [address] : undefined, chainId, query: { enabled: Boolean(address) } });
  const ownApproval = useReadContract({ address: manager, abi: communityMilestoneAbi, functionName: "hasExecutionTrancheApproval", args: address && stage !== undefined ? [planId, stage, address] : undefined, chainId, query: { enabled: Boolean(address && stage !== undefined) } });
  const recipientRead = useReadContract({ address: manager, abi: communityMilestoneAbi, functionName: "executionRecipient", chainId });
  const recorded = approversRead.data ?? [];
  const validityRead = useReadContracts({ contracts: stage === undefined ? [] : recorded.map((admin) => ({ address: manager, chainId, abi: communityMilestoneAbi, functionName: "hasExecutionTrancheApproval", args: [planId, stage, admin] } as const)) });
  const validAdmins = recorded.filter((_, index) => validityRead.data?.[index]?.result === true)
    .toSorted((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  const terms = termsRead.data as Terms | undefined;
  const write = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash: write.data });
  const busy = write.isPending || receipt.isLoading;
  const hasTime = communityTime !== undefined;
  const expired = Boolean(terms && hasTime && communityTime! >= terms.expiresAt);
  const canExecute = Boolean(terms && BigInt(validAdmins.length) >= terms.approvalThreshold);

  useEffect(() => {
    if (receipt.isSuccess) {
      const timer = window.setTimeout(() => window.location.reload(), 350);
      return () => window.clearTimeout(timer);
    }
  }, [receipt.isSuccess]);

  if (stageRead.error || termsRead.error || approversRead.error) return <p className="mt-4 text-sm text-amber-200">Payment authorization could not be loaded. Check the Manager deployment and RPC; do not treat this as an available withdrawal.</p>;
  if (!terms || stage === undefined) return <p className="mt-4 text-sm text-slate-300">Loading fixed tranche authorization...</p>;

  return <div className="mt-4 rounded-xl border border-amber-300/25 bg-amber-300/5 p-4 text-sm text-slate-300">
    <h4 className="font-semibold text-amber-100">{stage === 0 ? "Initial 20%" : `Milestone ${stage} tranche`} · awaiting Administration payment</h4>
    <p className="mt-2">Fixed amount: <strong className="text-white">{formatCommunityUsdc(terms.amount)} USDC</strong>. Valid current Admin approvals: <strong className="text-white">{validAdmins.length}/{terms.approvalThreshold.toString()}</strong>.</p>
    <p className="mt-2 break-all">Fixed recipient: <span className="select-all font-mono text-xs text-cyan-100">{recipientRead.data ?? "Loading..."}</span></p>
    <p className="mt-2">Payment deadline: {formatDateTimeFromUnix(terms.expiresAt)} (seven days of active Community time). {paused ? "The Community clock is paused." : expired ? "The authorization has expired." : "Capital is still protected inside Treasury."}</p>
    <p className="mt-2 text-xs">Supporter approval is not a payment. After Admin quorum, anyone may relay the fixed transfer. Next proof timing starts only after payment. Expiry makes the whole unpaid execution balance refundable to winning supporters, not freely withdrawable by Admins.</p>
    <div className="mt-4 flex flex-wrap gap-2">
      {adminRead.data && ownApproval.data === false && !expired ? <button disabled={busy || paused || !hasTime} onClick={() => write.writeContract({ address: hub, abi: communityHubAbi, functionName: "approveExecutionTranche", args: [planId] })} className="rounded-full bg-amber-200 px-4 py-2 font-bold text-slate-950 disabled:opacity-40">Approve fixed tranche</button> : null}
      {ownApproval.data === true ? <span className="px-2 py-2 text-xs text-cyan-100">Your current Admin approval is recorded.</span> : null}
      {canExecute && !expired ? <button disabled={!address || busy || paused || !hasTime} onClick={() => write.writeContract({ address: hub, abi: communityHubAbi, functionName: "executeExecutionTranche", args: [planId, validAdmins.slice(0, Number(terms.approvalThreshold))] })} className="rounded-full bg-cyan-200 px-4 py-2 font-bold text-slate-950 disabled:opacity-40">Execute fixed transfer</button> : null}
      {expired ? <button disabled={!address || busy || paused} onClick={() => write.writeContract({ address: hub, abi: communityHubAbi, functionName: "expireExecutionTranche", args: [planId] })} className="rounded-full border border-rose-300/40 px-4 py-2 font-bold text-rose-100 disabled:opacity-40">Expire authorization and enable refunds</button> : null}
    </div>
    {write.error ? <p className="mt-3 text-xs text-rose-200">{communityErrorMessage(write.error)}</p> : null}
  </div>;
}
