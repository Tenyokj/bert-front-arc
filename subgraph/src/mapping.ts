import { BigInt } from "@graphprotocol/graph-ts";

import {
  VoteCast,
  VotingRoundEnded,
  VotingRoundStarted,
} from "../generated/VotingSystem/VotingSystemUpgradeable";
import {
  IdeaCreated,
  IdeaStatusUpdated,
} from "../generated/IdeaRegistry/IdeaRegistryUpgradeable";
import { Idea, Round, Vote } from "../generated/schema";

function ensureRound(roundId: BigInt, blockNumber: BigInt): Round {
  const id = roundId.toString();
  let round = Round.load(id);
  if (round == null) {
    round = new Round(id);
    round.startTime = BigInt.zero();
    round.endTime = BigInt.zero();
    round.active = false;
    round.ended = false;
    round.totalVotes = BigInt.zero();
    round.winningIdeaId = BigInt.zero();
    round.ideaIds = [];
    round.createdAtBlock = blockNumber;
  }
  round.updatedAtBlock = blockNumber;
  return round;
}

function ensureIdea(ideaId: BigInt, blockNumber: BigInt): Idea {
  const id = ideaId.toString();
  let idea = Idea.load(id);
  if (idea == null) {
    idea = new Idea(id);
    idea.title = "";
    idea.description = "";
    idea.link = "";
    idea.createdAt = BigInt.zero();
    idea.totalVotes = BigInt.zero();
    idea.status = 0;
    idea.createdAtBlock = blockNumber;
  }
  idea.updatedAtBlock = blockNumber;
  return idea;
}

export function handleVotingRoundStarted(event: VotingRoundStarted): void {
  const round = ensureRound(event.params.roundId, event.block.number);
  round.startTime = event.params.startTime;
  round.endTime = event.params.endTime;
  round.active = true;
  round.ended = false;
  round.winningIdeaId = BigInt.zero();
  round.ideaIds = event.params.ideaIds;
  round.save();

  const ideaIds = event.params.ideaIds;
  for (let i = 0; i < ideaIds.length; i++) {
    const idea = ensureIdea(ideaIds[i], event.block.number);
    idea.roundId = event.params.roundId;
    idea.status = 1;
    idea.save();
  }
}

export function handleVotingRoundEnded(event: VotingRoundEnded): void {
  const round = ensureRound(event.params.roundId, event.block.number);
  round.active = false;
  round.ended = true;
  round.winningIdeaId = event.params.winningIdeaId;
  round.save();
}

export function handleVoteCast(event: VoteCast): void {
  const vote = new Vote(event.transaction.hash.toHex() + "-" + event.logIndex.toString());
  vote.roundId = event.params.roundId;
  vote.ideaId = event.params.ideaId;
  vote.voter = event.params.voter;
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
  const idea = ensureIdea(event.params.ideaId, event.block.number);
  idea.author = event.params.author;
  idea.title = event.params.title;
  idea.createdAt = event.block.timestamp;
  idea.status = 0;
  idea.save();
}

export function handleIdeaStatusUpdated(event: IdeaStatusUpdated): void {
  const idea = ensureIdea(event.params.ideaId, event.block.number);
  idea.status = event.params.newStatus;
  idea.save();
}
