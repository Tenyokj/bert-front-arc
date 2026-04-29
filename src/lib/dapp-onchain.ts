import { formatUnits } from "viem";

export const IDEA_STATUS_LABELS = [
  "Pending",
  "Voting",
  "WonVoting",
  "Funded",
  "Rejected",
  "Completed",
  "InProcess",
] as const;

export const MILESTONE_STAGE_LABELS: Record<number, string> = {
  1: "In-process proof",
  2: "Launch proof",
};

export function mapIdeaStatus(code: bigint | number | undefined) {
  if (code === undefined) return "Unknown";
  const idx = Number(code);
  return IDEA_STATUS_LABELS[idx] ?? "Unknown";
}

export function mapMilestoneStage(stage: number) {
  return MILESTONE_STAGE_LABELS[stage] ?? `Stage ${stage}`;
}

export function formatNumber(value: number | bigint | undefined) {
  if (value === undefined) return "-";
  return new Intl.NumberFormat("en-US").format(Number(value));
}

export function formatTokenAmount(
  value: bigint | number | undefined,
  decimals = 18,
  maxFractionDigits = 4
) {
  if (value === undefined) return "-";
  const raw = typeof value === "bigint" ? value : BigInt(value);
  const normalized = Number(formatUnits(raw, decimals));
  if (!Number.isFinite(normalized)) return formatUnits(raw, decimals);

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits:
      normalized >= 1000 ? Math.min(maxFractionDigits, 2) : maxFractionDigits,
  }).format(normalized);
}

export function formatDateTimeFromUnix(ts: bigint | number | undefined) {
  if (ts === undefined) return "-";
  const ms = Number(ts) * 1000;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(ms));
}

export function shortAddress(address?: string) {
  if (!address) return "-";
  if (address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
