import type { Address, Abi } from "viem";

import FundingPoolArtifact from "@/abi/DAO/FundingPoolUpgradeable.sol/FundingPoolUpgradeable.json";

function toAddress(value: string | undefined): Address | undefined {
  if (!value) return undefined;
  if (!/^0x[a-fA-F0-9]{40}$/.test(value)) return undefined;
  return value as Address;
}

export const fundingPoolAbi = (FundingPoolArtifact as { abi: Abi }).abi;

export const contracts = {
  fundingPool: toAddress(process.env.NEXT_PUBLIC_FUNDING_POOL_ADDRESS),
};

