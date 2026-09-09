import { CommunityHub as CommunityHubTemplate, CommunityTreasury as CommunityTreasuryTemplate } from "../generated/templates";
import {
  CommunityCreated,
  CommunityTreasuryCreated,
} from "../generated/CommunityFactory/CommunityFactory";
import { Community, CommunityHubSource, CommunityTreasurySource } from "../generated/schema";
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
}
