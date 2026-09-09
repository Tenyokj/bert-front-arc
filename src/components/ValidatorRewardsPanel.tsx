"use client";

import { useEffect, useState, type ReactNode } from "react";
import { formatUnits } from "viem";
import { useAccount, useReadContracts, useWaitForTransactionReceipt, useWriteContract } from "wagmi";

import { communityHubAbi, communityTreasuryAbi } from "@/lib/community-contracts";
import { communityErrorMessage } from "@/lib/community-errors";
import { useCommunityClock } from "@/lib/use-community-clock";

type Epoch = {
  startTime: bigint;
  endTime: bigint;
  availableValidationCases: bigint;
  rewardAmount: bigint;
  activeValidatorCount: bigint;
  finalized: boolean;
};

function normalizeEpoch(value: unknown): Epoch | null {
  if (!value || typeof value !== "object") return null;
  const tuple = value as Record<string, unknown> & readonly unknown[];
  const get = (index: number, name: string) => Array.isArray(tuple) ? tuple[index] : tuple[name];
  const startTime = get(0, "startTime");
  const endTime = get(1, "endTime");
  const availableValidationCases = get(2, "availableValidationCases");
  const rewardAmount = get(3, "rewardAmount");
  const activeValidatorCount = get(4, "activeValidatorCount");
  const finalized = get(5, "finalized");
  return typeof startTime === "bigint" && typeof endTime === "bigint" &&
    typeof availableValidationCases === "bigint" && typeof rewardAmount === "bigint" &&
    typeof activeValidatorCount === "bigint" && typeof finalized === "boolean"
    ? { startTime, endTime, availableValidationCases, rewardAmount, activeValidatorCount, finalized }
    : null;
}

function formatRemaining(seconds: bigint) {
  if (seconds <= 0n) return "ready now";
  const minutes = seconds / 60n;
  const remainder = seconds % 60n;
  return minutes > 0n ? `${minutes.toString()}m ${remainder.toString()}s` : `${remainder.toString()}s`;
}

/** Shows live, pause-aware validator epoch state and claim actions. */
export function ValidatorRewardsPanel({ hub, treasury, isValidator }: { hub: `0x${string}`; treasury: `0x${string}`; isValidator: boolean }) {
  const { address, chainId } = useAccount();
  const [selectedEpochId, setSelectedEpochId] = useState<bigint>();
  const epochIdRead = useReadContracts({
    chainId,
    contracts: [{ address: hub, abi: communityHubAbi, functionName: "currentValidatorRewardEpochId" }],
    query: { refetchInterval: 1_000 },
  });
  const currentEpochId = epochIdRead.data?.[0]?.result as bigint | undefined;
  const { communityTime, paused } = useCommunityClock(hub, chainId);

  useEffect(() => {
    if (currentEpochId && selectedEpochId === undefined) {
      setSelectedEpochId(currentEpochId > 1n ? currentEpochId - 1n : currentEpochId);
    }
  }, [currentEpochId, selectedEpochId]);

  useEffect(() => {
    if (currentEpochId && selectedEpochId && selectedEpochId + 9n < currentEpochId) {
      setSelectedEpochId(currentEpochId > 1n ? currentEpochId - 1n : currentEpochId);
    }
  }, [currentEpochId, selectedEpochId]);

  const epochId = selectedEpochId ?? currentEpochId;
  const reads = useReadContracts({
    chainId,
    contracts: epochId && address ? [
      { address: hub, abi: communityHubAbi, functionName: "getValidatorRewardEpoch", args: [epochId] },
      { address: hub, abi: communityHubAbi, functionName: "validationWindow" },
      { address: hub, abi: communityHubAbi, functionName: "validatorActiveThresholdBps" },
      { address: hub, abi: communityHubAbi, functionName: "validatorValidationCount", args: [epochId, address] },
      { address: hub, abi: communityHubAbi, functionName: "isValidatorActiveForEpoch", args: [epochId, address] },
      { address: treasury, abi: communityTreasuryAbi, functionName: "rewardAmountByEpoch", args: [epochId] },
      { address: treasury, abi: communityTreasuryAbi, functionName: "rewardPerValidatorByEpoch", args: [epochId] },
      { address: treasury, abi: communityTreasuryAbi, functionName: "validatorRewardClaimed", args: [epochId, address] },
    ] as const : [],
    query: { enabled: Boolean(epochId && address), refetchInterval: 1_000 },
  });
  const write = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash: write.data });

  useEffect(() => {
    if (receipt.isSuccess) window.setTimeout(() => window.location.reload(), 400);
  }, [receipt.isSuccess]);

  if (!isValidator) return null;
  if (!address) return <Panel><h2 className="text-2xl font-semibold text-white">Validator rewards</h2><p className="mt-2 text-sm text-slate-300">Connect the validator wallet to inspect its epoch activity and rewards.</p></Panel>;
  if (epochIdRead.isLoading || reads.isLoading) return <Panel><p className="text-sm text-slate-300">Loading validator reward epoch...</p></Panel>;
  if (!epochId || !currentEpochId || reads.error) return <section className="rounded-[28px] border border-rose-300/30 bg-rose-400/10 p-6 text-sm text-rose-100">Could not load validator reward information.</section>;

  const [epochResult, windowResult, thresholdResult, casesResult, activeResult, poolResult, rewardResult, claimedResult] = reads.data ?? [];
  const epoch = normalizeEpoch(epochResult?.result);
  const validationWindow = windowResult?.result as bigint | undefined;
  const activeThresholdBps = thresholdResult?.result as bigint | undefined;
  const cases = casesResult?.result as bigint | undefined;
  const active = activeResult?.result as boolean | undefined;
  const rewardPool = poolResult?.result as bigint | undefined;
  const reward = rewardResult?.result as bigint | undefined;
  const claimed = claimedResult?.result as boolean | undefined;
  if (!epoch || validationWindow === undefined || activeThresholdBps === undefined || communityTime === undefined) return <Panel><p className="text-sm text-slate-300">Validator epoch data is unavailable.</p></Panel>;

  const finalizationAt = epoch.endTime + validationWindow;
  const remaining = finalizationAt > communityTime ? finalizationAt - communityTime : 0n;
  const requiredCases = epoch.availableValidationCases === 0n
    ? 0n
    : (epoch.availableValidationCases * activeThresholdBps + 9_999n) / 10_000n;
  const readyToFinalize = !epoch.finalized && !paused && remaining === 0n;
  const canClaim = epoch.finalized && active && !claimed && (reward ?? 0n) > 0n;
  const epochIds = Array.from({ length: Math.min(Number(currentEpochId), 10) }, (_, index) => currentEpochId - BigInt(index));
  const statusCopy = epoch.finalized
    ? active
      ? `You are eligible. Your equal epoch share is ${formatUnits(reward ?? 0n, 6)} USDC.`
      : `This wallet completed ${cases?.toString() ?? "0"} of ${requiredCases.toString()} required validation cases and did not meet the on-chain activity threshold.`
    : paused
      ? "Community is paused. The validator epoch clock and finalization are frozen."
      : remaining === 0n
        ? "This epoch can now be finalized on-chain."
        : `Finalization becomes available in ${formatRemaining(remaining)} of active Community time.`;

  return <Panel>
    <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-200">Validator rewards</p>
    <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-2xl font-semibold text-white">Epoch #{epochId.toString()}</h2>
      <select value={epochId.toString()} onChange={(event) => setSelectedEpochId(BigInt(event.target.value))} className="rounded-xl border border-white/10 bg-slate-950/30 px-3 py-2 text-sm text-white">
        {epochIds.map((id) => <option key={id.toString()} value={id.toString()}>Epoch #{id.toString()}{id === currentEpochId ? " (current)" : ""}</option>)}
      </select>
    </div>
    <div className="mt-5 grid gap-3 sm:grid-cols-4">
      <Metric label="Your cases" value={cases?.toString() ?? "-"} />
      <Metric label="Available cases" value={epoch.availableValidationCases.toString()} />
      <Metric label="Required activity" value={`${requiredCases.toString()} cases (${formatBps(activeThresholdBps)})`} />
      <Metric label="Epoch reward pool" value={`${formatUnits(rewardPool ?? epoch.rewardAmount, 6)} USDC`} />
    </div>
    <p className="mt-4 text-sm text-slate-300">{statusCopy}</p>
    {currentEpochId > 10n ? <p className="mt-2 text-xs text-slate-500">Showing the 10 newest epochs. Older on-chain epochs remain preserved for auditability.</p> : null}
    {claimed ? <p className="mt-4 rounded-xl border border-emerald-300/20 bg-emerald-400/10 p-3 text-sm text-emerald-100">Your reward for this epoch has already been claimed.</p> : null}
    <div className="mt-4 flex flex-wrap gap-2">
      {readyToFinalize ? <button disabled={write.isPending || receipt.isLoading} onClick={() => write.writeContract({ address: hub, abi: communityHubAbi, functionName: "finalizeValidatorRewardEpoch", args: [epochId] })} className="rounded-full border border-cyan-300/40 px-4 py-2 text-sm font-bold text-cyan-100 disabled:opacity-40">Finalize reward epoch</button> : null}
      {canClaim ? <button disabled={write.isPending || receipt.isLoading} onClick={() => write.writeContract({ address: treasury, abi: communityTreasuryAbi, functionName: "claimValidatorReward", args: [epochId] })} className="rounded-full bg-cyan-300 px-4 py-2 text-sm font-bold text-slate-950 disabled:opacity-40">Claim {formatUnits(reward ?? 0n, 6)} USDC</button> : null}
    </div>
    {write.error ? <p className="mt-3 text-sm text-rose-200">{communityErrorMessage(write.error)}</p> : null}
    {receipt.isSuccess ? <p className="mt-3 text-sm text-emerald-100">Transaction confirmed. Refreshing the on-chain reward state...</p> : null}
  </Panel>;
}

function Panel({ children }: { children: ReactNode }) {
  return <section className="rounded-[28px] border border-cyan-300/18 bg-[linear-gradient(145deg,rgba(8,47,73,0.35),rgba(42,45,59,0.96))] p-6">{children}</section>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-white/10 bg-slate-950/20 p-3"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 font-semibold text-white">{value}</p></div>;
}

function formatBps(value: bigint) {
  const whole = value / 100n;
  const fraction = value % 100n;
  return fraction === 0n ? `${whole.toString()}%` : `${whole.toString()}.${fraction.toString().padStart(2, "0")}%`;
}
