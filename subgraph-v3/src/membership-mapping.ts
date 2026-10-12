import {
  AdminAdded,
  AdminRemoved,
  MemberJoined,
  MembershipExited,
  MembershipExitRequested,
  ProposalPointAwarded,
  ValidatorAdded,
  ValidatorEligibilityReached,
  ValidatorRemoved,
} from "../generated/templates/CommunityMembershipModule/CommunityMembershipModule";
import { communityForModule, ensureMember } from "./helpers";

export function handleMemberJoined(event: MemberJoined): void {
  const community = communityForModule(event.address); if (community == null) return;
  const member = ensureMember(community, event.params.member, event.block.timestamp);
  member.active = true; member.membershipStake = event.params.stake;
  member.joinedAt = event.block.timestamp; member.exitAvailableAt = null; member.save();
}
export function handleMembershipExitRequested(event: MembershipExitRequested): void {
  const community = communityForModule(event.address); if (community == null) return;
  const member = ensureMember(community, event.params.member, event.block.timestamp);
  member.exitAvailableAt = event.params.availableAt; member.save();
}
export function handleMembershipExited(event: MembershipExited): void {
  const community = communityForModule(event.address); if (community == null) return;
  const member = ensureMember(community, event.params.member, event.block.timestamp);
  member.active = false; member.membershipStake = event.params.stake;
  member.exitAvailableAt = null; member.save();
}
export function handleAdminAdded(event: AdminAdded): void {
  const community = communityForModule(event.address); if (community == null) return;
  const member = ensureMember(community, event.params.account, event.block.timestamp); member.isAdmin = true; member.save();
}
export function handleAdminRemoved(event: AdminRemoved): void {
  const community = communityForModule(event.address); if (community == null) return;
  const member = ensureMember(community, event.params.account, event.block.timestamp); member.isAdmin = false; member.save();
}
export function handleValidatorAdded(event: ValidatorAdded): void {
  const community = communityForModule(event.address); if (community == null) return;
  const member = ensureMember(community, event.params.account, event.block.timestamp); member.isValidator = true; member.save();
}
export function handleValidatorRemoved(event: ValidatorRemoved): void {
  const community = communityForModule(event.address); if (community == null) return;
  const member = ensureMember(community, event.params.account, event.block.timestamp); member.isValidator = false; member.save();
}
export function handleProposalPointAwarded(event: ProposalPointAwarded): void {
  const community = communityForModule(event.address); if (community == null) return;
  const member = ensureMember(community, event.params.member, event.block.timestamp);
  member.proposalPoints = event.params.totalPoints; member.save();
}
export function handleValidatorEligibilityReached(event: ValidatorEligibilityReached): void {
  const community = communityForModule(event.address); if (community == null) return;
  const member = ensureMember(community, event.params.member, event.block.timestamp);
  member.proposalPoints = event.params.totalPoints; member.validatorEligible = true; member.save();
}
