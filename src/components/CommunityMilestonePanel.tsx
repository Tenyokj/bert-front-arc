"use client";

import { useEffect, useState, type ReactNode } from "react";
import { FaCheckDouble, FaCircleInfo, FaFileShield, FaRotate } from "react-icons/fa6";
import { useAccount, useReadContract, useReadContracts, useWaitForTransactionReceipt, useWriteContract } from "wagmi";

import { formatCommunityUsdc } from "@/lib/community";
import { communityErrorMessage, communityTechnicalError } from "@/lib/community-errors";
import { communityHubAbi, communityMilestoneAbi } from "@/lib/community-contracts";
import { formatDateTimeFromUnix } from "@/lib/dapp-onchain";
import { useCommunityClock } from "@/lib/use-community-clock";
import { CommunityTranchePayment } from "@/components/CommunityTranchePayment";

type Plan = {
  proposalId: bigint;
  totalBudget: bigint;
  eligibleSupportWeight: bigint;
  releasedAmount: bigint;
  refundableAmount: bigint;
  proofDeadline: bigint;
  currentMilestone: number;
  status: number;
};

type Review = {
  openedAt: bigint;
  closesAt: bigint;
  correctionAvailableAt: bigint;
  approvingWeight: bigint;
  rejectingWeight: bigint;
  approvingAddresses: bigint;
  participatingAddresses: bigint;
  proofAttempts: number;
  evidenceHash: string;
};

const planStatus = ["No execution plan", "Awaiting proof", "Reviewing proof", "Correction cooldown", "Grace review", "Completed", "Failed", "Awaiting Admin tranche authorization"] as const;

/**
 * Renders the on-chain Community execution-plan lifecycle for every proposal that
 * settled into a winner. Eligibility remains enforced by CommunityHub and the
 * milestone module; this component only exposes the correct contract actions.
 */
export function CommunityMilestonePanel({ hub, proposalIds }: { hub: `0x${string}`; proposalIds: bigint[] }) {
  const { chainId } = useAccount();
  const managerRead = useReadContract({ address: hub, abi: communityHubAbi, functionName: "milestones", chainId });
  const manager = managerRead.data as `0x${string}` | undefined;
  const planReads = useReadContracts({
    contracts: manager
      ? proposalIds.map((planId) => ({ address: manager, chainId, abi: communityMilestoneAbi, functionName: "getPlan", args: [planId] }))
      : [],
  });
  const plans = (planReads.data ?? [])
    .map((item) => item.result as Plan | undefined)
    .filter((plan): plan is Plan => Boolean(plan && plan.totalBudget > 0n));

  if (managerRead.isLoading || planReads.isLoading) return <PanelShell title="Execution plans"><p className="text-sm text-slate-300">Loading milestone plans...</p></PanelShell>;
  if (managerRead.error || planReads.error || !manager) return <PanelShell title="Execution plans"><p className="text-sm text-amber-100">Milestone module could not be read from this CommunityHub.</p></PanelShell>;
  if (!plans.length) return <PanelShell title="Execution plans"><p className="max-w-3xl text-sm leading-relaxed text-slate-300">A Community execution plan appears after a binary YES or Slate winner settles. New quorum-enabled Managers reserve the budget and require Admin authorization for every 20/40/40 transfer; supporters additionally review each 40% stage. Original deployed Managers retain automatic transfers. Check the Community&apos;s Manager release.</p></PanelShell>;

  return <PanelShell title="Execution plans">
    <p className="max-w-3xl text-sm leading-relaxed text-slate-300">Only winning supporters can review proof; authors cannot vote for their own proposal. Patched milestone managers exclude the execution recipient from review weight and reviewer count, while preserving its financial refund rights. Review needs 40% eligible-weight quorum, 66.67% participating-weight approval, and at least max(3, ceil(3% of eligible reviewers)) approving wallets. Check the manager status on each plan; older Communities are not automatically patched.</p>
    <div className="mt-5 grid gap-4">
      {plans.map((plan) => <MilestonePlanCard key={plan.proposalId.toString()} hub={hub} manager={manager} plan={plan} />)}
    </div>
  </PanelShell>;
}

function MilestonePlanCard({ hub, manager, plan }: { hub: `0x${string}`; manager: `0x${string}`; plan: Plan }) {
  const { address, chainId } = useAccount();
  const { communityTime, paused } = useCommunityClock(hub, chainId);
  const [evidenceHash, setEvidenceHash] = useState("");
  const reviewRead = useReadContract({ address: manager, abi: communityMilestoneAbi, functionName: "getReview", args: [plan.proposalId, plan.currentMilestone], chainId, query: { enabled: plan.currentMilestone > 0 } });
  const recipientRead = useReadContract({ address: manager, abi: communityMilestoneAbi, functionName: "executionRecipient", chainId });
  const electorateRead = useReadContracts({
    contracts: [
      { address: manager, chainId, abi: communityMilestoneAbi, functionName: "totalSupportWeightByPlan", args: [plan.proposalId] },
      { address: manager, chainId, abi: communityMilestoneAbi, functionName: "eligibleReviewerCountByPlan", args: [plan.proposalId] },
    ],
    query: { retry: false },
  });
  const totalSupport = electorateRead.data?.[0]?.result as bigint | undefined;
  const reviewerCount = electorateRead.data?.[1]?.result as bigint | undefined;
  const hasSeparatedElectorate = totalSupport !== undefined && totalSupport > 0n && reviewerCount !== undefined;
  const choiceRead = useReadContract({ address: manager, abi: communityMilestoneAbi, functionName: "reviewChoice", args: address && plan.currentMilestone > 0 ? [plan.proposalId, plan.currentMilestone, address] : undefined, chainId, query: { enabled: Boolean(address && plan.currentMilestone > 0) } });
  const write = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash: write.data });
  const review = reviewRead.data as Review | undefined;
  const isRecipient = Boolean(address && recipientRead.data && address.toLowerCase() === String(recipientRead.data).toLowerCase());
  const time = communityTime ?? 0n;
  const validHash = /^0x[0-9a-fA-F]{64}$/.test(evidenceHash);
  const status = planStatus[plan.status] ?? "Unknown";
  const remaining = plan.status === 1 ? plan.proofDeadline - time : (review?.closesAt ?? 0n) - time;
  const actionBusy = write.isPending || receipt.isLoading;

  useEffect(() => {
    if (!receipt.isSuccess) return;
    const timer = window.setTimeout(() => window.location.reload(), 350);
    return () => window.clearTimeout(timer);
  }, [receipt.isSuccess]);

  const submit = () => write.writeContract({ address: hub, chainId, abi: communityHubAbi, functionName: "submitMilestoneProof", args: [plan.proposalId, evidenceHash as `0x${string}`] });
  const cast = (approved: boolean) => write.writeContract({ address: hub, chainId, abi: communityHubAbi, functionName: "castMilestoneReview", args: [plan.proposalId, approved] });
  const finalize = () => write.writeContract({ address: hub, chainId, abi: communityHubAbi, functionName: "finalizeMilestoneReview", args: [plan.proposalId] });
  const correct = () => write.writeContract({ address: hub, chainId, abi: communityHubAbi, functionName: "reopenAfterCorrection", args: [plan.proposalId] });
  const fail = () => write.writeContract({ address: hub, chainId, abi: communityHubAbi, functionName: "failExpiredPlan", args: [plan.proposalId] });
  const claim = () => write.writeContract({ address: hub, chainId, abi: communityHubAbi, functionName: "claimFailedPlanRefund", args: [plan.proposalId] });
  const technical = communityTechnicalError(write.error);

  return <article className="rounded-2xl border border-white/10 bg-slate-950/20 p-5">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-200">Plan #{plan.proposalId.toString()} · Milestone {plan.currentMilestone || "-"}/2</p><h3 className="mt-2 text-xl font-semibold text-white">{status}</h3></div><span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-100">20 / 40 / 40 rail</span></div>
    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Budget" value={`${formatCommunityUsdc(plan.totalBudget)} USDC`} /><Metric label="Released" value={`${formatCommunityUsdc(plan.releasedAmount)} USDC`} /><Metric label={hasSeparatedElectorate ? "Review-eligible support" : "Recorded winning support"} value={`${formatCommunityUsdc(plan.eligibleSupportWeight)} USDC`} /><Metric label="Total financial support" value={`${formatCommunityUsdc(totalSupport ?? plan.eligibleSupportWeight)} USDC`} /></div>
    {hasSeparatedElectorate ? <p className="mt-3 text-xs leading-relaxed text-cyan-100">Separated review/refund accounting detected: {reviewerCount.toString()} eligible reviewers. The execution recipient cannot review, but keeps any winning-support refund entitlement.</p> : <p className="mt-3 text-xs leading-relaxed text-amber-200">{electorateRead.isPending ? "Checking self-review protection..." : "Self-review protection could not be confirmed. Original V3.1 managers do not independently exclude a Member execution recipient. This UI hides recipient review controls, but does not patch the contract; use a non-participating execution wallet for legacy pilots."}</p>}
    {plan.status === 1 ? <p className="mt-4 text-sm text-slate-300">Proof deadline: <strong className="text-white">{formatDateTimeFromUnix(plan.proofDeadline)}</strong>{remaining > 0n ? ` (${formatRemaining(remaining)} active Community time left)` : " (deadline elapsed)"}.</p> : null}
    {(plan.status === 2 || plan.status === 4) && review ? <div className="mt-4 rounded-xl border border-white/10 bg-[#313443]/70 p-4 text-sm text-slate-300"><p>Proof: <span className="break-all font-mono text-xs text-cyan-100">{review.evidenceHash}</span></p><p className="mt-2">Review closes: <strong className="text-white">{formatDateTimeFromUnix(review.closesAt)}</strong>{remaining > 0n ? ` (${formatRemaining(remaining)} left)` : " (ready to finalize)"}.</p><p className="mt-2">Approve {formatCommunityUsdc(review.approvingWeight)} / Reject {formatCommunityUsdc(review.rejectingWeight)} USDC · {review.approvingAddresses.toString()} approvers · {review.participatingAddresses.toString()} reviewers.</p></div> : null}
    {plan.status === 3 && review ? <p className="mt-4 text-sm text-amber-100">The first proof did not pass. The execution recipient can submit one corrected proof after {formatDateTimeFromUnix(review.correctionAvailableAt)}.</p> : null}
    {paused ? <p className="mt-4 rounded-xl border border-amber-300/25 bg-amber-400/10 p-3 text-xs text-amber-100">Community time is frozen while paused. Proof and review deadlines do not advance.</p> : null}
    {plan.status === 7 ? <CommunityTranchePayment hub={hub} manager={manager} planId={plan.proposalId} /> : null}
    <div className="mt-5 flex flex-wrap gap-2">
      {plan.status === 1 && isRecipient ? <><input value={evidenceHash} onChange={(event) => setEvidenceHash(event.target.value)} placeholder="0x... 32-byte evidence hash" className="min-w-[260px] flex-1 rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2.5 text-sm text-white outline-none" /><button disabled={!validHash || actionBusy || paused} onClick={submit} className="rounded-full bg-cyan-300 px-4 py-2 text-sm font-bold text-slate-950 disabled:opacity-40"><FaFileShield className="mr-1 inline" /> Submit proof</button></> : null}
      {plan.status === 1 && !isRecipient && time > plan.proofDeadline ? <button disabled={actionBusy || paused} onClick={fail} className="rounded-full border border-rose-300/40 px-4 py-2 text-sm font-bold text-rose-100 disabled:opacity-40">Fail expired plan</button> : null}
      {(plan.status === 2 || plan.status === 4) && !isRecipient && recipientRead.isSuccess && choiceRead.data === 0 ? <><button disabled={actionBusy || paused || remaining <= 0n} onClick={() => cast(true)} className="rounded-full bg-emerald-300 px-4 py-2 text-sm font-bold text-slate-950 disabled:opacity-40"><FaCheckDouble className="mr-1 inline" /> Approve proof</button><button disabled={actionBusy || paused || remaining <= 0n} onClick={() => cast(false)} className="rounded-full border border-rose-300/40 px-4 py-2 text-sm font-bold text-rose-100 disabled:opacity-40">Reject proof</button></> : null}
      {(plan.status === 2 || plan.status === 4) && remaining <= 0n ? <button disabled={actionBusy || paused} onClick={finalize} className="rounded-full border border-cyan-300/40 px-4 py-2 text-sm font-bold text-cyan-100 disabled:opacity-40">Finalize review</button> : null}
      {plan.status === 3 && isRecipient && review && time >= review.correctionAvailableAt ? <button disabled={actionBusy || paused} onClick={correct} className="rounded-full border border-amber-300/40 px-4 py-2 text-sm font-bold text-amber-100 disabled:opacity-40"><FaRotate className="mr-1 inline" /> Open correction</button> : null}
      {plan.status === 6 ? <button disabled={actionBusy} onClick={claim} className="rounded-full border border-cyan-300/40 px-4 py-2 text-sm font-bold text-cyan-100 disabled:opacity-40">Claim failed-plan refund</button> : null}
    </div>
    {plan.status === 1 && isRecipient ? <p className="mt-3 text-xs text-slate-400"><FaCircleInfo className="mr-1 inline" /> Submit an immutable content hash for the full evidence bundle. Put multiple links, artefacts and explanations inside that bundle rather than losing evidence in a short form field.</p> : null}
    {write.error ? <div className="mt-3 text-xs text-rose-200"><p>{communityErrorMessage(write.error)}</p>{technical ? <details className="mt-1 text-slate-400"><summary className="cursor-pointer">Technical details</summary><p className="mt-1 break-all">{technical}</p></details> : null}</div> : null}
  </article>;
}

function PanelShell({ title, children }: { title: string; children: ReactNode }) {
  return <section className="rounded-[28px] border border-cyan-300/20 bg-[linear-gradient(135deg,rgba(8,47,73,0.5),rgba(42,45,59,0.96))] p-6"><p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-200">Community delivery safeguards</p><h2 className="mt-2 text-2xl font-semibold text-white">{title}</h2><div className="mt-4">{children}</div></section>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-white/10 bg-slate-950/20 p-3"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-sm font-semibold text-white">{value}</p></div>;
}

function formatRemaining(seconds: bigint) {
  const normalized = seconds < 0n ? 0n : seconds;
  return `${(normalized / 3_600n).toString()}h ${((normalized % 3_600n) / 60n).toString()}m`;
}
