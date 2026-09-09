import { type Address, type PublicClient } from "viem";

import { communityFactoryAbi, communityHubAbi } from "@/lib/community-contracts";

export type CommunityDeployment = { creator: Address; hub: Address; treasury: Address; createdAt: bigint; name?: string; metadataURI?: string };
export type CommunityProposal = {
  id: bigint; creator: Address; origin: number; mode: number; status: number; title: string; description: string; metadataURI: string;
  createdAt: bigint; validationDeadline: bigint; votingStartedAt: bigint; votingDeadline: bigint; bondAmount: bigint;
  yesVotes: bigint; noVotes: bigint; approvalCount: bigint; rejectionCount: bigint; assignedRoundId: bigint; roundVotes: bigint; accepted: boolean; settled: boolean;
};

export type CommunityBinaryVote = { choice: number; stake: bigint };
export type CommunityProposalBond = { amount: bigint; settled: boolean };
export type CommunityRefundPreview = { amount: bigint; available: boolean };

type ReadTuple = readonly unknown[] | Record<string, unknown>;

/** Normalizes viem's positional and named Solidity tuple representations. */
function tupleValue(value: ReadTuple, index: number, name: string): unknown {
  if (Array.isArray(value)) return value[index];
  return value[name];
}

/** Converts getBinaryVote output into a stable frontend shape. */
export function normalizeCommunityBinaryVote(value: unknown): CommunityBinaryVote | null {
  if (!value || (typeof value !== "object" && !Array.isArray(value))) return null;
  const tuple = value as ReadTuple;
  const choice = tupleValue(tuple, 0, "choice");
  const stake = tupleValue(tuple, 1, "stake");
  return typeof choice === "number" && typeof stake === "bigint" ? { choice, stake } : null;
}

/** Converts getProposalBond output into a stable frontend shape. */
export function normalizeCommunityProposalBond(value: unknown): CommunityProposalBond | null {
  if (!value || (typeof value !== "object" && !Array.isArray(value))) return null;
  const tuple = value as ReadTuple;
  const amount = tupleValue(tuple, 0, "amount");
  const settled = tupleValue(tuple, 1, "settled");
  return typeof amount === "bigint" && typeof settled === "boolean" ? { amount, settled } : null;
}

/** Converts getRefundPreview output into a stable frontend shape. */
export function normalizeCommunityRefundPreview(value: unknown): CommunityRefundPreview | null {
  if (!value || (typeof value !== "object" && !Array.isArray(value))) return null;
  const tuple = value as ReadTuple;
  const amount = tupleValue(tuple, 0, "amount");
  const available = tupleValue(tuple, 1, "available");
  return typeof amount === "bigint" && typeof available === "boolean" ? { amount, available } : null;
}

const asRead = (client: PublicClient, request: Record<string, unknown>) => client.readContract(request as never) as Promise<unknown>;

/** Reads Factory deployment data and enriches it with the canonical creation-event metadata. */
export async function getCommunityDeployment(client: PublicClient, factory: Address, communityId: bigint): Promise<CommunityDeployment> {
  const deployment = await asRead(client, { address: factory, abi: communityFactoryAbi, functionName: "getCommunity", args: [communityId] }) as CommunityDeployment;
  const logs = await client.getLogs({ address: factory, event: communityFactoryAbi[0], args: { communityId }, fromBlock: 0n, toBlock: "latest" });
  const event = logs.at(-1);
  return { ...deployment, name: event?.args.name, metadataURI: event?.args.metadataURI };
}

/** Converts the exact CommunityTypes.Proposal struct returned by CommunityHub into frontend data. */
export async function getCommunityProposal(client: PublicClient, hub: Address, proposalId: bigint): Promise<CommunityProposal> {
  const value = await asRead(client, { address: hub, abi: communityHubAbi, functionName: "getProposal", args: [proposalId] }) as Record<string, unknown>;
  return { id: proposalId, creator: value.creator as Address, origin: Number(value.origin), mode: Number(value.mode), status: Number(value.status), title: value.title as string, description: value.description as string, metadataURI: value.metadataURI as string, createdAt: value.createdAt as bigint, validationDeadline: value.validationDeadline as bigint, votingStartedAt: value.votingStartedAt as bigint, votingDeadline: value.votingDeadline as bigint, bondAmount: value.bondAmount as bigint, yesVotes: value.yesVotes as bigint, noVotes: value.noVotes as bigint, approvalCount: value.approvalCount as bigint, rejectionCount: value.rejectionCount as bigint, assignedRoundId: value.assignedRoundId as bigint, roundVotes: value.roundVotes as bigint, accepted: value.accepted as boolean, settled: value.settled as boolean };
}

export function proposalStatusLabel(status: number) { return ["Pending validation", "Rejected by validators", "Ready for binary voting", "Ready for Slate Round", "Binary voting", "In Slate Round", "Accepted", "Rejected", "Won Slate Round", "Lost Slate Round", "Settled"][status] ?? "Unknown"; }
