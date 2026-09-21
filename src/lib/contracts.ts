import type { Address, Abi } from "viem";

import FundingPoolArtifact from "@/abi/DAO/FundingPoolUpgradeable.sol/FundingPoolUpgradeable.json";
import GrantManagerArtifact from "@/abi/DAO/GrantManagerUpgradeable.sol/GrantManagerUpgradeable.json";
import IdeaRegistryArtifact from "@/abi/DAO/IdeaRegistryUpgradeable.sol/IdeaRegistryUpgradeable.json";
import VotingSystemArtifact from "@/abi/DAO/VotingSystemUpgradeable.sol/VotingSystemUpgradeable.json";
import ReputationSystemArtifact from "@/abi/extensions/ReputationSystemUpgradeable.sol/ReputationSystemUpgradeable.json";
import RolesRegistryArtifact from "@/abi/extensions/Roles/RolesRegistryUpgradeable.sol/RolesRegistryUpgradeable.json";
import VoterProgressionArtifact from "@/abi/extensions/VoterProgressionUpgradeable.sol/VoterProgressionUpgradeable.json";

function toAddress(value: string | undefined): Address | undefined {
  if (!value) return undefined;
  if (!/^0x[a-fA-F0-9]{40}$/.test(value)) return undefined;
  return value as Address;
}

export const usdcAbi = [
  {
    type: "function",
    stateMutability: "view",
    name: "symbol",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "function",
    stateMutability: "view",
    name: "decimals",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    type: "function",
    stateMutability: "view",
    name: "totalSupply",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    stateMutability: "view",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    stateMutability: "view",
    name: "allowance",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    stateMutability: "nonpayable",
    name: "approve",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const satisfies Abi;

export const roleBootstrapDistributorAbi = [
  {
    type: "function",
    stateMutability: "view",
    name: "distributionActive",
    inputs: [],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    stateMutability: "view",
    name: "isCuratorEligible",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    stateMutability: "view",
    name: "isReviewerEligible",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    stateMutability: "view",
    name: "hasClaimedCurator",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    stateMutability: "view",
    name: "hasClaimedReviewer",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    stateMutability: "nonpayable",
    name: "claimAllEligibleRoles",
    inputs: [],
    outputs: [],
  },
  {
    type: "function",
    stateMutability: "nonpayable",
    name: "claimCuratorRole",
    inputs: [],
    outputs: [],
  },
  {
    type: "function",
    stateMutability: "nonpayable",
    name: "claimReviewerRole",
    inputs: [],
    outputs: [],
  },
] as const satisfies Abi;

export const popVerifierAbi = [
  {
    type: "function",
    stateMutability: "view",
    name: "isVerifiedHuman",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    stateMutability: "view",
    name: "getVerification",
    inputs: [{ name: "account", type: "address" }],
    outputs: [
      { name: "verified", type: "bool" },
      { name: "until", type: "uint64" },
      { name: "nonce", type: "uint256" },
    ],
  },
  {
    type: "function",
    stateMutability: "nonpayable",
    name: "submitVerification",
    inputs: [
      { name: "verifiedUntil_", type: "uint64" },
      { name: "nonce", type: "uint256" },
      { name: "provider", type: "bytes32" },
      { name: "credentialHash", type: "bytes32" },
      { name: "signature", type: "bytes" },
    ],
    outputs: [],
  },
] as const satisfies Abi;

export const fundingPoolAbi = (FundingPoolArtifact as { abi: Abi }).abi;
export const grantManagerAbi = (GrantManagerArtifact as { abi: Abi }).abi;
export const ideaRegistryAbi = (IdeaRegistryArtifact as { abi: Abi }).abi;
export const votingSystemAbi = (VotingSystemArtifact as { abi: Abi }).abi;
export const reputationSystemAbi = (ReputationSystemArtifact as { abi: Abi }).abi;
export const rolesRegistryAbi = (RolesRegistryArtifact as { abi: Abi }).abi;
export const voterProgressionAbi = (VoterProgressionArtifact as { abi: Abi }).abi;

export const contracts = {
  fundingPool: toAddress(process.env.NEXT_PUBLIC_FUNDING_POOL_ADDRESS),
  grantManager: toAddress(process.env.NEXT_PUBLIC_GRANT_MANAGER_ADDRESS),
  ideaRegistry: toAddress(process.env.NEXT_PUBLIC_IDEA_REGISTRY_ADDRESS),
  reputationSystem: toAddress(process.env.NEXT_PUBLIC_REPUTATION_SYSTEM_ADDRESS),
  rolesRegistry: toAddress(process.env.NEXT_PUBLIC_ROLES_REGISTRY_ADDRESS),
  usdc: toAddress(process.env.NEXT_PUBLIC_USDC_ADDRESS),
  votingSystem: toAddress(process.env.NEXT_PUBLIC_VOTING_SYSTEM_ADDRESS),
  voterProgression: toAddress(process.env.NEXT_PUBLIC_VOTER_PROGRESSION_ADDRESS),
  roleBootstrapDistributor: toAddress(process.env.NEXT_PUBLIC_ROLE_BOOTSTRAP_DISTRIBUTOR_ADDRESS),
  popVerifier: toAddress(process.env.NEXT_PUBLIC_POP_VERIFIER_ADDRESS),
};
