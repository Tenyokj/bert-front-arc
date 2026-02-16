"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { FaArrowLeft, FaExternalLinkAlt } from "react-icons/fa";
import { useAccount, usePublicClient, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";

import { AddressIdentity } from "@/components/AddressIdentity";
import { contracts, ideaRegistryAbi, rolesRegistryAbi, voterProgressionAbi, votingSystemAbi } from "@/lib/contracts";
import {
  formatDateTimeFromUnix,
  formatTokenAmount,
  mapIdeaStatus,
  shortAddress,
} from "@/lib/dapp-onchain";
import {
  fetchIdeaByIdFromSubgraph,
  fetchVotesByIdeaFromSubgraph,
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
    return "Only wallets with Reviewer role can add reviews.";
  }
  if (message.includes("NotCurator")) {
    return "Only wallets with Curator role can mark ideas as low quality.";
  }
  if (message.includes("NotInVotingStatus")) {
    return "Review is allowed only while the idea is in Voting status.";
  }
  if (message.includes("NotInCorrectStatus")) {
    return "This action is not allowed for the current idea status.";
  }
  if (message.includes("NotAuthor")) {
    return "Only the idea author can perform this action.";
  }
  if (message.includes("IdeaAlreadyLowQuality")) {
    return "This idea is already marked as low quality.";
  }
  if (message.includes("Internal error")) {
    return "Transaction reverted by contract rules. Check role and idea status.";
  }
  return message;
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
    data: completeTxHash,
    isPending: isCompletePending,
    error: completeError,
    writeContract: writeMarkCompleted,
  } = useWriteContract();
  const { isLoading: isReviewConfirming, isSuccess: isReviewSuccess } = useWaitForTransactionReceipt({
    hash: reviewTxHash,
  });
  const { isLoading: isMarkConfirming, isSuccess: isMarkSuccess } = useWaitForTransactionReceipt({
    hash: markTxHash,
  });
  const { isLoading: isCompleteConfirming, isSuccess: isCompleteSuccess } = useWaitForTransactionReceipt({
    hash: completeTxHash,
  });

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

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const rawId = params?.id;
      const ideaId = Number(rawId);
      if (!client || !contracts.ideaRegistry || !Number.isFinite(ideaId)) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setLoadError(null);

      try {
        if (hasSubgraphConfigured()) {
          try {
            const subgraphIdea = await fetchIdeaByIdFromSubgraph(String(ideaId));
            if (subgraphIdea) {
              const subgraphVotes = await fetchVotesByIdeaFromSubgraph(String(ideaId), 5000);
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
                const reviewsRow = (await client.readContract({
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

        const structRow = await client.readContract({
          address: contracts.ideaRegistry,
          abi: ideaRegistryAbi,
          functionName: "getIdeaStruct",
          args: [BigInt(ideaId)],
        });

        const reviewsRow = (await client.readContract({
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
          const currentRound = (await client.readContract({
            address: contracts.votingSystem,
            abi: votingSystemAbi,
            functionName: "currentRoundId",
          })) as bigint;

          const maxRound = Number(currentRound);
          for (let rid = maxRound; rid >= 1; rid--) {
            let info: readonly [bigint, bigint[], bigint, bigint, boolean, boolean, bigint, bigint, bigint] | null = null;
            try {
              info = (await client.readContract({
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
              roundVoters = (await client.readContract({
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
  }, [client, params?.id, isReviewSuccess, isMarkSuccess, isCompleteSuccess]);

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

  return (
    <section className="space-y-6">
      <Link href="/ideas" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white">
        <FaArrowLeft />
        Back to ideas
      </Link>

      <article className="rounded-[28px] border border-white/10 bg-[#313443] p-5 shadow-[0_14px_30px_rgba(0,0,0,0.3)] md:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h1 className="font-[var(--font-display)] text-4xl text-white md:text-5xl">Idea #{idea.id}</h1>
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

        <p className="mt-3 text-2xl font-semibold text-slate-100">{idea.title}</p>
        <p className="mt-3 text-sm leading-relaxed text-slate-300">{idea.description}</p>

        <div className="mt-4 grid gap-2 text-xs text-slate-300 md:grid-cols-2 xl:grid-cols-4">
          <div className="min-w-0 rounded-lg border border-white/10 bg-[#242735] px-3 py-2">
            <p className="mb-1">Author:</p>
            <AddressIdentity address={idea.author} />
          </div>
          <p className="min-w-0 rounded-lg border border-white/10 bg-[#242735] px-3 py-2">
            Created: {formatDateTimeFromUnix(idea.createdAt)}
          </p>
          <p className="min-w-0 rounded-lg border border-white/10 bg-[#242735] px-3 py-2">
            Total votes: {formatTokenAmount(idea.totalVotes)} BTK
          </p>
          <p className="min-w-0 rounded-lg border border-white/10 bg-[#242735] px-3 py-2">
            Status code: {String(idea.statusCode)}
          </p>
        </div>

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
            <p className="mt-3 text-sm text-slate-300">No reviews yet.</p>
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
              placeholder="Write review"
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
                  writeReview({
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
                  writeMarkLowQuality({
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
              <button
                type="button"
                disabled={
                  !isConnected ||
                  !isAuthor ||
                  isCompletePending ||
                  isCompleteConfirming
                }
                onClick={() => {
                  writeMarkCompleted({
                    address: contracts.ideaRegistry!,
                    abi: ideaRegistryAbi,
                    functionName: "markAsCompleted",
                    args: [BigInt(idea.id)],
                    gas: 300_000n,
                  });
                }}
                className="rounded-lg border border-emerald-300/45 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCompletePending ? "Sign..." : isCompleteConfirming ? "Completing..." : "Mark as completed"}
              </button>
            </div>
            {!hasReviewerRole && (
              <p className="text-xs text-slate-300">Only reviewer role can submit review.</p>
            )}
            {!hasCuratorRole && (
              <p className="text-xs text-slate-300">Only curator role can mark low quality.</p>
            )}
            {hasReviewerRole && (
              <p className="text-xs text-slate-300">Contract rule: review is allowed only while idea status is Voting.</p>
            )}
            {hasCuratorRole && (
              <p className="text-xs text-slate-300">Contract rule: low quality mark is allowed only while idea status is Voting.</p>
            )}
            {reviewError && <p className="text-xs text-rose-300">{prettyTxError(reviewError.message)}</p>}
            {markError && <p className="text-xs text-rose-300">{prettyTxError(markError.message)}</p>}
            {!isAuthor && (
              <p className="text-xs text-slate-300">Only idea author can mark this idea as completed.</p>
            )}
            {isAuthor && (
              <p className="text-xs text-slate-300">
                Contract rule: completion is available only when idea status is Funded (status code 3). Current status code: {statusCodeValue.toString()}.
              </p>
            )}
            {completeError && <p className="text-xs text-rose-300">{prettyTxError(completeError.message)}</p>}
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-[#2a2d3a]">
          <table className="w-full text-left text-sm">
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
                    No on-chain voters found for this idea.
                  </td>
                </tr>
              ) : (
                voters.map((address) => (
                  <tr key={address} className="border-b border-white/5 last:border-b-0">
                    <td className="px-4 py-3 font-semibold text-slate-100">{shortAddress(address)}</td>
                    <td className="px-4 py-3 break-all text-slate-200">{address}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <a
          href={idea.link}
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-flex items-center gap-2 rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-200"
        >
          Open reference
          <FaExternalLinkAlt className="text-xs" />
        </a>
      </article>
    </section>
  );
}
