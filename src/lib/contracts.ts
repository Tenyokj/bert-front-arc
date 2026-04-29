import type { Address, Abi, AbiFunction } from "viem";

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

function replaceAbiFunctions(abi: Abi, replacements: readonly AbiFunction[]) {
  const names = new Set(replacements.map((item) => item.name));
  return [
    ...abi.filter((item) => item.type !== "function" || !names.has(item.name)),
    ...replacements,
  ] as Abi;
}

const ideaRegistryPatches = [
  {
    type: "function",
    stateMutability: "nonpayable",
    name: "createIdea",
    inputs: [
      { name: "_title", type: "string", internalType: "string" },
      { name: "_description", type: "string", internalType: "string" },
      { name: "_link", type: "string", internalType: "string" },
      { name: "_amount", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    stateMutability: "view",
    name: "authorMinStake",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
  },
  {
    type: "function",
    stateMutability: "view",
    name: "fundingPool",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
  },
] as const satisfies readonly AbiFunction[];

const grantManagerPatches = [
  {
    type: "function",
    stateMutability: "view",
    name: "getGrantPayout",
    inputs: [{ name: "roundId", type: "uint256", internalType: "uint256" }],
    outputs: [
      { name: "ideaId", type: "uint256", internalType: "uint256" },
      { name: "author", type: "address", internalType: "address" },
      { name: "totalGrant", type: "uint256", internalType: "uint256" },
      { name: "released", type: "uint256", internalType: "uint256" },
      { name: "initialClaimed", type: "bool", internalType: "bool" },
      { name: "inProcessPaid", type: "bool", internalType: "bool" },
      { name: "completionPaid", type: "bool", internalType: "bool" },
    ],
  },
  {
    type: "function",
    stateMutability: "view",
    name: "getMilestoneRequest",
    inputs: [
      { name: "roundId", type: "uint256", internalType: "uint256" },
      { name: "stage", type: "uint8", internalType: "uint8" },
    ],
    outputs: [
      { name: "requestId", type: "uint256", internalType: "uint256" },
      { name: "metadataURI", type: "string", internalType: "string" },
      { name: "details", type: "string", internalType: "string" },
      { name: "submittedAt", type: "uint256", internalType: "uint256" },
      { name: "lastRejectedAt", type: "uint256", internalType: "uint256" },
      { name: "approvals", type: "uint8", internalType: "uint8" },
      { name: "rejections", type: "uint8", internalType: "uint8" },
      { name: "maxReviewers", type: "uint8", internalType: "uint8" },
      { name: "approvalThreshold", type: "uint8", internalType: "uint8" },
      { name: "active", type: "bool", internalType: "bool" },
    ],
  },
  {
    type: "function",
    stateMutability: "nonpayable",
    name: "submitMilestoneProof",
    inputs: [
      { name: "roundId", type: "uint256", internalType: "uint256" },
      { name: "stage", type: "uint8", internalType: "uint8" },
      { name: "metadataURI", type: "string", internalType: "string" },
      { name: "details", type: "string", internalType: "string" },
    ],
    outputs: [],
  },
  {
    type: "function",
    stateMutability: "nonpayable",
    name: "reviewMilestoneProof",
    inputs: [
      { name: "roundId", type: "uint256", internalType: "uint256" },
      { name: "stage", type: "uint8", internalType: "uint8" },
      { name: "approved", type: "bool", internalType: "bool" },
    ],
    outputs: [],
  },
] as const satisfies readonly AbiFunction[];

const fundingPoolPatches = [
  {
    type: "function",
    stateMutability: "view",
    name: "authorStakeByIdea",
    inputs: [{ name: "ideaId", type: "uint256", internalType: "uint256" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
  },
] as const satisfies readonly AbiFunction[];

export const fundingPoolAbi = replaceAbiFunctions(
  (FundingPoolArtifact as { abi: Abi }).abi,
  fundingPoolPatches
);
export const governanceTokenAbi = (GovernanceTokenArtifact as { abi: Abi }).abi;
export const grantManagerAbi = replaceAbiFunctions(
  (GrantManagerArtifact as { abi: Abi }).abi,
  grantManagerPatches
);
export const ideaRegistryAbi = replaceAbiFunctions(
  (IdeaRegistryArtifact as { abi: Abi }).abi,
  ideaRegistryPatches
);
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
