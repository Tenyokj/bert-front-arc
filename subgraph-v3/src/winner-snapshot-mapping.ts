import {
  WinnerSnapshotSealed,
  WinnerSupportRecorded,
} from "../generated/templates/CommunityWinnerSnapshot/CommunityWinnerSnapshot";
import { CommunityWinnerSupport } from "../generated/schema";
import { communityForModule, ensureExecutionPlan, winnerSupportEntityId } from "./helpers";

export function handleWinnerSupportRecorded(event: WinnerSupportRecorded): void {
  const community = communityForModule(event.address); if (community == null) return;
  const plan = ensureExecutionPlan(community, event.params.planId, event.params.planId, event.block.timestamp);
  const id = winnerSupportEntityId(community, event.params.planId, event.params.supporter);
  let support = CommunityWinnerSupport.load(id);
  if (support == null) {
    support = new CommunityWinnerSupport(id);
    support.plan = plan.id; support.supporter = event.params.supporter;
  }
  support.weight = event.params.weight; support.save();
}
export function handleWinnerSnapshotSealed(event: WinnerSnapshotSealed): void {
  const community = communityForModule(event.address); if (community == null) return;
  const plan = ensureExecutionPlan(community, event.params.planId, event.params.planId, event.block.timestamp);
  plan.totalSupportWeight = event.params.totalWeight; plan.supporterCount = event.params.supporterCount;
  if (plan.status == "SnapshotPending") plan.status = "SnapshotSealed";
  plan.save();
}
