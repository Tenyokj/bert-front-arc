import { isAddress, parseUnits, zeroAddress } from "viem";

export function parseCreationUsdc(value: string): bigint {
  const input = value.trim();
  if (!/^\d+(?:\.\d{1,6})?$/.test(input)) return -1n;
  try { const amount = parseUnits(input, 6); return amount < 2n ** 256n ? amount : -1n; }
  catch { return -1n; }
}

export function referenceProblem(value: string): string | null {
  if (!value.trim()) return null;
  try { const url = new URL(value.trim()); if (["https:", "http:", "ipfs:", "ar:"].includes(url.protocol)) return null; } catch { /* Explain instead of silently editing the link. */ }
  return "Use a public http, https, ipfs or ar link, or leave this optional field empty.";
}

export function ideaStepProblems(step: number, draft: { title: string; description: string; link: string; authorBond: string; minimumNetFunding: string }, minimum?: bigint): string[] {
  if (step === 0) return [!draft.title.trim() ? "Add a proposal title." : null, !draft.description.trim() ? "Describe the outcome and how you will deliver it." : null, referenceProblem(draft.link)].filter((value): value is string => !!value);
  if (step === 1) {
    const bond = parseCreationUsdc(draft.authorBond), target = parseCreationUsdc(draft.minimumNetFunding);
    return [bond <= 0n ? "Author bond must be positive, with at most 6 decimal places." : minimum !== undefined && bond < minimum ? "Author bond is below the loaded contract minimum." : null, target <= 0n ? "Net funding target must be positive, with at most 6 decimal places." : null].filter((value): value is string => !!value);
  }
  return [];
}

export function effectiveCommunityAdmins(creator: string | undefined, admins: readonly string[]) {
  return creator && !admins.some((address) => address.toLowerCase() === creator.toLowerCase()) ? [creator, ...admins] : [...admins];
}

const validAddress = (value: string) => isAddress(value, { strict: false }) && value.toLowerCase() !== zeroAddress;
const positiveWhole = (value: string) => /^\d+$/.test(value) && BigInt(value) > 0n && BigInt(value) < 2n ** 256n;
const fieldNames: Record<string, string> = {
  entryStake: "Entry stake", proposalBond: "Proposal bond", voteMinStake: "Minimum vote",
  exitCooldownMinutes: "Exit cooldown", validationMinutes: "Validation window", binaryVotingMinutes: "Binary voting duration",
  roundVotingMinutes: "Slate voting duration", rewardEpochMinutes: "Validator reward epoch", milestoneReviewDays: "Milestone review",
  milestoneProofMinutes: "Milestone proof deadline", validatorPointsThreshold: "Validator points", rejectionFeeBps: "NO fee",
  validatorRewardBps: "Validator reward share", validatorActivityBps: "Validator activity threshold",
};
export function communityStepProblems(step: number, draft: Record<string, string>, creator: string | undefined, admins: readonly string[], validators: readonly string[]): string[] {
  if (step === 0) return [!draft.name.trim() ? "Add a Community name." : null, referenceProblem(draft.metadataURI), !validAddress(draft.executionRecipient.trim()) ? "Add a nonzero execution wallet or multisig. This address is immutable." : null].filter((value): value is string => !!value);
  if (step === 1) {
    const holders = effectiveCommunityAdmins(creator, admins), errors: string[] = [];
    if (!validators.length) errors.push("Add at least one validator wallet using the Add button.");
    for (const [label, entries] of [["Admins", holders], ["Validators", validators]] as const) {
      if (entries.some((address) => !validAddress(address))) errors.push(`${label} must be nonzero wallet addresses.`);
      if (new Set(entries.map((address) => address.toLowerCase())).size !== entries.length) errors.push(`${label} contain duplicate addresses.`);
    }
    if (validators.some((validator) => holders.some((admin) => admin.toLowerCase() === validator.toLowerCase()))) errors.push("Admin and validator roles cannot overlap.");
    if (!positiveWhole(draft.validatorThreshold) || BigInt(draft.validatorThreshold) > BigInt(validators.length)) errors.push("Validator approvals must be between 1 and the number of added validators.");
    if (!positiveWhole(draft.adminThreshold) || BigInt(draft.adminThreshold) > BigInt(holders.length || 1)) errors.push("Admin quorum must be between 1 and the number of admins, including the creator.");
    return errors;
  }
  if (step === 2) {
    const errors: string[] = [];
    for (const key of ["entryStake", "proposalBond", "voteMinStake"]) if (parseCreationUsdc(draft[key]) <= 0n) errors.push(`${fieldNames[key]}: enter positive USDC with at most 6 decimal places.`);
    for (const key of ["exitCooldownMinutes", "validationMinutes", "binaryVotingMinutes", "roundVotingMinutes", "rewardEpochMinutes", "milestoneReviewDays", "milestoneProofMinutes", "validatorPointsThreshold", "rejectionFeeBps", "validatorRewardBps", "validatorActivityBps"]) {
      if (!positiveWhole(draft[key])) errors.push(`${fieldNames[key]}: enter a positive whole number.`);
    }
    if (positiveWhole(draft.milestoneReviewDays) && BigInt(draft.milestoneReviewDays) > 14n) errors.push("Milestone review must be between 1 and 14 days.");
    if (positiveWhole(draft.validatorPointsThreshold) && BigInt(draft.validatorPointsThreshold) > 100n) errors.push("Validator points cannot exceed 100.");
    for (const [key, maximum] of [["rejectionFeeBps", 1000n], ["validatorRewardBps", 10000n], ["validatorActivityBps", 10000n]] as const) if (positiveWhole(draft[key]) && BigInt(draft[key]) > maximum) errors.push(`${fieldNames[key]}: maximum is ${maximum} bps.`);
    for (const key of ["exitCooldownMinutes", "validationMinutes", "binaryVotingMinutes", "roundVotingMinutes", "rewardEpochMinutes", "milestoneProofMinutes"]) {
      const maximum = key === "milestoneProofMinutes" ? 2n ** 64n : 2n ** 256n;
      if (positiveWhole(draft[key]) && BigInt(draft[key]) * 60n >= maximum) errors.push(`${fieldNames[key]}: duration is too large for the contract.`);
    }
    return errors;
  }
  return [];
}

export function reviewIdentity(value: unknown) { return JSON.stringify(value); }
