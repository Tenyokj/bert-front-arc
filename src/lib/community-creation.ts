import type { Address } from "viem";
import { getCommunityFactories, ORIGINAL_V31_FACTORY } from "./community-reference";

export type CommunityCreationContext = {
  creator: Address;
  chainId: number;
  factory: Address;
  adminActionsLibrary: Address;
};

/** Bind all three creation transactions to one trusted deployment and creator. */
export function communityCreationContext(input: {
  creator?: Address;
  chainId?: number;
  factory?: Address;
  adminActionsLibrary?: Address;
}): CommunityCreationContext {
  const { creator, chainId, factory, adminActionsLibrary } = input;
  if (!creator || !chainId || !factory || !adminActionsLibrary) throw new Error("Connect a wallet and configure the Community deployment.");
  if (!getCommunityFactories(chainId).some((item) => item.toLowerCase() === factory.toLowerCase())) {
    throw new Error("Switch to the network configured for this Community Factory.");
  }
  if (factory.toLowerCase() === ORIGINAL_V31_FACTORY.toLowerCase()) {
    throw new Error("Creation requires the matching V3.2 Factory and module deployers. Original V3.1 Communities remain accessible.");
  }
  if (/^0x0{40}$/i.test(creator) || !/^0x[a-fA-F0-9]{40}$/.test(adminActionsLibrary) || /^0x0{40}$/i.test(adminActionsLibrary)) {
    throw new Error("Creator and Admin-actions library must be non-zero addresses.");
  }
  return { creator, chainId, factory, adminActionsLibrary };
}

/** A wallet/network switch must not silently continue a previous reservation. */
export function matchesCommunityCreator(context: CommunityCreationContext, address?: Address, chainId?: number): boolean {
  return context.chainId === chainId && context.creator.toLowerCase() === address?.toLowerCase();
}

export function assertCommunityCreator(context: CommunityCreationContext | null, address?: Address, chainId?: number): asserts context is CommunityCreationContext {
  if (!context || !matchesCommunityCreator(context, address, chainId)) {
    throw new Error("Switch back to the reservation creator and its original network before continuing.");
  }
}
