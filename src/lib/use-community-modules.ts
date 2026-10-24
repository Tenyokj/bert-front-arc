"use client";

import type { Address } from "viem";
import { useReadContracts } from "wagmi";

import { communityHubAbi } from "@/lib/community-contracts";

export type CommunityModuleAddresses = {
  membership?: Address;
  proposal?: Address;
  voting?: Address;
  milestone?: Address;
};

/** Resolves the immutable V3.1 modules owned by one thin CommunityHub facade. */
export function useCommunityModules(hub: Address, chainId?: number) {
  const read = useReadContracts({
    contracts: [
      { address: hub, chainId, abi: communityHubAbi, functionName: "membershipModule" },
      { address: hub, chainId, abi: communityHubAbi, functionName: "proposalModule" },
      { address: hub, chainId, abi: communityHubAbi, functionName: "votingModule" },
      { address: hub, chainId, abi: communityHubAbi, functionName: "milestoneManager" },
    ],
  });
  const values = (read.data ?? []).map((item) => item.result) as (Address | undefined)[];

  return {
    ...read,
    modules: {
      membership: values[0],
      proposal: values[1],
      voting: values[2],
      milestone: values[3],
    } satisfies CommunityModuleAddresses,
  };
}
