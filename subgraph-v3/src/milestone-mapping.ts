import { BigInt } from "@graphprotocol/graph-ts";
import {
  ExecutionPlanCompleted,
  ExecutionPlanFailed,
  ExecutionPlanStarted,
  ExecutionRefundClaimed,
  MilestoneApproved,
  MilestoneCorrectionOpened,
  MilestoneGraceOpened,
  MilestoneProofSubmitted,
  MilestoneReviewCast,
} from "../generated/templates/CommunityMilestoneManager/CommunityMilestoneManager";
import { CommunityExecutionRefundClaim } from "../generated/schema";
import { communityForModule, ensureExecutionPlan, ensureMilestoneReview } from "./helpers";

export function handleExecutionPlanStarted(event: ExecutionPlanStarted): void {
  const community = communityForModule(event.address); if (community == null) return;
  const plan = ensureExecutionPlan(community, event.params.planId, event.params.proposalId, event.block.timestamp);
  plan.proposal = community.id + "-proposal-" + event.params.proposalId.toString();
  plan.budget = event.params.budget; plan.initialTranche = event.params.initialTranche;
  plan.releasedAmount = event.params.initialTranche; plan.currentMilestone = 1;
  plan.status = "Active"; plan.save();
}
export function handleMilestoneProofSubmitted(event: MilestoneProofSubmitted): void {
  const community = communityForModule(event.address); if (community == null) return;
  const plan = ensureExecutionPlan(community, event.params.planId, event.params.planId, event.block.timestamp);
  const review = ensureMilestoneReview(community, plan, event.params.milestone, event.block.timestamp);
  review.evidenceHash = event.params.evidenceHash; review.closesAt = event.params.closesAt; review.save();
  plan.currentMilestone = event.params.milestone; plan.status = "InReview"; plan.save();
}
export function handleMilestoneReviewCast(event: MilestoneReviewCast): void {
  const community = communityForModule(event.address); if (community == null) return;
  const plan = ensureExecutionPlan(community, event.params.planId, event.params.planId, event.block.timestamp);
  const review = ensureMilestoneReview(community, plan, event.params.milestone, event.block.timestamp);
  if (event.params.approved) review.yesWeight = review.yesWeight.plus(event.params.weight);
  else review.noWeight = review.noWeight.plus(event.params.weight);
  review.reviewerCount = review.reviewerCount.plus(BigInt.fromI32(1));
  review.save();
}
export function handleMilestoneApproved(event: MilestoneApproved): void {
  const community = communityForModule(event.address); if (community == null) return;
  const plan = ensureExecutionPlan(community, event.params.planId, event.params.planId, event.block.timestamp);
  const review = ensureMilestoneReview(community, plan, event.params.milestone, event.block.timestamp);
  review.settled = true; review.approved = true; review.releasedAmount = event.params.releasedAmount; review.save();
  plan.releasedAmount = plan.releasedAmount.plus(event.params.releasedAmount);
  plan.currentMilestone = event.params.milestone + 1; plan.status = "Active"; plan.save();
}
export function handleMilestoneCorrectionOpened(event: MilestoneCorrectionOpened): void {
  const community = communityForModule(event.address); if (community == null) return;
  const plan = ensureExecutionPlan(community, event.params.planId, event.params.planId, event.block.timestamp);
  const review = ensureMilestoneReview(community, plan, event.params.milestone, event.block.timestamp);
  review.correctionAvailableAt = event.params.availableAt; review.approved = false; review.save();
  plan.status = "CorrectionPending"; plan.save();
}
export function handleMilestoneGraceOpened(event: MilestoneGraceOpened): void {
  const community = communityForModule(event.address); if (community == null) return;
  const plan = ensureExecutionPlan(community, event.params.planId, event.params.planId, event.block.timestamp);
  const review = ensureMilestoneReview(community, plan, event.params.milestone, event.block.timestamp);
  review.graceClosesAt = event.params.closesAt; review.save();
  plan.status = "GraceReview"; plan.save();
}
export function handleExecutionPlanFailed(event: ExecutionPlanFailed): void {
  const community = communityForModule(event.address); if (community == null) return;
  const plan = ensureExecutionPlan(community, event.params.planId, event.params.planId, event.block.timestamp);
  plan.refundLiability = event.params.refundableAmount; plan.status = "Failed"; plan.save();
}
export function handleExecutionPlanCompleted(event: ExecutionPlanCompleted): void {
  const community = communityForModule(event.address); if (community == null) return;
  const plan = ensureExecutionPlan(community, event.params.planId, event.params.planId, event.block.timestamp);
  plan.status = "Completed"; plan.save();
}
export function handleExecutionRefundClaimed(event: ExecutionRefundClaimed): void {
  const community = communityForModule(event.address); if (community == null) return;
  const plan = ensureExecutionPlan(community, event.params.planId, event.params.planId, event.block.timestamp);
  plan.refundLiability = plan.refundLiability.minus(event.params.amount); plan.save();
  const claim = new CommunityExecutionRefundClaim(event.transaction.hash.toHex() + "-" + event.logIndex.toString());
  claim.plan = plan.id; claim.supporter = event.params.supporter; claim.amount = event.params.amount;
  claim.timestamp = event.block.timestamp; claim.txHash = event.transaction.hash; claim.save();
}
