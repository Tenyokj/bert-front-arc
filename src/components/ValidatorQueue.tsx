"use client";

import { useEffect, useMemo, useState } from "react";
import { formatUnits } from "viem";
import { useAccount, usePublicClient, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";

import { ClientPagination } from "@/components/ClientPagination";
import { ValidatorRewardsPanel } from "@/components/ValidatorRewardsPanel";
import { ValidatorRoleExit } from "@/components/ValidatorRoleExit";
import { communityHubAbi } from "@/lib/community-contracts";
import type { CommunityProposal } from "@/lib/community-v3";

const PAGE_SIZE = 6;
const PENDING_VALIDATION = 0;
const MEMBER_ORIGIN = 1;

function formatDeadline(timestamp: bigint) {
  return timestamp === 0n ? "Not set" : new Date(Number(timestamp) * 1_000).toLocaleString();
}

function referenceHref(metadataURI: string) {
  if (metadataURI.startsWith("https://") || metadataURI.startsWith("http://")) return metadataURI;
  if (metadataURI.startsWith("ipfs://")) return `https://ipfs.io/ipfs/${metadataURI.slice("ipfs://".length)}`;
  return null;
}

/** Validator-only queue with direct on-chain decision and pagination state. */
function ValidatorQueueContent({ hub, proposals, approvalThreshold, isValidator }: { hub: `0x${string}`; proposals: CommunityProposal[]; approvalThreshold: bigint; isValidator: boolean }) {
  const client = usePublicClient();
  const { address } = useAccount();
  const [decidedIds, setDecidedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const write = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash: write.data });
  const pending = useMemo(() => proposals.filter((proposal) => proposal.origin === MEMBER_ORIGIN && proposal.status === PENDING_VALIDATION), [proposals]);
  const totalPages = Math.max(1, Math.ceil(pending.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visible = pending.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    let cancelled = false;
    async function loadDecisions() {
      if (!client || !address || !isValidator || pending.length === 0) {
        if (!cancelled) setDecidedIds(new Set());
        return;
      }
      const entries = await Promise.all(pending.map(async (proposal) => [proposal.id.toString(), await client.readContract({ address: hub, abi: communityHubAbi, functionName: "validatorDecisionCast", args: [proposal.id, address] })] as const));
      if (!cancelled) setDecidedIds(new Set(entries.filter(([, decided]) => decided).map(([id]) => id)));
    }
    void loadDecisions().catch(() => { if (!cancelled) setDecidedIds(new Set()); });
    return () => { cancelled = true; };
  }, [address, client, hub, isValidator, pending]);

  function decide(proposalId: bigint, approved: boolean) {
    write.writeContract({ address: hub, abi: communityHubAbi, functionName: "castValidationDecision", args: [proposalId, approved] });
  }

  if (!isValidator) return <AccessMessage text="Validator access is required for this queue." />;
  if (pending.length === 0) return <AccessMessage text="No member proposals are waiting for validation." />;

  return <section className="space-y-4">
    <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Validator Queue</p><h2 className="mt-2 text-3xl font-semibold text-white">Review member proposals.</h2><p className="mt-2 text-sm text-slate-300">Each decision is written directly to CommunityHub. A proposal moves on-chain once it reaches the required threshold.</p></div>
    {visible.map((proposal) => {
      const decided = decidedIds.has(proposal.id.toString());
      const href = referenceHref(proposal.metadataURI);
      return <article key={proposal.id.toString()} className="rounded-[24px] border border-white/10 bg-[#2a2d3b] p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-200">Member proposal #{proposal.id.toString()}</p><h3 className="mt-2 text-xl font-semibold text-white">{proposal.title}</h3></div><span className="rounded-full bg-amber-400/10 px-3 py-1 text-xs font-bold text-amber-100">Pending validation</span></div><p className="mt-3 text-sm leading-relaxed text-slate-300">{proposal.description}</p>{href ? <a href={href} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-sm font-semibold text-cyan-200 underline decoration-cyan-300/40 underline-offset-4 hover:text-cyan-100">Open member reference</a> : proposal.metadataURI ? <p className="mt-3 break-all text-xs text-slate-400">Reference: {proposal.metadataURI}</p> : <p className="mt-3 text-xs text-slate-500">No member reference attached.</p>}<div className="mt-4 grid gap-3 text-sm sm:grid-cols-3"><Metric label="Approvals" value={`${proposal.approvalCount.toString()} / ${approvalThreshold.toString()}`} /><Metric label="Rejections" value={proposal.rejectionCount.toString()} /><Metric label="Bond" value={`${formatUnits(proposal.bondAmount, 6)} USDC`} /></div><p className="mt-3 text-xs text-slate-400">Creator: {proposal.creator} · Deadline: {formatDeadline(proposal.validationDeadline)}</p><div className="mt-4 flex flex-wrap gap-3">{decided ? <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-100">Your decision recorded</span> : <><button disabled={write.isPending || receipt.isLoading} onClick={() => decide(proposal.id, true)} className="rounded-full bg-cyan-300 px-4 py-2 text-sm font-bold text-slate-950 disabled:opacity-40">Approve</button><button disabled={write.isPending || receipt.isLoading} onClick={() => decide(proposal.id, false)} className="rounded-full border border-rose-300/30 px-4 py-2 text-sm font-bold text-rose-100 disabled:opacity-40">Reject</button></>}</div></article>;
    })}
    <ClientPagination currentPage={currentPage} totalItems={pending.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
    {write.error ? <p className="text-sm text-rose-200">{write.error.message}</p> : null}
    {receipt.isSuccess ? <p className="text-sm text-emerald-200">Decision confirmed. Refresh to retrieve the finalized on-chain state.</p> : null}
  </section>;
}

export function ValidatorQueue(props: { hub: `0x${string}`; treasury?: `0x${string}`; proposals: CommunityProposal[]; approvalThreshold: bigint; isValidator: boolean }) {
  const treasuryRead = useReadContract({ address: props.hub, abi: communityHubAbi, functionName: "communityTreasury" });
  const treasury = props.treasury ?? treasuryRead.data;
  return <div className="space-y-6"><ValidatorQueueContent {...props} />{treasury ? <ValidatorRewardsPanel hub={props.hub} treasury={treasury} isValidator={props.isValidator} /> : null}<ValidatorRoleExit hub={props.hub} isValidator={props.isValidator} /></div>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-white/10 bg-slate-950/20 p-3"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 font-semibold text-slate-100">{value}</p></div>;
}

function AccessMessage({ text }: { text: string }) {
  return <div className="rounded-[28px] border border-white/10 bg-[#2a2d3b] p-8"><h2 className="text-3xl font-semibold text-white">Validator Queue</h2><p className="mt-3 text-sm text-slate-300">{text}</p></div>;
}
