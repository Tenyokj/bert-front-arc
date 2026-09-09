"use client";

import { useEffect } from "react";
import { useReadContracts, useWaitForTransactionReceipt, useWriteContract } from "wagmi";

import { communityHubAbi } from "@/lib/community-contracts";
import { communityErrorMessage } from "@/lib/community-errors";

/** Shows archive blockers and opens a quorum-protected archive request only when the Hub is clean. */
export function CommunityArchivePanel({ hub, archived }: { hub: `0x${string}`; archived: boolean }) {
  const reads = useReadContracts({
    contracts: ["pendingValidationProposalCount", "activeBinaryProposalCount", "activeSlateRoundCount", "unresolvedMemberProposalCount"].map((functionName) => ({ address: hub, abi: communityHubAbi, functionName })) as never,
    query: { refetchInterval: 2_000 },
  });
  const write = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash: write.data });
  const busy = write.isPending || receipt.isLoading;
  const values = (reads.data ?? []).map((item) => item.result) as (bigint | undefined)[];
  const [pendingValidation, activeBinary, activeSlate, unresolvedMember] = values;
  const loaded = values.length === 4 && values.every((value) => value !== undefined);
  const canArchive = loaded && values.every((value) => value === 0n);

  useEffect(() => {
    if (receipt.isSuccess) window.setTimeout(() => window.location.reload(), 400);
  }, [receipt.isSuccess]);

  return <article className="rounded-[28px] border border-rose-300/20 bg-[linear-gradient(145deg,rgba(127,29,29,0.16),rgba(42,45,59,0.96))] p-5">
    <p className="text-xs font-bold uppercase tracking-[0.18em] text-rose-200">Archive Community</p>
    <h3 className="mt-2 text-xl font-semibold text-white">Permanently close governance.</h3>
    <p className="mt-2 text-sm text-slate-300">Archival blocks future governance and Treasury withdrawals. It remains possible only after every stake-bearing lifecycle is resolved and the configured Admin quorum approves the request.</p>
    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Metric label="Pending validation" value={pendingValidation} />
      <Metric label="Open binary votes" value={activeBinary} />
      <Metric label="Open Slate Rounds" value={activeSlate} />
      <Metric label="Unresolved member proposals" value={unresolvedMember} />
    </div>
    {archived ? <p className="mt-4 rounded-xl border border-slate-300/15 bg-slate-950/20 p-3 text-sm text-slate-300">This Community is already archived.</p> : <button disabled={!canArchive || busy} onClick={() => write.writeContract({ address: hub, abi: communityHubAbi, functionName: "createAdminActionRequest", args: [2, "0x0000000000000000000000000000000000000000", 0n] })} className="mt-4 rounded-full border border-rose-300/50 px-4 py-2 text-sm font-bold text-rose-100 disabled:opacity-40">{busy ? "Requesting..." : canArchive ? "Request Community archive" : "Resolve all blockers before archival"}</button>}
    {write.error ? <p className="mt-3 text-sm text-rose-200">{communityErrorMessage(write.error)}</p> : null}
    {receipt.isSuccess ? <p className="mt-3 text-sm text-emerald-200">Archive request created. Approve and execute it in the Admin action queue.</p> : null}
  </article>;
}

function Metric({ label, value }: { label: string; value: bigint | undefined }) {
  return <div className="rounded-xl border border-white/10 bg-slate-950/20 p-3"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 font-semibold text-white">{value === undefined ? "Loading" : value.toString()}</p></div>;
}
