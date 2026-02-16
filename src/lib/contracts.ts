import type { Address, Abi } from "viem";

import FundingPoolArtifact from "@/abi/DAO/FundingPoolUpgradeable.sol/FundingPoolUpgradeable.json";
import GovernanceTokenArtifact from "@/abi/DAO/GovernanceTokenUpgradeable.sol/GovernanceTokenUpgradeable.json";
import GrantManagerArtifact from "@/abi/DAO/GrantManagerUpgradeable.sol/GrantManagerUpgradeable.json";
import IdeaRegistryArtifact from "@/abi/DAO/IdeaRegistryUpgradeable.sol/IdeaRegistryUpgradeable.json";
import VotingSystemArtifact from "@/abi/DAO/VotingSystemUpgradeable.sol/VotingSystemUpgradeable.json";
import BRTFaucetArtifact from "@/abi/extensions/BRTFaucet.sol/BRTFaucet.json";
import ReputationSystemArtifact from "@/abi/extensions/ReputationSystemUpgradeable.sol/ReputationSystemUpgradeable.json";
import RolesRegistryArtifact from "@/abi/extensions/Roles/RolesRegistryUpgradeable.sol/RolesRegistryUpgradeable.json";
import VoterProgressionArtifact from "@/abi/extensions/VoterProgressionUpgradeable.sol/VoterProgressionUpgradeable.json";

function toAddress(value: string | undefined): Address | undefined {
  if (!value) return undefined;
  if (!/^0x[a-fA-F0-9]{40}$/.test(value)) return undefined;
  return value as Address;
}

export const fundingPoolAbi = (FundingPoolArtifact as { abi: Abi }).abi;
export const governanceTokenAbi = (GovernanceTokenArtifact as { abi: Abi }).abi;
export const grantManagerAbi = (GrantManagerArtifact as { abi: Abi }).abi;
export const ideaRegistryAbi = (IdeaRegistryArtifact as { abi: Abi }).abi;
export const votingSystemAbi = (VotingSystemArtifact as { abi: Abi }).abi;
export const brtfaucetAbi = (BRTFaucetArtifact as { abi: Abi }).abi;
export const reputationSystemAbi = (ReputationSystemArtifact as { abi: Abi }).abi;
export const rolesRegistryAbi = (RolesRegistryArtifact as { abi: Abi }).abi;
export const voterProgressionAbi = (VoterProgressionArtifact as { abi: Abi }).abi;

export const contracts = {
  fundingPool: toAddress(process.env.NEXT_PUBLIC_FUNDING_POOL_ADDRESS),
  governanceToken: toAddress(process.env.NEXT_PUBLIC_GOVERNANCE_TOKEN_ADDRESS),
  grantManager: toAddress(process.env.NEXT_PUBLIC_GRANT_MANAGER_ADDRESS),
  ideaRegistry: toAddress(process.env.NEXT_PUBLIC_IDEA_REGISTRY_ADDRESS),
  reputationSystem: toAddress(process.env.NEXT_PUBLIC_REPUTATION_SYSTEM_ADDRESS),
  rolesRegistry: toAddress(process.env.NEXT_PUBLIC_ROLES_REGISTRY_ADDRESS),
  votingSystem: toAddress(process.env.NEXT_PUBLIC_VOTING_SYSTEM_ADDRESS),
  voterProgression: toAddress(process.env.NEXT_PUBLIC_VOTER_PROGRESSION_ADDRESS),
  faucet: toAddress(process.env.NEXT_PUBLIC_FAUCET_ADDRESS),
};
