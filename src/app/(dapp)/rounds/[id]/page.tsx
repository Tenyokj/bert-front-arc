"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { formatUnits, parseUnits } from "viem";
import { FaArrowLeft } from "react-icons/fa";
import { useAccount, usePublicClient, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";

import { AddressIdentity } from "@/components/AddressIdentity";
import {
  contracts,
  governanceTokenAbi,
  grantManagerAbi,
  ideaRegistryAbi,
  votingSystemAbi,
} from "@/lib/contracts";
import { formatDateTimeFromUnix, mapIdeaStatus, shortAddress } from "@/lib/dapp-onchain";
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
  statusCode: bigint;
  votersCount: number;
  isReviewed: boolean;
};

function safeParseAmount(value: string) {
  const input = value.trim();
  if (!input) return 0n;
  try {
    return parseUnits(input, 18);
  } catch {
    return -1n;
  }
}

function formatBtk(value: bigint | number | undefined) {
  if (value === undefined) return "-";
  const raw = typeof value === "bigint" ? value : BigInt(value);
  const asNumber = Number(formatUnits(raw, 18));
  if (!Number.isFinite(asNumber)) return `${formatUnits(raw, 18)} BTK`;
  return `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: asNumber >= 1000 ? 0 : 4,
  }).format(asNumber)} BTK`;
}

function prettyRoundError(message?: string) {
  if (!message) return "";
  if (message.includes("RoundNotEnded")) return "Round can only be ended after the voting window closes.";
  if (message.includes("RoundAlreadyEnded")) return "This round has already been ended.";
  if (message.includes("AlreadyDistributed")) return "Initial 30% has already been claimed for this winning idea.";
  if (message.includes("NotAuthor")) return "Only the winning idea author can claim the initial 30%.";
  if (message.includes("NoWinner")) return "There is no winning idea yet for this round.";
  if (message.includes("Internal error")) return "Transaction reverted by contract rules. Check round state and wallet permissions.";
  return message;
}

export default function RoundDetailsPage() {
  const params = useParams<{ id: string }>();
  const client = usePublicClient();
  const { address, isConnected } = useAccount();

  const [round, setRound] = useState<RoundInfo | null>(null);
  const [ideas, setIdeas] = useState<RoundIdea[]>([]);
  const [voters, setVoters] = useState<Array<{ address: string; ideaId: number }>>([]);
  const [voteAmountByIdea, setVoteAmountByIdea] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const {
    data: approveTxHash,
    isPending: isApprovePending,
    error: approveError,
    writeContract: writeApprove,
  } = useWriteContract();
  const sendApprove = writeApprove as unknown as (variables: Record<string, unknown>) => void;
  const { isLoading: isApproveConfirming, isSuccess: isApproveConfirmed } = useWaitForTransactionReceipt({
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
    hash: claimTxHash,
  });

  const roundId = Number(params?.id);

  const { data: minStake } = useReadContract({
    address: contracts.votingSystem,
    abi: votingSystemAbi,
    functionName: "minStake",
    query: {
      enabled: Boolean(contracts.votingSystem),
    },
  });

  const { data: allowance } = useReadContract({
    address: contracts.governanceToken,
    abi: governanceTokenAbi,
    functionName: "allowance",
    args:
      address && contracts.fundingPool ? [address, contracts.fundingPool] : undefined,
    query: {
      enabled: Boolean(address && contracts.governanceToken && contracts.fundingPool),
    },
  });

  const { data: tokenBalance } = useReadContract({
    address: contracts.governanceToken,
    abi: governanceTokenAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(address && contracts.governanceToken),
    },
  });

  const { data: userHasVoted } = useReadContract({
    address: contracts.votingSystem,
    abi: votingSystemAbi,
    functionName: "hasVoted",
    args: Number.isFinite(roundId) && address ? [BigInt(roundId), address] : undefined,
    query: {
      enabled: Boolean(contracts.votingSystem && address && Number.isFinite(roundId)),
    },
  });

  const { data: canClaimGrantRaw } = useReadContract({
    address: contracts.grantManager,
    abi: grantManagerAbi,
    functionName: "canClaimGrant",
    args: Number.isFinite(roundId) ? [BigInt(roundId)] : undefined,
    query: {
      enabled: Boolean(contracts.grantManager && Number.isFinite(roundId)),
    },
  });
  const minStakeValue = minStake as bigint | undefined;
  const allowanceValue = allowance as bigint | undefined;
  const tokenBalanceValue = tokenBalance as bigint | undefined;
  const userHasVotedValue = userHasVoted as boolean | undefined;

  const canClaimGrant = Array.isArray(canClaimGrantRaw) ? Boolean(canClaimGrantRaw[0]) : false;
  const claimGrantReason = Array.isArray(canClaimGrantRaw)
    ? String(canClaimGrantRaw[1] ?? "")
    : "";
  const winnerIdea = ideas.find((idea) => BigInt(idea.id) === round?.winningIdeaId);
  const winnerAuthor = winnerIdea?.author;
  const isWinnerAuthor = Boolean(address && winnerAuthor && address.toLowerCase() === winnerAuthor.toLowerCase());
  const canClaimByWallet = canClaimGrant && isWinnerAuthor;

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
                    statusCode: BigInt(idea.status || "0"),
                    votersCount: votersByIdea.get(ideaId)?.size ?? 0,
                    isReviewed: false,
                  } satisfies RoundIdea;
                })
                .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

              if (contracts.ideaRegistry && ideaDetails.length > 0) {
                const reviewedRows = await Promise.all(
                  ideaDetails.map(async (entry) => {
                    try {
                      const count = (await readContract({
                        address: contracts.ideaRegistry!,
                        abi: ideaRegistryAbi,
                        functionName: "getReviewCount",
                        args: [BigInt(entry.id)],
                      })) as bigint;
                      return [entry.id, count > 0n] as const;
                    } catch {
                      return [entry.id, false] as const;
                    }
                  })
                );
                const reviewedMap = new Map<number, boolean>(reviewedRows);
                for (const entry of ideaDetails) {
                  entry.isReviewed = reviewedMap.get(entry.id) ?? false;
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
            const [idea, ideaRoundVotes, ideaVoters, reviewCount] = (await Promise.all([
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
            ])) as [
              readonly [bigint, string, string, string, string, bigint, bigint, bigint],
              bigint,
              string[],
              bigint,
            ];

            return {
              id: Number(idea[0]),
              author: idea[1],
              title: idea[2],
              description: idea[3],
              totalVotesOverall: idea[6],
              roundVotes: ideaRoundVotes,
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
        if (!cancelled) setLoadError(error instanceof Error ? error.message : "Failed to load round");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [client, roundId, isVoteConfirmed, isClaimConfirmed, isApproveConfirmed, isEndConfirmed]);

  const votersPreview = useMemo(() => voters.slice(0, 12), [voters]);

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

  const canVote = isConnected && round.active && !round.ended && !Boolean(userHasVotedValue);
  const canEndRound = round.active && !round.ended && Math.floor(Date.now() / 1000) > Number(round.endTime);
  const shouldShowEndRoundButton = round.active && !round.ended;
  const shouldShowClaimButton = Boolean(contracts.grantManager && round.ended && round.winningIdeaId > 0n && canClaimByWallet);

  return (
    <section className="space-y-6">
      <Link href="/rounds" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white">
        <FaArrowLeft />
        Back to rounds
      </Link>

      <article className="rounded-[28px] border border-white/10 bg-[#313443] p-4 shadow-[0_14px_30px_rgba(0,0,0,0.3)] sm:p-5 md:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h1 className="font-[var(--font-display)] text-3xl text-white sm:text-4xl md:text-5xl">Round #{round.id}</h1>
            <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-xs font-semibold text-cyan-300">
              {round.ended ? "Ended" : round.active ? "Live" : "Scheduled"}
            </span>
          </div>
        </div>

        <p className="mt-2 text-sm text-slate-400">
          Voting window: {formatDateTimeFromUnix(round.startTime)} - {formatDateTimeFromUnix(round.endTime)}
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <p className="text-sm text-slate-200">Total votes: {formatBtk(round.totalVotes)}</p>
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
              {isClaimPending ? "Awaiting signature..." : isClaimConfirming ? "Claiming..." : "Claim Initial 30%"}
            </button>
          ) : null}
        </div>

        {round.active && (
          <p className="mt-2 text-xs text-slate-300">
            {userHasVotedValue ? "Your wallet already voted in this round." : "You can vote once in this round."}
          </p>
        )}
        {!canEndRound && round.active && !round.ended && (
          <p className="mt-2 text-xs text-slate-300">Round can be ended only after `endTime`.</p>
        )}
        {claimError?.message && <p className="mt-2 max-w-full overflow-hidden break-words text-xs text-rose-300">{prettyRoundError(claimError.message)}</p>}
        {claimTxHash && <p className="mt-2 break-all text-xs text-slate-300">Claim tx: {claimTxHash}</p>}
        {endError?.message && <p className="mt-2 max-w-full overflow-hidden break-words text-xs text-rose-300">{prettyRoundError(endError.message)}</p>}
        {endTxHash && <p className="mt-2 break-all text-xs text-slate-300">End round tx: {endTxHash}</p>}
        {contracts.grantManager && (
          <p className="mt-2 text-xs text-slate-300">
            Claim status: {canClaimByWallet ? "eligible" : "not eligible"}
            {!isWinnerAuthor && round.winningIdeaId > 0n
              ? " (connected wallet is not winner author)"
              : claimGrantReason
                ? ` (${claimGrantReason})`
                : ""}
          </p>
        )}
        {round.winningIdeaId > 0n && (
          <p className="mt-2 text-xs text-slate-300">
            New payout flow: claim 30% here, then submit and review milestone proofs on the winning idea page for the 40% in-process and final 30% release.
          </p>
        )}
        {contracts.governanceToken && contracts.fundingPool && (
          <p className="mt-2 text-xs text-slate-300">
            Wallet balance: {formatBtk(tokenBalanceValue)} | Allowance to FundingPool: {formatBtk(allowanceValue)} | Min stake: {formatBtk(minStakeValue)}
          </p>
        )}

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
        </div>
      </article>

      <section className="rounded-[28px] border border-white/10 bg-[#313443] p-4 shadow-[0_14px_30px_rgba(0,0,0,0.28)] sm:p-5 md:p-7">
        <h2 className="font-[var(--font-display)] text-2xl text-white sm:text-3xl md:text-4xl">Ideas in this round</h2>
        <p className="mt-2 text-sm text-slate-300">On-chain `ideaIds`: {round.ideaIds.join(", ") || "-"}</p>

        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          {ideas.map((idea) => {
            const amountInput = voteAmountByIdea[idea.id] ?? "";
            const parsedAmount = safeParseAmount(amountInput);
            const needApprove = (allowanceValue ?? 0n) < parsedAmount;
            const insufficientBalance = (tokenBalanceValue ?? 0n) < parsedAmount;
            const belowMinStake = minStakeValue !== undefined && parsedAmount > 0n && parsedAmount < minStakeValue;
            const invalidVoteAmount = parsedAmount <= 0n || insufficientBalance || belowMinStake;
            const votingBusy = isVotePending || isVoteConfirming || isApprovePending || isApproveConfirming;
            const isOwnIdea = Boolean(address) && idea.author.toLowerCase() === address!.toLowerCase();

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
                    Round votes: {formatBtk(idea.roundVotes)}
                  </p>
                  <p className="rounded-lg border border-white/10 bg-[#232632] px-2.5 py-2">
                    Voters: {idea.votersCount}
                  </p>
                  <p className="col-span-2 rounded-lg border border-white/10 bg-[#232632] px-2.5 py-2">
                    All-time votes: {formatBtk(idea.totalVotesOverall)}
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
                    placeholder="Vote amount in BTK"
                  />
                  {needApprove ? (
                    <button
                      type="button"
                      disabled={!isConnected || parsedAmount <= 0n || isApprovePending || isApproveConfirming || !contracts.governanceToken || !contracts.fundingPool || isOwnIdea}
                      onClick={() => {
                        if (!contracts.governanceToken || !contracts.fundingPool || parsedAmount <= 0n) return;
                        sendApprove({
                          address: contracts.governanceToken,
                          abi: governanceTokenAbi,
                          functionName: "approve",
                          args: [contracts.fundingPool, parsedAmount],
                          gas: 200_000n,
                        });
                      }}
                      className="rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isApprovePending ? "Sign approve..." : isApproveConfirming ? "Approving..." : "Approve"}
                    </button>
                  ) : (
                  <button
                    type="button"
                    disabled={!canVote || invalidVoteAmount || votingBusy || isOwnIdea}
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
                    {isVotePending ? "Sign..." : isVoteConfirming ? "Voting..." : "Vote"}
                  </button>
                  )}
                </div>
                {insufficientBalance && <p className="mt-2 text-xs text-rose-300">Insufficient BTK balance for this vote amount.</p>}
                {belowMinStake && <p className="mt-2 text-xs text-rose-300">Amount is below `minStake`.</p>}
                {isOwnIdea && <p className="mt-2 text-xs text-rose-300">You cannot vote for your own idea.</p>}
                {!isOwnIdea && userHasVotedValue && <p className="mt-2 text-xs text-rose-300">You already voted in this round (one vote per wallet per round).</p>}
              </div>
            );
          })}
        </div>

        {approveError?.message && <p className="mt-4 max-w-full overflow-hidden break-words text-sm text-rose-300">{prettyRoundError(approveError.message)}</p>}
        {approveTxHash && <p className="mt-2 break-all text-xs text-slate-300">Approve tx: {approveTxHash}</p>}
        {voteError?.message && <p className="mt-4 max-w-full overflow-hidden break-words text-sm text-rose-300">{prettyRoundError(voteError.message)}</p>}
        {voteTxHash && <p className="mt-2 break-all text-xs text-slate-300">Vote tx: {voteTxHash}</p>}
      </section>
    </section>
  );
}
