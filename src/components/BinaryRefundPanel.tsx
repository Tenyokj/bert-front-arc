"use client";

import { useEffect } from "react";
import { formatUnits } from "viem";
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";

import { communityTreasuryAbi } from "@/lib/community-contracts";
import { communityErrorMessage, communityTechnicalError } from "@/lib/community-errors";
import { normalizeCommunityRefundPreview } from "@/lib/community-v3";

/** Explains and executes the explicit NO-side refund claim created by a settled binary proposal. */
export function BinaryRefundPanel({ treasury, proposalId, settled, voteChoice }: { treasury: `0x${string}`; proposalId: bigint; settled: boolean; voteChoice?: number }) {
  const { address, chainId } = useAccount();
  const refund = useReadContract({ address: treasury, abi: communityTreasuryAbi, functionName: "getRefundPreview", args: address ? [proposalId, address] : undefined, chainId, query: { enabled: Boolean(address && settled) } });
  const write = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash: write.data });
  const preview = normalizeCommunityRefundPreview(refund.data);
  useEffect(() => { if (receipt.isSuccess) window.setTimeout(() => window.location.reload(), 400); }, [receipt.isSuccess]);

  if (!address) return <p className="mt-5 rounded-xl border border-white/10 bg-slate-950/20 p-3 text-xs leading-relaxed text-slate-300">Connect your wallet to check whether a binary refund is claimable.</p>;
  if (!settled) return <p className="mt-5 rounded-xl border border-amber-300/15 bg-amber-400/5 p-3 text-xs leading-relaxed text-amber-100">Refunds are calculated only after this binary proposal is settled on-chain. If NO wins, NO voters claim their stake minus the configured rejection fee.</p>;
  if (preview?.available) return <ClaimCard amount={preview.amount} write={write} receipt={receipt} treasury={treasury} proposalId={proposalId} />;
  if (Number(voteChoice) === 2) return <p className="mt-5 rounded-xl border border-emerald-300/20 bg-emerald-400/10 p-3 text-xs leading-relaxed text-emerald-100">Your NO-side refund has already been claimed.</p>;
  return <div className="mt-5 rounded-xl border border-amber-300/20 bg-amber-400/5 p-3 text-xs leading-relaxed text-amber-100"><p className="font-semibold">No refund is available for the connected wallet.</p><p className="mt-1">This wallet did not cast a NO vote on this proposal. Switch to the wallet that voted NO to claim its refund.</p></div>;
}

function ClaimCard({ amount, write, receipt, treasury, proposalId }: { amount?: bigint; write: ReturnType<typeof useWriteContract>; receipt: ReturnType<typeof useWaitForTransactionReceipt>; treasury: `0x${string}`; proposalId: bigint }) {
  return <div className="mt-5 rounded-xl border border-emerald-300/20 bg-emerald-400/10 p-4"><p className="text-sm font-semibold text-emerald-50">NO-side refund</p><p className="mt-1 text-xs leading-relaxed text-emerald-100">{amount === undefined ? "Claim the NO-side refund for this settled proposal. The contract verifies your eligibility and exact amount." : `${formatUnits(amount, 6)} USDC is claimable. Refunds are not sent automatically.`}</p><button disabled={write.isPending || receipt.isLoading} onClick={() => write.writeContract({ address: treasury, abi: communityTreasuryAbi, functionName: "claimNoVoteRefund", args: [proposalId] })} className="mt-3 rounded-full bg-emerald-300 px-4 py-2 text-sm font-bold text-slate-950 disabled:opacity-40">{write.isPending || receipt.isLoading ? "Claiming refund..." : amount === undefined ? "Claim NO-side refund" : `Claim ${formatUnits(amount, 6)} USDC`}</button>{write.error ? <ErrorMessage error={write.error} /> : null}{receipt.isSuccess ? <p className="mt-2 text-xs text-emerald-100">Refund claimed. Your wallet balance will update after the next refresh.</p> : null}</div>;
}

function ErrorMessage({ error }: { error: unknown }) {
  const technical = communityTechnicalError(error);
  return <div className="mt-2 text-xs text-rose-200"><p>{communityErrorMessage(error)}</p>{technical ? <details className="mt-1 text-slate-400"><summary className="cursor-pointer">Technical details</summary><p className="mt-1 break-all">{technical}</p></details> : null}</div>;
}
