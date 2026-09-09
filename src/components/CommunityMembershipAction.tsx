"use client";

import { useEffect } from "react";
import { formatUnits } from "viem";
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";

import { usdcAbi } from "@/lib/contracts";
import { communityHubAbi, communityTreasuryAbi } from "@/lib/community-contracts";
import { communityErrorMessage } from "@/lib/community-errors";
import { useCommunityClock } from "@/lib/use-community-clock";

type MemberInfo = {
  active: boolean;
  joinedAt: bigint;
  exitRequestedAt: bigint;
  membershipStake: bigint;
  proposalPoints: bigint;
};

/** Community entry and exit workspace backed by the Hub's pause-adjusted Community clock. */
export function CommunityMembershipAction({
  hub,
  treasury,
  hasGovernanceRole,
}: {
  hub: `0x${string}`;
  treasury: `0x${string}`;
  hasGovernanceRole: boolean;
}) {
  const { address, chainId } = useAccount();
  const memberRead = useReadContract({ address: hub, abi: communityHubAbi, functionName: "getMember", args: address ? [address] : undefined, chainId, query: { enabled: Boolean(address), refetchInterval: 1_000 } });
  const usdcRead = useReadContract({ address: treasury, abi: communityTreasuryAbi, functionName: "usdc", chainId });
  const stakeRead = useReadContract({ address: hub, abi: communityHubAbi, functionName: "entryStakeUSDC", chainId });
  const cooldownRead = useReadContract({ address: hub, abi: communityHubAbi, functionName: "membershipExitCooldown", chainId });
  const pointsThresholdRead = useReadContract({ address: hub, abi: communityHubAbi, functionName: "validatorProposalPointsThreshold", chainId });
  const { communityTime, paused } = useCommunityClock(hub, chainId);
  const locksRead = useReadContract({ address: hub, abi: communityHubAbi, functionName: "unresolvedVoteLockCount", args: address ? [address] : undefined, chainId, query: { enabled: Boolean(address), refetchInterval: 1_000 } });
  const proposalsRead = useReadContract({ address: hub, abi: communityHubAbi, functionName: "activeMemberProposalCount", args: address ? [address] : undefined, chainId, query: { enabled: Boolean(address), refetchInterval: 1_000 } });
  const allowanceRead = useReadContract({
    address: usdcRead.data,
    abi: usdcAbi,
    functionName: "allowance",
    args: address && usdcRead.data ? [address, treasury] : undefined,
    chainId,
    query: { enabled: Boolean(address && usdcRead.data) },
  });
  const balanceRead = useReadContract({
    address: usdcRead.data,
    abi: usdcAbi,
    functionName: "balanceOf",
    args: address && usdcRead.data ? [address] : undefined,
    chainId,
    query: { enabled: Boolean(address && usdcRead.data) },
  });
  const approval = useWriteContract();
  const join = useWriteContract();
  const requestExit = useWriteContract();
  const finalizeExit = useWriteContract();
  const approvalReceipt = useWaitForTransactionReceipt({ hash: approval.data });
  const joinReceipt = useWaitForTransactionReceipt({ hash: join.data });
  const requestExitReceipt = useWaitForTransactionReceipt({ hash: requestExit.data });
  const finalizeExitReceipt = useWaitForTransactionReceipt({ hash: finalizeExit.data });

  useEffect(() => {
    if (approvalReceipt.isSuccess) void allowanceRead.refetch();
  }, [allowanceRead, approvalReceipt.isSuccess]);

  useEffect(() => {
    if (joinReceipt.isSuccess || requestExitReceipt.isSuccess) {
      window.setTimeout(() => window.location.reload(), 500);
    }
  }, [joinReceipt.isSuccess, requestExitReceipt.isSuccess]);

  useEffect(() => {
    if (finalizeExitReceipt.isSuccess) {
      // Keep the success state visible before the workspace reloads its role-dependent sections.
      window.setTimeout(() => window.location.reload(), 1_800);
    }
  }, [finalizeExitReceipt.isSuccess]);

  if (!address) {
    return <section className="rounded-[28px] border border-white/10 bg-[#2a2d3b] p-5 sm:p-6"><p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Membership & entry stake</p><h2 className="mt-2 text-2xl font-semibold text-white">Connect a wallet to join.</h2><p className="mt-2 text-sm text-slate-300">Membership status and entry-stake actions are always read from this Community&apos;s Hub.</p></section>;
  }

  if (hasGovernanceRole) {
    return <section className="rounded-[28px] border border-cyan-300/20 bg-cyan-400/5 p-5 sm:p-6"><p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-200">Membership & entry stake</p><h2 className="mt-2 text-2xl font-semibold text-white">Governance role active.</h2><p className="mt-2 text-sm text-cyan-100">Admin and Validator roles are exclusive from membership. This wallet has no entry stake locked in this Community.</p></section>;
  }

  const member = memberRead.data as MemberInfo | undefined;
  const stake = stakeRead.data as bigint | undefined;
  const usdc = usdcRead.data;
  const cooldown = cooldownRead.data as bigint | undefined;
  const pointsThreshold = pointsThresholdRead.data as bigint | undefined;
  const entryBusy = approval.isPending || approvalReceipt.isLoading || join.isPending || joinReceipt.isLoading;
  const exitBusy = requestExit.isPending || requestExitReceipt.isLoading || finalizeExit.isPending || finalizeExitReceipt.isLoading;
  const error = approval.error ?? join.error ?? requestExit.error ?? finalizeExit.error;

  if (member?.active) {
    const exitRequested = member.exitRequestedAt !== 0n;
    const availableAt = exitRequested && cooldown !== undefined ? member.exitRequestedAt + cooldown : undefined;
    const cooldownReady = availableAt !== undefined && communityTime !== undefined && communityTime >= availableAt;
    const remaining = availableAt !== undefined && communityTime !== undefined && communityTime < availableAt ? availableAt - communityTime : 0n;
    const cooldownProgress = exitRequested && cooldown && communityTime !== undefined
      ? Math.min(100, Number(((communityTime - member.exitRequestedAt) * 100n) / cooldown))
      : 0;
    const voteLocks = (locksRead.data as bigint | undefined) ?? 0n;
    const activeProposals = (proposalsRead.data as bigint | undefined) ?? 0n;
    const exitBlocked = voteLocks > 0n || activeProposals > 0n;
    const readyToReturn = exitRequested && cooldownReady && !exitBlocked && !paused;

    return <section className="overflow-hidden rounded-[28px] border border-emerald-300/25 bg-[linear-gradient(135deg,rgba(6,78,59,0.33),rgba(42,45,59,0.96)_55%,rgba(20,83,45,0.2))] p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-200">Membership & entry stake</p><h2 className="mt-2 text-2xl font-semibold text-white">Your stake has a clear exit path.</h2><p className="mt-2 max-w-2xl text-sm text-emerald-50/80">The full entry stake returns directly to this wallet only after the on-chain cooldown and all governance locks clear.</p></div>
        <span className="rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-emerald-100">Active member</span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Metric label="Locked entry stake" value={`${formatUnits(member.membershipStake, 6)} USDC`} tone="emerald" />
        <Metric label="Proposal points" value={`${member.proposalPoints.toString()} / ${pointsThreshold?.toString() ?? "-"}`} tone="default" />
        <Metric label="Exit state" value={!exitRequested ? "Not requested" : readyToReturn ? "Ready to return" : paused ? "Paused" : "In progress"} tone={readyToReturn ? "emerald" : "default"} />
      </div>

      {paused ? <p className="mt-4 rounded-xl border border-amber-300/25 bg-amber-400/10 p-3 text-sm text-amber-100">Community is paused. The exit clock and stake return are frozen until an Admin resumes the Community.</p> : null}

      {!exitRequested ? <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/20 p-4"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm font-semibold text-white">Step 1 of 3 · Start exit</p><p className="mt-1 text-sm text-slate-300">This starts the local cooldown. It does not send USDC yet.</p></div><button disabled={paused || exitBusy} onClick={() => requestExit.writeContract({ address: hub, abi: communityHubAbi, functionName: "requestMembershipExit" })} className="rounded-full border border-emerald-300/45 px-4 py-2.5 text-sm font-bold text-emerald-50 disabled:opacity-40">{exitBusy ? "Requesting exit..." : "Request membership exit"}</button></div></div> : <div className="mt-5 space-y-3">
        <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-semibold text-white">Step 2 of 3 · Cooldown</p><p className="mt-1 text-sm text-slate-300">{cooldownReady ? "Cooldown complete. The stake can move once there are no blockers." : `Remaining active Community time: ${formatRemaining(remaining)}.`}</p></div><span className={cooldownReady ? "rounded-full bg-emerald-300 px-3 py-1 text-xs font-bold text-slate-950" : "rounded-full border border-white/10 px-3 py-1 text-xs font-bold text-slate-300"}>{cooldownReady ? "Complete" : `${cooldownProgress}%`}</span></div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-emerald-300 transition-[width] duration-500" style={{ width: `${cooldownProgress}%` }} /></div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-4">
          <p className="text-sm font-semibold text-white">Step 3 of 3 · Clear governance locks</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2"><LockState label="Uncleared vote locks" value={voteLocks} description={voteLocks === 0n ? "No vote locks remain." : "Settle the relevant vote or round, then use Clear settled vote lock."} /><LockState label="Active member proposals" value={activeProposals} description={activeProposals === 0n ? "No member proposals block exit." : "Finish validation and settlement of your active proposal."} /></div>
        </div>

        <div className={readyToReturn ? "rounded-2xl border border-emerald-300/35 bg-emerald-400/10 p-4" : "rounded-2xl border border-white/10 bg-slate-950/20 p-4"}>
          <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm font-semibold text-white">Return to wallet</p><p className="mt-1 text-sm text-slate-300">{readyToReturn ? `All conditions are met. Return ${formatUnits(member.membershipStake, 6)} USDC now.` : paused ? "Unavailable while Community is paused." : exitBlocked ? "Resolve the listed governance locks first." : "This action unlocks after the active-time cooldown."}</p></div><button disabled={!readyToReturn || exitBusy} onClick={() => finalizeExit.writeContract({ address: hub, abi: communityHubAbi, functionName: "finalizeMembershipExit" })} className="rounded-full bg-emerald-300 px-4 py-2.5 text-sm font-bold text-slate-950 disabled:opacity-40">{exitBusy ? "Returning stake..." : `Return ${formatUnits(member.membershipStake, 6)} USDC`}</button></div>
        </div>
      </div>}
      {finalizeExitReceipt.isSuccess ? <p className="mt-4 rounded-xl border border-emerald-300/35 bg-emerald-400/15 p-3 text-sm font-semibold text-emerald-100">Entry stake returned to your wallet. Refreshing the Community workspace...</p> : null}
      {error ? <p className="mt-4 rounded-xl border border-rose-300/30 bg-rose-400/10 p-3 text-sm text-rose-100">{communityErrorMessage(error)}</p> : null}
    </section>;
  }

  const approved = stake !== undefined && (allowanceRead.data as bigint | undefined) !== undefined && (allowanceRead.data as bigint) >= stake;
  const balanceEnough = stake !== undefined && ((balanceRead.data as bigint | undefined) ?? 0n) >= stake;
  return <section className="rounded-[28px] border border-amber-300/25 bg-[linear-gradient(145deg,rgba(120,53,15,0.2),rgba(42,45,59,0.96))] p-5 sm:p-6"><p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-100">Membership & entry stake</p><h2 className="mt-2 text-2xl font-semibold text-white">Join this Community.</h2><p className="mt-2 text-sm text-slate-300">Lock <strong>{stake === undefined ? "..." : `${formatUnits(stake, 6)} USDC`}</strong> to vote and submit member proposals. The exit path is shown here after joining.</p>{paused ? <p className="mt-4 rounded-xl border border-amber-300/25 bg-amber-400/10 p-3 text-sm text-amber-100">Joining is unavailable while the Community is paused.</p> : null}{!balanceEnough && stake !== undefined ? <p className="mt-4 text-sm text-rose-200">This wallet does not hold enough USDC for the entry stake.</p> : null}<div className="mt-5 flex flex-wrap gap-2">{!approved ? <button disabled={paused || !usdc || stake === undefined || !balanceEnough || entryBusy} onClick={() => { if (usdc && stake !== undefined) approval.writeContract({ address: usdc, abi: usdcAbi, functionName: "approve", args: [treasury, stake] }); }} className="rounded-full border border-amber-200/50 px-4 py-2.5 text-sm font-bold text-amber-50 disabled:opacity-40">{entryBusy ? "Approving entry stake..." : "1. Approve entry stake"}</button> : null}<button disabled={paused || !approved || entryBusy} onClick={() => join.writeContract({ address: hub, abi: communityHubAbi, functionName: "joinCommunity" })} className="rounded-full bg-cyan-300 px-4 py-2.5 text-sm font-bold text-slate-950 disabled:opacity-40">{entryBusy ? "Joining..." : "2. Join Community"}</button></div>{error ? <p className="mt-4 rounded-xl border border-rose-300/30 bg-rose-400/10 p-3 text-sm text-rose-100">{communityErrorMessage(error)}</p> : null}</section>;
}

function Metric({ label, value, tone }: { label: string; value: string; tone: "emerald" | "default" }) {
  return <div className="rounded-xl border border-white/10 bg-slate-950/20 p-3"><p className="text-xs text-slate-500">{label}</p><p className={tone === "emerald" ? "mt-1 font-semibold text-emerald-100" : "mt-1 font-semibold text-white"}>{value}</p></div>;
}

function LockState({ label, value, description }: { label: string; value: bigint; description: string }) {
  const clear = value === 0n;
  return <div className={clear ? "rounded-xl border border-emerald-300/20 bg-emerald-400/5 p-3" : "rounded-xl border border-amber-300/20 bg-amber-400/5 p-3"}><div className="flex items-center justify-between gap-2"><p className="text-xs font-semibold text-slate-200">{label}</p><span className={clear ? "rounded-full bg-emerald-300 px-2 py-0.5 text-xs font-bold text-slate-950" : "rounded-full bg-amber-300 px-2 py-0.5 text-xs font-bold text-slate-950"}>{clear ? "Clear" : value.toString()}</span></div><p className="mt-2 text-xs leading-relaxed text-slate-400">{description}</p></div>;
}

function formatRemaining(seconds: bigint) {
  return `${(seconds / 60n).toString()}m ${(seconds % 60n).toString()}s`;
}
