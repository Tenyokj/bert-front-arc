import { Address, BigInt } from "@graphprotocol/graph-ts";
import {
  Community,
  CommunityHubSource,
  CommunityMember,
  CommunityProposal,
  CommunitySlateRound,
  CommunityTreasurySource,
  CommunityValidatorEpoch,
  CommunityWithdrawal,
} from "../generated/schema";

export const ZERO = BigInt.zero();

export function communityEntityId(factory: Address, communityId: BigInt): string {
  return factory.toHexString() + "-" + communityId.toString();
}

export function memberEntityId(community: Community, account: Address): string {
  return community.id + "-" + account.toHexString();
}

export function proposalEntityId(community: Community, proposalId: BigInt): string {
  return community.id + "-proposal-" + proposalId.toString();
}

export function roundEntityId(community: Community, roundId: BigInt): string {
  return community.id + "-round-" + roundId.toString();
}

export function epochEntityId(community: Community, epochId: BigInt): string {
  return community.id + "-epoch-" + epochId.toString();
}

export function withdrawalEntityId(community: Community, requestId: BigInt): string {
  return community.id + "-withdrawal-" + requestId.toString();
}

export function communityForHub(address: Address): Community | null {
  const source = CommunityHubSource.load(address.toHexString());
  return source == null ? null : Community.load(source.community);
}

export function communityForTreasury(address: Address): Community | null {
  const source = CommunityTreasurySource.load(address.toHexString());
  return source == null ? null : Community.load(source.community);
}

export function ensureMember(community: Community, account: Address, timestamp: BigInt): CommunityMember {
  const id = memberEntityId(community, account);
  let member = CommunityMember.load(id);
  if (member == null) {
    member = new CommunityMember(id);
    member.community = community.id;
    member.account = account;
    member.active = false;
    member.isAdmin = false;
    member.isValidator = false;
    member.membershipStake = ZERO;
    member.proposalPoints = ZERO;
    member.validatorEligible = false;
  }
  member.updatedAt = timestamp;
  return member;
}

export function ensureProposal(community: Community, proposalId: BigInt, timestamp: BigInt): CommunityProposal {
  const id = proposalEntityId(community, proposalId);
  let proposal = CommunityProposal.load(id);
  if (proposal == null) {
    proposal = new CommunityProposal(id);
    proposal.community = community.id;
    proposal.proposalId = proposalId;
    proposal.creator = Address.zero();
    proposal.origin = -1;
    proposal.mode = -1;
    proposal.status = "Unknown";
    proposal.validationApprovals = 0;
    proposal.validationRejections = 0;
    proposal.yesVotes = ZERO;
    proposal.noVotes = ZERO;
    proposal.settled = false;
    proposal.bondAmount = ZERO;
    proposal.bondState = "None";
    proposal.executionAmount = ZERO;
    proposal.validatorRewardAmount = ZERO;
    proposal.globalReserveAmount = ZERO;
    proposal.refundLiability = ZERO;
    proposal.createdAt = timestamp;
  }
  proposal.updatedAt = timestamp;
  return proposal;
}

export function ensureRound(community: Community, roundId: BigInt, timestamp: BigInt): CommunitySlateRound {
  const id = roundEntityId(community, roundId);
  let round = CommunitySlateRound.load(id);
  if (round == null) {
    round = new CommunitySlateRound(id);
    round.community = community.id;
    round.roundId = roundId;
    round.origin = -1;
    round.votingDeadline = ZERO;
    round.totalVotes = ZERO;
    round.winningVotes = ZERO;
    round.settled = false;
    round.executionAmount = ZERO;
    round.validatorRewardAmount = ZERO;
    round.createdAt = timestamp;
  }
  round.updatedAt = timestamp;
  return round;
}

export function ensureEpoch(community: Community, epochId: BigInt, timestamp: BigInt): CommunityValidatorEpoch {
  const id = epochEntityId(community, epochId);
  let epoch = CommunityValidatorEpoch.load(id);
  if (epoch == null) {
    epoch = new CommunityValidatorEpoch(id);
    epoch.community = community.id;
    epoch.epochId = epochId;
    epoch.startTime = ZERO;
    epoch.endTime = ZERO;
    epoch.activeValidatorCount = ZERO;
    epoch.rewardPerValidator = ZERO;
    epoch.finalized = false;
  }
  epoch.updatedAt = timestamp;
  return epoch;
}

export function ensureWithdrawal(community: Community, requestId: BigInt, timestamp: BigInt): CommunityWithdrawal {
  const id = withdrawalEntityId(community, requestId);
  let withdrawal = CommunityWithdrawal.load(id);
  if (withdrawal == null) {
    withdrawal = new CommunityWithdrawal(id);
    withdrawal.community = community.id;
    withdrawal.requestId = requestId;
    withdrawal.creator = Address.zero();
    withdrawal.recipient = Address.zero();
    withdrawal.amount = ZERO;
    withdrawal.reason = "";
    withdrawal.metadataURI = "";
    withdrawal.approvals = 0;
    withdrawal.cancelled = false;
    withdrawal.executed = false;
    withdrawal.createdAt = timestamp;
  }
  withdrawal.updatedAt = timestamp;
  return withdrawal;
}
