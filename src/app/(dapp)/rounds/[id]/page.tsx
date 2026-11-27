"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { formatUnits, parseUnits } from "viem";
import { FaArrowLeft } from "react-icons/fa";
import { useAccount, useBlock, usePublicClient, useReadContract, useWriteContract } from "wagmi";
import { useProtocolReceipt as useWaitForTransactionReceipt } from "@/hooks/useProtocolReceipt";

import { LifecyclePanel } from "@/components/dapp/LifecyclePanel";
import { milestoneMode, roundJourney, roundPhase, utcDeadline, voteReadiness } from "@/lib/detail-lifecycle";
import { defaultChain } from "@/lib/web3";
import { AddressIdentity } from "@/components/AddressIdentity";
import { HumanVerificationPanel } from "@/components/HumanVerificationPanel";
import { fundingRoundCanSettle } from "@/lib/funding-round-clock";
import {
  contracts,
  fundingPoolAbi,
  grantManagerAbi,
  ideaRegistryAbi,
  usdcAbi,
  votingSystemAbi,
} from "@/lib/contracts";
import { mapIdeaStatus, shortAddress, USDC_DECIMALS } from "@/lib/dapp-onchain";
import {
  fetchIdeasByIdsFromSubgraph,
  fetchRoundByIdFromSubgraph,
  fetchAllVotesByRoundFromSubgraph,
  hasSubgraphConfigured,
} from "@/lib/subgraph";

type RoundInfo = {
  id: number;
  ideaIds: number[];
  startTime: bigint;
  endTime: bigint;
  active: boolean;
  ended: boolean;
  totalVotes: bigint;
  winningIdeaId: bigint;
};

type RoundIdea = {
  id: number;
  author: string;
  title: string;
  description: string;
  totalVotesOverall: bigint;
  roundVotes: bigint;
  minimumNetFunding: bigint;
  statusCode: bigint;
  votersCount: number;
  isReviewed: boolean;
};

type Pledge = {
  ideaId: bigint;
  amount: bigint;
  refundClaimed: boolean;
};

function toPledge(row: unknown): Pledge {
  if (Array.isArray(row)) {
    return {
      ideaId: BigInt(row[0] ?? 0),
      amount: BigInt(row[1] ?? 0),
      refundClaimed: Boolean(row[2]),
    };
  }

  return { ideaId: 0n, amount: 0n, refundClaimed: false };
}

function safeParseAmount(value: string) {
  const input = value.trim();
  if (!input) return 0n;
  try {
    return parseUnits(input, USDC_DECIMALS);
  } catch {
    return -1n;
  }
}

function formatUsdc(value: bigint | number | undefined) {
  if (value === undefined) return "Unavailable";
  const raw = typeof value === "bigint" ? value : BigInt(value);
  const asNumber = Number(formatUnits(raw, USDC_DECIMALS));
  if (!Number.isFinite(asNumber)) return `${formatUnits(raw, USDC_DECIMALS)} USDC`;
  return `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: asNumber >= 1000 ? 0 : 4,
  }).format(asNumber)} USDC`;
}

function prettyRoundError(message?: string) {
  if (!message) return "";
  if (message.includes("rate limited") || message.includes("request limit reached")) {
    return "Arc RPC is rate limiting requests right now. Wait a few seconds and retry.";
  }
  if (message.includes("RoundNotEnded")) return "Round can only be ended after the voting window closes.";
  if (message.includes("RoundAlreadyEnded")) return "This round has already been ended.";
  if (message.includes("AlreadyDistributed")) return "The initial grant tranche has already been claimed for this winning idea.";
  if (message.includes("NotAuthor")) return "Only the winning idea author can claim the initial grant tranche.";
  if (message.includes("NoWinner")) return "There is no winning idea yet for this round.";
  if (message.includes("WinningParticipationUnavailable")) return "This wallet does not have an eligible winning pledge for participation credit.";
  if (message.includes("WinningParticipationAlreadyClaimed")) return "Participation credit was already claimed by this wallet.";
  if (message.includes("PledgeRefundUnavailable")) return "This pledge is not refundable in the current funding-round state.";
  if (message.includes("FundingTargetNotMet")) return "No proposal reached its required post-fee funding target, so the round will settle without a winner.";
  if (message.includes("Internal error")) return "Transaction reverted by contract rules. Check round state and wallet permissions.";
  return message;
}

export default function RoundDetailsPage() {
  const params = useParams<{ id: string }>();
  const client = usePublicClient({ chainId: defaultChain.id });
  const { address, chainId, isConnected } = useAccount();

  const [round, setRound] = useState<RoundInfo | null>(null);
  const [ideas, setIdeas] = useState<RoundIdea[]>([]);
  const [voters, setVoters] = useState<Array<{ address: string; ideaId: number }>>([]);
  const [voteAmountByIdea, setVoteAmountByIdea] = useState<Record<number, string>>({});
  const [voterPage, setVoterPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [allowanceOwner, setAllowanceOwner] = useState<string | null>(null);
  const [balanceOwner, setBalanceOwner] = useState<string | null>(null);
  const { data: latestBlock } = useBlock({
    chainId: defaultChain.id,
    query: { enabled: Boolean(round?.active && !round.ended), refetchInterval: 5_000 },
  });

  const {
    data: approveTxHash,
    isPending: isApprovePending,
    error: approveError,
    writeContract: writeApprove,
  } = useWriteContract();
  const sendApprove = writeApprove as unknown as (variables: Record<string, unknown>) => void;
  const { isLoading: isApproveConfirming, isSuccess: isApproveConfirmed } = useWaitForTransactionReceipt({
    chainId: defaultChain.id,
    hash: approveTxHash,
  });

  const {
    data: endTxHash,
    isPending: isEndPending,
    error: endError,
    writeContract: writeEndRound,
  } = useWriteContract();
  const sendEndRound = writeEndRound as unknown as (variables: Record<string, unknown>) => void;
  const { isLoading: isEndConfirming, isSuccess: isEndConfirmed } = useWaitForTransactionReceipt({
    chainId: defaultChain.id,
    hash: endTxHash,
  });

  const {
    data: voteTxHash,
    isPending: isVotePending,
    error: voteError,
    writeContract: writeVote,
  } = useWriteContract();
  const sendVote = writeVote as unknown as (variables: Record<string, unknown>) => void;
  const { isLoading: isVoteConfirming, isSuccess: isVoteConfirmed } = useWaitForTransactionReceipt({
    chainId: defaultChain.id,
    hash: voteTxHash,
  });

  const {
    data: claimTxHash,
    isPending: isClaimPending,
    error: claimError,
    writeContract: writeClaim,
  } = useWriteContract();
  const sendClaim = writeClaim as unknown as (variables: Record<string, unknown>) => void;
  const { isLoading: isClaimConfirming, isSuccess: isClaimConfirmed } = useWaitForTransactionReceipt({
    chainId: defaultChain.id,
    hash: claimTxHash,
  });

  const {
    data: refundTxHash,
    isPending: isRefundPending,
    error: refundError,
    writeContract: writeRefund,
  } = useWriteContract();
  const sendRefund = writeRefund as unknown as (variables: Record<string, unknown>) => void;
  const { isLoading: isRefundConfirming, isSuccess: isRefundConfirmed } = useWaitForTransactionReceipt({
    chainId: defaultChain.id,
    hash: refundTxHash,
  });
  const {
    data: participationTxHash,
    isPending: isParticipationPending,
    error: participationError,
    writeContract: writeParticipation,
  } = useWriteContract();
  const sendParticipation = writeParticipation as unknown as (variables: Record<string, unknown>) => void;
  const { isLoading: isParticipationConfirming, isSuccess: isParticipationConfirmed } = useWaitForTransactionReceipt({
    chainId: defaultChain.id,
    hash: participationTxHash,
  });

  const roundId = Number(params?.id);

  const { data: minStake } = useReadContract({
    chainId: defaultChain.id,
    address: contracts.votingSystem,
    abi: votingSystemAbi,
    functionName: "minStake",
    query: {
      enabled: Boolean(contracts.votingSystem),
    },
  });

  const { data: maxVoteAmount } = useReadContract({
    chainId: defaultChain.id,
    address: contracts.votingSystem,
    abi: votingSystemAbi,
    functionName: "maxVoteAmount",
    query: {
      enabled: Boolean(contracts.votingSystem),
    },
  });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    chainId: defaultChain.id,
    address: contracts.usdc,
    abi: usdcAbi,
    functionName: "allowance",
    args:
      address && contracts.fundingPool ? [address, contracts.fundingPool] : undefined,
    query: {
      enabled: Boolean(address && contracts.usdc && contracts.fundingPool),
    },
  });

  const { data: tokenBalance, refetch: refetchTokenBalance } = useReadContract({
    chainId: defaultChain.id,
    address: contracts.usdc,
    abi: usdcAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(address && contracts.usdc),
    },
  });

  const { data: userHasVoted } = useReadContract({
    chainId: defaultChain.id,
    address: contracts.votingSystem,
    abi: votingSystemAbi,
    functionName: "hasVoted",
    args: Number.isFinite(roundId) && address ? [BigInt(roundId), address] : undefined,
    query: {
      enabled: Boolean(contracts.votingSystem && address && Number.isFinite(roundId)),
    },
  });

  const { data: canClaimGrantRaw } = useReadContract({
    chainId: defaultChain.id,
    address: contracts.grantManager,
    abi: grantManagerAbi,
    functionName: "canClaimGrant",
    args: Number.isFinite(roundId) ? [BigInt(roundId)] : undefined,
    query: {
      enabled: Boolean(contracts.grantManager && Number.isFinite(roundId)),
    },
  });
  const { data: pledgeRaw, refetch: refetchPledge } = useReadContract({
    chainId: defaultChain.id,
    address: contracts.fundingPool,
    abi: fundingPoolAbi,
    functionName: "getPledge",
    args: Number.isFinite(roundId) && address ? [BigInt(roundId), address] : undefined,
    query: { enabled: Boolean(contracts.fundingPool && address && Number.isFinite(roundId)) },
  });
  const { data: fundingRoundSettlementRaw } = useReadContract({
    chainId: defaultChain.id,
    address: contracts.fundingPool,
    abi: fundingPoolAbi,
    functionName: "getFundingRoundSettlement",
    args: Number.isFinite(roundId) ? [BigInt(roundId)] : undefined,
    query: { enabled: Boolean(contracts.fundingPool && Number.isFinite(roundId)) },
  });
  const { data: grantRefundActiveRaw } = useReadContract({
    chainId: defaultChain.id,
    address: contracts.fundingPool,
    abi: fundingPoolAbi,
    functionName: "grantRefundActive",
    args: Number.isFinite(roundId) ? [BigInt(roundId)] : undefined,
    query: { enabled: Boolean(contracts.fundingPool && Number.isFinite(roundId)) },
  });
  const { data: isBackerMilestoneRoundRaw } = useReadContract({
    chainId: defaultChain.id,
    address: contracts.votingSystem,
    abi: votingSystemAbi,
    functionName: "isBackerMilestoneRound",
    args: Number.isFinite(roundId) ? [BigInt(roundId)] : undefined,
    query: { enabled: Boolean(contracts.votingSystem && Number.isFinite(roundId)) },
  });
  const { data: winningParticipationClaimedRaw, refetch: refetchWinningParticipation } = useReadContract({
    chainId: defaultChain.id,
    address: contracts.votingSystem,
    abi: votingSystemAbi,
    functionName: "winningParticipationClaimed",
    args: Number.isFinite(roundId) && address ? [BigInt(roundId), address] : undefined,
    query: { enabled: Boolean(contracts.votingSystem && Number.isFinite(roundId) && address) },
  });
  const minStakeValue = minStake as bigint | undefined;
  const maxVoteAmountValue = maxVoteAmount as bigint | undefined;
  const allowanceValue = allowance as bigint | undefined;
  const tokenBalanceValue = tokenBalance as bigint | undefined;
  const userHasVotedValue = userHasVoted as boolean | undefined;
  const pledge = toPledge(pledgeRaw);
  const fundingRoundSettlement = Array.isArray(fundingRoundSettlementRaw)
    ? {
        opened: Boolean(fundingRoundSettlementRaw[0]),
        settled: Boolean(fundingRoundSettlementRaw[1]),
        winningIdeaId: BigInt(fundingRoundSettlementRaw[2] ?? 0),
      }
    : { opened: false, settled: false, winningIdeaId: 0n };
  const isBackerMilestoneRound = Boolean(isBackerMilestoneRoundRaw);
  const normalizedAddress = address?.toLowerCase() ?? null;

  const canClaimGrant = Array.isArray(canClaimGrantRaw) ? Boolean(canClaimGrantRaw[0]) : false;
  const claimGrantReason = Array.isArray(canClaimGrantRaw)
    ? String(canClaimGrantRaw[1] ?? "")
    : "";
  const winnerIdea = ideas.find((idea) => BigInt(idea.id) === round?.winningIdeaId);
  const winnerAuthor = winnerIdea?.author;
  const isWinnerAuthor = Boolean(address && winnerAuthor && address.toLowerCase() === winnerAuthor.toLowerCase());
  const canClaimByWallet = canClaimGrant && isWinnerAuthor;
  const hasPledge = pledge.amount > 0n;
  const pledgeWon = hasPledge && pledge.ideaId === fundingRoundSettlement.winningIdeaId;
  const canClaimPledgeRefund =
    fundingRoundSettlement.settled &&
    hasPledge &&
    !pledge.refundClaimed &&
    (fundingRoundSettlement.winningIdeaId === 0n || !pledgeWon || grantRefundActiveRaw === true);
  const canClaimWinningParticipation = Boolean(round?.ended && pledgeWon && grantRefundActiveRaw === false && winningParticipationClaimedRaw === false);

  useEffect(() => {
    if (!isApproveConfirmed) return;
    void refetchAllowance();
  }, [isApproveConfirmed, refetchAllowance]);

  useEffect(() => {
    if (!isVoteConfirmed) return;
    void Promise.all([refetchAllowance(), refetchTokenBalance(), refetchPledge()]);
  }, [isVoteConfirmed, refetchAllowance, refetchPledge, refetchTokenBalance]);

  useEffect(() => {
    if (!isRefundConfirmed) return;
    void Promise.all([refetchPledge(), refetchTokenBalance()]);
  }, [isRefundConfirmed, refetchPledge, refetchTokenBalance]);

  useEffect(() => {
    if (!isParticipationConfirmed) return;
    void refetchWinningParticipation();
  }, [isParticipationConfirmed, refetchWinningParticipation]);

  useEffect(() => {
    setAllowanceOwner(null);
    setBalanceOwner(null);
    if (!normalizedAddress) {
      setVoteAmountByIdea({});
      return;
    }
    void Promise.all([refetchAllowance(), refetchTokenBalance()]);
  }, [normalizedAddress, refetchAllowance, refetchTokenBalance]);

  useEffect(() => {
    if (!normalizedAddress || allowanceValue === undefined) return;
    setAllowanceOwner(normalizedAddress);
  }, [normalizedAddress, allowanceValue]);

  useEffect(() => {
    if (!normalizedAddress || tokenBalanceValue === undefined) return;
    setBalanceOwner(normalizedAddress);
  }, [normalizedAddress, tokenBalanceValue]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!client || !contracts.votingSystem || !contracts.ideaRegistry || !Number.isFinite(roundId)) {
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
            const subgraphRound = await fetchRoundByIdFromSubgraph(String(roundId));
            if (subgraphRound) {
              const ideaIds = (subgraphRound.ideaIds || []).map((id) => Number(id));
              const [subgraphIdeas, subgraphVotes] = await Promise.all([
                fetchIdeasByIdsFromSubgraph(ideaIds.map((id) => String(id))),
                fetchAllVotesByRoundFromSubgraph(String(roundId)),
              ]);

              const voteSumsByIdea = new Map<number, bigint>();
              const votersByIdea = new Map<number, Set<string>>();
              const flatVoters: Array<{ address: string; ideaId: number }> = [];

              for (const vote of subgraphVotes) {
                const ideaId = Number(vote.ideaId);
                if (!Number.isFinite(ideaId) || ideaId <= 0) continue;

                const prev = voteSumsByIdea.get(ideaId) ?? 0n;
                voteSumsByIdea.set(ideaId, prev + BigInt(vote.amount || "0"));

                const normalized = vote.voter.toLowerCase();
                if (!votersByIdea.has(ideaId)) votersByIdea.set(ideaId, new Set());
                const ideaVoters = votersByIdea.get(ideaId)!;
                if (!ideaVoters.has(normalized)) {
                  ideaVoters.add(normalized);
                  flatVoters.push({ address: vote.voter, ideaId });
                }
              }

              const ideaMap = new Map(subgraphIdeas.map((entry) => [Number(entry.id), entry]));
              const ideaDetails: RoundIdea[] = ideaIds
                .map((ideaId) => {
                  const idea = ideaMap.get(ideaId);
                  if (!idea) return null;
                  return {
                    id: ideaId,
                    author: idea.author,
                    title: idea.title,
                    description: idea.description,
                    totalVotesOverall: BigInt(idea.totalVotes || "0"),
                    roundVotes: voteSumsByIdea.get(ideaId) ?? 0n,
                    minimumNetFunding: 0n,
                    statusCode: BigInt(idea.status || "0"),
                    votersCount: votersByIdea.get(ideaId)?.size ?? 0,
                    isReviewed: false,
                  } satisfies RoundIdea;
                })
                .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

              if (contracts.ideaRegistry && ideaDetails.length > 0) {
                const minimumFundingRows = await Promise.all(
                  ideaDetails.map(async (entry) => {
                    try {
                      const minimumNetFunding = (await readContract({
                        address: contracts.ideaRegistry!,
                        abi: ideaRegistryAbi,
                        functionName: "minimumNetFundingByIdea",
                        args: [BigInt(entry.id)],
                      })) as bigint;
                      return [entry.id, minimumNetFunding] as const;
                    } catch {
                      return [entry.id, 0n] as const;
                    }
                  })
                );
                const minimumFundingMap = new Map<number, bigint>(minimumFundingRows);
                for (const entry of ideaDetails) {
                  entry.minimumNetFunding = minimumFundingMap.get(entry.id) ?? 0n;
                }
              }

              const nextRound: RoundInfo = {
                id: Number(subgraphRound.id),
                ideaIds,
                startTime: BigInt(subgraphRound.startTime),
                endTime: BigInt(subgraphRound.endTime),
                active: Boolean(subgraphRound.active),
                ended: Boolean(subgraphRound.ended),
                totalVotes: BigInt(subgraphRound.totalVotes || "0"),
                winningIdeaId: BigInt(subgraphRound.winningIdeaId || "0"),
              };

              if (!cancelled) {
                setRound(nextRound);
                setIdeas(ideaDetails);
                setVoters(flatVoters);
              }
              return;
            }
          } catch {
            // Fallback to direct RPC reads below.
          }
        }

        const row = (await readContract({
          address: contracts.votingSystem,
          abi: votingSystemAbi,
          functionName: "getRoundInfo",
          args: [BigInt(roundId)],
        })) as readonly [bigint, bigint[], bigint, bigint, boolean, boolean, bigint, bigint, bigint];

        if (row[0] === 0n) {
          throw new Error("Round not found");
        }

        const nextRound: RoundInfo = {
          id: Number(row[0]),
          ideaIds: row[1].map((value) => Number(value)),
          startTime: row[2],
          endTime: row[3],
          active: row[4],
          ended: row[5],
          totalVotes: row[6],
          winningIdeaId: row[7],
        };

        const ideaDetails = await Promise.all(
          nextRound.ideaIds.map(async (ideaId) => {
            const [idea, ideaRoundVotes, ideaVoters, reviewCount, minimumNetFunding] = (await Promise.all([
              readContract({
                address: contracts.ideaRegistry!,
                abi: ideaRegistryAbi,
                functionName: "getIdea",
                args: [BigInt(ideaId)],
              }),
              readContract({
                address: contracts.votingSystem!,
                abi: votingSystemAbi,
                functionName: "getVotesForIdea",
                args: [BigInt(roundId), BigInt(ideaId)],
              }),
              readContract({
                address: contracts.votingSystem!,
                abi: votingSystemAbi,
                functionName: "getVotersForIdea",
                args: [BigInt(roundId), BigInt(ideaId)],
              }),
              readContract({
                address: contracts.ideaRegistry!,
                abi: ideaRegistryAbi,
                functionName: "getReviewCount",
                args: [BigInt(ideaId)],
              }),
              readContract({
                address: contracts.ideaRegistry!,
                abi: ideaRegistryAbi,
                functionName: "minimumNetFundingByIdea",
                args: [BigInt(ideaId)],
              }),
            ])) as [
              readonly [bigint, string, string, string, string, bigint, bigint, bigint],
              bigint,
              string[],
              bigint,
              bigint,
            ];

            return {
              id: Number(idea[0]),
              author: idea[1],
              title: idea[2],
              description: idea[3],
              totalVotesOverall: idea[6],
              roundVotes: ideaRoundVotes,
              minimumNetFunding,
              statusCode: idea[7],
              votersCount: ideaVoters.length,
              isReviewed: reviewCount > 0n,
            } satisfies RoundIdea;
          })
        );

        const votersByIdea = await Promise.all(
          nextRound.ideaIds.map(async (ideaId) => {
            const addresses = (await readContract({
              address: contracts.votingSystem!,
              abi: votingSystemAbi,
              functionName: "getVotersForIdea",
              args: [BigInt(roundId), BigInt(ideaId)],
            })) as string[];
            return addresses.map((entryAddress) => ({ address: entryAddress, ideaId }));
          })
        );

        if (!cancelled) {
          setRound(nextRound);
          setIdeas(ideaDetails);
          setVoters(votersByIdea.flat());
        }
      } catch (error) {
        const message = error instanceof Error ? prettyRoundError(error.message) : "Failed to load round";
        if (!cancelled) setLoadError(message);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [client, roundId, isVoteConfirmed, isClaimConfirmed, isApproveConfirmed, isEndConfirmed]);

  const voterPages = Math.max(1, Math.ceil(voters.length / 12));
  const currentVoterPage = Math.min(voterPage, voterPages);
  const votersPreview = useMemo(() => voters.slice((currentVoterPage - 1) * 12, currentVoterPage * 12), [voters, currentVoterPage]);

  if (!contracts.votingSystem || !contracts.ideaRegistry) {
    return (
      <p className="rounded-xl border border-amber-300/35 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
        Set <code>NEXT_PUBLIC_VOTING_SYSTEM_ADDRESS</code> and <code>NEXT_PUBLIC_IDEA_REGISTRY_ADDRESS</code> in `.env`.
      </p>
    );
  }

  if (isLoading) {
    return <p className="rounded-xl border border-white/10 bg-[#313443] px-4 py-3 text-sm text-slate-300">Loading on-chain round...</p>;
  }

  if (loadError || !round) {
    return <p className="rounded-xl border border-rose-300/35 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{loadError || "Round not found"}</p>;
  }

  const voteBlocker = voteReadiness({ connected: isConnected, correctChain: chainId === defaultChain.id, round, timestamp: latestBlock?.timestamp, hasVoted: userHasVotedValue });
  const canVote = voteBlocker === null;
  const payoutModeKnown = typeof isBackerMilestoneRoundRaw === "boolean";
  // The contract uses block.timestamp, not the visitor's potentially skewed computer clock.
  const canEndRound = fundingRoundCanSettle(round, latestBlock?.timestamp);
  const shouldShowEndRoundButton = round.active && !round.ended;
  const shouldShowClaimButton = Boolean(contracts.grantManager && round.ended && round.winningIdeaId > 0n && canClaimByWallet);

  return (
    <section className="space-y-6">
      <Link href="/rounds" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white">
        <FaArrowLeft />
        Back to rounds
      </Link>

      <fieldset disabled={isConnected && chainId !== defaultChain.id} className="min-w-0 space-y-6">
      <article className="rounded-[28px] border border-white/10 bg-[#313443] p-4 shadow-[0_14px_30px_rgba(0,0,0,0.3)] sm:p-5 md:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h1 className="font-[var(--font-display)] text-3xl text-white sm:text-4xl md:text-5xl">Round #{round.id}</h1>
            <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-xs font-semibold text-cyan-300">
              {roundPhase(round, latestBlock?.timestamp)}
            </span>
          </div>
        </div>

        <p className="mt-2 text-sm text-slate-400">
          Voting window: {utcDeadline(round.startTime)} - {utcDeadline(round.endTime)}
        </p>

        <div className="mt-6">
          <LifecyclePanel title="From pledge to grant" steps={roundJourney(round, latestBlock?.timestamp)} mode={milestoneMode(isBackerMilestoneRoundRaw)}
            deadlines={[{ label: "Voting opens", value: utcDeadline(round.startTime) }, { label: "Voting closes", value: utcDeadline(round.endTime) }, { label: "Latest chain time", value: utcDeadline(latestBlock?.timestamp) }]}
            next={round.ended ? round.winningIdeaId > 0n ? "The selected author checks their claim. Other pledgers inspect refunds; winning pledgers follow the idea's milestone reviews." : "Pledgers check their refund controls below. This round has no selected grant." : canEndRound ? "Any connected wallet can request settlement. A transaction is still required; inspect its result below." : voteBlocker ?? "Choose a proposal below. Check the amount, approve USDC if needed, then submit the separate pledge transaction."}
            href={round.ended && round.winningIdeaId > 0n ? `/ideas/${round.winningIdeaId}` : "#round-ideas"}
            linkLabel={round.ended && round.winningIdeaId > 0n ? "Open selected idea" : "Inspect proposals"} />
        </div>

        <p className="mt-4 text-xs text-slate-300">Before pledging: <a href="#round-verification" className="text-cyan-200 underline underline-offset-4">inspect verification and voting policy below</a>. Contract checks still apply even when the voting window is open.</p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <p className="text-sm text-slate-200">Total votes: {formatUsdc(round.totalVotes)}</p>
          {fundingRoundSettlement.settled && fundingRoundSettlement.winningIdeaId === 0n && (
            <span className="rounded-full border border-amber-300/40 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-100">
              No proposal cleared its funding target
            </span>
          )}
          {shouldShowEndRoundButton ? (
            <button
              disabled={!isConnected || !canEndRound || isEndPending || isEndConfirming}
              onClick={() =>
                sendEndRound({
                  address: contracts.votingSystem!,
                  abi: votingSystemAbi,
                  functionName: "endVotingRound",
                  args: [BigInt(round.id)],
                  gas: 4_000_000n,
                })
              }
              className="rounded-lg bg-indigo-500/90 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isEndPending ? "Awaiting signature..." : isEndConfirming ? "Ending..." : "End Round"}
            </button>
          ) : null}
          {round.winningIdeaId > 0n && (
            <span className="rounded-full border border-emerald-300/40 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
              Winner: Idea #{round.winningIdeaId.toString()}
            </span>
          )}
          {shouldShowClaimButton ? (
            <button
              disabled={!isConnected || isClaimPending || isClaimConfirming}
              onClick={() => {
                sendClaim({
                  address: contracts.grantManager!,
                  abi: grantManagerAbi,
                  functionName: "claimGrant",
                  args: [BigInt(round.id)],
                  gas: 8_000_000n,
                });
              }}
              className="rounded-lg bg-emerald-500/90 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isClaimPending ? "Awaiting signature..." : isClaimConfirming ? "Claiming..." : payoutModeKnown ? `Claim Initial ${isBackerMilestoneRound ? "20" : "30"}%` : "Claim initial tranche"}
            </button>
          ) : null}
          {canClaimWinningParticipation ? (
            <button
              disabled={!isConnected || isParticipationPending || isParticipationConfirming}
              onClick={() => sendParticipation({ address: contracts.votingSystem!, abi: votingSystemAbi, functionName: "claimWinningParticipation", args: [BigInt(round.id)], gas: 500_000n })}
              className="rounded-lg border border-cyan-300/40 bg-cyan-500/10 px-4 py-2 text-xs font-semibold text-cyan-100 transition-colors hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isParticipationPending ? "Awaiting signature..." : isParticipationConfirming ? "Claiming..." : "Claim winning participation"}
            </button>
          ) : null}
        </div>

        {round.active && (
          <p className="mt-2 text-xs text-slate-300">
            {voteBlocker ?? "One pledge is allowed; verification, balance, allowance and contract checks still apply."}
          </p>
        )}
        {!canEndRound && round.active && !round.ended && (
          <p className="mt-2 text-xs text-slate-300">Round can be ended only after `endTime`.</p>
        )}
        {claimError?.message && <p className="mt-2 max-w-full overflow-hidden break-words text-xs text-rose-300">{prettyRoundError(claimError.message)}</p>}
        {claimTxHash && <p className="mt-2 break-all text-xs text-slate-300">Claim transaction reference: {claimTxHash}</p>}
        {endError?.message && <p className="mt-2 max-w-full overflow-hidden break-words text-xs text-rose-300">{prettyRoundError(endError.message)}</p>}
        {endTxHash && <p className="mt-2 break-all text-xs text-slate-300">Round-finalization transaction reference: {endTxHash}</p>}
        {participationError?.message && <p className="mt-2 max-w-full overflow-hidden break-words text-xs text-rose-300">{prettyRoundError(participationError.message)}</p>}
        {participationTxHash && <p className="mt-2 break-all text-xs text-slate-300">Participation transaction reference: {participationTxHash}</p>}
        {contracts.grantManager && (
          <p className="mt-2 text-xs text-slate-300">
            Grant claim status: {canClaimByWallet ? "eligible for this connected wallet" : "not yet available for this connected wallet"}
            {!isWinnerAuthor && round.winningIdeaId > 0n
              ? " (connected wallet is not winner author)"
              : claimGrantReason
                ? ` (${claimGrantReason})`
                : ""}
          </p>
        )}
        {round.winningIdeaId > 0n && (
          <p className="mt-2 text-xs text-slate-300">
            {!payoutModeKnown ? "The round's review mode could not be read. No payout schedule is assumed." : isBackerMilestoneRound
              ? "Backer-governed V2 flow: the winner claims 20%, then winning pledgers review two 40% milestones on the idea page."
              : "Legacy flow: claim 30% here, then submit and review milestone proofs on the winning idea page for the 40% in-process and final 30% release."}
          </p>
        )}
        {contracts.usdc && contracts.fundingPool && (
          <p className="mt-2 text-xs text-slate-300">
            Wallet pledge context: balance {formatUsdc(tokenBalanceValue)} | approved for FundingPool {formatUsdc(allowanceValue)} | minimum pledge {formatUsdc(minStakeValue)} | max pledge {maxVoteAmountValue === 0n ? "Cap disabled" : formatUsdc(maxVoteAmountValue)}
          </p>
        )}

        {isConnected && contracts.fundingPool && (
          <div className="mt-4 rounded-xl border border-cyan-300/20 bg-cyan-500/5 p-4 text-sm text-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-white">Your pledge</p>
                <p className="mt-1 text-xs text-slate-300">
                  {hasPledge
                    ? `${formatUsdc(pledge.amount)} pledged to Idea #${pledge.ideaId.toString()}.`
                    : pledgeRaw === undefined ? "Pledge data unavailable. No empty-wallet state is assumed." : "This wallet has not pledged in this round."}
                  {pledge.refundClaimed ? " Refund already claimed." : ""}
                </p>
              </div>
              {canClaimPledgeRefund && (
                <button
                  type="button"
                  disabled={isRefundPending || isRefundConfirming}
                  onClick={() => {
                    if (!contracts.fundingPool) return;
                    sendRefund({
                      address: contracts.fundingPool,
                      abi: fundingPoolAbi,
                      functionName: "claimPledgeRefund",
                      args: [BigInt(round.id)],
                      gas: 500_000n,
                    });
                  }}
                  className="rounded-lg border border-emerald-300/40 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isRefundPending ? "Awaiting signature..." : isRefundConfirming ? "Returning pledge..." : "Claim pledge refund"}
                </button>
              )}
            </div>
            {hasPledge && fundingRoundSettlement.settled && !canClaimPledgeRefund && !pledge.refundClaimed && pledgeWon && grantRefundActiveRaw === false && (
              <p className="mt-2 text-xs text-slate-300">Your pledge backs the selected winner and is held as grant escrow until the grant completes, expires, or is cancelled.</p>
            )}
          </div>
        )}
        {refundError?.message && <p className="mt-2 max-w-full overflow-hidden break-words text-xs text-rose-300">{prettyRoundError(refundError.message)}</p>}
        {refundTxHash && <p className="mt-2 break-all text-xs text-slate-300">Refund transaction reference: {refundTxHash}</p>}

        <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-[#2a2d3a]">
          <div className="overflow-x-auto">
          <table className="min-w-[460px] w-full text-left text-sm">
            <thead className="border-b border-white/10 text-xs uppercase tracking-[0.13em] text-slate-400">
              <tr>
                <th className="px-4 py-3">Voter {voters.length}</th>
                <th className="px-4 py-3">Idea ID</th>
              </tr>
            </thead>
            <tbody>
              {votersPreview.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-slate-300" colSpan={2}>
                    No on-chain voters yet.
                  </td>
                </tr>
              ) : (
                votersPreview.map((entry, index) => (
                  <tr key={`${entry.address}-${entry.ideaId}-${index}`} className="border-b border-white/5 last:border-b-0">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-100">{shortAddress(entry.address)}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-200">#{entry.ideaId}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
          <nav aria-label="Round voter pages" className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-4 py-3 text-xs text-slate-300">
            <span>{voters.length} loaded voters / 12 per page / Page {currentVoterPage} of {voterPages}</span>
            <div className="flex gap-3"><button type="button" disabled={currentVoterPage <= 1} onClick={() => setVoterPage(currentVoterPage - 1)} className="rounded-lg border border-white/15 px-3 py-2 disabled:opacity-40">Previous voters</button><button type="button" disabled={currentVoterPage >= voterPages} onClick={() => setVoterPage(currentVoterPage + 1)} className="rounded-lg border border-white/15 px-3 py-2 disabled:opacity-40">Next voters</button></div>
          </nav>
        </div>
      </article>

      <details id="round-verification" className="rounded-2xl border border-cyan-300/20 bg-slate-950/40 p-4 sm:p-5">
        <summary className="cursor-pointer text-sm font-semibold text-cyan-100">Verification &amp; voting policy / expand to inspect wallet access</summary>
        <div className="mt-4 space-y-4">
      <div className="rounded-3xl border border-amber-300/20 bg-[linear-gradient(135deg,rgba(251,191,36,0.10),rgba(15,23,42,0.82))] p-5 md:p-6">
        <p className="text-xs uppercase tracking-[0.28em] text-amber-300">Voting Policy</p>
        <h2 className="mt-3 font-[var(--font-display)] text-2xl text-white sm:text-3xl">
          A pledge funds a proposal. Approval only sets a spending limit.
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-300">
          Check your verification status below, inspect each proposal, then enter your pledge. The loaded minimum is {formatUsdc(minStakeValue)}; wallet cap: {maxVoteAmountValue === 0n ? "disabled" : formatUsdc(maxVoteAmountValue)}. The contract enforces the policy attached to this round; testnet demo verification is not proof of personhood.
        </p>
      </div>

      <HumanVerificationPanel />
        </div>
      </details>

      <section id="round-ideas" className="rounded-[28px] border border-white/10 bg-[#313443] p-4 shadow-[0_14px_30px_rgba(0,0,0,0.28)] sm:p-5 md:p-7">
        <h2 className="font-[var(--font-display)] text-2xl text-white sm:text-3xl md:text-4xl">Ideas in this round</h2>
        <p className="mt-2 text-sm text-slate-300">On-chain `ideaIds`: {round.ideaIds.join(", ") || "-"}</p>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">
          Open a proposal to inspect its funding target. During a live round, you can make one pledge after approving the amount; that pledge is not routed to another proposal if your choice loses.
        </p>

        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          {ideas.map((idea) => {
            const amountInput = voteAmountByIdea[idea.id] ?? "";
            const parsedAmount = safeParseAmount(amountInput);
            const allowanceReady = !normalizedAddress || allowanceOwner === normalizedAddress;
            const balanceReady = !normalizedAddress || balanceOwner === normalizedAddress;
            const effectiveAllowance = allowanceReady ? allowanceValue : undefined;
            const effectiveBalance = balanceReady ? tokenBalanceValue : undefined;
            const needApprove = (effectiveAllowance ?? 0n) < parsedAmount;
            const insufficientBalance = (effectiveBalance ?? 0n) < parsedAmount;
            const belowMinStake = minStakeValue !== undefined && parsedAmount > 0n && parsedAmount < minStakeValue;
            const aboveMaxVoteAmount =
              maxVoteAmountValue !== undefined && maxVoteAmountValue > 0n && parsedAmount > maxVoteAmountValue;
            const invalidVoteAmount = parsedAmount <= 0n || insufficientBalance || belowMinStake || aboveMaxVoteAmount;
            const votingBusy = isVotePending || isVoteConfirming || isApprovePending || isApproveConfirming;
            const isOwnIdea = Boolean(address) && idea.author.toLowerCase() === address!.toLowerCase();
            const accountDataReady = !!normalizedAddress && allowanceReady && balanceReady && effectiveAllowance !== undefined && effectiveBalance !== undefined && minStakeValue !== undefined && maxVoteAmountValue !== undefined;
            const amountHelp = voteBlocker ?? (isOwnIdea ? "Authors cannot pledge to their own idea." : !accountDataReady ? "Reading wallet balance, allowance and pledge limits. Please wait before signing." : parsedAmount <= 0n ? "Enter an amount in USDC. It is not sent until you confirm a pledge." : needApprove ? "Step 1 of 2: approve this amount. Then return here to submit the pledge." : "Step 2 of 2: allowance is sufficient. Submit your pledge; approval alone has not funded this idea.");

            return (
              <div
                key={idea.id}
                className="rounded-2xl border border-white/10 bg-[#292c39] p-4 transition-colors duration-300 hover:border-cyan-400/40"
              >
                <Link href={`/ideas/${idea.id}`} className="block">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-xl font-semibold text-white">Idea #{idea.id}</h3>
                  <div className="flex items-center gap-1.5">
                    {idea.isReviewed && (
                      <span className="rounded-full border border-emerald-300/45 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-200">
                        Reviewed
                      </span>
                    )}
                    <span className="rounded-full bg-cyan-500/10 px-2.5 py-1 text-xs font-semibold text-cyan-300">
                      {mapIdeaStatus(idea.statusCode)}
                    </span>
                  </div>
                </div>
                <p className="mt-2 text-base text-slate-100">{idea.title}</p>
                <p className="mt-2 line-clamp-2 text-sm text-slate-300">{idea.description}</p>

                <div className="mt-4 grid gap-2 text-xs text-slate-300 sm:grid-cols-2">
                  <p className="rounded-lg border border-white/10 bg-[#232632] px-2.5 py-2">
                    Gross pledges: {formatUsdc(idea.roundVotes)}
                  </p>
                  <p className="rounded-lg border border-white/10 bg-[#232632] px-2.5 py-2">
                    Minimum net target: {idea.minimumNetFunding > 0n ? formatUsdc(idea.minimumNetFunding) : "Not available"}
                  </p>
                  <p className="rounded-lg border border-white/10 bg-[#232632] px-2.5 py-2">
                    Voters: {idea.votersCount}
                  </p>
                  <p className="col-span-2 rounded-lg border border-white/10 bg-[#232632] px-2.5 py-2">
                    All-time votes: {formatUsdc(idea.totalVotesOverall)}
                  </p>
                  <div className="col-span-2 rounded-lg border border-white/10 bg-[#232632] px-2.5 py-2">
                    <p className="mb-1 text-slate-300">Author:</p>
                    <AddressIdentity address={idea.author} />
                  </div>
                </div>
                </Link>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <input
                    value={amountInput}
                    onChange={(event) => {
                      setVoteAmountByIdea((prev) => ({
                        ...prev,
                        [idea.id]: event.target.value,
                      }));
                    }}
                    className="min-w-0 flex-1 rounded-lg border border-white/10 bg-[#232632] px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400/60"
                    aria-label={`Pledge amount for idea #${idea.id} (USDC)`}
                    aria-describedby={`pledge-help-${idea.id}`}
                    placeholder="How much USDC do you want to pledge?"
                  />
                  {needApprove ? (
                    <button
                      type="button"
                      disabled={!canVote || !accountDataReady || invalidVoteAmount || isApprovePending || isApproveConfirming || !contracts.usdc || !contracts.fundingPool || isOwnIdea}
                      onClick={() => {
                        if (!contracts.usdc || !contracts.fundingPool || parsedAmount <= 0n) return;
                        sendApprove({
                          address: contracts.usdc,
                          abi: usdcAbi,
                          functionName: "approve",
                          args: [contracts.fundingPool, parsedAmount],
                          gas: 200_000n,
                        });
                      }}
                      className="rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isApprovePending ? "Sign approve..." : isApproveConfirming ? "Approving..." : "Approve USDC"}
                    </button>
                  ) : (
                  <button
                    type="button"
                    disabled={!canVote || !accountDataReady || invalidVoteAmount || votingBusy || isOwnIdea}
                    onClick={() => {
                      if (!contracts.votingSystem || invalidVoteAmount) return;
                      sendVote({
                        address: contracts.votingSystem,
                        abi: votingSystemAbi,
                        functionName: "vote",
                        args: [BigInt(round.id), BigInt(idea.id), parsedAmount],
                        gas: 3_000_000n,
                      });
                    }}
                    className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isVotePending ? "Sign..." : isVoteConfirming ? "Pledging..." : "Pledge USDC"}
                  </button>
                  )}
                </div>
                <p id={`pledge-help-${idea.id}`} className="mt-3 text-xs leading-relaxed text-slate-300">{amountHelp}</p>
                {insufficientBalance && <p className="mt-2 text-xs text-rose-300">Insufficient USDC balance for this pledge.</p>}
                {belowMinStake && <p className="mt-2 text-xs text-rose-300">Pledge is below `minStake`.</p>}
                {aboveMaxVoteAmount && <p className="mt-2 text-xs text-rose-300">Pledge is above the `maxVoteAmount` cap.</p>}
                {isOwnIdea && <p className="mt-2 text-xs text-rose-300">You cannot vote for your own idea.</p>}
                {!isOwnIdea && userHasVotedValue && <p className="mt-2 text-xs text-rose-300">You already voted in this round (one vote per wallet per round).</p>}
              </div>
            );
          })}
        </div>

        {approveError?.message && <p className="mt-4 max-w-full overflow-hidden break-words text-sm text-rose-300">{prettyRoundError(approveError.message)}</p>}
        {approveTxHash && <p className="mt-2 break-all text-xs text-slate-300">Approval transaction reference: {approveTxHash}</p>}
        {voteError?.message && <p className="mt-4 max-w-full overflow-hidden break-words text-sm text-rose-300">{prettyRoundError(voteError.message)}</p>}
        {voteTxHash && <p className="mt-2 break-all text-xs text-slate-300">Vote transaction reference: {voteTxHash}</p>}
      </section>
      </fieldset>
    </section>
  );
}
