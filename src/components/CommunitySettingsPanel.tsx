"use client";

import { formatUnits } from "viem";
import { useReadContracts } from "wagmi";

import { communityHubAbi } from "@/lib/community-contracts";

/** Displays immutable CommunityHub economics and timing parameters from chain. */
export function CommunitySettingsPanel({ hub }: { hub: `0x${string}` }) {
  const config = useReadContracts({
    contracts: [
      "entryStakeUSDC", "proposalBondUSDC", "voteMinStakeUSDC", "membershipExitCooldown",
      "validatorApprovalThreshold", "adminApprovalThreshold", "binaryRejectionFeeBps",
      "validatorRewardShareBps", "validationWindow", "binaryVotingDuration", "roundVotingDuration",
      "validatorRewardEpoch", "validatorActiveThresholdBps", "validatorProposalPointsThreshold",
    ].map((functionName) => ({ address: hub, abi: communityHubAbi, functionName })) as never,
  });

  const values = (config.data ?? []).map((item) => item.result) as (bigint | undefined)[];
  if (config.isLoading) return <p className="mt-5 text-sm text-slate-400">Loading immutable Community settings...</p>;
  if (config.error || values.some((value) => value === undefined)) return <p className="mt-5 text-sm text-amber-100">Community settings could not be read from the deployed Hub.</p>;

  const [entryStake, bond, minimumVote, exitCooldown, validatorThreshold, adminQuorum, noFee, validatorShare, validationWindow, binaryDuration, slateDuration, rewardEpoch, activityThreshold, pointThreshold] = values as bigint[];
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
    ["Admin withdrawal quorum", adminQuorum.toString()],
    ["NO rejection fee", formatBps(noFee)],
    ["Validator reward share", formatBps(validatorShare)],
    ["Validator activity", formatBps(activityThreshold)],
    ["Validator role threshold", `${pointThreshold.toString()} proposal points`],
  ];

  return <details className="mt-6 rounded-2xl border border-white/10 bg-slate-950/20 p-4">
    <summary className="cursor-pointer list-none text-sm font-semibold text-cyan-100 marker:hidden">
      <span className="flex items-center justify-between gap-4">Community rules and economics <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">View all settings</span></span>
    </summary>
    <p className="mt-3 text-sm text-slate-400">These values are immutable for this deployed Community and are read directly from CommunityHub.</p>
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
