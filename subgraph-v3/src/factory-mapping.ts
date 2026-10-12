import {
  CommunityHub as CommunityHubTemplate,
  CommunityMembershipModule as CommunityMembershipModuleTemplate,
  CommunityMilestoneManager as CommunityMilestoneManagerTemplate,
  CommunityProposalModule as CommunityProposalModuleTemplate,
  CommunityTreasury as CommunityTreasuryTemplate,
  CommunityVotingModule as CommunityVotingModuleTemplate,
  CommunityWinnerSnapshot as CommunityWinnerSnapshotTemplate,
} from "../generated/templates";
import {
  CommunityCreated,
  CommunityTreasuryCreated,
} from "../generated/CommunityFactory/CommunityFactory";
import { CommunityHub as CommunityHubContract } from "../generated/CommunityFactory/CommunityHub";
import {
  Community,
  CommunityHubSource,
  CommunityModuleSource,
  CommunityTreasurySource,
} from "../generated/schema";
import { Address } from "@graphprotocol/graph-ts";
import { communityEntityId } from "./helpers";

export function handleCommunityTreasuryCreated(event: CommunityTreasuryCreated): void {
  const id = communityEntityId(event.address, event.params.communityId);
  let community = Community.load(id);
  if (community == null) {
    community = new Community(id);
    community.communityId = event.params.communityId;
    community.factory = event.address;
    community.creator = event.params.creator;
    community.treasury = event.params.treasury;
    community.name = event.params.name;
    community.metadataURI = event.params.metadataURI;
    community.configHash = event.params.configHash;
    community.active = false;
    community.status = 0;
    community.createdAt = event.block.timestamp;
    community.createdAtBlock = event.block.number;
  }
  community.updatedAt = event.block.timestamp;
  community.updatedAtBlock = event.block.number;
  community.save();

  const sourceId = event.params.treasury.toHexString();
  let source = CommunityTreasurySource.load(sourceId);
  if (source == null) {
    source = new CommunityTreasurySource(sourceId);
    source.community = community.id;
    source.save();
    CommunityTreasuryTemplate.create(event.params.treasury);
  }
}

export function handleCommunityCreated(event: CommunityCreated): void {
  const id = communityEntityId(event.address, event.params.communityId);
  const community = Community.load(id);
  if (community == null) return;

  community.creator = event.params.creator;
  community.hub = event.params.hub;
  community.treasury = event.params.treasury;
  community.active = true;
  community.updatedAt = event.block.timestamp;
  community.updatedAtBlock = event.block.number;
  community.save();

  const sourceId = event.params.hub.toHexString();
  if (CommunityHubSource.load(sourceId) == null) {
    const source = new CommunityHubSource(sourceId);
    source.community = community.id;
    source.save();
    CommunityHubTemplate.create(event.params.hub);
  }

  // Modules are deployed by the Hub constructor and have distinct addresses.
  // Their events therefore require separate dynamic data sources.
  registerModule(event.params.hub, community.id, "membership", 0);
  registerModule(event.params.hub, community.id, "proposal", 1);
  registerModule(event.params.hub, community.id, "voting", 2);
  registerModule(event.params.hub, community.id, "milestone", 3);
  registerModule(event.params.hub, community.id, "winnerSnapshot", 4);
}

function registerModule(hubAddress: Address, communityId: string, kind: string, moduleType: i32): void {
  const hub = CommunityHubContract.bind(hubAddress);
  let moduleAddress: Address;

  if (moduleType == 0) moduleAddress = hub.membershipModule();
  else if (moduleType == 1) moduleAddress = hub.proposalModule();
  else if (moduleType == 2) moduleAddress = hub.votingModule();
  else if (moduleType == 3) moduleAddress = hub.milestoneManager();
  else moduleAddress = hub.winnerSnapshot();

  const sourceId = moduleAddress.toHexString();
  if (CommunityModuleSource.load(sourceId) != null) return;

  const source = new CommunityModuleSource(sourceId);
  source.community = communityId;
  source.kind = kind;
  source.save();

  if (moduleType == 0) CommunityMembershipModuleTemplate.create(moduleAddress);
  else if (moduleType == 1) CommunityProposalModuleTemplate.create(moduleAddress);
  else if (moduleType == 2) CommunityVotingModuleTemplate.create(moduleAddress);
  else if (moduleType == 3) CommunityMilestoneManagerTemplate.create(moduleAddress);
  else CommunityWinnerSnapshotTemplate.create(moduleAddress);
}
