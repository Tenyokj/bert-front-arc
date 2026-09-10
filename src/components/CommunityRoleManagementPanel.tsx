"use client";

import { useEffect, useState } from "react";
import { isAddress, type Address } from "viem";
import { useAccount, usePublicClient, useWaitForTransactionReceipt, useWriteContract } from "wagmi";

import { communityEventFromBlock, communityHubAbi } from "@/lib/community-contracts";
import { communityErrorMessage } from "@/lib/community-errors";

type RoleEvent = {
  account: Address;
  role: "admin" | "validator";
  assigned: boolean;
  blockNumber: bigint;
  logIndex: number;
};

/** Reconstructs and manages the Hub's current local Admin and Validator sets from on-chain events. */
export function CommunityRoleManagementPanel({ hub, archived }: { hub: `0x${string}`; archived: boolean }) {
  const { chainId } = useAccount();
  const client = usePublicClient({ chainId });
  const [admins, setAdmins] = useState<Address[]>([]);
  const [validators, setValidators] = useState<Address[]>([]);
  const [newAdmin, setNewAdmin] = useState("");
  const [loading, setLoading] = useState(true);
  const write = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash: write.data });
  const busy = write.isPending || receipt.isLoading;
  const roleChangesLocked = busy || archived;

  useEffect(() => {
    let cancelled = false;

    async function loadRoleSets() {
      if (!client) return;
      setLoading(true);
      try {
        const [adminAdded, adminRemoved, validatorAdded, validatorRemoved] = await Promise.all([
          client.getLogs({ address: hub, event: communityHubAbi[2] as never, fromBlock: communityEventFromBlock, toBlock: "latest" }),
          client.getLogs({ address: hub, event: communityHubAbi[3] as never, fromBlock: communityEventFromBlock, toBlock: "latest" }),
          client.getLogs({ address: hub, event: communityHubAbi[4] as never, fromBlock: communityEventFromBlock, toBlock: "latest" }),
          client.getLogs({ address: hub, event: communityHubAbi[5] as never, fromBlock: communityEventFromBlock, toBlock: "latest" }),
        ]);
        const events: RoleEvent[] = [
          ...toRoleEvents(adminAdded, "admin", true, "admin"),
          ...toRoleEvents(adminRemoved, "admin", false, "admin"),
          ...toRoleEvents(validatorAdded, "validator", true, "validator"),
          ...toRoleEvents(validatorRemoved, "validator", false, "validator"),
        ].sort(compareRoleEvents);
        const activeAdmins = new Set<Address>();
        const activeValidators = new Set<Address>();
        for (const event of events) {
          const set = event.role === "admin" ? activeAdmins : activeValidators;
          if (event.assigned) set.add(event.account);
          else set.delete(event.account);
        }
        if (!cancelled) {
          setAdmins([...activeAdmins]);
          setValidators([...activeValidators]);
        }
      } catch {
        if (!cancelled) {
          setAdmins([]);
          setValidators([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadRoleSets();
    return () => { cancelled = true; };
  }, [client, hub, receipt.isSuccess]);

  useEffect(() => {
    if (receipt.isSuccess) window.setTimeout(() => window.location.reload(), 400);
  }, [receipt.isSuccess]);

  const newAdminAddress = isAddress(newAdmin) ? newAdmin as Address : undefined;
  const writeHub = (functionName: string, args: readonly unknown[] = []) => {
    write.writeContract({ address: hub, abi: communityHubAbi, functionName, args } as never);
  };
  const requestRoleAction = (action: 3 | 4 | 6, account: Address) => {
    writeHub("createAdminActionRequest", [action, account, 0n]);
  };

  return <article className="rounded-[28px] border border-white/10 bg-[#2a2d3b] p-5">
    <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-200">Role management</p>
    <h3 className="mt-2 text-xl font-semibold text-white">Local Admin and Validator sets.</h3>
    <p className="mt-2 text-sm text-slate-300">Role holders are reconstructed from the Hub&apos;s own role events. Every roster change becomes a quorum-protected request; a wallet can hold only one active Community role.</p>
    {archived ? <p className="mt-3 rounded-xl border border-amber-300/25 bg-amber-400/10 p-3 text-sm text-amber-100">This Community is archived, so its Admin and Validator sets are permanently locked.</p> : null}

    <div className="mt-5 grid gap-4 xl:grid-cols-2">
      <RoleSet title="Admins" holders={admins} loading={loading} actionLabel="Request removal" disabled={roleChangesLocked} onRemove={(account) => requestRoleAction(4, account)} />
      <RoleSet title="Validators" holders={validators} loading={loading} actionLabel="Request removal" disabled={roleChangesLocked} onRemove={(account) => requestRoleAction(6, account)} />
    </div>

    <div className="mt-5">
      <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-4">
        <p className="text-sm font-semibold text-white">Add Admin</p>
        <p className="mt-1 text-xs text-slate-400">The address must not be an active Member or Validator. For an Admin handover, add the replacement through quorum first, then request removal of the outgoing Admin from the list above.</p>
        <input value={newAdmin} onChange={(event) => setNewAdmin(event.target.value.trim())} placeholder="0x admin address" className="mt-3 w-full rounded-xl border border-white/10 bg-slate-950/30 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500" />
        <button disabled={!newAdminAddress || roleChangesLocked} onClick={() => newAdminAddress && requestRoleAction(3, newAdminAddress)} className="mt-3 rounded-full bg-cyan-300 px-4 py-2 text-sm font-bold text-slate-950 disabled:opacity-40">Request Admin addition</button>
      </div>
    </div>

    {write.error ? <p className="mt-4 text-sm text-rose-200">{communityErrorMessage(write.error)}</p> : null}
    {receipt.isSuccess ? <p className="mt-4 text-sm text-emerald-200">Role set updated. Refreshing on-chain state...</p> : null}
  </article>;
}

function RoleSet({ title, holders, loading, actionLabel, disabled, onRemove }: { title: string; holders: Address[]; loading: boolean; actionLabel: string; disabled: boolean; onRemove: (account: Address) => void }) {
  return <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-4">
    <div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold text-white">{title}</p><span className="rounded-full border border-white/10 px-2.5 py-1 text-xs font-bold text-cyan-100">{holders.length}</span></div>
    {loading ? <p className="mt-3 text-sm text-slate-400">Reading role events...</p> : holders.length === 0 ? <p className="mt-3 text-sm text-slate-400">No active {title.toLowerCase()} found.</p> : <div className="mt-3 space-y-2">{holders.map((account) => <div key={account} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-[#313443]/75 p-3"><code className="text-xs text-slate-100">{account}</code><button disabled={disabled} onClick={() => onRemove(account)} className="rounded-full border border-rose-300/30 px-3 py-1.5 text-xs font-bold text-rose-100 disabled:opacity-40">{actionLabel}</button></div>)}</div>}
  </div>;
}

function toRoleEvents(logs: readonly unknown[], role: RoleEvent["role"], assigned: boolean, field: "admin" | "validator"): RoleEvent[] {
  return logs.flatMap((log) => {
    const event = log as { args?: Record<string, unknown>; blockNumber?: bigint; logIndex?: number };
    const account = event.args?.[field];
    return typeof account === "string" && isAddress(account) ? [{ account: account as Address, role, assigned, blockNumber: event.blockNumber ?? 0n, logIndex: event.logIndex ?? 0 }] : [];
  });
}

function compareRoleEvents(left: RoleEvent, right: RoleEvent) {
  if (left.blockNumber !== right.blockNumber) return left.blockNumber < right.blockNumber ? -1 : 1;
  return left.logIndex - right.logIndex;
}
