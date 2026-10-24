import { BigInt } from "@graphprotocol/graph-ts";
import {
  ExecutionPlanCompleted,
  ExecutionPlanFailed,
  ExecutionPlanStarted,
  ExecutionRefundClaimed,
  ExecutionTrancheReady,
  ExecutionTrancheApproved,
  ExecutionTranchePaid,
  ExecutionTrancheExpired,
  MilestoneApproved,
  MilestoneCorrectionOpened,
  MilestoneGraceOpened,
  MilestoneProofSubmitted,
  MilestoneReviewCast,
} from "../generated/templates/CommunityMilestoneManager/CommunityMilestoneManager";
import { CommunityExecutionRefundClaim, CommunityExecutionTranche, CommunityExecutionTrancheApproval } from "../generated/schema";
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
  // This entity mirrors the latest attempt, not a sum across corrected proofs.
  review.yesWeight = BigInt.fromI32(0); review.noWeight = BigInt.fromI32(0);
  review.reviewerCount = BigInt.fromI32(0); review.releasedAmount = BigInt.fromI32(0);
  review.settled = false; review.unset("approved");
  review.correctionAvailableAt = null; review.graceClosesAt = null;
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
  review.correctionAvailableAt = event.params.availableAt; review.settled = true; review.approved = false; review.save();
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

export function handleExecutionTrancheReady(event: ExecutionTrancheReady): void {
  const community = communityForModule(event.address); if (community == null) return;
  const plan = ensureExecutionPlan(community, event.params.planId, event.params.planId, event.block.timestamp);
  const tranche = new CommunityExecutionTranche(plan.id + "-tranche-" + event.params.tranche.toString());
  tranche.plan = plan.id; tranche.stage = event.params.tranche; tranche.amount = event.params.amount;
  tranche.readyAt = event.params.readyAt; tranche.expiresAt = event.params.expiresAt;
  tranche.approvalThreshold = event.params.approvalThreshold; tranche.status = "AwaitingApproval"; tranche.save();
  if (event.params.tranche == 0) plan.initialTranche = event.params.amount;
  plan.currentMilestone = event.params.tranche == 0 ? 1 : event.params.tranche;
  plan.status = "AwaitingTranche"; plan.save();
}

export function handleExecutionTrancheApproved(event: ExecutionTrancheApproved): void {
  const community = communityForModule(event.address); if (community == null) return;
  const plan = ensureExecutionPlan(community, event.params.planId, event.params.planId, event.block.timestamp);
  const trancheId = plan.id + "-tranche-" + event.params.tranche.toString();
  const approval = new CommunityExecutionTrancheApproval(trancheId + "-" + event.params.admin.toHexString());
  approval.tranche = trancheId; approval.admin = event.params.admin; approval.roleNonce = event.params.roleNonce;
  approval.timestamp = event.block.timestamp; approval.txHash = event.transaction.hash; approval.save();
}

export function handleExecutionTranchePaid(event: ExecutionTranchePaid): void {
  const community = communityForModule(event.address); if (community == null) return;
  const plan = ensureExecutionPlan(community, event.params.planId, event.params.planId, event.block.timestamp);
  const tranche = CommunityExecutionTranche.load(plan.id + "-tranche-" + event.params.tranche.toString());
  if (tranche != null) { tranche.status = "Paid"; tranche.recipient = event.params.recipient; tranche.paidAt = event.block.timestamp; tranche.save(); }
  plan.releasedAmount = plan.releasedAmount.plus(event.params.amount);
  plan.currentMilestone = event.params.tranche == 0 ? 1 : 2;
  plan.status = event.params.tranche == 2 ? "Completed" : "Active"; plan.save();
  if (event.params.tranche > 0) {
    const review = ensureMilestoneReview(community, plan, event.params.tranche, event.block.timestamp);
    review.releasedAmount = event.params.amount; review.save();
  }
}

export function handleExecutionTrancheExpired(event: ExecutionTrancheExpired): void {
  const community = communityForModule(event.address); if (community == null) return;
  const plan = ensureExecutionPlan(community, event.params.planId, event.params.planId, event.block.timestamp);
  const tranche = CommunityExecutionTranche.load(plan.id + "-tranche-" + event.params.tranche.toString());
  if (tranche != null) { tranche.status = "Expired"; tranche.save(); }
}
