"use client";

import { formatUnits } from "viem";
import { useReadContract, useReadContracts } from "wagmi";

import { communityHubAbi, communityMembershipModuleAbi, communityMilestoneAbi, communityProposalModuleAbi, communityVotingModuleAbi } from "@/lib/community-contracts";
import { useCommunityModules } from "@/lib/use-community-modules";

/** Displays immutable CommunityHub economics and timing parameters from chain. */
export function CommunitySettingsPanel({ hub }: { hub: `0x${string}` }) {
  const moduleRead = useCommunityModules(hub);
  const { membership, proposal, voting, milestone } = moduleRead.modules;
  const adminQuorumRead = useReadContract({ address: hub, abi: communityHubAbi, functionName: "adminApprovalThreshold" });
  const config = useReadContracts({
    contracts: membership && proposal && voting ? [
      { address: membership, abi: communityMembershipModuleAbi, functionName: "entryStakeUSDC" },
      { address: proposal, abi: communityProposalModuleAbi, functionName: "proposalBondUSDC" },
      { address: voting, abi: communityVotingModuleAbi, functionName: "voteMinStakeUSDC" },
      { address: membership, abi: communityMembershipModuleAbi, functionName: "membershipExitCooldown" },
      { address: proposal, abi: communityProposalModuleAbi, functionName: "validatorApprovalThreshold" },
      { address: voting, abi: communityVotingModuleAbi, functionName: "binaryRejectionFeeBps" },
      { address: voting, abi: communityVotingModuleAbi, functionName: "validatorRewardShareBps" },
      { address: proposal, abi: communityProposalModuleAbi, functionName: "validationWindow" },
      { address: voting, abi: communityVotingModuleAbi, functionName: "binaryVotingDuration" },
      { address: voting, abi: communityVotingModuleAbi, functionName: "roundVotingDuration" },
      { address: proposal, abi: communityProposalModuleAbi, functionName: "validatorRewardEpoch" },
      { address: proposal, abi: communityProposalModuleAbi, functionName: "validatorActiveThresholdBps" },
      { address: membership, abi: communityMembershipModuleAbi, functionName: "validatorProposalPointsThreshold" },
    ] : [],
  });
  const milestoneConfig = useReadContracts({
    contracts: milestone
      ? (["executionRecipient", "reviewDuration", "proofDuration"] as const).map((functionName) => ({
          address: milestone,
          abi: communityMilestoneAbi,
          functionName,
        }))
      : [],
  });

  const values = (config.data ?? []).map((item) => item.result) as (bigint | undefined)[];
  if (config.isLoading || moduleRead.isLoading || milestoneConfig.isLoading) return <p className="mt-5 text-sm text-slate-400">Loading immutable Community settings...</p>;
  if (config.error || moduleRead.error || values.length !== 13 || values.some((value) => value === undefined)) return <p className="mt-5 text-sm text-amber-100">Community settings could not be read from the deployed modules.</p>;

  const [entryStake, bond, minimumVote, exitCooldown, validatorThreshold, noFee, validatorShare, validationWindow, binaryDuration, slateDuration, rewardEpoch, activityThreshold, pointThreshold] = values as bigint[];
  const [executionRecipient, reviewDuration, proofDuration] = (milestoneConfig.data ?? []).map((item) => item.result) as [string | undefined, bigint | undefined, bigint | undefined];
  const rows = [
    ["Entry stake", `${formatUsdc(entryStake)} USDC`],
    ["Member proposal bond", `${formatUsdc(bond)} USDC`],
    ["Minimum vote", `${formatUsdc(minimumVote)} USDC`],
    ["Maximum single vote", "10,000 USDC"],
    ["Exit cooldown", formatDuration(exitCooldown)],
    ["Validation window", formatDuration(validationWindow)],
    ["Binary voting", formatDuration(binaryDuration)],
    ["Slate voting", formatDuration(slateDuration)],
    ["Validator reward epoch", formatDuration(rewardEpoch)],
    ["Validator approvals", validatorThreshold.toString()],
    ["Admin withdrawal quorum", (adminQuorumRead.data as bigint | undefined)?.toString() ?? "Unavailable"],
    ["NO rejection fee", formatBps(noFee)],
    ["Validator reward share", formatBps(validatorShare)],
    ["Validator activity", formatBps(activityThreshold)],
    ["Validator role threshold", `${pointThreshold.toString()} proposal points`],
    ["Administration execution wallet", executionRecipient ? `${executionRecipient.slice(0, 8)}...${executionRecipient.slice(-6)}` : "Unavailable"],
    ["Milestone review", reviewDuration ? formatDuration(reviewDuration) : "Unavailable"],
    ["Proof deadline", proofDuration ? formatDuration(proofDuration) : "Unavailable"],
  ];

  return <details className="mt-6 rounded-2xl border border-white/10 bg-slate-950/20 p-4">
    <summary className="cursor-pointer list-none text-sm font-semibold text-cyan-100 marker:hidden">
      <span className="flex items-center justify-between gap-4">Community rules and economics <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">View all settings</span></span>
    </summary>
    <p className="mt-3 text-sm text-slate-400">These immutable values are read from this Hub&apos;s dedicated Membership, Proposal, Voting and Milestone modules.</p>
    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {rows.map(([label, value]) => <Metric key={label} label={label} value={value} />)}
    </div>
  </details>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-white/10 bg-[#313443]/70 p-3"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-sm font-semibold text-slate-100">{value}</p></div>;
}

function formatUsdc(value: bigint) {
  const formatted = formatUnits(value, 6);
  const [whole, fraction] = formatted.split(".");
  return fraction ? `${whole}.${fraction.slice(0, 2).replace(/0+$/, "")}`.replace(/\.$/, "") : whole;
}

function formatBps(value: bigint) {
  const whole = value / 100n;
  const fraction = value % 100n;
  return fraction === 0n ? `${whole.toString()}%` : `${whole.toString()}.${fraction.toString().padStart(2, "0")}%`;
}

function formatDuration(seconds: bigint) {
  if (seconds === 0n) return "0 minutes";
  if (seconds % 86_400n === 0n) return `${(seconds / 86_400n).toString()} day${seconds === 86_400n ? "" : "s"}`;
  if (seconds % 3_600n === 0n) return `${(seconds / 3_600n).toString()} hour${seconds === 3_600n ? "" : "s"}`;
  if (seconds % 60n === 0n) return `${(seconds / 60n).toString()} min`;
  return `${seconds.toString()} sec`;
}
