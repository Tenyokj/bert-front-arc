import { Address, BigInt } from "@graphprotocol/graph-ts";

import {
  IdeaCreated,
  IdeaMarkedLowQuality,
  IdeaRegistryUpgradeable,
  IdeaStatusUpdated,
  ReviewAdded,
} from "../generated/IdeaRegistry/IdeaRegistryUpgradeable";
import {
  AuthorStakeDeposited,
  AuthorStakeSlashed,
  FundsDeposited,
  FundsDistributed,
  IdeaFundsReserved,
  PoolBalanceUpdated,
} from "../generated/FundingPool/FundingPoolUpgradeable";
import {
  GrantManagerUpgradeable,
  MilestoneApproved,
  MilestoneProofSubmitted,
  MilestoneRejected,
  MilestoneReviewed,
  RoundFunded,
} from "../generated/GrantManager/GrantManagerUpgradeable";
import {
  ReputationDecreased,
  ReputationDeinitialized,
  ReputationIncreased,
  ReputationInitialized,
  ReputationSet,
  ReputationSystemUpgradeable,
} from "../generated/ReputationSystem/ReputationSystemUpgradeable";
import {
  VoteCast,
  VotingRoundEnded,
  VotingRoundStarted,
} from "../generated/VotingSystem/VotingSystemUpgradeable";
import {
  ProgressionReset,
  RoleGranted,
  VoterProgressionUpgradeable,
  WinningVoteRegistered,
} from "../generated/VoterProgression/VoterProgressionUpgradeable";
import {
  Account,
  Distribution,
  GrantPayout,
  Idea,
  MilestoneRequest,
  ProtocolStats,
  Review,
  Round,
  Vote,
} from "../generated/schema";

const ZERO = BigInt.zero();
const ONE = BigInt.fromI32(1);
const PROTOCOL_STATS_ID = "current";

function ensureAccount(address: Address, blockNumber: BigInt): Account {
  const id = address.toHexString();
  let account = Account.load(id);
  if (account == null) {
    account = new Account(id);
    account.address = address;
    account.reputation = ZERO;
    account.reputationInitialized = false;
    account.winningVotes = ZERO;
    account.isCurator = false;
    account.isReviewer = false;
    account.votesToCurator = ZERO;
    account.votesToReviewer = ZERO;
    account.createdIdeaCount = ZERO;
    account.createdAtBlock = blockNumber;
  }
  account.updatedAtBlock = blockNumber;
  return account;
}

function ensureRound(roundId: BigInt, blockNumber: BigInt): Round {
  const id = roundId.toString();
  let round = Round.load(id);
  if (round == null) {
    round = new Round(id);
    round.startTime = ZERO;
    round.endTime = ZERO;
    round.active = false;
    round.ended = false;
    round.totalVotes = ZERO;
    round.winningIdeaId = ZERO;
    round.winningVotes = ZERO;
    round.ideaIds = [];
    round.fundingReserved = ZERO;
    round.distributedAmount = ZERO;
    round.createdAtBlock = blockNumber;
  }
  round.updatedAtBlock = blockNumber;
  return round;
}

function ensureProtocolStats(blockNumber: BigInt): ProtocolStats {
  let stats = ProtocolStats.load(PROTOCOL_STATS_ID);
  if (stats == null) {
    stats = new ProtocolStats(PROTOCOL_STATS_ID);
    stats.totalTreasury = ZERO;
    stats.totalDeposited = ZERO;
    stats.totalDistributed = ZERO;
    stats.distributionCount = ZERO;
    stats.totalIdeas = ZERO;
    stats.totalRounds = ZERO;
    stats.activeRounds = ZERO;
    stats.createdAtBlock = blockNumber;
  }
  stats.updatedAtBlock = blockNumber;
  return stats;
}

function ensureIdea(ideaId: BigInt, blockNumber: BigInt): Idea {
  const id = ideaId.toString();
  let idea = Idea.load(id);
  if (idea == null) {
    idea = new Idea(id);
    idea.title = "";
    idea.description = "";
    idea.link = "";
    idea.createdAt = ZERO;
    idea.totalVotes = ZERO;
    idea.status = 0;
    idea.isLowQuality = false;
    idea.authorStake = ZERO;
    idea.reviewCount = 0;
    idea.createdAtBlock = blockNumber;
  }
  idea.updatedAtBlock = blockNumber;
  return idea;
}

function ensureGrantPayout(roundId: BigInt, blockNumber: BigInt): GrantPayout {
  const id = roundId.toString();
  let payout = GrantPayout.load(id);
  if (payout == null) {
    payout = new GrantPayout(id);
    payout.roundId = roundId;
    payout.round = id;
    payout.ideaId = ZERO;
    payout.totalGrant = ZERO;
    payout.released = ZERO;
    payout.initialClaimed = false;
    payout.inProcessPaid = false;
    payout.completionPaid = false;
    payout.createdAtBlock = blockNumber;
  }
  payout.updatedAtBlock = blockNumber;
  return payout;
}

function ensureMilestoneRequest(
  roundId: BigInt,
  stage: i32,
  blockNumber: BigInt,
): MilestoneRequest {
  const id = milestoneEntityId(roundId, stage);
  let request = MilestoneRequest.load(id);
  if (request == null) {
    request = new MilestoneRequest(id);
    request.roundId = roundId;
    request.round = roundId.toString();
    request.ideaId = ZERO;
    request.stage = stage;
    request.requestId = ZERO;
    request.metadataURI = "";
    request.details = "";
    request.submittedAt = ZERO;
    request.lastRejectedAt = ZERO;
    request.approvals = 0;
    request.rejections = 0;
    request.maxReviewers = 0;
    request.approvalThreshold = 0;
    request.active = false;
    request.createdAtBlock = blockNumber;
  }
  request.updatedAtBlock = blockNumber;
  return request;
}

function milestoneEntityId(roundId: BigInt, stage: i32): string {
  return roundId.toString() + "-" + stage.toString();
}

function syncIdeaFromContract(
  contractAddress: Address,
  ideaId: BigInt,
  blockNumber: BigInt,
): Idea {
  const idea = ensureIdea(ideaId, blockNumber);
  const contract = IdeaRegistryUpgradeable.bind(contractAddress);
  const result = contract.try_getIdea(ideaId);

  if (!result.reverted) {
    const value = result.value;
    idea.author = value.getAuthor();
    idea.authorAccount = value.getAuthor().toHexString();
    idea.title = value.getTitle();
    idea.description = value.getDescription();
    idea.link = value.getLink();
    idea.createdAt = value.getCreatedAt();
    idea.totalVotes = value.getTotalVotes();
    idea.status = value.getStatus();
  }

  idea.save();
  return idea;
}

function syncGrantPayoutFromContract(
  contractAddress: Address,
  roundId: BigInt,
  blockNumber: BigInt,
): GrantPayout {
  const payout = ensureGrantPayout(roundId, blockNumber);
  const contract = GrantManagerUpgradeable.bind(contractAddress);
  const value = contract.getGrantPayout(roundId);

  payout.ideaId = value.getIdeaId();
  payout.idea = value.getIdeaId().toString();
  payout.author = value.getAuthor();
  payout.authorAccount = value.getAuthor().toHexString();
  payout.totalGrant = value.getTotalGrant();
  payout.released = value.getReleased();
  payout.initialClaimed = value.getInitialClaimed();
  payout.inProcessPaid = value.getInProcessPaid();
  payout.completionPaid = value.getCompletionPaid();
  payout.save();

  return payout;
}

function syncMilestoneRequestFromContract(
  contractAddress: Address,
  roundId: BigInt,
  stage: i32,
  blockNumber: BigInt,
): MilestoneRequest {
  const request = ensureMilestoneRequest(roundId, stage, blockNumber);
  const payout = syncGrantPayoutFromContract(contractAddress, roundId, blockNumber);
  const contract = GrantManagerUpgradeable.bind(contractAddress);
  const value = contract.getMilestoneRequest(roundId, stage);

  request.ideaId = payout.ideaId;
  request.idea = payout.ideaId.toString();
  request.requestId = value.getRequestId();
  request.metadataURI = value.getMetadataURI();
  request.details = value.getDetails();
  request.submittedAt = value.getSubmittedAt();
  request.lastRejectedAt = value.getLastRejectedAt();
  request.approvals = value.getApprovals();
  request.rejections = value.getRejections();
  request.maxReviewers = value.getMaxReviewers();
  request.approvalThreshold = value.getApprovalThreshold();
  request.active = value.getActive();
  request.save();

  return request;
}

function syncProgressionFromContract(
  contractAddress: Address,
  voter: Address,
  blockNumber: BigInt,
): Account {
  const account = ensureAccount(voter, blockNumber);
  const contract = VoterProgressionUpgradeable.bind(contractAddress);
  const value = contract.getProgressionStatus(voter);

  account.winningVotes = value.getWinningVotes();
  account.isCurator = value.getIsCurator();
  account.isReviewer = value.getIsReviewer();
  account.votesToCurator = value.getVotesToCurator();
  account.votesToReviewer = value.getVotesToReviewer();
  account.save();

  return account;
}

function syncReputationFromContract(
  contractAddress: Address,
  author: Address,
  blockNumber: BigInt,
): Account {
  const account = ensureAccount(author, blockNumber);
  const contract = ReputationSystemUpgradeable.bind(contractAddress);
  const initializedResult = contract.try_isInitialized(author);

  if (!initializedResult.reverted) {
    account.reputationInitialized = initializedResult.value;
  }

  const reputationResult = contract.try_getReputation(author);
  if (!reputationResult.reverted) {
    account.reputation = reputationResult.value;
  }

  account.save();
  return account;
}

export function handleVotingRoundStarted(event: VotingRoundStarted): void {
  const round = ensureRound(event.params.roundId, event.block.number);
  round.startTime = event.params.startTime;
  round.endTime = event.params.endTime;
  round.active = true;
  round.ended = false;
  round.winningIdeaId = ZERO;
  round.winningVotes = ZERO;
  round.ideaIds = event.params.ideaIds;
  round.save();

  const stats = ensureProtocolStats(event.block.number);
  if (event.params.roundId.gt(stats.totalRounds)) {
    stats.totalRounds = event.params.roundId;
  }
  stats.activeRounds = stats.activeRounds.plus(ONE);
  stats.save();

  const ideaIds = event.params.ideaIds;
  for (let i = 0; i < ideaIds.length; i++) {
    const idea = ensureIdea(ideaIds[i], event.block.number);
    idea.roundId = event.params.roundId;
    idea.round = event.params.roundId.toString();
    idea.status = 1;
    idea.save();
  }
}

export function handleVotingRoundEnded(event: VotingRoundEnded): void {
  const round = ensureRound(event.params.roundId, event.block.number);
  round.active = false;
  round.ended = true;
  round.winningIdeaId = event.params.winningIdeaId;
  round.winningVotes = event.params.winningVotes;
  round.save();

  const stats = ensureProtocolStats(event.block.number);
  if (stats.activeRounds.gt(ZERO)) {
    stats.activeRounds = stats.activeRounds.minus(ONE);
  }
  stats.save();
}

export function handleVoteCast(event: VoteCast): void {
  const voterAccount = ensureAccount(event.params.voter, event.block.number);
  voterAccount.save();

  const vote = new Vote(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString(),
  );
  vote.roundId = event.params.roundId;
  vote.ideaId = event.params.ideaId;
  vote.voter = event.params.voter;
  vote.voterAccount = event.params.voter.toHexString();
  vote.amount = event.params.amount;
  vote.txHash = event.transaction.hash;
  vote.timestamp = event.block.timestamp;
  vote.blockNumber = event.block.number;
  vote.save();

  const round = ensureRound(event.params.roundId, event.block.number);
  round.totalVotes = round.totalVotes.plus(event.params.amount);
  round.save();

  const idea = ensureIdea(event.params.ideaId, event.block.number);
  idea.totalVotes = idea.totalVotes.plus(event.params.amount);
  idea.save();
}

export function handleIdeaCreated(event: IdeaCreated): void {
  const account = ensureAccount(event.params.author, event.block.number);
  account.createdIdeaCount = account.createdIdeaCount.plus(ONE);
  account.save();

  const idea = syncIdeaFromContract(
    event.address,
    event.params.ideaId,
    event.block.number,
  );
  idea.author = event.params.author;
  idea.authorAccount = event.params.author.toHexString();
  idea.title = event.params.title;
  idea.status = 0;
  idea.save();

  const stats = ensureProtocolStats(event.block.number);
  if (event.params.ideaId.gt(stats.totalIdeas)) {
    stats.totalIdeas = event.params.ideaId;
  }
  stats.save();
}

export function handleIdeaStatusUpdated(event: IdeaStatusUpdated): void {
  const idea = ensureIdea(event.params.ideaId, event.block.number);
  idea.status = event.params.newStatus;
  idea.save();
}

export function handleIdeaMarkedLowQuality(event: IdeaMarkedLowQuality): void {
  const idea = ensureIdea(event.params.ideaId, event.block.number);
  idea.isLowQuality = true;
  idea.save();

  const curator = ensureAccount(event.params.curator, event.block.number);
  curator.save();
}

export function handleReviewAdded(event: ReviewAdded): void {
  const reviewer = ensureAccount(event.params.reviewer, event.block.number);
  reviewer.save();

  const contract = IdeaRegistryUpgradeable.bind(event.address);
  const reviewCountResult = contract.try_getReviewCount(event.params.ideaId);
  const idea = ensureIdea(event.params.ideaId, event.block.number);

  let reviewIndex = ZERO;
  let comment = "";

  if (!reviewCountResult.reverted && reviewCountResult.value.gt(ZERO)) {
    reviewIndex = reviewCountResult.value.minus(ONE);
    idea.reviewCount = reviewCountResult.value.toI32();

    const reviewResult = contract.try_ideaReviews(event.params.ideaId, reviewIndex);
    if (!reviewResult.reverted) {
      comment = reviewResult.value.getComment();
    }
  } else {
    idea.reviewCount = idea.reviewCount + 1;
    reviewIndex = BigInt.fromI32(idea.reviewCount - 1);
  }

  idea.save();

  const review = new Review(
    event.params.ideaId.toString() + "-" + reviewIndex.toString(),
  );
  review.ideaId = event.params.ideaId;
  review.idea = event.params.ideaId.toString();
  review.reviewer = event.params.reviewer;
  review.reviewerAccount = event.params.reviewer.toHexString();
  review.comment = comment;
  review.txHash = event.transaction.hash;
  review.timestamp = event.block.timestamp;
  review.blockNumber = event.block.number;
  review.save();
}

export function handleAuthorStakeDeposited(event: AuthorStakeDeposited): void {
  const author = ensureAccount(event.params.author, event.block.number);
  author.save();

  const idea = ensureIdea(event.params.ideaId, event.block.number);
  idea.authorStake = idea.authorStake.plus(event.params.amount);
  idea.save();
}

export function handleFundsDeposited(event: FundsDeposited): void {
  const stats = ensureProtocolStats(event.block.number);
  stats.totalDeposited = stats.totalDeposited.plus(event.params.amount);
  stats.save();
}

export function handleAuthorStakeSlashed(event: AuthorStakeSlashed): void {
  const idea = ensureIdea(event.params.ideaId, event.block.number);
  if (event.params.amount.ge(idea.authorStake)) {
    idea.authorStake = ZERO;
  } else {
    idea.authorStake = idea.authorStake.minus(event.params.amount);
  }
  idea.save();
}

export function handleIdeaFundsReserved(event: IdeaFundsReserved): void {
  const round = ensureRound(event.params.roundId, event.block.number);
  round.fundingReserved = round.fundingReserved.plus(event.params.amount);
  round.save();
}

export function handleFundsDistributed(event: FundsDistributed): void {
  const round = ensureRound(event.params.roundId, event.block.number);
  round.distributedAmount = round.distributedAmount.plus(event.params.amount);
  round.save();

  const stats = ensureProtocolStats(event.block.number);
  stats.totalDistributed = stats.totalDistributed.plus(event.params.amount);
  stats.distributionCount = stats.distributionCount.plus(ONE);
  stats.save();

  const distribution = new Distribution(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString(),
  );
  distribution.roundId = event.params.roundId;
  distribution.ideaId = event.params.ideaId;
  distribution.amount = event.params.amount;
  distribution.txHash = event.transaction.hash;
  distribution.timestamp = event.block.timestamp;
  distribution.blockNumber = event.block.number;
  distribution.save();
}

export function handlePoolBalanceUpdated(event: PoolBalanceUpdated): void {
  const stats = ensureProtocolStats(event.block.number);
  stats.totalTreasury = event.params.newBalance;
  stats.save();
}

export function handleRoundFunded(event: RoundFunded): void {
  syncGrantPayoutFromContract(event.address, event.params.roundId, event.block.number);
}

export function handleMilestoneProofSubmitted(
  event: MilestoneProofSubmitted,
): void {
  syncMilestoneRequestFromContract(
    event.address,
    event.params.roundId,
    event.params.stage,
    event.block.number,
  );
}

export function handleMilestoneReviewed(event: MilestoneReviewed): void {
  const reviewer = ensureAccount(event.params.reviewer, event.block.number);
  reviewer.save();

  const request = syncMilestoneRequestFromContract(
    event.address,
    event.params.roundId,
    event.params.stage,
    event.block.number,
  );
  request.lastReviewedAt = event.block.timestamp;
  request.lastReviewer = event.params.reviewer;
  request.lastReviewApproved = event.params.approved;
  request.save();
}

export function handleMilestoneRejected(event: MilestoneRejected): void {
  syncMilestoneRequestFromContract(
    event.address,
    event.params.roundId,
    event.params.stage,
    event.block.number,
  );
}

export function handleMilestoneApproved(event: MilestoneApproved): void {
  syncGrantPayoutFromContract(event.address, event.params.roundId, event.block.number);
  syncMilestoneRequestFromContract(
    event.address,
    event.params.roundId,
    event.params.stage,
    event.block.number,
  );
}

export function handleWinningVoteRegistered(
  event: WinningVoteRegistered,
): void {
  syncProgressionFromContract(event.address, event.params.voter, event.block.number);
}

export function handleRoleGranted(event: RoleGranted): void {
  syncProgressionFromContract(event.address, event.params.voter, event.block.number);
}

export function handleProgressionReset(event: ProgressionReset): void {
  syncProgressionFromContract(event.address, event.params.voter, event.block.number);
}

export function handleReputationInitialized(
  event: ReputationInitialized,
): void {
  syncReputationFromContract(event.address, event.params.user, event.block.number);
}

export function handleReputationIncreased(event: ReputationIncreased): void {
  syncReputationFromContract(event.address, event.params.author, event.block.number);
}

export function handleReputationDecreased(event: ReputationDecreased): void {
  syncReputationFromContract(event.address, event.params.author, event.block.number);
}

export function handleReputationSet(event: ReputationSet): void {
  syncReputationFromContract(event.address, event.params.author, event.block.number);
}

export function handleReputationDeinitialized(
  event: ReputationDeinitialized,
): void {
  syncReputationFromContract(event.address, event.params.author, event.block.number);
}
