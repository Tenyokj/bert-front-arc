import { parseAbi, type Abi, type Address } from "viem";
import { contracts, fundingPoolAbi, grantManagerAbi, ideaRegistryAbi, reputationSystemAbi, rolesRegistryAbi, voterProgressionAbi, votingSystemAbi } from "./contracts";

export type AdminGroup = "governance" | "treasury" | "access" | "reputation" | "infrastructure";
export type AdminField = { name: string; label: string; kind: "address" | "addresses" | "uint" | "bool" | "role"; unit?: "usdc" | "seconds" | "bps"; min?: string; max?: string; contract?: boolean };
export type AdminOperation = { id: string; title: string; method: string; group: AdminGroup; description: string; critical: boolean; fields: AdminField[]; getter?: string };
export type AdminContract = { id: string; name: string; address?: Address; abi: Abi; reads: string[]; operations: AdminOperation[]; registry?: boolean };

export const protocolRoles = ["DEFAULT_ADMIN_ROLE", "VOTING_ROLE", "GRANT_ROLE", "DISTRIBUTOR_ROLE", "IREGISTRY_ROLE", "REPUTATION_MANAGER_ROLE", "AUTO_GRANT_ROLE", "CURATOR_ROLE", "REVIEWER_ROLE"] as const;
const account: AdminField = { name: "account", label: "Target wallet", kind: "address" };
const roles: AdminField = { name: "role", label: "Protocol role", kind: "role" };
const operation = (method: string, title: string, group: AdminGroup, description: string, fields: AdminField[] = [], getter?: string, critical = true): AdminOperation => ({ id: method, method, title, group, description, fields, getter, critical });
const link = (method: string, getter: string, title: string) => operation(method, title, "infrastructure", "Changes a live dependency. Check the deployed code and reciprocal roles before changing this connection.", [{ name: "destination", label: "Reviewed contract address", kind: "address", contract: true }], getter);
const parameter = (method: string, getter: string, title: string, field: AdminField, description: string) => operation(method, title, "governance", description, [field], getter);
const pauseOperations = [operation("pause", "Pause contract", "infrastructure", "Stops this contract's pause-gated actions. Other contracts are not paused automatically.", [], "isPaused"), operation("unpause", "Resume contract", "infrastructure", "Resumes pause-gated actions after operator checks.", [], "isPaused")];
const popAdminAbi = parseAbi(["function roles() view returns(address)", "function trustedSigner() view returns(address)", "function setTrustedSigner(address newSigner)", "function revokeVerification(address user)", "function isVerifiedHuman(address user) view returns(bool)"]);

// Deliberate allowlist, never an automatically generated write console from an ABI.
export const adminContracts: AdminContract[] = [
  { id: "fundingPool", name: "FundingPool", address: contracts.fundingPool, abi: [...fundingPoolAbi, ...parseAbi(["function setCommunityFactoryApproval(address factory,bool approved)"])], reads: ["isPaused", "roles", "usdc", "ideaRegistry", "pledgeFeeBps", "communityFactory", "protocolReserve"], operations: [
    ...pauseOperations,
    link("setUsdc", "usdc", "Replace the pool token"), link("setIdeaRegistry", "ideaRegistry", "Change IdeaRegistry"),
    operation("setPledgeFeeBps", "Set the pledge fee", "treasury", "Basis points: 100 bps = 1%. Maximum 10%. Existing round snapshots are not rewritten.", [{ name: "fee", label: "Pledge fee (bps)", kind: "uint", unit: "bps", max: "1000" }], "pledgeFeeBps"),
    operation("syncBalance", "Account for direct surplus", "treasury", "Reconciles direct token transfers under the contract's accounting rules. This does not authorize a team withdrawal."),
    operation("setCommunityFactory", "Set the primary Community Factory", "infrastructure", "Review Factory generation and treasury admission rules. This is not an upgrade of existing Communities.", [{ name: "factory", label: "Factory contract", kind: "address", contract: true }], "communityFactory"),
    operation("setCommunityFactoryApproval", "Change a Factory allowlist entry", "infrastructure", "Approves or removes one Factory. Check historical Community treasury access before revoking.", [{ name: "factory", label: "Factory contract", kind: "address", contract: true }, { name: "approved", label: "Approved", kind: "bool" }]),
    operation("allocateReserveToIdea", "Allocate reserve to a round idea", "treasury", "Moves eligible protocol reserve into a particular round allocation. It is not a withdrawal to your wallet.", [{ name: "round", label: "Round ID", kind: "uint", min: "1" }, { name: "idea", label: "Idea ID", kind: "uint", min: "1" }, { name: "amount", label: "Reserve allocation (USDC)", kind: "uint", unit: "usdc", min: "1" }]),
  ] },
  { id: "votingSystem", name: "VotingSystem", address: contracts.votingSystem, abi: votingSystemAbi, reads: ["isPaused", "roles", "fundingPool", "ideaRegistry", "reputationSystem", "voterProgression", "VOTING_DURATION", "minStake", "IDEAS_PER_ROUND", "humanVerifier", "humanOnlyVoting", "maxVoteAmount", "backerMilestonesEnabled"], operations: [
    ...pauseOperations,
    ...[["setFundingPool", "fundingPool", "Change FundingPool"], ["setIdeaRegistry", "ideaRegistry", "Change IdeaRegistry"], ["setReputationSystem", "reputationSystem", "Change ReputationSystem"], ["setVoterProgression", "voterProgression", "Change VoterProgression"], ["setHumanVerifier", "humanVerifier", "Change voting verifier"]].map(([method, getter, title]) => link(method, getter, title)),
    parameter("setVotingDuration", "VOTING_DURATION", "Set the voting duration", { name: "duration", label: "Duration (seconds)", kind: "uint", unit: "seconds", min: "86400" }, "Minimum one day. Read the round's stored deadline for existing rounds."),
    parameter("setMinStake", "minStake", "Set the minimum voting stake", { name: "stake", label: "Stake (USDC)", kind: "uint", unit: "usdc" }, "Enter human-readable USDC; calldata uses six decimals."),
    parameter("setIdeaPerRound", "IDEAS_PER_ROUND", "Set ideas per round", { name: "quantity", label: "Idea count (5-50)", kind: "uint", min: "5", max: "50" }, "Controls the configured round size. Contract validation remains authoritative."),
    parameter("setHumanOnlyVoting", "humanOnlyVoting", "Change human-only voting", { name: "enabled", label: "Require verified-human access", kind: "bool" }, "Enabling this can prevent unverified wallets from voting."),
    parameter("setMaxVoteAmount", "maxVoteAmount", "Set the per-vote cap", { name: "cap", label: "Cap (USDC; 0 disables)", kind: "uint", unit: "usdc" }, "Zero disables the cap; this is not a per-person lifetime allowance."),
    parameter("setBackerMilestonesEnabled", "backerMilestonesEnabled", "Select the mode for future rounds", { name: "enabled", label: "Backer-reviewed milestones enabled", kind: "bool" }, "Critical lifecycle setting. Running rounds retain their stored mode. Disabling selects the legacy lifecycle for subsequently started rounds."),
  ] },
  { id: "ideaRegistry", name: "IdeaRegistry", address: contracts.ideaRegistry, abi: ideaRegistryAbi, reads: ["roles", "fundingPool", "reputationSystem", "voterProgression", "authorMinStake", "humanVerifier", "humanOnlyIdeaCreation"], operations: [
    ...[["setFundingPool", "fundingPool", "Change FundingPool"], ["setReputationSystem", "reputationSystem", "Change ReputationSystem"], ["setVoterProgression", "voterProgression", "Change VoterProgression"], ["setHumanVerifier", "humanVerifier", "Change idea-creation verifier"]].map(([method, getter, title]) => link(method, getter, title)),
    parameter("setAuthorMinStake", "authorMinStake", "Set the minimum author bond", { name: "bond", label: "Author bond (USDC)", kind: "uint", unit: "usdc" }, "This is the author bond, not the proposal's requested funding target."),
    parameter("setHumanOnlyIdeaCreation", "humanOnlyIdeaCreation", "Change human-only idea creation", { name: "enabled", label: "Require verified-human access", kind: "bool" }, "Enabling this can block unverified authors from submitting ideas."),
  ] },
  { id: "grantManager", name: "GrantManager", address: contracts.grantManager, abi: grantManagerAbi, reads: ["roles", "isPaused", "fundingPool", "votingSystem", "ideaRegistry"], operations: [...pauseOperations, ...[["setFundingPool", "fundingPool", "Change FundingPool"], ["setVotingSystem", "votingSystem", "Change VotingSystem"], ["setIdeaRegistry", "ideaRegistry", "Change IdeaRegistry"]].map(([method, getter, title]) => link(method, getter, title))] },
  { id: "rolesRegistry", name: "RolesRegistry", address: contracts.rolesRegistry, abi: rolesRegistryAbi, registry: true, reads: ["DEFAULT_ADMIN_ROLE"], operations: [
    operation("grantSystemRole", "Grant a system role", "access", "System roles authorize protocol contracts. Select a system role, not a user or Admin role.", [roles, { ...account, label: "Protocol contract", contract: true }]),
    operation("revokeSystemRole", "Revoke a system role", "access", "Removing a live module's role can break protocol execution.", [roles, account]),
    operation("revokeUserRole", "Revoke a user role", "access", "For CURATOR_ROLE or REVIEWER_ROLE. This does not reset VoterProgression bookkeeping.", [roles, account]),
    operation("grantRole", "Grant a protocol role (advanced)", "access", "AccessControl operation. DEFAULT_ADMIN_ROLE grants broad control. Do not bypass module bookkeeping casually.", [roles, account]),
    operation("revokeRole", "Revoke a protocol role (advanced)", "access", "AccessControl operation. Revoking the last Admin can permanently remove operator access. Module bookkeeping is not reset.", [roles, account]),
  ] },
  { id: "popVerifier", name: "PoPVerifier", address: contracts.popVerifier, abi: popAdminAbi, reads: ["roles", "trustedSigner"], operations: [
    operation("setTrustedSigner", "Rotate the trusted verification signer", "access", "Changes which backend signatures are accepted. This does not deploy a backend or prove personhood.", [{ ...account, label: "New trusted signer" }], "trustedSigner"),
    operation("revokeVerification", "Revoke a wallet's verification", "access", "Revokes the target wallet's onchain verification. This can block gated participation.", [account]),
  ] },
  { id: "voterProgression", name: "VoterProgression", address: contracts.voterProgression, abi: voterProgressionAbi, reads: ["roles"], operations: [
    operation("grantCuratorRole", "Grant Curator through progression", "reputation", "Administrative override through the progression module, preserving its role-granted bookkeeping.", [account]),
    operation("grantReviewerRole", "Grant Reviewer through progression", "reputation", "Administrative override through the progression module. Its system permissions must also be configured.", [account]),
    operation("resetProgression", "Reset a voter's progression", "reputation", "Resets progression and attempts to revoke progression-granted roles. Review the target and module permissions.", [account]),
  ] },
  { id: "reputationSystem", name: "ReputationSystem", address: contracts.reputationSystem, abi: reputationSystemAbi, reads: ["roles", "MAX_REPUTATION", "START_REPUTATION"], operations: [
    operation("setReputation", "Set reputation (emergency override)", "reputation", "Raw reputation points, not a percentage. Current source maximum is 20,000; simulation checks the deployed contract.", [account, { name: "reputation", label: "Reputation points", kind: "uint", max: "20000" }]),
    operation("deinitializeReputation", "Deinitialize reputation", "reputation", "Emergency recovery operation. Review its effect on default reputation before signing.", [account]),
    operation("batchInitializeReputation", "Initialize a small reputation batch", "reputation", "Up to 25 unique addresses per UI batch. Initializes eligible entries; inspect the exact calldata before signing.", [{ name: "accounts", label: "Wallet addresses (comma or newline separated)", kind: "addresses" }]),
  ] },
];
