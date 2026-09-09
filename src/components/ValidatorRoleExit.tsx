"use client";

import { useEffect } from "react";
import { useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";

import { communityHubAbi } from "@/lib/community-contracts";
import { communityErrorMessage } from "@/lib/community-errors";

/** Allows a validator to resign only when the Hub's validation set is unlocked. */
export function ValidatorRoleExit({ hub, isValidator }: { hub: `0x${string}`; isValidator: boolean }) {
  const pendingRead = useReadContract({ address: hub, abi: communityHubAbi, functionName: "pendingValidationProposalCount", query: { refetchInterval: 2_000 } });
  const write = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash: write.data });
  const pending = pendingRead.data as bigint | undefined;
  const busy = write.isPending || receipt.isLoading;
  const canResign = pending === 0n;

  useEffect(() => {
    if (receipt.isSuccess) window.setTimeout(() => window.location.reload(), 400);
  }, [receipt.isSuccess]);
  if (!isValidator) return null;

  return <article className="rounded-[28px] border border-rose-300/20 bg-rose-400/5 p-5">
    <p className="text-xs font-bold uppercase tracking-[0.18em] text-rose-200">Validator role</p>
    <h3 className="mt-2 text-xl font-semibold text-white">Resign from this Community.</h3>
    <p className="mt-2 text-sm text-slate-300">Resignation is blocked while Member proposals await validation, so no active review loses its configured validator set.</p>
    <p className="mt-3 text-xs text-slate-400">Pending validation cases: {pending === undefined ? "Loading" : pending.toString()}</p>
    <button disabled={!canResign || busy} onClick={() => write.writeContract({ address: hub, abi: communityHubAbi, functionName: "renounceValidatorRole" })} className="mt-4 rounded-full border border-rose-300/40 px-4 py-2 text-sm font-bold text-rose-100 disabled:opacity-40">{busy ? "Resigning..." : canResign ? "Renounce Validator role" : "Finish pending validation first"}</button>
    {write.error ? <p className="mt-3 text-sm text-rose-200">{communityErrorMessage(write.error)}</p> : null}
  </article>;
}
