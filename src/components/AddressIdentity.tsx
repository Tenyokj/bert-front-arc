"use client";

import { useReadContract } from "wagmi";

import {
  contracts,
  reputationSystemAbi,
  voterProgressionAbi,
} from "@/lib/contracts";
import { shortAddress } from "@/lib/dapp-onchain";

type AddressIdentityProps = {
  address?: string;
  className?: string;
};

export function AddressIdentity({ address, className }: AddressIdentityProps) {
  const addr = address as `0x${string}` | undefined;

  const { data: isRepInitialized } = useReadContract({
    address: contracts.reputationSystem,
    abi: reputationSystemAbi,
    functionName: "isInitialized",
    args: addr ? [addr] : undefined,
    query: { enabled: Boolean(addr && contracts.reputationSystem) },
  });

  const { data: reputation } = useReadContract({
    address: contracts.reputationSystem,
    abi: reputationSystemAbi,
    functionName: "getReputation",
    args: addr ? [addr] : undefined,
    query: {
      enabled: Boolean(addr && contracts.reputationSystem && isRepInitialized),
    },
  });

  const { data: isReviewer } = useReadContract({
    address: contracts.voterProgression,
    abi: voterProgressionAbi,
    functionName: "hasRoleReviewer",
    args: addr ? [addr] : undefined,
    query: { enabled: Boolean(addr && contracts.voterProgression) },
  });

  const { data: isCurator } = useReadContract({
    address: contracts.voterProgression,
    abi: voterProgressionAbi,
    functionName: "hasRoleCurator",
    args: addr ? [addr] : undefined,
    query: { enabled: Boolean(addr && contracts.voterProgression) },
  });

  if (!address) return <span className={className}>-</span>;

  return (
    <div className={className}>
      <p className="break-all">{address}</p>
      <div className="mt-1 flex flex-wrap items-center gap-1.5">
        <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[11px] text-slate-200">
          {shortAddress(address)}
        </span>
        <span className="rounded-full border border-cyan-300/40 bg-cyan-500/10 px-2 py-0.5 text-[11px] font-semibold text-cyan-200">
          REP: {isRepInitialized ? String(reputation ?? 0n) : "0"}
        </span>
        {isReviewer && (
          <span className="rounded-full border border-indigo-300/45 bg-indigo-500/10 px-2 py-0.5 text-[11px] font-semibold text-indigo-200">
            Reviewer
          </span>
        )}
        {isCurator && (
          <span className="rounded-full border border-emerald-300/45 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-200">
            Curator
          </span>
        )}
      </div>
    </div>
  );
}

