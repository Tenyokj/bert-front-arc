"use client";

import { useEffect, useMemo, useState } from "react";
import { formatUnits, isAddress, parseUnits } from "viem";
import { useAccount, usePublicClient, useWaitForTransactionReceipt, useWriteContract } from "wagmi";

import { communityHubAbi, communityTreasuryAbi } from "@/lib/community-contracts";
import { communityErrorMessage } from "@/lib/community-errors";
import { ValidatorNominationPanel } from "@/components/ValidatorNominationPanel";
import { ClientPagination } from "@/components/ClientPagination";
import { CommunityArchivePanel } from "@/components/CommunityArchivePanel";
import { CommunityRoleManagementPanel } from "@/components/CommunityRoleManagementPanel";
import { CommunityAdminActionQueue, type CommunityAdminActionRequest } from "@/components/CommunityAdminActionQueue";
import type { CommunityProposal } from "@/lib/community-v3";

type Withdrawal = {
  id: bigint;
  to: string;
  amount: bigint;
  approvalCount: bigint;
  reason: string;
  executed: boolean;
  cancelled: boolean;
  approvedByYou: boolean;
};

const ADMIN_ORIGIN = 0;
const SLATE_MODE = 1;
const APPROVED_FOR_ROUND = 3;

/** Admin-only controls for the CommunityHub and its paired CommunityTreasury. */
export function CommunityAdminPanel({
  hub,
  treasury,
  proposals,
  communityStatus,
  isAdmin,
}: {
  hub: `0x${string}`;
  treasury: `0x${string}`;
  proposals: CommunityProposal[];
  communityStatus?: number;
  isAdmin: boolean;
}) {
  const { address, chainId } = useAccount();
  const client = usePublicClient({ chainId });
  const [roundOrigin, setRoundOrigin] = useState<0 | 1>(ADMIN_ORIGIN);
  const [selectedIds, setSelectedIds] = useState<bigint[]>([]);
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [metadataURI, setMetadataURI] = useState("");
  const [execution, setExecution] = useState<bigint>();
  const [availableExecution, setAvailableExecution] = useState<bigint>();
  const [quorum, setQuorum] = useState<bigint>();
  const [adminCount, setAdminCount] = useState<bigint>();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [cancellationActions, setCancellationActions] = useState<CommunityAdminActionRequest[]>([]);
  const [withdrawalPage, setWithdrawalPage] = useState(1);
  const [slatePage, setSlatePage] = useState(1);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const write = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash: write.data });

  const paused = communityStatus === 1;
  const archived = communityStatus === 2;
  const governanceLocked = paused || archived;
  const busy = write.isPending || receipt.isLoading;
  const eligible = useMemo(() => proposals
    .filter((proposal) => (
      proposal.origin === roundOrigin
      && proposal.mode === SLATE_MODE
      && proposal.status === APPROVED_FOR_ROUND
      && proposal.assignedRoundId === 0n
    ))
    // The Hub retains this exact order as its deterministic first-max tie-break.
    .sort((left, right) => left.id < right.id ? -1 : left.id > right.id ? 1 : 0), [proposals, roundOrigin]);

  useEffect(() => {
    setSelectedIds((current) => current.filter((id) => eligible.some((proposal) => proposal.id === id)));
    setSlatePage(1);
  }, [eligible]);

  useEffect(() => {
    let cancelled = false;

    async function loadTreasury() {
      if (!client || !isAdmin) return;

      setLoadError(null);
      const read = (request: Record<string, unknown>) => client.readContract(request as never) as Promise<unknown>;
      const [balance, available, threshold, count, requestCount] = await Promise.all([
        read({ address: treasury, abi: communityTreasuryAbi, functionName: "executionBalance" }),
        read({ address: treasury, abi: communityTreasuryAbi, functionName: "availableExecutionBalance" }),
        read({ address: hub, abi: communityHubAbi, functionName: "adminApprovalThreshold" }),
        read({ address: hub, abi: communityHubAbi, functionName: "adminCount" }),
        read({ address: treasury, abi: communityTreasuryAbi, functionName: "withdrawalRequestCount" }),
      ]);
      const requestIds = Array.from(
        { length: Math.min(Number(requestCount), 40) },
        (_, index) => BigInt(Number(requestCount) - index),
      );
      const rows = await Promise.all(requestIds.map(async (requestId) => {
        const value = await read({
          address: treasury,
          abi: communityTreasuryAbi,
          functionName: "getWithdrawalRequest",
          args: [requestId],
        }) as Record<string, unknown>;
        const approvedByYou = address ? await read({
          address: treasury,
          abi: communityTreasuryAbi,
          functionName: "hasApprovedWithdrawal",
          args: [requestId, address],
        }) as boolean : false;
        return {
          id: requestId,
          to: value.to as string,
          amount: value.amount as bigint,
          approvalCount: value.approvalCount as bigint,
          reason: value.reason as string,
          executed: value.executed as boolean,
          cancelled: value.cancelled as boolean,
          approvedByYou,
        } satisfies Withdrawal;
      }));

      if (!cancelled) {
        setExecution(balance as bigint);
        setAvailableExecution(available as bigint);
        setQuorum(threshold as bigint);
        setAdminCount(count as bigint);
        setWithdrawals(rows);
      }
    }

    void loadTreasury().catch((error: unknown) => {
      if (!cancelled) {
        setWithdrawals([]);
        setLoadError(error instanceof Error ? error.message : "Could not load Treasury data.");
      }
    });

    return () => { cancelled = true; };
  }, [address, chainId, client, hub, isAdmin, receipt.isSuccess, treasury]);

  function createRound() {
    if (governanceLocked) {
      setNotice(archived ? "This Community is archived. New governance actions are permanently disabled." : "Slate Round creation is unavailable while the Community is paused.");
      return;
    }
    if (selectedIds.length === 0) return;
    setNotice(null);
    write.writeContract({
      address: hub,
      abi: communityHubAbi,
      functionName: roundOrigin === ADMIN_ORIGIN ? "createAdminSlateRound" : "createMemberSlateRound",
      args: [[...selectedIds].sort((left, right) => left < right ? -1 : left > right ? 1 : 0)],
    } as never);
  }

  function toggleSlateProposal(proposalId: bigint) {
    if (selectedIds.includes(proposalId)) {
      setSelectedIds((current) => current.filter((id) => id !== proposalId));
      return;
    }
    if (selectedIds.length >= 30) {
      setNotice("A Slate Round can contain at most 30 proposals.");
      return;
    }
    setNotice(null);
    setSelectedIds((current) => [...current, proposalId]);
  }

  function createWithdrawal() {
    if (governanceLocked) {
      setNotice(archived ? "This Community is archived. Treasury withdrawals are permanently disabled." : "The Community is paused. Creating, approving, and executing withdrawals is locked until it resumes.");
      return;
    }
    if (!isAddress(recipient) || !reason.trim()) return;
    try {
      const value = parseUnits(amount, 6);
      if (value <= 0n) return;
      setNotice(null);
      write.writeContract({
        address: treasury,
        abi: communityTreasuryAbi,
        functionName: "createWithdrawalRequest",
        args: [recipient, value, reason.trim(), metadataURI.trim()],
      });
    } catch {
      setNotice("Withdrawal amount must be a valid positive USDC value.");
    }
  }

  function withdrawalAction(request: Withdrawal, action: "approve" | "execute" | "cancel") {
    if (governanceLocked && action !== "cancel") {
      setNotice(archived ? "This Community is archived. Only cancellation can release an existing reservation." : "The Community is paused. Only cancellation is available to release an existing reservation.");
      return;
    }
    setNotice(null);
    if (action === "cancel") {
      write.writeContract({ address: hub, abi: communityHubAbi, functionName: "createAdminActionRequest", args: [7, "0x0000000000000000000000000000000000000000", request.id] });
      return;
    }
    const functionName = action === "approve" ? "approveWithdrawal" : "executeWithdrawal";
    write.writeContract({ address: treasury, abi: communityTreasuryAbi, functionName, args: [request.id] } as never);
  }

  function cancellationAction(requestId: bigint, action: "approve" | "execute") {
    const functionName = action === "approve" ? "approveAdminActionRequest" : "executeAdminActionRequest";
    write.writeContract({ address: hub, abi: communityHubAbi, functionName, args: [requestId] } as never);
  }

  function changeStatus() {
    if (archived) return;
    setNotice(null);
    write.writeContract({ address: hub, abi: communityHubAbi, functionName: "createAdminActionRequest", args: [paused ? 1 : 0, "0x0000000000000000000000000000000000000000", 0n] });
  }

  if (!isAdmin) {
    return <div className="rounded-[28px] border border-white/10 bg-[#2a2d3b] p-8"><h2 className="text-3xl font-semibold text-white">Admin Panel</h2><p className="mt-3 text-sm text-slate-300">Admin access required.</p></div>;
  }

  const parsedAmount = (() => {
    try { return amount ? parseUnits(amount, 6) : 0n; } catch { return -1n; }
  })();
  const reservedExecution = execution !== undefined && availableExecution !== undefined ? execution - availableExecution : undefined;
  const readyWithdrawals = withdrawals.filter((request) => (
    !request.executed && !request.cancelled && quorum !== undefined && request.approvalCount >= quorum
  ));
  const withdrawalTotalPages = Math.max(1, Math.ceil(withdrawals.length / 6));
  const currentWithdrawalPage = Math.min(withdrawalPage, withdrawalTotalPages);
  const visibleWithdrawals = withdrawals.slice((currentWithdrawalPage - 1) * 6, currentWithdrawalPage * 6);
  const slateTotalPages = Math.max(1, Math.ceil(eligible.length / 30));
  const currentSlatePage = Math.min(slatePage, slateTotalPages);
  const visibleEligible = eligible.slice((currentSlatePage - 1) * 30, currentSlatePage * 30);

  return <section className="space-y-6">
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Admin Panel</p>
      <h2 className="mt-2 text-3xl font-semibold text-white">Governance operations.</h2>
      <p className="mt-2 text-sm text-slate-300">Configuration values are immutable in the deployed Hub. These controls map directly to available administrative contract calls.</p>
    </div>

    {paused ? <div className="rounded-2xl border border-amber-300/35 bg-amber-400/10 p-4 text-sm text-amber-100">Community is paused. Treasury requests, approvals, and execution are locked. You can still cancel a pending request to release its reserved balance.</div> : null}
    {archived ? <div className="rounded-2xl border border-rose-300/35 bg-rose-400/10 p-4 text-sm text-rose-100">Community is archived. Governance and Treasury withdrawals are permanently disabled; only claims, exits and request cancellation remain available.</div> : null}

    <div className="grid gap-4 lg:grid-cols-2">
      <article className="rounded-[28px] border border-white/10 bg-[#2a2d3b] p-5">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-200">Community status</p>
        <p className="mt-3 text-lg font-semibold text-white">{archived ? "Archived" : paused ? "Paused" : "Active"}</p>
        <p className="mt-2 text-sm text-slate-300">Pausing freezes governance time and blocks voting, proposal creation and Treasury withdrawals.</p>
        {!archived ? <button disabled={busy} onClick={changeStatus} className="mt-4 rounded-full border border-cyan-300/40 px-4 py-2 text-sm font-bold text-cyan-100 disabled:opacity-40">{paused ? "Request Community resume" : "Request Community pause"}</button> : null}
      </article>
      <article className="rounded-[28px] border border-white/10 bg-[#2a2d3b] p-5">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-200">Execution Treasury</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Metric label="Execution balance" value={execution === undefined ? "Loading" : `${formatUnits(execution, 6)} USDC`} />
          <Metric label="Reserved by requests" value={reservedExecution === undefined ? "Loading" : `${formatUnits(reservedExecution, 6)} USDC`} />
          <Metric label="Available to request" value={availableExecution === undefined ? "Loading" : `${formatUnits(availableExecution, 6)} USDC`} />
        </div>
        <p className="mt-3 text-xs text-slate-400">Required approvals: {quorum?.toString() ?? "-"} of {adminCount?.toString() ?? "-"} active admins.</p>
      </article>
    </div>

    <CommunityAdminActionQueue hub={hub} quorum={quorum} refreshKey={write.data} onCancellationActionsChange={setCancellationActions} />

    {loadError ? <p className="rounded-xl border border-rose-300/30 bg-rose-400/10 p-4 text-sm text-rose-100">Treasury data could not be read: {loadError}</p> : null}

    {!archived ? <><CommunityRoleManagementPanel hub={hub} archived={archived} /><ValidatorNominationPanel hub={hub} /></> : <CommunityRoleManagementPanel hub={hub} archived={archived} />}
    <CommunityArchivePanel hub={hub} archived={archived} />

    {readyWithdrawals.length > 0 ? <article className="rounded-[28px] border border-emerald-300/30 bg-emerald-400/10 p-5">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-200">Transfer ready</p>
      <h3 className="mt-2 text-xl font-semibold text-white">{readyWithdrawals.length} withdrawal {readyWithdrawals.length === 1 ? "is" : "requests are"} ready to send.</h3>
      <p className="mt-2 text-sm text-emerald-50/80">The required quorum is already on-chain. Signing execution sends USDC to the chosen recipient.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {readyWithdrawals.map((request) => <button key={request.id.toString()} disabled={busy || governanceLocked} onClick={() => withdrawalAction(request, "execute")} className="rounded-full bg-emerald-300 px-4 py-2 text-sm font-bold text-slate-950 disabled:opacity-40">Send {formatUnits(request.amount, 6)} USDC for request #{request.id.toString()}</button>)}
      </div>
    </article> : null}

    <article className="rounded-[28px] border border-white/10 bg-[#2a2d3b] p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-200">Create Slate Round</p><h3 className="mt-2 text-xl font-semibold text-white">Select contract-eligible proposals.</h3></div>
        <div className="flex gap-2">
          <button type="button" onClick={() => { setRoundOrigin(0); setSlatePage(1); }} className={roundOrigin === 0 ? "rounded-full bg-cyan-300 px-3 py-2 text-xs font-bold text-slate-950" : "rounded-full border border-white/10 px-3 py-2 text-xs font-bold text-slate-300"}>Admin</button>
          <button type="button" onClick={() => { setRoundOrigin(1); setSlatePage(1); }} className={roundOrigin === 1 ? "rounded-full bg-cyan-300 px-3 py-2 text-xs font-bold text-slate-950" : "rounded-full border border-white/10 px-3 py-2 text-xs font-bold text-slate-300"}>Member</button>
        </div>
      </div>
      <p className="mt-3 text-sm text-slate-300">Only {roundOrigin === 0 ? "admin" : "validator-approved member"} slate proposals in <code>ApprovedForRound</code> with no assigned round can be selected. Lower proposal ID wins a tie, regardless of click order.</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {visibleEligible.map((proposal) => <button type="button" key={proposal.id.toString()} onClick={() => toggleSlateProposal(proposal.id)} className={selectedIds.includes(proposal.id) ? "rounded-xl border border-cyan-300 bg-cyan-400/10 p-4 text-left" : "rounded-xl border border-white/10 bg-slate-950/20 p-4 text-left"}><p className="text-xs font-bold text-cyan-200">#{proposal.id.toString()}</p><p className="mt-1 font-semibold text-white">{proposal.title}</p></button>)}
        {eligible.length === 0 ? <p className="rounded-xl border border-dashed border-white/10 p-4 text-sm text-slate-400">No proposals are currently eligible for this Slate Round.</p> : null}
      </div>
      <ClientPagination currentPage={currentSlatePage} totalItems={eligible.length} pageSize={30} onPageChange={setSlatePage} />
      <button disabled={governanceLocked || selectedIds.length === 0 || busy} onClick={createRound} className="mt-4 rounded-full bg-cyan-300 px-4 py-2 text-sm font-bold text-slate-950 disabled:opacity-40">Create Slate Round ({selectedIds.length})</button>
    </article>

    <article className="rounded-[28px] border border-white/10 bg-[#2a2d3b] p-5">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-200">Withdrawal request</p>
      <h3 className="mt-2 text-xl font-semibold text-white">Reserve execution funds for approval.</h3>
      <p className="mt-2 text-sm text-slate-300">Creating a request reserves funds and records the creator&apos;s first approval. Execute a ready request to transfer USDC.</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <input disabled={governanceLocked} value={recipient} onChange={(event) => setRecipient(event.target.value)} placeholder="Recipient address" className="rounded-xl border border-white/10 bg-slate-950/30 px-4 py-3 text-sm text-white outline-none disabled:opacity-40" />
        <input disabled={governanceLocked} value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Amount in USDC" inputMode="decimal" className="rounded-xl border border-white/10 bg-slate-950/30 px-4 py-3 text-sm text-white outline-none disabled:opacity-40" />
        <input disabled={governanceLocked} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Reason" className="rounded-xl border border-white/10 bg-slate-950/30 px-4 py-3 text-sm text-white outline-none disabled:opacity-40" />
        <input disabled={governanceLocked} value={metadataURI} onChange={(event) => setMetadataURI(event.target.value)} placeholder="Metadata URI (optional)" className="rounded-xl border border-white/10 bg-slate-950/30 px-4 py-3 text-sm text-white outline-none disabled:opacity-40" />
      </div>
      <button disabled={governanceLocked || !isAddress(recipient) || !reason.trim() || parsedAmount <= 0n || (availableExecution !== undefined && parsedAmount > availableExecution) || busy} onClick={createWithdrawal} className="mt-4 rounded-full bg-cyan-300 px-4 py-2 text-sm font-bold text-slate-950 disabled:opacity-40">Create withdrawal request</button>
    </article>

    <article className="rounded-[28px] border border-white/10 bg-[#2a2d3b] p-5">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-200">Withdrawal requests</p>
      <div className="mt-4 space-y-3">
        {visibleWithdrawals.map((request) => {
          const quorumReached = quorum !== undefined && request.approvalCount >= quorum;
          const terminal = request.executed || request.cancelled;
          const cancellation = cancellationActions.find((action) => action.value === request.id && !action.executed);
          const cancellationApprovedByYou = address ? cancellation?.approvals.has(address.toLowerCase()) : false;
          const cancellationReady = cancellation !== undefined && quorum !== undefined && BigInt(cancellation.approvals.size) >= quorum;
          return <div key={request.id.toString()} className="rounded-xl border border-white/10 bg-slate-950/20 p-4">
            <div className="flex flex-wrap justify-between gap-2"><p className="font-semibold text-white">#{request.id.toString()} · {formatUnits(request.amount, 6)} USDC</p><span className="text-xs font-bold text-cyan-100">{request.executed ? "Executed" : request.cancelled ? "Cancelled" : quorumReached ? "Ready to execute" : "Awaiting approvals"}</span></div>
            <p className="mt-2 text-sm text-slate-300">{request.reason}</p>
            <p className="mt-2 break-all text-xs text-slate-400">To: {request.to} · Approvals: {request.approvalCount.toString()} / {quorum?.toString() ?? "-"}</p>
            {!terminal ? <div className="mt-3 flex flex-wrap gap-2">
              {!request.approvedByYou ? <button disabled={busy || governanceLocked} onClick={() => withdrawalAction(request, "approve")} className="rounded-full border border-cyan-300/40 px-3 py-1.5 text-xs font-bold text-cyan-100 disabled:opacity-40">Approve</button> : null}
              {quorumReached ? <button disabled={busy || governanceLocked} onClick={() => withdrawalAction(request, "execute")} className="rounded-full bg-emerald-300 px-3 py-1.5 text-xs font-bold text-slate-950 disabled:opacity-40">Execute transfer</button> : null}
              {cancellation ? <div className="w-full rounded-xl border border-amber-300/20 bg-amber-400/5 p-3 text-xs text-amber-100"><p>Cancellation request #{cancellation.id.toString()} · {cancellation.approvals.size} / {quorum?.toString() ?? "-"} Admin approvals.</p><div className="mt-2 flex flex-wrap gap-2">{!cancellationApprovedByYou ? <button disabled={busy} onClick={() => cancellationAction(cancellation.id, "approve")} className="rounded-full border border-amber-300/40 px-3 py-1.5 font-bold disabled:opacity-40">Approve cancellation</button> : null}{cancellationReady ? <button disabled={busy} onClick={() => cancellationAction(cancellation.id, "execute")} className="rounded-full bg-amber-300 px-3 py-1.5 font-bold text-slate-950 disabled:opacity-40">Cancel withdrawal now</button> : null}</div></div> : <button disabled={busy} onClick={() => withdrawalAction(request, "cancel")} className="rounded-full border border-rose-300/30 px-3 py-1.5 text-xs font-bold text-rose-100 disabled:opacity-40">Request cancellation</button>}
            </div> : null}
          </div>;
        })}
        {withdrawals.length === 0 ? <p className="text-sm text-slate-400">No withdrawal requests yet.</p> : null}
      </div>
      <ClientPagination currentPage={currentWithdrawalPage} totalItems={withdrawals.length} pageSize={6} onPageChange={setWithdrawalPage} />
    </article>

    {notice ? <p className="rounded-xl border border-amber-300/30 bg-amber-400/10 p-4 text-sm text-amber-100">{notice}</p> : null}
    {write.error ? <p className="rounded-xl border border-rose-300/30 bg-rose-400/10 p-4 text-sm text-rose-100">{communityErrorMessage(write.error)}</p> : null}
    {receipt.isSuccess ? <p className="text-sm text-emerald-200">Transaction confirmed. Treasury data has been refreshed from the chain.</p> : null}
  </section>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-white/10 bg-slate-950/20 p-3"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 font-semibold text-slate-100">{value}</p></div>;
}
