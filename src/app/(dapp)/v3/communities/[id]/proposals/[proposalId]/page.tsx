"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { FaArrowLeft, FaCheckDouble, FaCircleInfo } from "react-icons/fa6";
import { useAccount, usePublicClient } from "wagmi";

import { BinaryLifecycleActions } from "@/components/BinaryLifecycleActions";
import { BinaryRefundPanel } from "@/components/BinaryRefundPanel";
import { BinaryVoteLockPanel } from "@/components/BinaryVoteLockPanel";
import { BinaryVoteAction } from "@/components/BinaryVoteAction";
import { MemberValidationFinalizer } from "@/components/MemberValidationFinalizer";
import { formatCommunityUsdc, formatProposalMode, formatProposalOrigin, formatProposalStatus } from "@/lib/community";
import { communityContracts, communityHubAbi, communityTreasuryAbi } from "@/lib/community-contracts";
import { communityReferenceHref } from "@/lib/community-links";
import { formatDateTimeFromUnix, shortAddress } from "@/lib/dapp-onchain";
import {
  getCommunityDeployment,
  getCommunityProposal,
  normalizeCommunityBinaryVote,
  normalizeCommunityProposalBond,
  type CommunityDeployment,
  type CommunityProposal,
} from "@/lib/community-v3";

export default function CommunityProposalPage() {
  const params = useParams<{ id: string; proposalId: string }>();
  const communityId = Number(params.id);
  const proposalId = Number(params.proposalId);
  const { address, chainId } = useAccount();
  const client = usePublicClient({ chainId });
  const [deployment, setDeployment] = useState<CommunityDeployment | null>(null);
  const [proposal, setProposal] = useState<CommunityProposal | null>(null);
  const [vote, setVote] = useState<{ choice: number; stake: bigint } | null>(null);
  const [bond, setBond] = useState<{ amount: bigint; settled: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!client || !communityContracts.factory || communityId < 1 || proposalId < 1) return;
      try {
        const community = await getCommunityDeployment(client, communityContracts.factory, BigInt(communityId));
        const item = await getCommunityProposal(client, community.hub, BigInt(proposalId));
        const read = (request: Record<string, unknown>) => (
          client as { readContract: (value: Record<string, unknown>) => Promise<unknown> }
        ).readContract(request);
        const [bondValue, voteValue] = await Promise.all([
          read({ address: community.treasury, abi: communityTreasuryAbi, functionName: "getProposalBond", args: [BigInt(proposalId)] }),
          address && item.mode === 0
            ? read({ address: community.hub, abi: communityHubAbi, functionName: "getBinaryVote", args: [BigInt(proposalId), address] })
            : Promise.resolve(null),
        ]);
        if (!cancelled) {
          setDeployment(community);
          setProposal(item);
          setBond(normalizeCommunityProposalBond(bondValue));
          setVote(normalizeCommunityBinaryVote(voteValue));
        }
      } catch (reason) {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "Could not load proposal.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [address, chainId, client, communityId, proposalId]);

  if (loading) return <p className="rounded-2xl border border-white/10 bg-[#313443] p-5 text-sm text-slate-300">Loading proposal...</p>;
  if (error || !proposal || !deployment) return <p className="rounded-2xl border border-rose-300/30 bg-rose-400/10 p-5 text-sm text-rose-100">{error ?? "Proposal not found."}</p>;

  const isBinary = proposal.mode === 0;
  const result = proposal.settled
    ? proposal.accepted ? "YES accepted" : "NO / tie won"
    : proposal.yesVotes > proposal.noVotes ? "YES currently leads" : "NO currently leads";
  const reference = communityReferenceHref(proposal.metadataURI);

  return <section className="space-y-6">
    <Link href={`/v3/communities/${communityId}`} className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-200"><FaArrowLeft /> Back to {deployment.name || `Community #${communityId}`}</Link>

    <div className="rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,#243d48,#20232f_55%,#313443)] p-7 sm:p-9">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="text-xs font-bold uppercase tracking-[0.26em] text-cyan-200">Proposal #{proposal.id.toString()} · {formatProposalOrigin(proposal.origin)}</p><h1 className="mt-3 text-4xl font-semibold text-white sm:text-5xl">{proposal.title}</h1></div>
        <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1.5 text-sm font-semibold text-cyan-100">{formatProposalStatus(proposal.status)}</span>
      </div>
      <p className="mt-5 max-w-3xl whitespace-pre-wrap text-sm leading-relaxed text-slate-300">{proposal.description}</p>
      {reference ? <a href={reference} target="_blank" rel="noreferrer" className="mt-4 inline-flex text-sm font-semibold text-cyan-200 underline decoration-cyan-300/40 underline-offset-4 hover:text-cyan-100">Open proposal metadata</a> : proposal.metadataURI ? <p className="mt-4 break-all text-xs text-slate-400">Metadata: {proposal.metadataURI}</p> : null}
    </div>

    <div className="grid gap-4 md:grid-cols-4">
      <Metric label="Proposal type" value={formatProposalOrigin(proposal.origin).toUpperCase()} />
      <Metric label="Voting mode" value={formatProposalMode(proposal.mode)} />
      <Metric label="Creator" value={shortAddress(proposal.creator)} />
      <Metric label="Created" value={formatDateTimeFromUnix(proposal.createdAt)} />
    </div>

    <MemberValidationFinalizer hub={deployment.hub} proposalId={proposal.id} origin={proposal.origin} status={proposal.status} validationDeadline={proposal.validationDeadline} />

    {isBinary ? <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
      <div className="rounded-[28px] border border-white/10 bg-[#2a2d3b] p-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Binary vote state</p>
        <h2 className="mt-3 text-3xl font-semibold text-white">{result}</h2>
        <div className="mt-5 grid grid-cols-2 gap-3"><Metric label="YES" value={`${formatCommunityUsdc(proposal.yesVotes)} USDC`} /><Metric label="NO" value={`${formatCommunityUsdc(proposal.noVotes)} USDC`} /></div>
        <p className="mt-5 text-sm text-slate-300">Voting starts: {proposal.votingStartedAt ? formatDateTimeFromUnix(proposal.votingStartedAt) : "Not opened"}<br />Community-clock deadline: {proposal.votingDeadline ? formatDateTimeFromUnix(proposal.votingDeadline) : "Not scheduled"}</p>
        <p className="mt-2 text-xs text-slate-400">Pause periods do not count toward this deadline. The settlement control uses the live on-chain Community clock.</p>
        <BinaryLifecycleActions hub={deployment.hub} proposalId={proposal.id} status={proposal.status} votingDeadline={proposal.votingDeadline} />
      </div>
      <div className="rounded-[28px] border border-white/10 bg-[#2a2d3b] p-6">
        <FaCheckDouble className="text-xl text-cyan-300" />
        <h2 className="mt-4 text-2xl font-semibold text-white">Your on-chain position</h2>
        {!address ? <p className="mt-3 text-sm text-slate-300">Connect a wallet to see your vote and available actions.</p> : vote?.choice ? <p className="mt-3 text-sm text-slate-300">You voted <strong className="text-white">{vote.choice === 1 ? "YES" : "NO"}</strong> with <strong className="text-white">{formatCommunityUsdc(vote.stake)} USDC</strong>.</p> : <p className="mt-3 text-sm text-slate-300">No vote recorded for this wallet.</p>}
        <BinaryVoteAction hub={deployment.hub} treasury={deployment.treasury} proposalId={proposal.id} proposalStatus={proposal.status} proposalCreator={proposal.creator} existingChoice={vote?.choice} />
        <BinaryRefundPanel treasury={deployment.treasury} proposalId={proposal.id} settled={proposal.settled} voteChoice={vote?.choice} />
        <BinaryVoteLockPanel hub={deployment.hub} proposalId={proposal.id} settled={proposal.settled} voteChoice={vote?.choice} />
        <p className="mt-5 rounded-xl border border-cyan-300/15 bg-cyan-400/5 p-3 text-xs leading-relaxed text-cyan-100"><FaCircleInfo className="mr-2 inline" />Votes are available only while the proposal is in the on-chain voting state and the wallet is an active Community member.</p>
      </div>
    </div> : <div className="rounded-[28px] border border-white/10 bg-[#2a2d3b] p-6"><h2 className="text-2xl font-semibold text-white">Slate candidate state</h2><p className="mt-3 text-sm text-slate-300">Assigned round: {proposal.assignedRoundId ? `#${proposal.assignedRoundId.toString()}` : "Not assigned"}. Round votes: {formatCommunityUsdc(proposal.roundVotes)} USDC.</p></div>}

    <div className="grid gap-4 md:grid-cols-3">
      <Metric label="Proposal bond" value={`${formatCommunityUsdc(bond?.amount)} USDC`} />
      <Metric label="Bond state" value={bond?.settled ? "Settled" : "Locked"} />
      <Metric label="Validator approvals" value={`${proposal.approvalCount.toString()} approve / ${proposal.rejectionCount.toString()} reject`} />
    </div>
  </section>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-white/10 bg-[#313443] p-4"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p><p className="mt-2 break-words text-sm font-semibold text-white">{value}</p></div>;
}
