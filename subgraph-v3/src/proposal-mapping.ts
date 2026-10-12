import {
  ProposalCreated,
  ProposalValidationFinalized,
  ValidatorDecisionCast,
  ValidatorRewardEpochRolled,
} from "../generated/templates/CommunityProposalModule/CommunityProposalModule";
import { CommunityValidatorDecision } from "../generated/schema";
import { communityForModule, ensureEpoch, ensureProposal } from "./helpers";

export function handleProposalCreated(event: ProposalCreated): void {
  const community = communityForModule(event.address); if (community == null) return;
  const proposal = ensureProposal(community, event.params.proposalId, event.block.timestamp);
  proposal.creator = event.params.creator; proposal.origin = event.params.origin;
  proposal.mode = event.params.mode;
  proposal.status = event.params.origin == 0 ? "AdminCreated" : "PendingValidation";
  proposal.save();
}
export function handleValidatorDecisionCast(event: ValidatorDecisionCast): void {
  const community = communityForModule(event.address); if (community == null) return;
  const proposal = ensureProposal(community, event.params.proposalId, event.block.timestamp);
  if (event.params.approved) proposal.validationApprovals += 1; else proposal.validationRejections += 1;
  proposal.save();
  const decision = new CommunityValidatorDecision(event.transaction.hash.toHex() + "-" + event.logIndex.toString());
  decision.proposal = proposal.id; decision.validator = event.params.validator;
  decision.approved = event.params.approved; decision.timestamp = event.block.timestamp;
  decision.txHash = event.transaction.hash; decision.save();
}
export function handleProposalValidationFinalized(event: ProposalValidationFinalized): void {
  const community = communityForModule(event.address); if (community == null) return;
  const proposal = ensureProposal(community, event.params.proposalId, event.block.timestamp);
  proposal.validationApproved = event.params.approved;
  proposal.status = event.params.approved ? "ApprovedForVoting" : "RejectedByValidators"; proposal.save();
}
export function handleValidatorRewardEpochRolled(event: ValidatorRewardEpochRolled): void {
  const community = communityForModule(event.address); if (community == null) return;
  const epoch = ensureEpoch(community, event.params.epochId, event.block.timestamp);
  epoch.startTime = event.params.startTime; epoch.endTime = event.params.endTime; epoch.save();
}
