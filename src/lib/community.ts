import { formatUnits } from "viem";

export const COMMUNITY_STATUS_LABELS = ["Active", "Paused", "Archived"] as const;
export const PROPOSAL_ORIGIN_LABELS = ["Admin", "Member"] as const;
export const PROPOSAL_MODE_LABELS = ["Binary", "Slate"] as const;
export const PROPOSAL_STATUS_LABELS = [
  "Pending validation",
  "Rejected by validators",
  "Ready for binary voting",
  "Ready for slate round",
  "Binary voting",
  "In slate round",
  "Accepted",
  "Rejected",
  "Won round",
  "Lost round",
  "Settled",
] as const;

export function formatCommunityUsdc(value: bigint | undefined, maximumFractionDigits = 2) {
  if (value === undefined) return "-";
  const normalized = Number(formatUnits(value, 6));
  return new Intl.NumberFormat("en-US", { maximumFractionDigits }).format(normalized);
}

export function formatCommunityStatus(status: bigint | number | undefined) {
  return COMMUNITY_STATUS_LABELS[Number(status)] ?? "Unknown";
}

export function formatProposalStatus(status: bigint | number | undefined) {
  return PROPOSAL_STATUS_LABELS[Number(status)] ?? "Unknown";
}

export function formatProposalOrigin(origin: bigint | number | undefined) {
  return PROPOSAL_ORIGIN_LABELS[Number(origin)] ?? "Unknown";
}

export function formatProposalMode(mode: bigint | number | undefined) {
  return PROPOSAL_MODE_LABELS[Number(mode)] ?? "Unknown";
}
