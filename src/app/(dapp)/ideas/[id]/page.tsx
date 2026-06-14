"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { FaArrowLeft, FaExternalLinkAlt } from "react-icons/fa";
import {
  useAccount,
  usePublicClient,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";

import { AddressIdentity } from "@/components/AddressIdentity";
import {
  contracts,
  grantManagerAbi,
  ideaRegistryAbi,
  rolesRegistryAbi,
  voterProgressionAbi,
  votingSystemAbi,
} from "@/lib/contracts";
import {
  formatDateTimeFromUnix,
  formatTokenAmount,
  mapIdeaStatus,
  mapMilestoneStage,
  shortAddress,
} from "@/lib/dapp-onchain";
import {
  fetchIdeaByIdFromSubgraph,
  fetchAllVotesByIdeaFromSubgraph,
  hasSubgraphConfigured,
} from "@/lib/subgraph";

type IdeaDetails = {
  id: number;
  author: string;
  title: string;
  description: string;
  link: string;
  createdAt: bigint;
  totalVotes: bigint;
  statusCode: bigint;
  isLowQuality: boolean;
};

type IdeaReview = {
  reviewer: string;
  comment: string;
};

type GrantPayout = {
  ideaId: bigint;
  author: string;
  totalGrant: bigint;
  released: bigint;
  initialClaimed: boolean;
  inProcessPaid: boolean;
  completionPaid: boolean;
};

type MilestoneRequest = {
  requestId: bigint;
  metadataURI: string;
  details: string;
  submittedAt: bigint;
  lastRejectedAt: bigint;
  approvals: number;
  rejections: number;
  maxReviewers: number;
  approvalThreshold: number;
  active: boolean;
};

type GrantRoundInfo = {
  winningIdeaId: bigint;
  author: string;
  ideaStatus: bigint;
};

type VotingRoundInfo = {
  id: bigint;
  ideaIds: bigint[];
  startTime: bigint;
  endTime: bigint;
  active: boolean;
  ended: boolean;
  totalVotes: bigint;
  winningIdeaId: bigint;
  winningVotes: bigint;
};

const IN_PROCESS_STAGE = 1;
const COMPLETION_STAGE = 2;

function pickField<T>(row: unknown, index: number, key: string, fallback: T): T {
  if (Array.isArray(row) && row[index] !== undefined) {
    return row[index] as T;
  }
  if (row && typeof row === "object" && key in row) {
    return (row as Record<string, unknown>)[key] as T;
  }
  return fallback;
}

function prettyTxError(message?: string) {
  if (!message) return "";
  if (message.includes("NotReviewer")) {
    return "Only wallets with Reviewer role can add reviews or review milestone proofs.";
  }
  if (message.includes("NotCurator")) {
    return "Only wallets with Curator role can mark ideas as low quality.";
  }
  if (message.includes("NotInVotingStatus")) {
    return "Review is allowed only while the idea is in Voting status.";
  }
  if (message.includes("NotInCorrectStatus") || message.includes("InvalidTransition")) {
    return "This action is not allowed for the current idea status.";
  }
  if (message.includes("NotAuthor")) {
    return "Only the idea author can perform this action.";
  }
  if (message.includes("IdeaAlreadyLowQuality")) {
    return "This idea is already marked as low quality.";
  }
  if (message.includes("MilestoneNotEligible")) {
    return "This milestone stage is not eligible yet. Complete the previous payout step first.";
  }
  if (message.includes("MilestoneRequestActive")) {
    return "There is already an active proof request for this stage.";
  }
  if (message.includes("NoActiveMilestoneRequest")) {
    return "No active milestone proof request is open for this stage.";
  }
  if (message.includes("MilestoneAlreadyReviewed")) {
    return "This wallet has already reviewed the current proof request.";
  }
  if (message.includes("MilestoneCooldownActive")) {
    return "This milestone was recently rejected. Wait for the cooldown before resubmitting proof.";
  }
  if (message.includes("CannotReviewOwnIdea")) {
    return "Idea author cannot review their own milestone proof.";
  }
  if (message.includes("AlreadyDistributed")) {
    return "The initial grant tranche has already been claimed.";
  }
  if (message.includes("Internal error")) {
    return "Transaction reverted by contract rules. Check role, idea status, and payout phase.";
  }
  return message;
}

function toGrantPayout(row: unknown): GrantPayout {
  return {
    ideaId: pickField<bigint>(row, 0, "ideaId", 0n),
    author: pickField<string>(row, 1, "author", ""),
    totalGrant: pickField<bigint>(row, 2, "totalGrant", 0n),
    released: pickField<bigint>(row, 3, "released", 0n),
    initialClaimed: pickField<boolean>(row, 4, "initialClaimed", false),
    inProcessPaid: pickField<boolean>(row, 5, "inProcessPaid", false),
    completionPaid: pickField<boolean>(row, 6, "completionPaid", false),
  };
}

function toMilestoneRequest(row: unknown): MilestoneRequest {
  return {
    requestId: pickField<bigint>(row, 0, "requestId", 0n),
    metadataURI: pickField<string>(row, 1, "metadataURI", ""),
    details: pickField<string>(row, 2, "details", ""),
    submittedAt: pickField<bigint>(row, 3, "submittedAt", 0n),
    lastRejectedAt: pickField<bigint>(row, 4, "lastRejectedAt", 0n),
    approvals: Number(pickField<number | bigint>(row, 5, "approvals", 0)),
    rejections: Number(pickField<number | bigint>(row, 6, "rejections", 0)),
    maxReviewers: Number(pickField<number | bigint>(row, 7, "maxReviewers", 0)),
    approvalThreshold: Number(pickField<number | bigint>(row, 8, "approvalThreshold", 0)),
    active: pickField<boolean>(row, 9, "active", false),
  };
}

function toGrantRoundInfo(row: unknown): GrantRoundInfo {
  return {
    winningIdeaId: pickField<bigint>(row, 0, "winningIdeaId", 0n),
    author: pickField<string>(row, 1, "author", ""),
    ideaStatus: pickField<bigint>(row, 2, "ideaStatus", 0n),
  };
}

function toVotingRoundInfo(row: unknown): VotingRoundInfo {
  return {
    id: pickField<bigint>(row, 0, "id", 0n),
    ideaIds: pickField<bigint[]>(row, 1, "ideaIds", []),
    startTime: pickField<bigint>(row, 2, "startTime", 0n),
    endTime: pickField<bigint>(row, 3, "endTime", 0n),
    active: pickField<boolean>(row, 4, "active", false),
    ended: pickField<boolean>(row, 5, "ended", false),
    totalVotes: pickField<bigint>(row, 6, "totalVotes", 0n),
    winningIdeaId: pickField<bigint>(row, 7, "winningIdeaId", 0n),
    winningVotes: pickField<bigint>(row, 8, "winningVotes", 0n),
  };
}

function MilestoneCard({
  stage,
  request,
  authorView,
  reviewerView,
  metadataURI,
  onMetadataURIChange,
  details,
  onDetailsChange,
  onSubmit,
  onApprove,
  onReject,
  submitBusy,
  reviewBusy,
}: {
  stage: number;
  request: MilestoneRequest;
  authorView: boolean;
  reviewerView: boolean;
  metadataURI: string;
  onMetadataURIChange: (value: string) => void;
  details: string;
  onDetailsChange: (value: string) => void;
  onSubmit: () => void;
  onApprove: () => void;
  onReject: () => void;
  submitBusy: boolean;
  reviewBusy: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#232632] p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h4 className="text-lg font-semibold text-white">{mapMilestoneStage(stage)}</h4>
        <span className="rounded-full border border-cyan-300/35 bg-cyan-500/10 px-2.5 py-1 text-xs font-semibold text-cyan-200">
          Stage {stage}
        </span>
      </div>

      <div className="mt-3 grid gap-2 text-xs text-slate-300 sm:grid-cols-2">
        <p className="rounded-lg border border-white/10 bg-[#1d202b] px-3 py-2">Request ID: {request.requestId.toString()}</p>
        <p className="rounded-lg border border-white/10 bg-[#1d202b] px-3 py-2">Status: {request.active ? "Active review" : request.requestId > 0n ? "Settled" : "Not submitted"}</p>
        <p className="rounded-lg border border-white/10 bg-[#1d202b] px-3 py-2">Approvals: {request.approvals}/{request.approvalThreshold || "-"}</p>
        <p className="rounded-lg border border-white/10 bg-[#1d202b] px-3 py-2">Rejections: {request.rejections}/{request.maxReviewers || "-"}</p>
        <p className="rounded-lg border border-white/10 bg-[#1d202b] px-3 py-2">Submitted: {request.submittedAt > 0n ? formatDateTimeFromUnix(request.submittedAt) : "-"}</p>
        <p className="rounded-lg border border-white/10 bg-[#1d202b] px-3 py-2">Last rejection: {request.lastRejectedAt > 0n ? formatDateTimeFromUnix(request.lastRejectedAt) : "-"}</p>
      </div>

      {request.metadataURI ? (
        <div className="mt-3 rounded-xl border border-white/10 bg-[#1d202b] p-3 text-sm text-slate-300">
          <p className="font-semibold text-slate-100">Proof metadata</p>
          <a href={request.metadataURI} target="_blank" rel="noreferrer" className="mt-2 block break-all text-cyan-200 hover:text-cyan-100">
            {request.metadataURI}
          </a>
          {request.details ? <p className="mt-2 leading-relaxed">{request.details}</p> : null}
        </div>
      ) : null}

      {authorView ? (
        <div className="mt-4 grid gap-2">
          <input
            value={metadataURI}
            onChange={(event) => onMetadataURIChange(event.target.value)}
            placeholder="ipfs://..., https://github..., demo URL"
            className="rounded-lg border border-white/10 bg-[#1d202b] px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400/60"
          />
          <textarea
            value={details}
            onChange={(event) => onDetailsChange(event.target.value)}
            placeholder="Short summary of what validators should review"
            className="min-h-24 rounded-lg border border-white/10 bg-[#1d202b] px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400/60"
          />
          <button
            type="button"
            disabled={submitBusy || !metadataURI.trim() || request.active}
            onClick={onSubmit}
            className="rounded-lg bg-indigo-500/90 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitBusy ? "Submitting..." : request.active ? "Proof already active" : `Submit ${mapMilestoneStage(stage)}`}
          </button>
        </div>
      ) : null}

      {reviewerView && request.active ? (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            disabled={reviewBusy}
            onClick={onApprove}
            className="rounded-lg border border-emerald-300/45 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {reviewBusy ? "Submitting..." : "Approve"}
          </button>
          <button
            type="button"
            disabled={reviewBusy}
            onClick={onReject}
            className="rounded-lg border border-rose-300/45 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {reviewBusy ? "Submitting..." : "Reject"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default function IdeaDetailsPage() {
  const params = useParams<{ id: string }>();
  const client = usePublicClient();
  const { address, isConnected } = useAccount();
  const [idea, setIdea] = useState<IdeaDetails | null>(null);
  const [roundId, setRoundId] = useState<number | null>(null);
  const [voters, setVoters] = useState<string[]>([]);
  const [reviews, setReviews] = useState<IdeaReview[]>([]);
  const [reviewText, setReviewText] = useState("");
  const [stageOneMetadata, setStageOneMetadata] = useState("");
  const [stageOneDetails, setStageOneDetails] = useState("");
  const [stageTwoMetadata, setStageTwoMetadata] = useState("");
  const [stageTwoDetails, setStageTwoDetails] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const {
    data: reviewTxHash,
    isPending: isReviewPending,
    error: reviewError,
    writeContract: writeReview,
  } = useWriteContract();
  const {
    data: markTxHash,
    isPending: isMarkPending,
    error: markError,
    writeContract: writeMarkLowQuality,
  } = useWriteContract();
  const {
    data: claimTxHash,
    isPending: isClaimPending,
    error: claimError,
    writeContract: writeClaim,
  } = useWriteContract();
  const {
    data: milestoneSubmitTxHash,
    isPending: isMilestoneSubmitPending,
    error: milestoneSubmitError,
    writeContract: writeMilestoneSubmit,
  } = useWriteContract();
  const {
    data: milestoneReviewTxHash,
    isPending: isMilestoneReviewPending,
    error: milestoneReviewError,
    writeContract: writeMilestoneReview,
  } = useWriteContract();

  const sendReview = writeReview as unknown as (variables: Record<string, unknown>) => void;
  const sendMarkLowQuality = writeMarkLowQuality as unknown as (variables: Record<string, unknown>) => void;
  const sendClaim = writeClaim as unknown as (variables: Record<string, unknown>) => void;
  const sendMilestoneSubmit = writeMilestoneSubmit as unknown as (variables: Record<string, unknown>) => void;
  const sendMilestoneReview = writeMilestoneReview as unknown as (variables: Record<string, unknown>) => void;

  const { isLoading: isReviewConfirming, isSuccess: isReviewSuccess } = useWaitForTransactionReceipt({ hash: reviewTxHash });
  const { isLoading: isMarkConfirming, isSuccess: isMarkSuccess } = useWaitForTransactionReceipt({ hash: markTxHash });
  const { isLoading: isClaimConfirming, isSuccess: isClaimSuccess } = useWaitForTransactionReceipt({ hash: claimTxHash });
  const { isLoading: isMilestoneSubmitConfirming, isSuccess: isMilestoneSubmitSuccess } = useWaitForTransactionReceipt({ hash: milestoneSubmitTxHash });
  const { isLoading: isMilestoneReviewConfirming, isSuccess: isMilestoneReviewSuccess } = useWaitForTransactionReceipt({ hash: milestoneReviewTxHash });

  const { data: isReviewer } = useReadContract({
    address: contracts.voterProgression,
    abi: voterProgressionAbi,
    functionName: "hasRoleReviewer",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address && contracts.voterProgression) },
  });

  const { data: isCurator } = useReadContract({
    address: contracts.voterProgression,
    abi: voterProgressionAbi,
    functionName: "hasRoleCurator",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address && contracts.voterProgression) },
  });

  const { data: reviewerRoleId } = useReadContract({
    address: contracts.rolesRegistry,
    abi: rolesRegistryAbi,
    functionName: "REVIEWER_ROLE",
    query: { enabled: Boolean(contracts.rolesRegistry) },
  });

  const { data: curatorRoleId } = useReadContract({
    address: contracts.rolesRegistry,
    abi: rolesRegistryAbi,
    functionName: "CURATOR_ROLE",
    query: { enabled: Boolean(contracts.rolesRegistry) },
  });

  const { data: isReviewerByRoles } = useReadContract({
    address: contracts.rolesRegistry,
    abi: rolesRegistryAbi,
    functionName: "hasRole",
    args: address && reviewerRoleId ? [reviewerRoleId, address] : undefined,
    query: { enabled: Boolean(address && contracts.rolesRegistry && reviewerRoleId) },
  });

  const { data: isCuratorByRoles } = useReadContract({
    address: contracts.rolesRegistry,
    abi: rolesRegistryAbi,
    functionName: "hasRole",
    args: address && curatorRoleId ? [curatorRoleId, address] : undefined,
    query: { enabled: Boolean(address && contracts.rolesRegistry && curatorRoleId) },
  });

  const { data: canClaimGrantRaw } = useReadContract({
    address: contracts.grantManager,
    abi: grantManagerAbi,
    functionName: "canClaimGrant",
    args: roundId !== null ? [BigInt(roundId)] : undefined,
    query: { enabled: Boolean(contracts.grantManager && roundId !== null) },
  });

  const { data: grantPayoutRaw } = useReadContract({
    address: contracts.grantManager,
    abi: grantManagerAbi,
    functionName: "getGrantPayout",
    args: roundId !== null ? [BigInt(roundId)] : undefined,
    query: { enabled: Boolean(contracts.grantManager && roundId !== null) },
  });

  const { data: grantRoundInfoRaw } = useReadContract({
    address: contracts.grantManager,
    abi: grantManagerAbi,
    functionName: "getRoundInfo",
    args: roundId !== null ? [BigInt(roundId)] : undefined,
    query: { enabled: Boolean(contracts.grantManager && roundId !== null) },
  });

  const { data: votingRoundInfoRaw } = useReadContract({
    address: contracts.votingSystem,
    abi: votingSystemAbi,
    functionName: "getRoundInfo",
    args: roundId !== null ? [BigInt(roundId)] : undefined,
    query: { enabled: Boolean(contracts.votingSystem && roundId !== null) },
  });

  const { data: inProcessRequestRaw } = useReadContract({
    address: contracts.grantManager,
    abi: grantManagerAbi,
    functionName: "getMilestoneRequest",
    args: roundId !== null ? [BigInt(roundId), IN_PROCESS_STAGE] : undefined,
    query: { enabled: Boolean(contracts.grantManager && roundId !== null) },
  });

  const { data: completionRequestRaw } = useReadContract({
    address: contracts.grantManager,
    abi: grantManagerAbi,
    functionName: "getMilestoneRequest",
    args: roundId !== null ? [BigInt(roundId), COMPLETION_STAGE] : undefined,
    query: { enabled: Boolean(contracts.grantManager && roundId !== null) },
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const rawId = params?.id;
      const ideaId = Number(rawId);
      if (!client || !contracts.ideaRegistry || !Number.isFinite(ideaId)) {
        setIsLoading(false);
        return;
      }
      const readContract = (config: Record<string, unknown>) =>
        (client as { readContract: (arg: Record<string, unknown>) => Promise<unknown> }).readContract(config);

      setIsLoading(true);
      setLoadError(null);

      try {
        if (hasSubgraphConfigured()) {
          try {
            const subgraphIdea = await fetchIdeaByIdFromSubgraph(String(ideaId));
            if (subgraphIdea) {
              const subgraphVotes = await fetchAllVotesByIdeaFromSubgraph(String(ideaId));
              const uniqueVoters = Array.from(
                new Set(subgraphVotes.map((entry) => entry.voter.toLowerCase()))
              );

              const currentIdea: IdeaDetails = {
                id: Number(subgraphIdea.id),
                author: subgraphIdea.author,
                title: subgraphIdea.title,
                description: subgraphIdea.description,
                link: subgraphIdea.link,
                createdAt: BigInt(subgraphIdea.createdAt || "0"),
                totalVotes: BigInt(subgraphIdea.totalVotes || "0"),
                statusCode: BigInt(subgraphIdea.status || "0"),
                isLowQuality: false,
              };

              let reviewsData: IdeaReview[] = [];
              try {
                const reviewsRow = (await readContract({
                  address: contracts.ideaRegistry,
                  abi: ideaRegistryAbi,
                  functionName: "getIdeaReviews",
                  args: [BigInt(ideaId)],
                })) as readonly { reviewer: string; comment: string }[];
                reviewsData = reviewsRow.map((entry) => ({ reviewer: entry.reviewer, comment: entry.comment }));
              } catch {
                reviewsData = [];
              }

              if (!cancelled) {
                setIdea(currentIdea);
                setRoundId(subgraphIdea.roundId ? Number(subgraphIdea.roundId) : null);
                setVoters(uniqueVoters);
                setReviews(reviewsData);
              }
              return;
            }
          } catch {
            // Fallback to direct RPC reads below.
          }
        }

        const structRow = await readContract({
          address: contracts.ideaRegistry,
          abi: ideaRegistryAbi,
          functionName: "getIdeaStruct",
          args: [BigInt(ideaId)],
        });

        const reviewsRow = (await readContract({
          address: contracts.ideaRegistry,
          abi: ideaRegistryAbi,
          functionName: "getIdeaReviews",
          args: [BigInt(ideaId)],
        })) as readonly { reviewer: string; comment: string }[];

        const currentIdea: IdeaDetails = {
          id: Number(pickField<bigint>(structRow, 0, "id", 0n)),
          author: pickField<string>(structRow, 1, "author", ""),
          title: pickField<string>(structRow, 2, "title", ""),
          description: pickField<string>(structRow, 3, "description", ""),
          link: pickField<string>(structRow, 4, "link", ""),
          createdAt: pickField<bigint>(structRow, 5, "createdAt", 0n),
          totalVotes: pickField<bigint>(structRow, 6, "totalVotes", 0n),
          isLowQuality: pickField<boolean>(structRow, 7, "isLowQuality", false),
          statusCode: pickField<bigint>(structRow, 8, "status", 0n),
        };

        let resolvedRoundId: number | null = null;
        let roundVoters: string[] = [];

        if (contracts.votingSystem) {
          const currentRound = (await readContract({
            address: contracts.votingSystem,
            abi: votingSystemAbi,
            functionName: "currentRoundId",
          })) as bigint;

          const maxRound = Number(currentRound);
          for (let rid = maxRound; rid >= 1; rid -= 1) {
            let info: readonly [bigint, bigint[], bigint, bigint, boolean, boolean, bigint, bigint, bigint] | null = null;
            try {
              info = (await readContract({
                address: contracts.votingSystem,
                abi: votingSystemAbi,
                functionName: "getRoundInfo",
                args: [BigInt(rid)],
              })) as readonly [bigint, bigint[], bigint, bigint, boolean, boolean, bigint, bigint, bigint];
            } catch {
              continue;
            }

            if (!info || info[0] === 0n) continue;

            const ideaIds = info[1].map((value) => Number(value));
            if (ideaIds.includes(ideaId)) {
              resolvedRoundId = rid;
              roundVoters = (await readContract({
                address: contracts.votingSystem,
                abi: votingSystemAbi,
                functionName: "getVotersForIdea",
                args: [BigInt(rid), BigInt(ideaId)],
              })) as string[];
              break;
            }
          }
        }

        if (!cancelled) {
          setIdea(currentIdea);
          setRoundId(resolvedRoundId);
          setVoters(roundVoters);
          setReviews(reviewsRow.map((entry) => ({ reviewer: entry.reviewer, comment: entry.comment })));
        }
      } catch (error) {
        if (!cancelled) setLoadError(error instanceof Error ? error.message : "Failed to load idea");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [client, params?.id, isReviewSuccess, isMarkSuccess, isClaimSuccess, isMilestoneSubmitSuccess, isMilestoneReviewSuccess]);

  useEffect(() => {
    if (isReviewSuccess) {
      setReviewText("");
    }
  }, [isReviewSuccess]);

  if (!contracts.ideaRegistry) {
    return (
      <p className="rounded-xl border border-amber-300/35 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
        Set <code>NEXT_PUBLIC_IDEA_REGISTRY_ADDRESS</code> in `.env` to open idea details.
      </p>
    );
  }

  if (isLoading) {
    return <p className="rounded-xl border border-white/10 bg-[#313443] px-4 py-3 text-sm text-slate-300">Loading on-chain idea...</p>;
  }

  if (loadError || !idea) {
    return <p className="rounded-xl border border-rose-300/35 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{loadError || "Idea not found"}</p>;
  }

  const isAuthor = Boolean(address && idea.author && address.toLowerCase() === idea.author.toLowerCase());
  const hasReviewerRole = Boolean(isReviewerByRoles ?? isReviewer);
  const hasCuratorRole = Boolean(isCuratorByRoles ?? isCurator);
  const statusCodeValue = typeof idea.statusCode === "bigint" ? idea.statusCode : BigInt(Number(idea.statusCode));
  const canClaimGrant = Array.isArray(canClaimGrantRaw) ? Boolean(canClaimGrantRaw[0]) : false;
  const claimGrantReason = Array.isArray(canClaimGrantRaw) ? String(canClaimGrantRaw[1] ?? "") : "";
  const payout = grantPayoutRaw ? toGrantPayout(grantPayoutRaw) : null;
  const grantRoundInfo = grantRoundInfoRaw ? toGrantRoundInfo(grantRoundInfoRaw) : null;
  const votingRoundInfo = votingRoundInfoRaw ? toVotingRoundInfo(votingRoundInfoRaw) : null;
  const inProcessRequest = inProcessRequestRaw ? toMilestoneRequest(inProcessRequestRaw) : toMilestoneRequest(undefined);
  const completionRequest = completionRequestRaw ? toMilestoneRequest(completionRequestRaw) : toMilestoneRequest(undefined);
  const isWinningIdea = Boolean(
    votingRoundInfo?.ended &&
    grantRoundInfo &&
    grantRoundInfo.winningIdeaId > 0n &&
    grantRoundInfo.winningIdeaId === BigInt(idea.id)
  );
  const shouldShowGrantPipeline = Boolean(roundId && votingRoundInfo?.ended && isWinningIdea);
  const shouldShowClaimButton = Boolean(isAuthor && !payout?.initialClaimed && canClaimGrant);
  const canAuthorSubmitStageOne = Boolean(isAuthor && payout?.initialClaimed && !payout?.inProcessPaid && statusCodeValue === 3n);
  const canAuthorSubmitStageTwo = Boolean(isAuthor && payout?.inProcessPaid && !payout?.completionPaid && statusCodeValue === 6n);
  const canReviewerReviewStageOne = Boolean(hasReviewerRole && inProcessRequest.active && !isAuthor);
  const canReviewerReviewStageTwo = Boolean(hasReviewerRole && completionRequest.active && !isAuthor);
  const releaseProgress = payout?.totalGrant ? Number((payout.released * 100n) / payout.totalGrant) : 0;

  return (
    <section className="space-y-6">
      <Link href="/ideas" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white">
        <FaArrowLeft />
        Back to ideas
      </Link>

      <article className="rounded-[28px] border border-white/10 bg-[#313443] p-4 shadow-[0_14px_30px_rgba(0,0,0,0.3)] sm:p-5 md:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h1 className="font-[var(--font-display)] text-3xl text-white sm:text-4xl md:text-5xl">Idea #{idea.id}</h1>
            <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-xs font-semibold text-cyan-300">
              {mapIdeaStatus(idea.statusCode)}
            </span>
            {reviews.length > 0 && (
              <span className="rounded-full border border-emerald-300/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                Reviewed
              </span>
            )}
            {idea.isLowQuality && (
              <span className="rounded-full border border-rose-300/40 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-200">
                Low quality
              </span>
            )}
          </div>
          <p className="text-sm text-slate-300">
            {roundId ? `Round #${roundId}` : "Not assigned to round"}
          </p>
        </div>

        <p className="mt-3 text-xl font-semibold text-slate-100 sm:text-2xl">{idea.title}</p>
        <p className="mt-3 text-sm leading-relaxed text-slate-300">{idea.description}</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-[#2a2d3a] px-4 py-3 text-sm text-slate-200">
            1. Read the proposal and inspect vote traction.
          </div>
          <div className="rounded-xl border border-white/10 bg-[#2a2d3a] px-4 py-3 text-sm text-slate-200">
            2. Check whether the idea is active in a round, funded, or already in grant review.
          </div>
          <div className="rounded-xl border border-white/10 bg-[#2a2d3a] px-4 py-3 text-sm text-slate-200">
            3. If you have the right role, use this page for review or milestone validation.
          </div>
        </div>

        <div className="mt-4 grid gap-2 text-xs text-slate-300 sm:grid-cols-2 xl:grid-cols-4">
          <div className="min-w-0 rounded-lg border border-white/10 bg-[#242735] px-3 py-2">
            <p className="mb-1">Author:</p>
            <AddressIdentity address={idea.author} />
          </div>
          <p className="min-w-0 rounded-lg border border-white/10 bg-[#242735] px-3 py-2">
            Created: {formatDateTimeFromUnix(idea.createdAt)}
          </p>
          <p className="min-w-0 rounded-lg border border-white/10 bg-[#242735] px-3 py-2">
            Total votes: {formatTokenAmount(idea.totalVotes)} USDC
          </p>
          <p className="min-w-0 rounded-lg border border-white/10 bg-[#242735] px-3 py-2">
            Status code: {String(idea.statusCode)}
          </p>
        </div>

        {contracts.grantManager && shouldShowGrantPipeline ? (
          <div className="mt-5 rounded-2xl border border-white/10 bg-[#2a2d3a] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-white">Grant pipeline</h3>
              {payout?.totalGrant ? (
                <span className="rounded-full border border-emerald-300/45 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                  Released {releaseProgress}%
                </span>
              ) : null}
            </div>

            <div className="mt-3 grid gap-2 text-xs text-slate-300 sm:grid-cols-2 xl:grid-cols-4">
              <p className="rounded-lg border border-white/10 bg-[#232632] px-3 py-2">Round: #{roundId}</p>
              <p className="rounded-lg border border-white/10 bg-[#232632] px-3 py-2">Claimable: {canClaimGrant ? "Yes" : "No"}</p>
              <p className="rounded-lg border border-white/10 bg-[#232632] px-3 py-2">Total grant: {formatTokenAmount(payout?.totalGrant)} USDC</p>
              <p className="rounded-lg border border-white/10 bg-[#232632] px-3 py-2">Released: {formatTokenAmount(payout?.released)} USDC</p>
            </div>

            <div className="mt-3 grid gap-2 text-xs text-slate-300 sm:grid-cols-3">
              <p className="rounded-lg border border-white/10 bg-[#232632] px-3 py-2">Initial 30%: {payout?.initialClaimed ? "Paid" : "Pending"}</p>
              <p className="rounded-lg border border-white/10 bg-[#232632] px-3 py-2">In-process 40%: {payout?.inProcessPaid ? "Paid" : "Pending"}</p>
              <p className="rounded-lg border border-white/10 bg-[#232632] px-3 py-2">Launch 30%: {payout?.completionPaid ? "Paid" : "Pending"}</p>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-[#232632] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-100">Validation Access</h4>
                <span className="rounded-full border border-cyan-300/35 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-semibold text-cyan-200">
                  Live checks
                </span>
              </div>
              <div className="mt-3 grid gap-2 text-xs text-slate-300 sm:grid-cols-2 xl:grid-cols-4">
                <p className="rounded-lg border border-white/10 bg-[#1d202b] px-3 py-2">Winner idea: {isWinningIdea ? "Yes" : "No"}</p>
                <p className="rounded-lg border border-white/10 bg-[#1d202b] px-3 py-2">Reviewer role: {hasReviewerRole ? "Yes" : "No"}</p>
                <p className="rounded-lg border border-white/10 bg-[#1d202b] px-3 py-2">Author wallet: {isAuthor ? "Yes" : "No"}</p>
                <p className="rounded-lg border border-white/10 bg-[#1d202b] px-3 py-2">Round ended: {votingRoundInfo?.ended ? "Yes" : "No"}</p>
                <p className="rounded-lg border border-white/10 bg-[#1d202b] px-3 py-2">Stage 1 request: {inProcessRequest.active ? "Active" : inProcessRequest.requestId > 0n ? "Settled" : "None"}</p>
                <p className="rounded-lg border border-white/10 bg-[#1d202b] px-3 py-2">Stage 2 request: {completionRequest.active ? "Active" : completionRequest.requestId > 0n ? "Settled" : "None"}</p>
                <p className="rounded-lg border border-white/10 bg-[#1d202b] px-3 py-2">Can validate stage 1: {canReviewerReviewStageOne ? "Yes" : "No"}</p>
                <p className="rounded-lg border border-white/10 bg-[#1d202b] px-3 py-2">Can validate stage 2: {canReviewerReviewStageTwo ? "Yes" : "No"}</p>
              </div>
            </div>

            {shouldShowClaimButton ? (
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={!isConnected || isClaimPending || isClaimConfirming}
                  onClick={() => {
                    if (!contracts.grantManager || roundId === null) return;
                    sendClaim({
                      address: contracts.grantManager,
                      abi: grantManagerAbi,
                      functionName: "claimGrant",
                      args: [BigInt(roundId)],
                      gas: 8_000_000n,
                    });
                  }}
                  className="rounded-lg bg-emerald-500/90 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isClaimPending ? "Sign..." : isClaimConfirming ? "Claiming..." : "Claim initial 30%"}
                </button>
              </div>
            ) : null}

            <p className="mt-3 text-xs text-slate-300">
              {!isAuthor
                ? "Only the idea author can claim and submit proof for grant milestones."
                : payout?.initialClaimed
                  ? "Initial 30% has already been claimed. Continue with milestone proof flow below."
                : canClaimGrant
                  ? "Your idea is ready for the initial 30% claim."
                  : claimGrantReason || "Claim will unlock once round settlement and eligibility checks pass."}
            </p>
            {claimError && <p className="mt-2 max-w-full overflow-hidden break-words text-xs text-rose-300">{prettyTxError(claimError.message)}</p>}
            {claimTxHash && <p className="mt-2 break-all text-xs text-slate-300">Grant transaction reference: {claimTxHash}</p>}

            <div className="mt-5 grid gap-4 2xl:grid-cols-2">
              <MilestoneCard
                stage={IN_PROCESS_STAGE}
                request={inProcessRequest}
                authorView={canAuthorSubmitStageOne}
                reviewerView={canReviewerReviewStageOne}
                metadataURI={stageOneMetadata}
                onMetadataURIChange={setStageOneMetadata}
                details={stageOneDetails}
                onDetailsChange={setStageOneDetails}
                onSubmit={() => {
                  if (!contracts.grantManager || roundId === null) return;
                  sendMilestoneSubmit({
                    address: contracts.grantManager,
                    abi: grantManagerAbi,
                    functionName: "submitMilestoneProof",
                    args: [BigInt(roundId), IN_PROCESS_STAGE, stageOneMetadata.trim(), stageOneDetails.trim()],
                    gas: 1_000_000n,
                  });
                }}
                onApprove={() => {
                  if (!contracts.grantManager || roundId === null) return;
                  sendMilestoneReview({
                    address: contracts.grantManager,
                    abi: grantManagerAbi,
                    functionName: "reviewMilestoneProof",
                    args: [BigInt(roundId), IN_PROCESS_STAGE, true],
                    gas: 800_000n,
                  });
                }}
                onReject={() => {
                  if (!contracts.grantManager || roundId === null) return;
                  sendMilestoneReview({
                    address: contracts.grantManager,
                    abi: grantManagerAbi,
                    functionName: "reviewMilestoneProof",
                    args: [BigInt(roundId), IN_PROCESS_STAGE, false],
                    gas: 800_000n,
                  });
                }}
                submitBusy={isMilestoneSubmitPending || isMilestoneSubmitConfirming}
                reviewBusy={isMilestoneReviewPending || isMilestoneReviewConfirming}
              />

              <MilestoneCard
                stage={COMPLETION_STAGE}
                request={completionRequest}
                authorView={canAuthorSubmitStageTwo}
                reviewerView={canReviewerReviewStageTwo}
                metadataURI={stageTwoMetadata}
                onMetadataURIChange={setStageTwoMetadata}
                details={stageTwoDetails}
                onDetailsChange={setStageTwoDetails}
                onSubmit={() => {
                  if (!contracts.grantManager || roundId === null) return;
                  sendMilestoneSubmit({
                    address: contracts.grantManager,
                    abi: grantManagerAbi,
                    functionName: "submitMilestoneProof",
                    args: [BigInt(roundId), COMPLETION_STAGE, stageTwoMetadata.trim(), stageTwoDetails.trim()],
                    gas: 1_000_000n,
                  });
                }}
                onApprove={() => {
                  if (!contracts.grantManager || roundId === null) return;
                  sendMilestoneReview({
                    address: contracts.grantManager,
                    abi: grantManagerAbi,
                    functionName: "reviewMilestoneProof",
                    args: [BigInt(roundId), COMPLETION_STAGE, true],
                    gas: 800_000n,
                  });
                }}
                onReject={() => {
                  if (!contracts.grantManager || roundId === null) return;
                  sendMilestoneReview({
                    address: contracts.grantManager,
                    abi: grantManagerAbi,
                    functionName: "reviewMilestoneProof",
                    args: [BigInt(roundId), COMPLETION_STAGE, false],
                    gas: 800_000n,
                  });
                }}
                submitBusy={isMilestoneSubmitPending || isMilestoneSubmitConfirming}
                reviewBusy={isMilestoneReviewPending || isMilestoneReviewConfirming}
              />
            </div>

            {milestoneSubmitError && <p className="mt-3 text-xs text-rose-300">{prettyTxError(milestoneSubmitError.message)}</p>}
            {milestoneSubmitTxHash && <p className="mt-2 break-all text-xs text-slate-300">Proof transaction reference: {milestoneSubmitTxHash}</p>}
            {milestoneReviewError && <p className="mt-2 text-xs text-rose-300">{prettyTxError(milestoneReviewError.message)}</p>}
            {milestoneReviewTxHash && <p className="mt-2 break-all text-xs text-slate-300">Review transaction reference: {milestoneReviewTxHash}</p>}
            <p className="mt-3 text-xs text-slate-400">
              If a milestone proof is rejected, the author can submit a new request after a 48-hour cooldown.
            </p>
            {!hasReviewerRole && (inProcessRequest.active || completionRequest.active) && !isAuthor && (
              <p className="mt-3 text-xs text-amber-200">
                Active validation exists, but this wallet cannot review it yet. Reviewer role is required.
              </p>
            )}
            {hasReviewerRole && isAuthor && (inProcessRequest.active || completionRequest.active) && (
              <p className="mt-3 text-xs text-amber-200">
                Reviewer role detected, but the idea author cannot validate their own proof request.
              </p>
            )}
            {hasReviewerRole && !isAuthor && !inProcessRequest.active && !completionRequest.active && (
              <p className="mt-3 text-xs text-slate-400">
                No active validation request is open right now. Approve/reject buttons appear automatically when the author submits a proof for the current eligible stage.
              </p>
            )}
            {hasReviewerRole && (
              <p className="mt-3 text-xs text-slate-400">
                Reviewer flow: stage 1 needs 3 approvals out of 5 reviewers; stage 2 needs 2 approvals out of 3 reviewers.
              </p>
            )}
          </div>
        ) : null}

        {contracts.grantManager && roundId && votingRoundInfo?.ended && !isWinningIdea && grantRoundInfo?.winningIdeaId && grantRoundInfo.winningIdeaId > 0n ? (
          <div className="mt-5 rounded-2xl border border-white/10 bg-[#2a2d3a] p-4">
            <h3 className="text-lg font-semibold text-white">Grant pipeline</h3>
            <p className="mt-3 text-sm text-slate-300">
              Validation and milestone payouts belong only to the winning idea of round #{roundId}.
            </p>
            <p className="mt-2 text-xs text-slate-400">
              Winning idea for this round: #{grantRoundInfo.winningIdeaId.toString()}. This idea is not the round winner, so no proof review or grant actions should appear here.
            </p>
          </div>
        ) : null}

        {contracts.grantManager && roundId && votingRoundInfo && !votingRoundInfo.ended ? (
          <div className="mt-5 rounded-2xl border border-white/10 bg-[#2a2d3a] p-4">
            <h3 className="text-lg font-semibold text-white">Grant pipeline</h3>
            <p className="mt-3 text-sm text-slate-300">
              Post-verification opens only after the round is ended and the winning idea is finalized on-chain.
            </p>
            <p className="mt-2 text-xs text-slate-400">
              This round is still active, so claim and milestone validation actions are hidden for now.
            </p>
          </div>
        ) : null}

        <div className="mt-5 rounded-2xl border border-white/10 bg-[#2a2d3a] p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-white">Reviews ({reviews.length})</h3>
            {hasReviewerRole && (
              <span className="rounded-full border border-indigo-300/45 bg-indigo-500/10 px-2.5 py-1 text-[11px] font-semibold text-indigo-200">
                Reviewer role
              </span>
            )}
          </div>

          {reviews.length === 0 ? (
            <p className="mt-3 text-sm text-slate-300">No reviewer feedback yet. Once a reviewer comments, this idea will start building evaluation history here.</p>
          ) : (
            <div className="mt-3 grid gap-2">
              {reviews.map((entry, idx) => (
                <div key={`${entry.reviewer}-${idx}`} className="rounded-xl border border-white/10 bg-[#232632] px-3 py-2">
                  <AddressIdentity address={entry.reviewer} className="text-xs text-slate-300" />
                  <p className="mt-2 text-sm text-slate-100">{entry.comment}</p>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 grid gap-2">
            <textarea
              value={reviewText}
              onChange={(event) => setReviewText(event.target.value)}
              placeholder="What should the team improve, clarify, or ship next?"
              className="min-h-24 rounded-lg border border-white/10 bg-[#232632] px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400/60"
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={
                  !isConnected ||
                  !hasReviewerRole ||
                  !reviewText.trim() ||
                  isReviewPending ||
                  isReviewConfirming
                }
                onClick={() => {
                  sendReview({
                    address: contracts.ideaRegistry!,
                    abi: ideaRegistryAbi,
                    functionName: "addReview",
                    args: [BigInt(idea.id), reviewText.trim()],
                    gas: 500_000n,
                  });
                }}
                className="rounded-lg bg-indigo-500/90 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
              {isReviewPending ? "Sign..." : isReviewConfirming ? "Submitting..." : "Add review"}
              </button>
              <button
                type="button"
                disabled={
                  !isConnected ||
                  !hasCuratorRole ||
                  isMarkPending ||
                  isMarkConfirming ||
                  idea.isLowQuality
                }
                onClick={() => {
                  sendMarkLowQuality({
                    address: contracts.ideaRegistry!,
                    abi: ideaRegistryAbi,
                    functionName: "markLowQuality",
                    args: [BigInt(idea.id)],
                    gas: 500_000n,
                  });
                }}
                className="rounded-lg border border-rose-300/45 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
              {isMarkPending ? "Sign..." : isMarkConfirming ? "Marking..." : "Mark low quality"}
              </button>
            </div>
            {!hasReviewerRole && (
              <p className="text-xs text-slate-300">Review submission is available only to wallets with reviewer permissions.</p>
            )}
            {!hasCuratorRole && (
              <p className="text-xs text-slate-300">Low-quality flagging is available only to wallets with curator permissions.</p>
            )}
            {hasReviewerRole && (
              <p className="text-xs text-slate-300">Contract rule: review is allowed only while idea status is Voting.</p>
            )}
            {hasCuratorRole && (
              <p className="text-xs text-slate-300">Contract rule: low quality mark is allowed only while idea status is Voting.</p>
            )}
            {isAuthor && (
              <p className="text-xs text-slate-300">
                Final completion unlocks automatically after stage 2 proof approval.
              </p>
            )}
            {reviewError && <p className="max-w-full overflow-hidden break-words text-xs text-rose-300">{prettyTxError(reviewError.message)}</p>}
            {markError && <p className="max-w-full overflow-hidden break-words text-xs text-rose-300">{prettyTxError(markError.message)}</p>}
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-[#2a2d3a]">
          <div className="overflow-x-auto">
          <table className="min-w-[520px] w-full text-left text-sm">
            <thead className="border-b border-white/10 text-xs uppercase tracking-[0.13em] text-slate-400">
              <tr>
                <th className="px-4 py-3">Voters {voters.length}</th>
                <th className="px-4 py-3">Address</th>
              </tr>
            </thead>
            <tbody>
              {voters.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-slate-300" colSpan={2}>
                    No on-chain voters found for this idea yet.
                  </td>
                </tr>
              ) : (
                voters.map((voterAddress) => (
                  <tr key={voterAddress} className="border-b border-white/5 last:border-b-0">
                    <td className="px-4 py-3 font-semibold text-slate-100">{shortAddress(voterAddress)}</td>
                    <td className="px-4 py-3 break-all text-slate-200">{voterAddress}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </div>

        {idea.link ? (
          <a
            href={idea.link}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex items-center gap-2 rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-200"
          >
            Open reference
            <FaExternalLinkAlt className="text-xs" />
          </a>
        ) : null}
      </article>
    </section>
  );
}
