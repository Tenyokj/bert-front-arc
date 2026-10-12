import {
  BinaryProposalSettled,
  BinaryVoteCast,
  BinaryVotingOpened,
  SlateRoundCreated,
  SlateRoundSettled,
  SlateRoundVoteCast,
} from "../generated/templates/CommunityVotingModule/CommunityVotingModule";
import { CommunityBinaryVote, CommunitySlateVote } from "../generated/schema";
import { communityForModule, ensureProposal, ensureRound } from "./helpers";

export function handleBinaryVotingOpened(event: BinaryVotingOpened): void {
  const community = communityForModule(event.address); if (community == null) return;
  const proposal = ensureProposal(community, event.params.proposalId, event.block.timestamp);
  proposal.mode = 0; proposal.status = "InVoting"; proposal.binaryDeadline = event.params.votingDeadline; proposal.save();
}
export function handleBinaryVoteCast(event: BinaryVoteCast): void {
  const community = communityForModule(event.address); if (community == null) return;
  const proposal = ensureProposal(community, event.params.proposalId, event.block.timestamp);
  if (event.params.choice == 1) proposal.yesVotes = proposal.yesVotes.plus(event.params.amount);
  else if (event.params.choice == 2) proposal.noVotes = proposal.noVotes.plus(event.params.amount);
  proposal.save();
  const vote = new CommunityBinaryVote(event.transaction.hash.toHex() + "-" + event.logIndex.toString());
  vote.proposal = proposal.id; vote.voter = event.params.voter; vote.choice = event.params.choice;
  vote.amount = event.params.amount; vote.timestamp = event.block.timestamp; vote.txHash = event.transaction.hash; vote.save();
}
export function handleBinaryProposalSettled(event: BinaryProposalSettled): void {
  const community = communityForModule(event.address); if (community == null) return;
  const proposal = ensureProposal(community, event.params.proposalId, event.block.timestamp);
  proposal.accepted = event.params.accepted; proposal.executionAmount = event.params.executionBudget;
  proposal.settled = true; proposal.status = event.params.accepted ? "Accepted" : "Settled"; proposal.save();
}
export function handleSlateRoundCreated(event: SlateRoundCreated): void {
  const community = communityForModule(event.address); if (community == null) return;
  const round = ensureRound(community, event.params.roundId, event.block.timestamp);
  round.origin = event.params.origin; round.votingDeadline = event.params.votingDeadline; round.save();
}
export function handleSlateRoundVoteCast(event: SlateRoundVoteCast): void {
  const community = communityForModule(event.address); if (community == null) return;
  const round = ensureRound(community, event.params.roundId, event.block.timestamp);
  round.totalVotes = round.totalVotes.plus(event.params.amount); round.save();
  const proposal = ensureProposal(community, event.params.proposalId, event.block.timestamp);
  proposal.mode = 1; proposal.status = "InRoundVoting"; proposal.round = round.id; proposal.save();
  const vote = new CommunitySlateVote(event.transaction.hash.toHex() + "-" + event.logIndex.toString());
  vote.round = round.id; vote.proposal = proposal.id; vote.voter = event.params.voter;
  vote.amount = event.params.amount; vote.timestamp = event.block.timestamp; vote.txHash = event.transaction.hash; vote.save();
}
export function handleSlateRoundSettled(event: SlateRoundSettled): void {
  const community = communityForModule(event.address); if (community == null) return;
  const round = ensureRound(community, event.params.roundId, event.block.timestamp);
  round.winningProposalId = event.params.winner; round.winningVotes = event.params.winningVotes;
  round.executionAmount = event.params.executionBudget; round.settled = true; round.save();
  const proposal = ensureProposal(community, event.params.winner, event.block.timestamp);
  proposal.status = "WonRound"; proposal.executionAmount = event.params.executionBudget; proposal.save();
}
