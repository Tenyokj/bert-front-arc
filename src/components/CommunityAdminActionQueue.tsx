"use client";

import { useEffect, useState } from "react";
import { type Address } from "viem";
import { useAccount, usePublicClient, useWaitForTransactionReceipt, useWriteContract } from "wagmi";

import { communityHubAbi } from "@/lib/community-contracts";
import { communityErrorMessage } from "@/lib/community-errors";

export type CommunityAdminActionRequest = { id: bigint; action: number; target: Address; value: bigint; expiresAt: bigint; approvals: Set<string>; executed: boolean };
const labels = ["Pause Community", "Resume Community", "Archive Community", "Add Admin", "Remove Admin", "Add Validator", "Remove Validator", "Cancel withdrawal"];

/** Rebuilds and operates the Hub-owned quorum queue from its immutable on-chain events. */
export function CommunityAdminActionQueue({ hub, quorum, refreshKey, onCancellationActionsChange }: { hub: Address; quorum?: bigint; refreshKey?: string; onCancellationActionsChange?: (actions: CommunityAdminActionRequest[]) => void }) {
  const { address, chainId } = useAccount();
  const client = usePublicClient({ chainId });
  const [requests, setRequests] = useState<CommunityAdminActionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const write = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash: write.data });
  const busy = write.isPending || receipt.isLoading;

  useEffect(() => {
    let stale = false;
    async function load() {
      if (!client) return;
      setLoading(true);
      try {
        // Blockdaemon's Arc RPC prunes older logs. Fresh requests are the only
        // actionable queue items, so query a bounded recent range instead of
        // asking for history from the Factory deployment block.
        const latestBlock = await client.getBlockNumber();
        const recentWindow = 30_000n;
        const fromBlock = latestBlock > recentWindow ? latestBlock - recentWindow : 0n;
        const [opened, approved, executed] = await Promise.all([
          client.getLogs({ address: hub, event: { type: "event", anonymous: false, name: "AdminActionRequested", inputs: [{ indexed: true, name: "requestId", type: "uint256" }, { indexed: false, name: "action", type: "uint8" }, { indexed: true, name: "proposer", type: "address" }, { indexed: true, name: "target", type: "address" }, { indexed: false, name: "value", type: "uint256" }, { indexed: false, name: "expiresAt", type: "uint256" }] }, fromBlock, toBlock: "latest" }),
          client.getLogs({ address: hub, event: { type: "event", anonymous: false, name: "AdminActionApproved", inputs: [{ indexed: true, name: "requestId", type: "uint256" }, { indexed: true, name: "admin", type: "address" }] }, fromBlock, toBlock: "latest" }),
          client.getLogs({ address: hub, event: { type: "event", anonymous: false, name: "AdminActionExecuted", inputs: [{ indexed: true, name: "requestId", type: "uint256" }, { indexed: false, name: "action", type: "uint8" }, { indexed: true, name: "executor", type: "address" }] }, fromBlock, toBlock: "latest" }),
        ]);
        const rows = new Map<bigint, CommunityAdminActionRequest>();
        for (const log of opened) { const args = log.args as { requestId?: bigint; action?: number; target?: Address; value?: bigint; expiresAt?: bigint }; if (args.requestId !== undefined && args.action !== undefined && args.target && args.value !== undefined && args.expiresAt !== undefined) rows.set(args.requestId, { id: args.requestId, action: args.action, target: args.target, value: args.value, expiresAt: args.expiresAt, approvals: new Set(), executed: false }); }
        for (const log of approved) { const args = log.args as { requestId?: bigint; admin?: Address }; if (args.requestId !== undefined && args.admin) rows.get(args.requestId)?.approvals.add(args.admin.toLowerCase()); }
        for (const log of executed) { const id = (log.args as { requestId?: bigint }).requestId; if (id !== undefined && rows.has(id)) rows.get(id)!.executed = true; }
        if (!stale) {
          const next = [...rows.values()].sort((a, b) => a.id > b.id ? -1 : 1);
          setRequests(next);
          onCancellationActionsChange?.(next.filter((request) => request.action === 7));
        }
      } catch {
        if (!stale) {
          setRequests([]);
          onCancellationActionsChange?.([]);
        }
      } finally { if (!stale) setLoading(false); }
    }
    void load(); return () => { stale = true; };
  }, [client, hub, onCancellationActionsChange, receipt.isSuccess, refreshKey]);

  const visibleRequests = requests.filter((request) => request.action !== 7);

  return <article className="rounded-[28px] border border-cyan-300/20 bg-[#2a2d3b] p-5">
    <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-200">Admin action queue</p><h3 className="mt-2 text-xl font-semibold text-white">Quorum-protected Community changes.</h3>
    <p className="mt-2 text-sm text-slate-300">Every roster, pause, archive and withdrawal-cancellation action needs {quorum?.toString() ?? "the configured"} Admin approval{quorum === 1n ? "" : "s"}. Requests expire after seven active Community days.</p>
    {loading ? <p className="mt-4 text-sm text-slate-400">Reading Hub action events...</p> : visibleRequests.length === 0 ? <p className="mt-4 rounded-xl border border-dashed border-white/10 p-4 text-sm text-slate-400">No roster or Community-lifecycle actions yet.</p> : <div className="mt-4 space-y-3">{visibleRequests.map((request) => { const approved = address ? request.approvals.has(address.toLowerCase()) : false; const ready = quorum !== undefined && BigInt(request.approvals.size) >= quorum; return <div key={request.id.toString()} className="rounded-xl border border-white/10 bg-slate-950/20 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold text-white">#{request.id.toString()} · {labels[request.action] ?? "Unknown action"}</p><span className="text-xs font-bold text-cyan-100">{request.executed ? "Executed" : `${request.approvals.size} / ${quorum?.toString() ?? "-"} approvals`}</span></div>{request.target !== "0x0000000000000000000000000000000000000000" ? <p className="mt-2 break-all text-xs text-slate-400">Target: {request.target}</p> : null}{!request.executed ? <div className="mt-3 flex flex-wrap gap-2">{!approved ? <button disabled={busy} onClick={() => write.writeContract({ address: hub, abi: communityHubAbi, functionName: "approveAdminActionRequest", args: [request.id] })} className="rounded-full border border-cyan-300/40 px-3 py-1.5 text-xs font-bold text-cyan-100 disabled:opacity-40">Approve</button> : null}{ready ? <button disabled={busy} onClick={() => write.writeContract({ address: hub, abi: communityHubAbi, functionName: "executeAdminActionRequest", args: [request.id] })} className="rounded-full bg-emerald-300 px-3 py-1.5 text-xs font-bold text-slate-950 disabled:opacity-40">Execute</button> : null}</div> : null}</div>; })}</div>}
    {write.error ? <p className="mt-3 text-sm text-rose-200">{communityErrorMessage(write.error)}</p> : null}
  </article>;
}
