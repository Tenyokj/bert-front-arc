import { BigInt } from "@graphprotocol/graph-ts";
import {
  AdminActionApproved, AdminActionCancelled, AdminActionExecuted, AdminActionRequested,
  AdminAdded, AdminRemoved, BinaryProposalSettled, BinaryVoteCast, BinaryVotingOpened,
  CommunityArchived, CommunityStatusChanged, MemberJoined, MembershipExited,
  MembershipExitRequested, ProposalCreated, ProposalPointAwarded, ProposalValidationFinalized,
  SlateRoundCreated, SlateRoundSettled, SlateRoundVoteCast, ValidatorAdded,
  ValidatorDecisionCast, ValidatorEligibilityReached, ValidatorRemoved,
  ValidatorRewardEpochFinalized, ValidatorRewardEpochRolled,
} from "../generated/templates/CommunityHub/CommunityHub";
import {
  CommunityAdminAction, CommunityBinaryVote, CommunitySlateVote, CommunityValidatorDecision,
} from "../generated/schema";
import {
  communityForHub, ensureEpoch, ensureMember, ensureProposal, ensureRound, proposalEntityId,
  roundEntityId,
} from "./helpers";

function actionId(communityId: string, requestId: BigInt): string {
  return communityId + "-admin-action-" + requestId.toString();
}

export function handleCommunityStatusChanged(event: CommunityStatusChanged): void {
  const community = communityForHub(event.address); if (community == null) return;
  community.status = event.params.newStatus;
  community.updatedAt = event.block.timestamp; community.updatedAtBlock = event.block.number; community.save();
}
export function handleCommunityArchived(event: CommunityArchived): void {
  const community = communityForHub(event.address); if (community == null) return;
  community.status = 2; community.active = false;
  community.updatedAt = event.block.timestamp; community.updatedAtBlock = event.block.number; community.save();
}
export function handleAdminAdded(event: AdminAdded): void { const c = communityForHub(event.address); if (c == null) return; const m = ensureMember(c, event.params.admin, event.block.timestamp); m.isAdmin = true; m.save(); }
export function handleAdminRemoved(event: AdminRemoved): void { const c = communityForHub(event.address); if (c == null) return; const m = ensureMember(c, event.params.admin, event.block.timestamp); m.isAdmin = false; m.save(); }
export function handleValidatorAdded(event: ValidatorAdded): void { const c = communityForHub(event.address); if (c == null) return; const m = ensureMember(c, event.params.validator, event.block.timestamp); m.isValidator = true; m.save(); }
export function handleValidatorRemoved(event: ValidatorRemoved): void { const c = communityForHub(event.address); if (c == null) return; const m = ensureMember(c, event.params.validator, event.block.timestamp); m.isValidator = false; m.save(); }
export function handleMemberJoined(event: MemberJoined): void { const c = communityForHub(event.address); if (c == null) return; const m = ensureMember(c, event.params.member, event.block.timestamp); m.active = true; m.membershipStake = event.params.stake; m.joinedAt = event.block.timestamp; m.exitAvailableAt = null; m.save(); }
export function handleMembershipExitRequested(event: MembershipExitRequested): void { const c = communityForHub(event.address); if (c == null) return; const m = ensureMember(c, event.params.member, event.block.timestamp); m.exitAvailableAt = event.params.availableAt; m.save(); }
export function handleMembershipExited(event: MembershipExited): void { const c = communityForHub(event.address); if (c == null) return; const m = ensureMember(c, event.params.member, event.block.timestamp); m.active = false; m.membershipStake = event.params.returnedStake; m.exitAvailableAt = null; m.save(); }

export function handleProposalCreated(event: ProposalCreated): void {
  const c = communityForHub(event.address); if (c == null) return;
  const p = ensureProposal(c, event.params.proposalId, event.block.timestamp);
  p.creator = event.params.creator; p.origin = event.params.origin; p.status = event.params.origin == 0 ? "AdminCreated" : "PendingValidation"; p.save();
}
export function handleValidatorDecisionCast(event: ValidatorDecisionCast): void {
  const c = communityForHub(event.address); if (c == null) return;
  const p = ensureProposal(c, event.params.proposalId, event.block.timestamp);
  if (event.params.approved) p.validationApprovals += 1; else p.validationRejections += 1; p.save();
  const d = new CommunityValidatorDecision(event.transaction.hash.toHex() + "-" + event.logIndex.toString()); d.proposal = p.id; d.validator = event.params.validator; d.approved = event.params.approved; d.timestamp = event.block.timestamp; d.txHash = event.transaction.hash; d.save();
}
export function handleProposalValidationFinalized(event: ProposalValidationFinalized): void { const c = communityForHub(event.address); if (c == null) return; const p = ensureProposal(c, event.params.proposalId, event.block.timestamp); p.validationApproved = event.params.approved; p.status = event.params.approved ? "ApprovedForVoting" : "RejectedByValidators"; p.save(); }
export function handleBinaryVotingOpened(event: BinaryVotingOpened): void { const c = communityForHub(event.address); if (c == null) return; const p = ensureProposal(c, event.params.proposalId, event.block.timestamp); p.mode = 0; p.status = "InVoting"; p.binaryDeadline = event.params.votingDeadline; p.save(); }
export function handleBinaryVoteCast(event: BinaryVoteCast): void { const c = communityForHub(event.address); if (c == null) return; const p = ensureProposal(c, event.params.proposalId, event.block.timestamp); if (event.params.choice == 1) p.yesVotes = p.yesVotes.plus(event.params.amount); else if (event.params.choice == 2) p.noVotes = p.noVotes.plus(event.params.amount); p.save(); const v = new CommunityBinaryVote(event.transaction.hash.toHex() + "-" + event.logIndex.toString()); v.proposal = p.id; v.voter = event.params.voter; v.choice = event.params.choice; v.amount = event.params.amount; v.timestamp = event.block.timestamp; v.txHash = event.transaction.hash; v.save(); }
export function handleBinaryProposalSettled(event: BinaryProposalSettled): void { const c = communityForHub(event.address); if (c == null) return; const p = ensureProposal(c, event.params.proposalId, event.block.timestamp); p.accepted = event.params.accepted; p.settled = true; p.status = "Settled"; p.save(); }
export function handleSlateRoundCreated(event: SlateRoundCreated): void { const c = communityForHub(event.address); if (c == null) return; const r = ensureRound(c, event.params.roundId, event.block.timestamp); r.origin = event.params.origin; r.votingDeadline = event.params.votingDeadline; r.save(); }
export function handleSlateRoundVoteCast(event: SlateRoundVoteCast): void { const c = communityForHub(event.address); if (c == null) return; const r = ensureRound(c, event.params.roundId, event.block.timestamp); r.totalVotes = r.totalVotes.plus(event.params.amount); r.save(); const p = ensureProposal(c, event.params.proposalId, event.block.timestamp); p.mode = 1; p.status = "InRoundVoting"; p.round = r.id; p.save(); const v = new CommunitySlateVote(event.transaction.hash.toHex() + "-" + event.logIndex.toString()); v.round = r.id; v.proposal = p.id; v.voter = event.params.voter; v.amount = event.params.amount; v.timestamp = event.block.timestamp; v.txHash = event.transaction.hash; v.save(); }
export function handleSlateRoundSettled(event: SlateRoundSettled): void { const c = communityForHub(event.address); if (c == null) return; const r = ensureRound(c, event.params.roundId, event.block.timestamp); r.winningProposalId = event.params.winningProposalId; r.winningVotes = event.params.winningVotes; r.totalVotes = event.params.totalVotes; r.settled = true; r.save(); const p = ensureProposal(c, event.params.winningProposalId, event.block.timestamp); p.status = "WonRound"; p.save(); }
export function handleProposalPointAwarded(event: ProposalPointAwarded): void { const c = communityForHub(event.address); if (c == null) return; const m = ensureMember(c, event.params.member, event.block.timestamp); m.proposalPoints = event.params.totalPoints; m.save(); }
export function handleValidatorEligibilityReached(event: ValidatorEligibilityReached): void { const c = communityForHub(event.address); if (c == null) return; const m = ensureMember(c, event.params.member, event.block.timestamp); m.proposalPoints = event.params.totalPoints; m.validatorEligible = true; m.save(); }
export function handleValidatorRewardEpochRolled(event: ValidatorRewardEpochRolled): void { const c = communityForHub(event.address); if (c == null) return; const e = ensureEpoch(c, event.params.epochId, event.block.timestamp); e.startTime = event.params.startTime; e.endTime = event.params.endTime; e.save(); }
export function handleValidatorRewardEpochFinalized(event: ValidatorRewardEpochFinalized): void { const c = communityForHub(event.address); if (c == null) return; const e = ensureEpoch(c, event.params.epochId, event.block.timestamp); e.activeValidatorCount = event.params.activeValidatorCount; e.finalized = true; e.save(); }

export function handleAdminActionRequested(event: AdminActionRequested): void { const c = communityForHub(event.address); if (c == null) return; const a = new CommunityAdminAction(actionId(c.id, event.params.requestId)); a.community = c.id; a.requestId = event.params.requestId; a.action = event.params.action; a.proposer = event.params.proposer; a.target = event.params.target; a.value = event.params.value; a.expiresAt = event.params.expiresAt; a.approvals = 1; a.cancelled = false; a.executed = false; a.createdAt = event.block.timestamp; a.updatedAt = event.block.timestamp; a.save(); }
export function handleAdminActionApproved(event: AdminActionApproved): void { const c = communityForHub(event.address); if (c == null) return; const a = CommunityAdminAction.load(actionId(c.id, event.params.requestId)); if (a == null) return; a.approvals += 1; a.updatedAt = event.block.timestamp; a.save(); }
export function handleAdminActionCancelled(event: AdminActionCancelled): void { const c = communityForHub(event.address); if (c == null) return; const a = CommunityAdminAction.load(actionId(c.id, event.params.requestId)); if (a == null) return; a.cancelled = true; a.updatedAt = event.block.timestamp; a.save(); }
export function handleAdminActionExecuted(event: AdminActionExecuted): void { const c = communityForHub(event.address); if (c == null) return; const a = CommunityAdminAction.load(actionId(c.id, event.params.requestId)); if (a == null) return; a.executed = true; a.updatedAt = event.block.timestamp; a.save(); }
