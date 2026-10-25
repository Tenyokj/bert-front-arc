"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { formatUnits } from "viem";
import { useAccount, usePublicClient, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";

import { popVerifierAbi, usdcAbi } from "@/lib/contracts";
import { communityHubAbi, communityMembershipModuleAbi, communityTreasuryAbi, communityVotingModuleAbi } from "@/lib/community-contracts";
import { communityErrorMessage } from "@/lib/community-errors";
import { useCommunityClock } from "@/lib/use-community-clock";
import { useCommunityModules } from "@/lib/use-community-modules";
import { confirmWalletAction } from "@/lib/wallet-action";

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
  const client = usePublicClient({ chainId });
  const actionLock = useRef(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState<unknown>(null);
  const moduleRead = useCommunityModules(hub, chainId);
  const membershipModule = moduleRead.modules.membership;
  const verifierRead = useReadContract({ address: membershipModule, abi: communityMembershipModuleAbi, functionName: "humanVerifier", chainId, query: { enabled: Boolean(membershipModule) } });
  const verificationRead = useReadContract({ address: verifierRead.data, abi: popVerifierAbi, functionName: "isVerifiedHuman", args: address ? [address] : undefined, chainId, query: { enabled: Boolean(address && verifierRead.data), refetchInterval: 5_000 } });
  const memberRead = useReadContract({ address: hub, abi: communityHubAbi, functionName: "getMember", args: address ? [address] : undefined, chainId, query: { enabled: Boolean(address), refetchInterval: 1_000 } });
  const usdcRead = useReadContract({ address: treasury, abi: communityTreasuryAbi, functionName: "usdc", chainId });
  const stakeRead = useReadContract({ address: membershipModule, abi: communityMembershipModuleAbi, functionName: "entryStakeUSDC", chainId, query: { enabled: Boolean(membershipModule) } });
  const cooldownRead = useReadContract({ address: membershipModule, abi: communityMembershipModuleAbi, functionName: "membershipExitCooldown", chainId, query: { enabled: Boolean(membershipModule) } });
  const pointsThresholdRead = useReadContract({ address: hub, abi: communityHubAbi, functionName: "validatorProposalPointsThreshold", chainId });
  const { communityTime, paused } = useCommunityClock(hub, chainId);
  const obligationsRead = useReadContract({ address: membershipModule, abi: communityMembershipModuleAbi, functionName: "unresolvedObligationCount", args: address ? [address] : undefined, chainId, query: { enabled: Boolean(address && membershipModule), refetchInterval: 1_000 } });
  const voteLocksRead = useReadContract({ address: moduleRead.modules.voting, abi: communityVotingModuleAbi, functionName: "hasExitBlockingObligation", args: address ? [address] : undefined, chainId, query: { enabled: Boolean(address && moduleRead.modules.voting), refetchInterval: 1_000 } });
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
  const approvalReceipt = useWaitForTransactionReceipt({ hash: approval.data, chainId });
  const joinReceipt = useWaitForTransactionReceipt({ hash: join.data, chainId });
  const requestExitReceipt = useWaitForTransactionReceipt({ hash: requestExit.data, chainId });
  const finalizeExitReceipt = useWaitForTransactionReceipt({ hash: finalizeExit.data, chainId });

  useEffect(() => {
    if (approvalReceipt.data?.status === "success") void allowanceRead.refetch();
  }, [allowanceRead, approvalReceipt.data?.status]);

  useEffect(() => {
    if (joinReceipt.data?.status === "success" || requestExitReceipt.data?.status === "success") {
      const timer = window.setTimeout(() => window.location.reload(), 500);
      return () => window.clearTimeout(timer);
    }
  }, [joinReceipt.data?.status, requestExitReceipt.data?.status]);

  useEffect(() => {
    if (finalizeExitReceipt.data?.status === "success") {
      // Keep the success state visible before the workspace reloads its role-dependent sections.
      const timer = window.setTimeout(() => window.location.reload(), 1_800);
      return () => window.clearTimeout(timer);
    }
  }, [finalizeExitReceipt.data?.status]);

  async function runAction(action: "approve" | "joinCommunity" | "requestMembershipExit" | "finalizeMembershipExit") {
    if (actionLock.current || !address || !client || !chainId) return;
    actionLock.current = true;
    setActionBusy(true);
    setActionError(null);
    approval.reset(); join.reset(); requestExit.reset(); finalizeExit.reset();
    try {
      if (client.chain?.id !== chainId) throw new Error("Wallet and read client must use the same network.");
      await confirmWalletAction({
        isApplied: async () => {
          if (action === "approve") {
            if (!usdcRead.data || stakeRead.data === undefined) throw new Error("Entry stake is still loading.");
            const allowance = await client.readContract({ address: usdcRead.data, abi: usdcAbi, functionName: "allowance", args: [address, treasury] });
            return allowance >= stakeRead.data;
          }
          const current = await client.readContract({ address: hub, abi: communityHubAbi, functionName: "getMember", args: [address] });
          return action === "joinCommunity" ? current.active : action === "requestMembershipExit" ? current.exitRequestedAt > 0n : !current.active;
        },
        send: async () => {
          if (action === "approve") {
            if (!usdcRead.data || stakeRead.data === undefined) throw new Error("Entry stake is still loading.");
            const { request } = await client.simulateContract({ account: address, address: usdcRead.data, abi: usdcAbi, functionName: "approve", args: [treasury, stakeRead.data] });
            return approval.writeContractAsync({ ...request, chainId });
          }
          const { request } = await client.simulateContract({ account: address, address: hub, abi: communityHubAbi, functionName: action });
          const writer = action === "joinCommunity" ? join : action === "requestMembershipExit" ? requestExit : finalizeExit;
          return writer.writeContractAsync({ ...request, chainId });
        },
        wait: (hash) => client.waitForTransactionReceipt({ hash, timeout: 60_000 }),
      });
      if (action === "approve") await allowanceRead.refetch();
      else window.location.reload();
    } catch (error) {
      setActionError(error);
    } finally {
      actionLock.current = false;
      setActionBusy(false);
    }
  }

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
  const entryBusy = actionBusy || approval.isPending || approvalReceipt.isLoading || join.isPending || joinReceipt.isLoading;
  const exitBusy = actionBusy || requestExit.isPending || requestExitReceipt.isLoading || finalizeExit.isPending || finalizeExitReceipt.isLoading;
  const error = actionError;

  if (member?.active) {
    const exitRequested = member.exitRequestedAt !== 0n;
    const availableAt = exitRequested && cooldown !== undefined ? member.exitRequestedAt + cooldown : undefined;
    const cooldownReady = availableAt !== undefined && communityTime !== undefined && communityTime >= availableAt;
    const remaining = availableAt !== undefined && communityTime !== undefined && communityTime < availableAt ? availableAt - communityTime : 0n;
    const cooldownProgress = exitRequested && cooldown && communityTime !== undefined
      ? Math.min(100, Number(((communityTime - member.exitRequestedAt) * 100n) / cooldown))
      : 0;
    const obligations = obligationsRead.data;
    const voteLocks = voteLocksRead.data;
    const locksLoaded = obligationsRead.data !== undefined && voteLocksRead.data !== undefined;
    const exitBlocked = !locksLoaded || (obligations ?? 0n) > 0n || voteLocks === true;
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

      {!exitRequested ? <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/20 p-4"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm font-semibold text-white">Step 1 of 3 · Start exit</p><p className="mt-1 text-sm text-slate-300">This starts the local cooldown. It does not send USDC yet.</p></div><button disabled={paused || exitBusy} onClick={() => void runAction("requestMembershipExit")} className="rounded-full border border-emerald-300/45 px-4 py-2.5 text-sm font-bold text-emerald-50 disabled:opacity-40">{exitBusy ? "Requesting exit..." : "Request membership exit"}</button></div></div> : <div className="mt-5 space-y-3">
        <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-semibold text-white">Step 2 of 3 · Cooldown</p><p className="mt-1 text-sm text-slate-300">{cooldownReady ? "Cooldown complete. The stake can move once there are no blockers." : `Remaining active Community time: ${formatRemaining(remaining)}.`}</p></div><span className={cooldownReady ? "rounded-full bg-emerald-300 px-3 py-1 text-xs font-bold text-slate-950" : "rounded-full border border-white/10 px-3 py-1 text-xs font-bold text-slate-300"}>{cooldownReady ? "Complete" : `${cooldownProgress}%`}</span></div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-emerald-300 transition-[width] duration-500" style={{ width: `${cooldownProgress}%` }} /></div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-4">
          <p className="text-sm font-semibold text-white">Step 3 of 3 · Clear governance locks</p>
          <div className="mt-3"><LockState label="Unresolved governance obligations" value={obligations} description={obligations === undefined ? "Checking proposal-author obligations." : obligations === 0n ? "No proposal-author obligation blocks exit." : "Resolve the relevant member proposal before finalizing exit."} /></div>
          <div className="mt-3"><LockState label="Vote and milestone exit block" value={voteLocks} description={!locksLoaded ? "Checking on-chain locks. Stake return stays disabled until both modules respond." : !voteLocks ? "No voting-module lock blocks exit." : "Complete the delivery or claim your failed-plan refund, then clear each settled vote lock."} /></div>
        </div>

        <div className={readyToReturn ? "rounded-2xl border border-emerald-300/35 bg-emerald-400/10 p-4" : "rounded-2xl border border-white/10 bg-slate-950/20 p-4"}>
          <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm font-semibold text-white">Return to wallet</p><p className="mt-1 text-sm text-slate-300">{readyToReturn ? `All conditions are met. Return ${formatUnits(member.membershipStake, 6)} USDC now.` : paused ? "Unavailable while Community is paused." : exitBlocked ? "Resolve the listed governance locks first." : "This action unlocks after the active-time cooldown."}</p></div><button disabled={!readyToReturn || exitBusy} onClick={() => void runAction("finalizeMembershipExit")} className="rounded-full bg-emerald-300 px-4 py-2.5 text-sm font-bold text-slate-950 disabled:opacity-40">{exitBusy ? "Returning stake..." : `Return ${formatUnits(member.membershipStake, 6)} USDC`}</button></div>
        </div>
      </div>}
      {finalizeExitReceipt.data?.status === "success" ? <p className="mt-4 rounded-xl border border-emerald-300/35 bg-emerald-400/15 p-3 text-sm font-semibold text-emerald-100">Entry stake returned to your wallet. Refreshing the Community workspace...</p> : null}
      {error ? <p className="mt-4 rounded-xl border border-rose-300/30 bg-rose-400/10 p-3 text-sm text-rose-100">{communityErrorMessage(error)}</p> : null}
    </section>;
  }

  const approved = stake !== undefined && (allowanceRead.data as bigint | undefined) !== undefined && (allowanceRead.data as bigint) >= stake;
  const balanceEnough = stake !== undefined && ((balanceRead.data as bigint | undefined) ?? 0n) >= stake;
  return <section className="rounded-[28px] border border-amber-300/25 bg-[linear-gradient(145deg,rgba(120,53,15,0.2),rgba(42,45,59,0.96))] p-5 sm:p-6"><p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-100">Membership & entry stake</p><h2 className="mt-2 text-2xl font-semibold text-white">Join this Community.</h2><p className="mt-2 text-sm text-slate-300">Lock <strong>{stake === undefined ? "..." : `${formatUnits(stake, 6)} USDC`}</strong> to vote and submit member proposals. The exit path is shown here after joining.</p>{paused ? <p className="mt-4 rounded-xl border border-amber-300/25 bg-amber-400/10 p-3 text-sm text-amber-100">Joining is unavailable while the Community is paused.</p> : null}{!balanceEnough && stake !== undefined ? <p className="mt-4 text-sm text-rose-200">This wallet does not hold enough USDC for the entry stake.</p> : null}<div className="mt-4 text-sm text-amber-100">{verificationRead.data === false ? <span>Complete <Link href="/profile" className="font-semibold underline">human verification in Profile</Link> before approving or joining.</span> : verificationRead.data !== true ? "Checking on-chain verification. Joining stays disabled until it is confirmed." : "On-chain verification confirmed."}</div><button type="button" disabled={entryBusy} onClick={() => { void memberRead.refetch(); void verificationRead.refetch(); void allowanceRead.refetch(); void balanceRead.refetch(); }} className="mt-3 text-sm font-semibold text-cyan-200 underline">Refresh on-chain membership status (read-only)</button><div className="mt-5 flex flex-wrap gap-2">{!approved ? <button disabled={paused || verificationRead.data !== true || !usdc || stake === undefined || !balanceEnough || entryBusy} onClick={() => void runAction("approve")} className="rounded-full border border-amber-200/50 px-4 py-2.5 text-sm font-bold text-amber-50 disabled:opacity-40">{entryBusy ? "Approving entry stake..." : "1. Approve entry stake"}</button> : null}<button disabled={paused || verificationRead.data !== true || !memberRead.data || !approved || !balanceEnough || entryBusy} onClick={() => void runAction("joinCommunity")} className="rounded-full bg-cyan-300 px-4 py-2.5 text-sm font-bold text-slate-950 disabled:opacity-40">{entryBusy ? "Joining..." : "2. Join Community"}</button></div>{error ? <p className="mt-4 rounded-xl border border-rose-300/30 bg-rose-400/10 p-3 text-sm text-rose-100">{communityErrorMessage(error)}</p> : null}</section>;
}

function Metric({ label, value, tone }: { label: string; value: string; tone: "emerald" | "default" }) {
  return <div className="rounded-xl border border-white/10 bg-slate-950/20 p-3"><p className="text-xs text-slate-500">{label}</p><p className={tone === "emerald" ? "mt-1 font-semibold text-emerald-100" : "mt-1 font-semibold text-white"}>{value}</p></div>;
}

function LockState({ label, value, description }: { label: string; value: bigint | boolean | undefined; description: string }) {
  const clear = value === 0n || value === false;
  return <div className={clear ? "rounded-xl border border-emerald-300/20 bg-emerald-400/5 p-3" : "rounded-xl border border-amber-300/20 bg-amber-400/5 p-3"}><div className="flex items-center justify-between gap-2"><p className="text-xs font-semibold text-slate-200">{label}</p><span className={clear ? "rounded-full bg-emerald-300 px-2 py-0.5 text-xs font-bold text-slate-950" : "rounded-full bg-amber-300 px-2 py-0.5 text-xs font-bold text-slate-950"}>{value === undefined ? "Checking" : clear ? "Clear" : value === true ? "Blocked" : value.toString()}</span></div><p className="mt-2 text-xs leading-relaxed text-slate-400">{description}</p></div>;
}

function formatRemaining(seconds: bigint) {
  return `${(seconds / 60n).toString()}m ${(seconds % 60n).toString()}s`;
}
