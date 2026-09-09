"use client";

import { useEffect, useState } from "react";
import { formatUnits } from "viem";
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";

import { usdcAbi } from "@/lib/contracts";
import { communityHubAbi, communityTreasuryAbi } from "@/lib/community-contracts";
import { communityErrorMessage } from "@/lib/community-errors";

type ProposalKind = "adminBinary" | "memberBinary" | "adminSlate" | "memberSlate";

/** Creates only the proposal flows that CommunityHub exposes on-chain. */
export function CreateCommunityProposal({ hub, treasury, isAdmin, isMember }: { hub: `0x${string}`; treasury: `0x${string}`; isAdmin: boolean; isMember: boolean }) {
  const { address } = useAccount();
  const [kind, setKind] = useState<ProposalKind>(isAdmin ? "adminBinary" : "memberBinary");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [metadata, setMetadata] = useState("");
  const { data: usdc } = useReadContract({ address: treasury, abi: communityTreasuryAbi, functionName: "usdc" });
  const { data: proposalBond } = useReadContract({ address: hub, abi: communityHubAbi, functionName: "proposalBondUSDC" });
  const { data: allowance, refetch: refetchAllowance } = useReadContract({ address: usdc, abi: usdcAbi, functionName: "allowance", args: address && usdc ? [address, treasury] : undefined, query: { enabled: Boolean(address && usdc) } });
  const approval = useWriteContract();
  const approvalReceipt = useWaitForTransactionReceipt({ hash: approval.data });
  const proposalWrite = useWriteContract();
  const proposalReceipt = useWaitForTransactionReceipt({ hash: proposalWrite.data });
  useEffect(() => { if (approvalReceipt.isSuccess) void refetchAllowance(); }, [approvalReceipt.isSuccess, refetchAllowance]);
  const adminKind = kind.startsWith("admin"); const slate = kind.endsWith("Slate"); const needsBond = !adminKind; const bondAmount = proposalBond as bigint | undefined; const allowanceValue = allowance as bigint | undefined; const bondApproved = !needsBond || (bondAmount !== undefined && allowanceValue !== undefined && allowanceValue >= bondAmount); const hasContent = Boolean(title.trim() && description.trim()); const allowed = isAdmin || isMember;
  function approveBond() { if (usdc && bondAmount !== undefined) approval.writeContract({ address: usdc, abi: usdcAbi, functionName: "approve", args: [treasury, bondAmount] }); }
  function submit() { if (!hasContent || (adminKind ? !isAdmin : !isMember) || !bondApproved) return; const functionName = adminKind ? (slate ? "createAdminSlateProposal" : "createAdminProposal") : (slate ? "createMemberSlateProposal" : "createMemberProposal"); proposalWrite.writeContract({ address: hub, abi: communityHubAbi, functionName, args: [title.trim(), description.trim(), metadata.trim()] } as never); }
  if (!allowed) return <div className="rounded-[28px] border border-white/10 bg-[#2a2d3b] p-8"><h2 className="text-3xl font-semibold text-white">Create Proposal</h2><p className="mt-3 text-sm text-slate-300">You are not a Community member. Join the community before submitting a proposal.</p></div>;
  const error = approval.error ?? proposalWrite.error;
  return <section className="rounded-[28px] border border-white/10 bg-[#2a2d3b] p-6 sm:p-8"><p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Create Proposal</p><h2 className="mt-2 text-3xl font-semibold text-white">Start a governance decision.</h2><p className="mt-3 text-sm text-slate-300">Community states are exclusive: Admins create admin proposals; stake-backed Members create member proposals.</p><div className="mt-5 flex flex-wrap gap-2">{(isAdmin ? ["adminBinary", "adminSlate"] : ["memberBinary", "memberSlate"]).map((value) => <button key={value} type="button" onClick={() => setKind(value as ProposalKind)} className={kind === value ? "rounded-full bg-cyan-300 px-3 py-2 text-xs font-bold text-slate-950" : "rounded-full border border-white/10 px-3 py-2 text-xs font-bold text-slate-300"}>{value.replace(/([A-Z])/g, " $1")}</button>)}</div>{needsBond ? <div className="mt-4 rounded-xl border border-amber-300/20 bg-amber-400/10 p-3 text-sm text-amber-100">Member proposals enter validator review. The exact proposal bond is <strong>{bondAmount === undefined ? "loading" : `${formatUnits(bondAmount, 6)} USDC`}</strong>.</div> : null}<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Proposal title" className="mt-5 w-full rounded-xl border border-white/10 bg-slate-950/30 px-4 py-3 text-sm text-white outline-none" /><textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Full description" rows={5} className="mt-3 w-full rounded-xl border border-white/10 bg-slate-950/30 px-4 py-3 text-sm text-white outline-none" /><input value={metadata} onChange={(event) => setMetadata(event.target.value)} placeholder="Metadata URI (optional)" className="mt-3 w-full rounded-xl border border-white/10 bg-slate-950/30 px-4 py-3 text-sm text-white outline-none" />{needsBond && !bondApproved ? <button disabled={!usdc || bondAmount === undefined || approval.isPending || approvalReceipt.isLoading} onClick={approveBond} className="mt-4 rounded-full border border-cyan-300/50 px-4 py-2.5 text-sm font-bold text-cyan-100 disabled:opacity-40">{approval.isPending || approvalReceipt.isLoading ? "Approving bond..." : "1. Approve proposal bond"}</button> : null}<button disabled={proposalWrite.isPending || proposalReceipt.isLoading || !hasContent || !bondApproved || (adminKind ? !isAdmin : !isMember)} onClick={submit} className="mt-4 ml-0 rounded-full bg-cyan-300 px-4 py-2.5 text-sm font-bold text-slate-950 disabled:opacity-40 sm:ml-3">{proposalWrite.isPending || proposalReceipt.isLoading ? "Submitting..." : needsBond ? "2. Submit for validation" : "Submit proposal"}</button>{error ? <p className="mt-3 text-sm text-rose-200">{communityErrorMessage(error)}</p> : null}{proposalReceipt.isSuccess ? <p className="mt-3 text-sm text-emerald-200">Proposal submitted. Refresh the workspace to see its current on-chain status.</p> : null}</section>;
}
