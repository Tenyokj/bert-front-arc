"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { useParams, usePathname } from "next/navigation";
import { FaArrowLeft, FaCoins, FaLock, FaShieldHalved, FaUsers } from "react-icons/fa6";
import { parseUnits } from "viem";
import { useAccount, usePublicClient, useWaitForTransactionReceipt, useWriteContract } from "wagmi";

import { AddressIdentity } from "@/components/AddressIdentity";
import {
  communityContracts,
  communityFactoryAbi,
  communityHubAbi,
  communityTreasuryAbi,
} from "@/lib/community-contracts";
import {
  formatCommunityStatus,
  formatCommunityUsdc,
  formatProposalMode,
  formatProposalOrigin,
  formatProposalStatus,
} from "@/lib/community";
import { formatDateTimeFromUnix, shortAddress } from "@/lib/dapp-onchain";
import { usdcAbi } from "@/lib/contracts";

type Deployment = { creator: string; hub: string; treasury: string; createdAt: bigint };
type HubSnapshot = {
  status: bigint;
  entryStake: bigint;
  proposalBond: bigint;
  voteMinStake: bigint;
  validatorThreshold: bigint;
  proposalCount: bigint;
  roundCount: bigint;
  validatorRewardEpochId: bigint;
};
type TreasurySnapshot = {
  usdc: string;
  execution: bigint;
  availableExecution: bigint;
  validatorRewards: bigint;
  membershipLocked: bigint;
  proposalBondsLocked: bigint;
  refundLiability: bigint;
  withdrawalRequestCount: bigint;
};
type ProposalRow = {
  id: number;
  creator: string;
  origin: bigint;
  mode: bigint;
  status: bigint;
  title: string;
  description: string;
  votingDeadline: bigint;
  yesVotes: bigint;
  noVotes: bigint;
  approvalCount: bigint;
  rejectionCount: bigint;
  accepted: boolean;
  settled: boolean;
};
type RoundRow = {
  id: number;
  origin: bigint;
  endTime: bigint;
  totalVotes: bigint;
  winningProposalId: bigint;
  winningVotes: bigint;
  settled: boolean;
  proposalIds: bigint[];
};
type WithdrawalRequestRow = {
  id: number;
  to: string;
  amount: bigint;
  approvalCount: bigint;
  reason: string;
  executed: boolean;
  cancelled: boolean;
};
type MemberSnapshot = { active: boolean; joinedAt: bigint; exitRequestedAt: bigint; membershipStake: bigint; proposalPoints: bigint };

const zeroAddress = "0x0000000000000000000000000000000000000000";

export default function CommunityDetailsPage() {
  const params = useParams<{ id: string }>();
  const pathname = usePathname();
  const client = usePublicClient();
  const { address, isConnected } = useAccount();
  const [deployment, setDeployment] = useState<Deployment | null>(null);
  const [hub, setHub] = useState<HubSnapshot | null>(null);
  const [treasury, setTreasury] = useState<TreasurySnapshot | null>(null);
  const [member, setMember] = useState<MemberSnapshot | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isValidator, setIsValidator] = useState(false);
  const [proposals, setProposals] = useState<ProposalRow[]>([]);
  const [rounds, setRounds] = useState<RoundRow[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [proposalTitle, setProposalTitle] = useState("");
  const [proposalDescription, setProposalDescription] = useState("");
  const [proposalMetadataUri, setProposalMetadataUri] = useState("");
  const [proposalMode, setProposalMode] = useState<"binary" | "slate">("binary");
  const [voteAmount, setVoteAmount] = useState("10");
  const [roundProposalIds, setRoundProposalIds] = useState("");
  const [validatorEpoch, setValidatorEpoch] = useState("1");
  const [withdrawalRecipient, setWithdrawalRecipient] = useState("");
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [withdrawalReason, setWithdrawalReason] = useState("");
  const [withdrawalMetadataUri, setWithdrawalMetadataUri] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const { data: txHash, error: transactionError, isPending, writeContract } = useWriteContract();
  const sendTransaction = writeContract as unknown as (variables: Record<string, unknown>) => void;
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash });
  const communityId = Number(params?.id);
  const hubAddress = deployment?.hub !== zeroAddress ? deployment?.hub : undefined;
  const communityIndexPath = pathname.startsWith("/v3") ? "/v3/communities" : "/communities";

  useEffect(() => {
    if (isConfirmed) setRefreshKey((value) => value + 1);
  }, [isConfirmed]);

  useEffect(() => {
    let cancelled = false;

    async function loadCommunity() {
      if (!client || !communityContracts.factory || !Number.isInteger(communityId) || communityId <= 0) {
        if (!cancelled) setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const read = (config: Record<string, unknown>) =>
          (client as { readContract: (arg: Record<string, unknown>) => Promise<unknown> }).readContract(config);
        const row = (await read({
          address: communityContracts.factory,
          abi: communityFactoryAbi,
          functionName: "getCommunity",
          args: [BigInt(communityId)],
        })) as Deployment;
        const nextDeployment = { creator: row.creator, hub: row.hub, treasury: row.treasury, createdAt: row.createdAt } satisfies Deployment;
        if (nextDeployment.hub === zeroAddress) {
          if (!cancelled) setDeployment(nextDeployment);
          return;
        }

        const [hubValues, treasuryValues] = await Promise.all([
          Promise.all([
            read({ address: nextDeployment.hub, abi: communityHubAbi, functionName: "communityStatus" }),
            read({ address: nextDeployment.hub, abi: communityHubAbi, functionName: "entryStakeUSDC" }),
            read({ address: nextDeployment.hub, abi: communityHubAbi, functionName: "proposalBondUSDC" }),
            read({ address: nextDeployment.hub, abi: communityHubAbi, functionName: "voteMinStakeUSDC" }),
            read({ address: nextDeployment.hub, abi: communityHubAbi, functionName: "validatorApprovalThreshold" }),
            read({ address: nextDeployment.hub, abi: communityHubAbi, functionName: "proposalCount" }),
            read({ address: nextDeployment.hub, abi: communityHubAbi, functionName: "roundCount" }),
            read({ address: nextDeployment.hub, abi: communityHubAbi, functionName: "currentValidatorRewardEpochId" }),
          ]),
          Promise.all([
            read({ address: nextDeployment.treasury, abi: communityTreasuryAbi, functionName: "usdc" }),
            read({ address: nextDeployment.treasury, abi: communityTreasuryAbi, functionName: "executionBalance" }),
            read({ address: nextDeployment.treasury, abi: communityTreasuryAbi, functionName: "availableExecutionBalance" }),
            read({ address: nextDeployment.treasury, abi: communityTreasuryAbi, functionName: "validatorRewardBalance" }),
            read({ address: nextDeployment.treasury, abi: communityTreasuryAbi, functionName: "totalMembershipLocked" }),
            read({ address: nextDeployment.treasury, abi: communityTreasuryAbi, functionName: "totalProposalBondLocked" }),
            read({ address: nextDeployment.treasury, abi: communityTreasuryAbi, functionName: "totalRefundLiability" }),
            read({ address: nextDeployment.treasury, abi: communityTreasuryAbi, functionName: "withdrawalRequestCount" }),
          ]),
        ]);

        const nextHub = {
          status: hubValues[0] as bigint,
          entryStake: hubValues[1] as bigint,
          proposalBond: hubValues[2] as bigint,
          voteMinStake: hubValues[3] as bigint,
          validatorThreshold: hubValues[4] as bigint,
          proposalCount: hubValues[5] as bigint,
          roundCount: hubValues[6] as bigint,
          validatorRewardEpochId: hubValues[7] as bigint,
        } satisfies HubSnapshot;
        const nextTreasury = {
          usdc: treasuryValues[0] as string,
          execution: treasuryValues[1] as bigint,
          availableExecution: treasuryValues[2] as bigint,
          validatorRewards: treasuryValues[3] as bigint,
          membershipLocked: treasuryValues[4] as bigint,
          proposalBondsLocked: treasuryValues[5] as bigint,
          refundLiability: treasuryValues[6] as bigint,
          withdrawalRequestCount: treasuryValues[7] as bigint,
        } satisfies TreasurySnapshot;

        const visibleCount = Math.min(Number(nextHub.proposalCount), 12);
        const proposalRows = await Promise.all(
          Array.from({ length: visibleCount }, (_, index) => BigInt(visibleCount - index)).map(async (proposalId) => {
            const value = (await read({ address: nextDeployment.hub, abi: communityHubAbi, functionName: "getProposal", args: [proposalId] })) as Record<string, unknown>;
            return {
              id: Number(proposalId), creator: value.creator as string, origin: value.origin as bigint, mode: value.mode as bigint,
              status: value.status as bigint, title: value.title as string, description: value.description as string,
              votingDeadline: value.votingDeadline as bigint, yesVotes: value.yesVotes as bigint, noVotes: value.noVotes as bigint,
              approvalCount: value.approvalCount as bigint, rejectionCount: value.rejectionCount as bigint,
              accepted: value.accepted as boolean, settled: value.settled as boolean,
            } satisfies ProposalRow;
          })
        );
        const visibleRoundCount = Math.min(Number(nextHub.roundCount), 8);
        const roundRows = await Promise.all(
          Array.from({ length: visibleRoundCount }, (_, index) => BigInt(visibleRoundCount - index)).map(async (roundId) => {
            const [value, proposalIds] = await Promise.all([
              read({ address: nextDeployment.hub, abi: communityHubAbi, functionName: "getRound", args: [roundId] }),
              read({ address: nextDeployment.hub, abi: communityHubAbi, functionName: "getRoundProposalIds", args: [roundId] }),
            ]);
            const fields = value as Record<string, unknown>;
            return {
              id: Number(roundId), origin: fields.origin as bigint, endTime: fields.endTime as bigint,
              totalVotes: fields.totalVotes as bigint, winningProposalId: fields.winningProposalId as bigint,
              winningVotes: fields.winningVotes as bigint, settled: fields.settled as boolean,
              proposalIds: [...(proposalIds as readonly bigint[])],
            } satisfies RoundRow;
          })
        );
        const visibleWithdrawalCount = Math.min(Number(nextTreasury.withdrawalRequestCount), 6);
        const withdrawalRows = await Promise.all(
          Array.from({ length: visibleWithdrawalCount }, (_, index) => BigInt(visibleWithdrawalCount - index)).map(async (requestId) => {
            const value = (await read({ address: nextDeployment.treasury, abi: communityTreasuryAbi, functionName: "getWithdrawalRequest", args: [requestId] })) as Record<string, unknown>;
            return {
              id: Number(requestId), to: value.to as string, amount: value.amount as bigint,
              approvalCount: value.approvalCount as bigint, reason: value.reason as string,
              executed: value.executed as boolean, cancelled: value.cancelled as boolean,
            } satisfies WithdrawalRequestRow;
          })
        );

        if (address) {
          const [memberValue, adminValue, validatorValue] = await Promise.all([
            read({ address: nextDeployment.hub, abi: communityHubAbi, functionName: "getMember", args: [address] }),
            read({ address: nextDeployment.hub, abi: communityHubAbi, functionName: "isAdminAccount", args: [address] }),
            read({ address: nextDeployment.hub, abi: communityHubAbi, functionName: "isValidatorAccount", args: [address] }),
          ]);
          const values = memberValue as Record<string, unknown>;
          if (!cancelled) {
            setMember({ active: values.active as boolean, joinedAt: values.joinedAt as bigint, exitRequestedAt: values.exitRequestedAt as bigint, membershipStake: values.membershipStake as bigint, proposalPoints: values.proposalPoints as bigint });
            setIsAdmin(adminValue as boolean);
            setIsValidator(validatorValue as boolean);
          }
        } else if (!cancelled) {
          setMember(null);
          setIsAdmin(false);
          setIsValidator(false);
        }

        if (!cancelled) {
          setDeployment(nextDeployment);
          setHub(nextHub);
          setTreasury(nextTreasury);
          setProposals(proposalRows);
          setRounds(roundRows);
          setWithdrawals(withdrawalRows);
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Could not load this community.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadCommunity();
    return () => { cancelled = true; };
  }, [address, client, communityId, refreshKey]);

  const approveEntryStake = () => {
    if (!treasury || !hub) return;
    sendTransaction({ address: treasury.usdc as `0x${string}`, abi: usdcAbi, functionName: "approve", args: [deployment!.treasury, hub.entryStake] });
  };
  const join = () => hubAddress && sendTransaction({ address: hubAddress as `0x${string}`, abi: communityHubAbi, functionName: "joinCommunity" });
  const requestExit = () => hubAddress && sendTransaction({ address: hubAddress as `0x${string}`, abi: communityHubAbi, functionName: "requestMembershipExit" });
  const finalizeExit = () => hubAddress && sendTransaction({ address: hubAddress as `0x${string}`, abi: communityHubAbi, functionName: "finalizeMembershipExit" });
  const approveProposalBond = () => {
    if (!treasury || !hub || !deployment) return;
    sendTransaction({ address: treasury.usdc as `0x${string}`, abi: usdcAbi, functionName: "approve", args: [deployment.treasury, hub.proposalBond] });
  };
  const submitProposal = () => {
    if (!hubAddress || !proposalTitle.trim() || !proposalDescription.trim()) {
      setFormError("Add both a title and a description before publishing.");
      return;
    }
    setFormError(null);
    const functionName = isAdmin
      ? proposalMode === "binary" ? "createAdminProposal" : "createAdminSlateProposal"
      : proposalMode === "binary" ? "createMemberProposal" : "createMemberSlateProposal";
    sendTransaction({ address: hubAddress as `0x${string}`, abi: communityHubAbi, functionName, args: [proposalTitle.trim(), proposalDescription.trim(), proposalMetadataUri.trim()] });
  };
  const approveVoteStake = () => {
    if (!treasury || !deployment) return;
    try {
      setFormError(null);
      sendTransaction({ address: treasury.usdc as `0x${string}`, abi: usdcAbi, functionName: "approve", args: [deployment.treasury, parseUnits(voteAmount, 6)] });
    } catch {
      setFormError("Vote amount must be a valid USDC value.");
    }
  };
  const castBinaryVote = (proposalId: number, choice: 1 | 2) => {
    if (!hubAddress) return;
    try {
      setFormError(null);
      sendTransaction({ address: hubAddress as `0x${string}`, abi: communityHubAbi, functionName: "castBinaryVote", args: [BigInt(proposalId), choice, parseUnits(voteAmount, 6)] });
    } catch {
      setFormError("Vote amount must be a valid USDC value.");
    }
  };
  const validateProposal = (proposalId: number, approved: boolean) => hubAddress && sendTransaction({ address: hubAddress as `0x${string}`, abi: communityHubAbi, functionName: "castValidationDecision", args: [BigInt(proposalId), approved] });
  const openBinaryVoting = (proposalId: number) => hubAddress && sendTransaction({ address: hubAddress as `0x${string}`, abi: communityHubAbi, functionName: "openBinaryVoting", args: [BigInt(proposalId)] });
  const settleBinaryProposal = (proposalId: number) => hubAddress && sendTransaction({ address: hubAddress as `0x${string}`, abi: communityHubAbi, functionName: "settleBinaryProposal", args: [BigInt(proposalId)] });
  const parseRoundProposalIds = () => {
    const ids = roundProposalIds.split(",").map((value) => value.trim()).filter(Boolean);
    if (ids.length === 0 || ids.some((id) => !/^\d+$/.test(id) || Number(id) <= 0)) {
      throw new Error("Enter positive proposal IDs separated by commas.");
    }
    return ids.map((id) => BigInt(id));
  };
  const createSlateRound = (origin: 0 | 1) => {
    if (!hubAddress) return;
    try {
      setFormError(null);
      sendTransaction({ address: hubAddress as `0x${string}`, abi: communityHubAbi, functionName: origin === 0 ? "createAdminSlateRound" : "createMemberSlateRound", args: [parseRoundProposalIds()] });
    } catch (roundError) {
      setFormError(roundError instanceof Error ? roundError.message : "Enter valid proposal IDs.");
    }
  };
  const castSlateVote = (roundId: number, proposalId: bigint) => {
    if (!hubAddress) return;
    try {
      setFormError(null);
      sendTransaction({ address: hubAddress as `0x${string}`, abi: communityHubAbi, functionName: "castSlateRoundVote", args: [BigInt(roundId), proposalId, parseUnits(voteAmount, 6)] });
    } catch {
      setFormError("Vote amount must be a valid USDC value.");
    }
  };
  const settleSlateRound = (roundId: number) => hubAddress && sendTransaction({ address: hubAddress as `0x${string}`, abi: communityHubAbi, functionName: "settleSlateRound", args: [BigInt(roundId)] });
  const claimNoVoteRefund = (proposalId: number) => deployment && sendTransaction({ address: deployment.treasury as `0x${string}`, abi: communityTreasuryAbi, functionName: "claimNoVoteRefund", args: [BigInt(proposalId)] });
  const claimValidatorReward = () => {
    if (!deployment || !/^\d+$/.test(validatorEpoch) || Number(validatorEpoch) <= 0) {
      setFormError("Enter a valid finalized validator epoch ID.");
      return;
    }
    setFormError(null);
    sendTransaction({ address: deployment.treasury as `0x${string}`, abi: communityTreasuryAbi, functionName: "claimValidatorReward", args: [BigInt(validatorEpoch)] });
  };
  const createWithdrawal = () => {
    if (!deployment || !/^0x[a-fA-F0-9]{40}$/.test(withdrawalRecipient) || !withdrawalReason.trim()) {
      setFormError("Add a valid recipient address and a withdrawal reason.");
      return;
    }
    try {
      setFormError(null);
      sendTransaction({ address: deployment.treasury as `0x${string}`, abi: communityTreasuryAbi, functionName: "createWithdrawalRequest", args: [withdrawalRecipient as `0x${string}`, parseUnits(withdrawalAmount, 6), withdrawalReason.trim(), withdrawalMetadataUri.trim()] });
    } catch {
      setFormError("Withdrawal amount must be a valid USDC value.");
    }
  };
  const approveWithdrawal = (requestId: number) => deployment && sendTransaction({ address: deployment.treasury as `0x${string}`, abi: communityTreasuryAbi, functionName: "approveWithdrawal", args: [BigInt(requestId)] });
  const cancelWithdrawal = (requestId: number) => deployment && sendTransaction({
    address: deployment.hub as `0x${string}`,
    abi: communityHubAbi,
    functionName: "createAdminActionRequest",
    args: [7, zeroAddress, BigInt(requestId)],
  });
  const executeWithdrawal = (requestId: number) => deployment && sendTransaction({ address: deployment.treasury as `0x${string}`, abi: communityTreasuryAbi, functionName: "executeWithdrawal", args: [BigInt(requestId)] });

  if (!communityContracts.factory) return <p className="rounded-xl border border-amber-300/35 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">Set <code>NEXT_PUBLIC_V3_FACTORY_ADDRESS</code> to open Community Layer data.</p>;
  if (loading) return <p className="rounded-xl border border-white/10 bg-[#313443] px-4 py-3 text-sm text-slate-300">Loading community governance state...</p>;
  if (error || !deployment) return <p className="rounded-xl border border-rose-300/35 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{error ?? "Community not found."}</p>;
  if (deployment.hub === zeroAddress) return <section className="rounded-[28px] border border-amber-300/20 bg-[#2a2d3b] p-6 sm:p-8"><Link href={communityIndexPath} className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-200"><FaArrowLeft /> Communities</Link><h1 className="mt-5 font-[var(--font-display)] text-4xl text-white">Community #{communityId} is waiting for activation.</h1><p className="mt-4 max-w-2xl text-slate-300">A Treasury has been reserved, but its creator has not yet deployed and activated the matching CommunityHub.</p></section>;

  const busy = isPending || isConfirming;
  return (
    <section className="space-y-6">
      <Link href={communityIndexPath} className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-200 transition hover:text-cyan-100"><FaArrowLeft /> Community directory</Link>
      <div className="rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,#243240_0%,#20232f_55%,#2a2d3b_100%)] p-6 sm:p-8 md:p-10"><div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200">BERT V3 / Community #{communityId}</p><h1 className="mt-4 font-[var(--font-display)] text-4xl text-white sm:text-5xl">Community governance, live on-chain.</h1><p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-300">Members make stake-backed decisions. Validators protect proposal quality. Admins execute approved outcomes through a local USDC Treasury.</p></div><span className="w-fit rounded-full border border-emerald-300/25 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-200">{formatCommunityStatus(hub?.status)}</span></div><div className="mt-7 grid gap-3 text-sm sm:grid-cols-3"><div className="rounded-2xl border border-white/10 bg-slate-950/20 p-4"><p className="text-slate-500">Creator</p><div className="mt-2"><AddressIdentity address={deployment.creator} /></div></div><div className="rounded-2xl border border-white/10 bg-slate-950/20 p-4"><p className="text-slate-500">Treasury</p><p className="mt-2 font-medium text-slate-200">{shortAddress(deployment.treasury)}</p></div><div className="rounded-2xl border border-white/10 bg-slate-950/20 p-4"><p className="text-slate-500">Activated</p><p className="mt-2 font-medium text-slate-200">{formatDateTimeFromUnix(deployment.createdAt)}</p></div></div></div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Execution balance" value={`${formatCommunityUsdc(treasury?.execution)} USDC`} icon={<FaCoins />} /><Metric label="Available to execute" value={`${formatCommunityUsdc(treasury?.availableExecution)} USDC`} icon={<FaLock />} /><Metric label="Validator rewards" value={`${formatCommunityUsdc(treasury?.validatorRewards)} USDC`} icon={<FaShieldHalved />} /><Metric label="Membership locked" value={`${formatCommunityUsdc(treasury?.membershipLocked)} USDC`} icon={<FaUsers />} /></div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]"><div className="rounded-[28px] border border-white/10 bg-[#2a2d3b] p-6"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Your membership</p>{!isConnected ? <p className="mt-4 text-sm leading-relaxed text-slate-300">Connect a wallet to join this community or inspect your local role.</p> : member?.active ? <><h2 className="mt-3 text-2xl font-semibold text-white">You are an active member.</h2><p className="mt-3 text-sm text-slate-300">Stake: {formatCommunityUsdc(member.membershipStake)} USDC. Proposal points: {member.proposalPoints.toString()}.</p><div className="mt-5 flex flex-wrap gap-3"><button disabled={busy} onClick={requestExit} className="rounded-full border border-amber-300/30 bg-amber-400/10 px-4 py-2.5 text-sm font-semibold text-amber-100 disabled:opacity-50">Request exit</button>{member.exitRequestedAt > 0n ? <button disabled={busy} onClick={finalizeExit} className="rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-50">Finalize exit</button> : null}</div></> : <><h2 className="mt-3 text-2xl font-semibold text-white">Join with {formatCommunityUsdc(hub?.entryStake)} USDC.</h2><p className="mt-3 text-sm leading-relaxed text-slate-300">Approve the community Treasury once, then submit your membership transaction.</p><div className="mt-5 flex flex-wrap gap-3"><button disabled={busy} onClick={approveEntryStake} className="rounded-full border border-cyan-300/30 bg-cyan-400/10 px-4 py-2.5 text-sm font-semibold text-cyan-100 disabled:opacity-50">1. Approve entry stake</button><button disabled={busy} onClick={join} className="rounded-full bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-50">2. Join community</button></div></>}{isAdmin || isValidator ? <p className="mt-5 rounded-xl border border-cyan-300/20 bg-cyan-400/5 px-3 py-2 text-sm text-cyan-100">Local role: {isAdmin ? "Admin" : "Validator"}</p> : null}{txHash ? <p className="mt-4 text-xs text-slate-400">Latest transaction: {shortAddress(txHash)} {isConfirming ? "confirming..." : isConfirmed ? "confirmed" : "submitted"}</p> : null}{transactionError ? <p className="mt-3 text-sm text-rose-200">{transactionError.message}</p> : null}</div><div className="rounded-[28px] border border-white/10 bg-[#2a2d3b] p-6"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Community rules</p><div className="mt-5 grid gap-3 sm:grid-cols-2"><Rule label="Proposal bond" value={`${formatCommunityUsdc(hub?.proposalBond)} USDC`} /><Rule label="Minimum vote" value={`${formatCommunityUsdc(hub?.voteMinStake)} USDC`} /><Rule label="Validator approvals" value={hub?.validatorThreshold.toString() ?? "-"} /><Rule label="Active proposals" value={hub?.proposalCount.toString() ?? "0"} /><Rule label="Slate rounds" value={hub?.roundCount.toString() ?? "0"} /><Rule label="Refund liability" value={`${formatCommunityUsdc(treasury?.refundLiability)} USDC`} /></div></div></div>

      {isConnected && (isAdmin || member?.active) ? <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <div className="rounded-[28px] border border-cyan-300/15 bg-[linear-gradient(135deg,rgba(19,54,66,0.55),rgba(42,45,59,0.98))] p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200">Governance studio</p>
          <h2 className="mt-2 font-[var(--font-display)] text-3xl text-white">Publish a proposal</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">{isAdmin ? "Your proposal enters its selected governance lane immediately." : `Member proposals are reviewed by validators and require a ${formatCommunityUsdc(hub?.proposalBond)} USDC bond.`}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <input value={proposalTitle} onChange={(event) => setProposalTitle(event.target.value)} placeholder="Proposal title" className="rounded-xl border border-white/10 bg-slate-950/35 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/50" />
            <select value={proposalMode} onChange={(event) => setProposalMode(event.target.value as "binary" | "slate")} className="rounded-xl border border-white/10 bg-slate-950/35 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/50"><option value="binary">Binary YES / NO</option><option value="slate">Slate round candidate</option></select>
          </div>
          <textarea value={proposalDescription} onChange={(event) => setProposalDescription(event.target.value)} placeholder="Explain the outcome, scope, and why the community should support it." rows={4} className="mt-3 w-full resize-y rounded-xl border border-white/10 bg-slate-950/35 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/50" />
          <input value={proposalMetadataUri} onChange={(event) => setProposalMetadataUri(event.target.value)} placeholder="Metadata URI (optional)" className="mt-3 w-full rounded-xl border border-white/10 bg-slate-950/35 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/50" />
          <div className="mt-4 flex flex-wrap gap-3">
            {!isAdmin ? <button disabled={busy} onClick={approveProposalBond} className="rounded-full border border-cyan-300/30 bg-cyan-400/10 px-4 py-2.5 text-sm font-semibold text-cyan-100 disabled:opacity-50">1. Approve bond</button> : null}
            <button disabled={busy} onClick={submitProposal} className="rounded-full bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-50">{isAdmin ? "Publish proposal" : "2. Submit for validation"}</button>
          </div>
        </div>
        <div className="rounded-[28px] border border-white/10 bg-[#2a2d3b] p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Voting wallet</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Set your stake once.</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">Minimum stake is {formatCommunityUsdc(hub?.voteMinStake)} USDC. Each binary vote is capped at 10,000 USDC by the protocol.</p>
          <input inputMode="decimal" value={voteAmount} onChange={(event) => setVoteAmount(event.target.value)} className="mt-5 w-full rounded-xl border border-white/10 bg-slate-950/35 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/50" aria-label="Vote amount in USDC" />
          <button disabled={busy || !member?.active} onClick={approveVoteStake} className="mt-3 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-4 py-2.5 text-sm font-semibold text-cyan-100 disabled:opacity-50">Approve vote stake</button>
          <p className="mt-4 text-xs leading-relaxed text-slate-500">Approvals are on-chain permissions for this community Treasury. The Treasury can only take the amount you use in a vote or bond flow.</p>
        </div>
      </div> : null}

      {formError ? <p className="rounded-xl border border-rose-300/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{formError}</p> : null}

      {isAdmin ? <div className="rounded-[28px] border border-white/10 bg-[#2a2d3b] p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Slate round control</p>
        <div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div className="max-w-2xl"><h2 className="font-[var(--font-display)] text-3xl text-white">Turn validated candidates into a choice.</h2><p className="mt-2 text-sm leading-relaxed text-slate-300">Enter IDs in their desired tie-break order. A tied slate chooses the earliest proposal ID in this ordered list, exactly as CommunityHub does on-chain.</p></div><div className="w-full max-w-xl"><label className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Proposal IDs</label><input value={roundProposalIds} onChange={(event) => setRoundProposalIds(event.target.value)} placeholder="Example: 12, 15, 18" className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/35 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/50" /><div className="mt-3 flex flex-wrap gap-3"><button disabled={busy} onClick={() => createSlateRound(0)} className="rounded-full bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-50">Open admin slate</button><button disabled={busy} onClick={() => createSlateRound(1)} className="rounded-full border border-white/15 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">Open member slate</button></div></div></div>
      </div> : null}

      <div className="rounded-[28px] border border-white/10 bg-[#2a2d3b] p-6 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Proposal board</p><h2 className="mt-2 font-[var(--font-display)] text-3xl text-white">Current governance activity</h2></div><span className="text-sm text-slate-400">Latest {proposals.length} proposals</span></div>
        {proposals.length === 0 ? <p className="mt-6 rounded-2xl border border-white/10 bg-[#313443] p-5 text-sm leading-relaxed text-slate-300">No proposals have been created yet. An active member can submit the first idea from the Governance studio above.</p> : <div className="mt-6 grid gap-4 xl:grid-cols-2">{proposals.map((item) => <article key={item.id} className="rounded-2xl border border-white/10 bg-[#313443] p-5"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm text-slate-400">Proposal #{item.id}</p><span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-2.5 py-1 text-xs font-semibold text-cyan-100">{formatProposalStatus(item.status)}</span></div><h3 className="mt-3 text-xl font-semibold text-white">{item.title}</h3><p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-300">{item.description}</p><div className="mt-4 grid gap-2 text-xs text-slate-300 sm:grid-cols-3"><p>{formatProposalOrigin(item.origin)} / {formatProposalMode(item.mode)}</p><p>YES {formatCommunityUsdc(item.yesVotes)}</p><p>NO {formatCommunityUsdc(item.noVotes)}</p></div>{Number(item.status) === 0 ? <p className="mt-3 text-xs text-slate-400">Validator decisions: {item.approvalCount.toString()} approve / {item.rejectionCount.toString()} reject</p> : null}<div className="mt-5 flex flex-wrap gap-2">{isValidator && Number(item.status) === 0 ? <><button disabled={busy} onClick={() => validateProposal(item.id, true)} className="rounded-full bg-emerald-300 px-3 py-2 text-xs font-bold text-slate-950 disabled:opacity-50">Approve</button><button disabled={busy} onClick={() => validateProposal(item.id, false)} className="rounded-full border border-rose-300/30 bg-rose-400/10 px-3 py-2 text-xs font-bold text-rose-100 disabled:opacity-50">Reject</button></> : null}{isAdmin && Number(item.status) === 2 && Number(item.mode) === 0 ? <button disabled={busy} onClick={() => openBinaryVoting(item.id)} className="rounded-full bg-cyan-300 px-3 py-2 text-xs font-bold text-slate-950 disabled:opacity-50">Open binary vote</button> : null}{member?.active && Number(item.status) === 4 && Number(item.mode) === 0 ? <><button disabled={busy} onClick={() => castBinaryVote(item.id, 1)} className="rounded-full bg-white px-3 py-2 text-xs font-bold text-slate-950 disabled:opacity-50">Vote YES</button><button disabled={busy} onClick={() => castBinaryVote(item.id, 2)} className="rounded-full border border-white/15 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Vote NO</button></> : null}{Number(item.status) === 4 && Number(item.mode) === 0 ? <button disabled={busy} onClick={() => settleBinaryProposal(item.id)} className="rounded-full border border-amber-300/30 bg-amber-400/10 px-3 py-2 text-xs font-bold text-amber-100 disabled:opacity-50">Settle when ended</button> : null}</div></article>)}</div>}
      </div>

      <div className="rounded-[28px] border border-white/10 bg-[#2a2d3b] p-6 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Slate rounds</p><h2 className="mt-2 font-[var(--font-display)] text-3xl text-white">One stake, one selected outcome.</h2></div><span className="text-sm text-slate-400">Latest {rounds.length} rounds</span></div>
        {rounds.length === 0 ? <p className="mt-6 rounded-2xl border border-white/10 bg-[#313443] p-5 text-sm leading-relaxed text-slate-300">No slate rounds yet. Admins can compose a round from approved slate proposals above.</p> : <div className="mt-6 grid gap-4 xl:grid-cols-2">{rounds.map((round) => <article key={round.id} className="rounded-2xl border border-white/10 bg-[#313443] p-5"><div className="flex items-start justify-between gap-4"><div><p className="text-sm text-slate-400">Round #{round.id} / {formatProposalOrigin(round.origin)}</p><h3 className="mt-2 text-xl font-semibold text-white">{round.settled ? "Settled selection" : "Open slate vote"}</h3></div><span className={round.settled ? "rounded-full border border-emerald-300/25 bg-emerald-400/10 px-2.5 py-1 text-xs font-semibold text-emerald-200" : "rounded-full border border-cyan-300/20 bg-cyan-400/10 px-2.5 py-1 text-xs font-semibold text-cyan-100"}>{round.settled ? "Settled" : "Voting"}</span></div><p className="mt-3 text-sm text-slate-300">Candidates: {round.proposalIds.map((id) => `#${id.toString()}`).join(", ")}</p><div className="mt-4 grid gap-2 text-xs text-slate-300 sm:grid-cols-2"><p>Total stake {formatCommunityUsdc(round.totalVotes)} USDC</p><p>{round.settled ? `Winner #${round.winningProposalId.toString()}` : `Ends ${formatDateTimeFromUnix(round.endTime)}`}</p></div>{!round.settled ? <div className="mt-5 flex flex-wrap gap-2">{member?.active ? round.proposalIds.map((proposalId) => <button key={proposalId.toString()} disabled={busy} onClick={() => castSlateVote(round.id, proposalId)} className="rounded-full bg-white px-3 py-2 text-xs font-bold text-slate-950 disabled:opacity-50">Choose #{proposalId.toString()}</button>) : null}<button disabled={busy} onClick={() => settleSlateRound(round.id)} className="rounded-full border border-amber-300/30 bg-amber-400/10 px-3 py-2 text-xs font-bold text-amber-100 disabled:opacity-50">Settle when ended</button></div> : null}</article>)}</div>}
      </div>

      {isConnected ? <div className="grid gap-6 xl:grid-cols-2"><div className="rounded-[28px] border border-white/10 bg-[#2a2d3b] p-6"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Your claims</p><h2 className="mt-2 text-2xl font-semibold text-white">Withdraw what the protocol owes you.</h2><p className="mt-3 text-sm leading-relaxed text-slate-300">NO-side voters claim refunds after a rejected binary vote. Reward-eligible validators claim each finalized epoch separately.</p><div className="mt-5 flex flex-wrap gap-2">{proposals.filter((proposal) => proposal.settled && !proposal.accepted && Number(proposal.mode) === 0).map((proposal) => <button key={proposal.id} disabled={busy} onClick={() => claimNoVoteRefund(proposal.id)} className="rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-2 text-xs font-bold text-emerald-100 disabled:opacity-50">Claim NO refund #{proposal.id}</button>)}</div>{isValidator ? <div className="mt-5 border-t border-white/10 pt-5"><label className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Finalized validator epoch</label><div className="mt-2 flex gap-3"><input inputMode="numeric" value={validatorEpoch} onChange={(event) => setValidatorEpoch(event.target.value)} placeholder={`Current: ${hub?.validatorRewardEpochId.toString() ?? "-"}`} className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-950/35 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/50" /><button disabled={busy} onClick={claimValidatorReward} className="rounded-full bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50">Claim reward</button></div></div> : null}</div>
        {isAdmin ? <div className="rounded-[28px] border border-amber-300/15 bg-[linear-gradient(135deg,rgba(95,57,18,0.22),rgba(42,45,59,0.98))] p-6"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-200">Treasury multisig</p><h2 className="mt-2 text-2xl font-semibold text-white">Execution withdrawals need quorum.</h2><p className="mt-3 text-sm leading-relaxed text-slate-300">Creating a request reserves funds and records your first approval. Other community admins must approve before execution.</p><div className="mt-5 grid gap-3"><input value={withdrawalRecipient} onChange={(event) => setWithdrawalRecipient(event.target.value)} placeholder="Recipient 0x address" className="rounded-xl border border-white/10 bg-slate-950/35 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-amber-200/50" /><input inputMode="decimal" value={withdrawalAmount} onChange={(event) => setWithdrawalAmount(event.target.value)} placeholder="Amount in USDC" className="rounded-xl border border-white/10 bg-slate-950/35 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-amber-200/50" /><input value={withdrawalReason} onChange={(event) => setWithdrawalReason(event.target.value)} placeholder="Execution reason" className="rounded-xl border border-white/10 bg-slate-950/35 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-amber-200/50" /><input value={withdrawalMetadataUri} onChange={(event) => setWithdrawalMetadataUri(event.target.value)} placeholder="Evidence metadata URI (optional)" className="rounded-xl border border-white/10 bg-slate-950/35 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-amber-200/50" /></div><button disabled={busy} onClick={createWithdrawal} className="mt-4 rounded-full bg-amber-200 px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-50">Create withdrawal request</button></div> : null}</div> : null}

      {isAdmin && withdrawals.length > 0 ? <div className="rounded-[28px] border border-white/10 bg-[#2a2d3b] p-6 sm:p-8"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Withdrawal queue</p><h2 className="mt-2 font-[var(--font-display)] text-3xl text-white">Treasury approvals on-chain.</h2></div><span className="text-sm text-slate-400">Latest {withdrawals.length} requests</span></div><div className="mt-6 grid gap-4 xl:grid-cols-2">{withdrawals.map((request) => <article key={request.id} className="rounded-2xl border border-white/10 bg-[#313443] p-5"><div className="flex justify-between gap-4"><div><p className="text-sm text-slate-400">Request #{request.id}</p><h3 className="mt-2 text-xl font-semibold text-white">{formatCommunityUsdc(request.amount)} USDC</h3></div><span className="text-xs font-semibold text-slate-300">{request.executed ? "Executed" : request.cancelled ? "Cancelled" : `${request.approvalCount.toString()} approvals`}</span></div><p className="mt-3 text-sm text-slate-300">{request.reason}</p><p className="mt-2 text-xs text-slate-500">Recipient {shortAddress(request.to)}</p>{!request.executed && !request.cancelled ? <div className="mt-5 flex flex-wrap gap-2"><button disabled={busy} onClick={() => approveWithdrawal(request.id)} className="rounded-full bg-cyan-300 px-3 py-2 text-xs font-bold text-slate-950 disabled:opacity-50">Approve</button><button disabled={busy} onClick={() => executeWithdrawal(request.id)} className="rounded-full bg-emerald-300 px-3 py-2 text-xs font-bold text-slate-950 disabled:opacity-50">Execute after quorum</button><button disabled={busy} onClick={() => cancelWithdrawal(request.id)} className="rounded-full border border-rose-300/30 bg-rose-400/10 px-3 py-2 text-xs font-bold text-rose-100 disabled:opacity-50">Cancel</button></div> : null}</article>)}</div></div> : null}
    </section>
  );
}

function Metric({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return <div className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(53,57,72,0.94),rgba(32,35,47,0.96))] p-5"><div className="flex items-center justify-between text-cyan-200"><span className="text-lg">{icon}</span><span className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Live</span></div><p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p><p className="mt-2 font-[var(--font-display)] text-2xl text-white">{value}</p></div>;
}

function Rule({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-white/8 bg-slate-950/20 p-3"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 font-semibold text-slate-100">{value}</p></div>;
}
