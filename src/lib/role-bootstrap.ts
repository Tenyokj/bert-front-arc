import type { Address } from "viem";

function toAddress(value: string | undefined): Address | undefined {
  if (!value) return undefined;
  if (!/^0x[a-fA-F0-9]{40}$/.test(value)) return undefined;
  return value as Address;
}

function parseAddressList(value: string | undefined): Address[] {
  if (!value) return [];

  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item): item is Address => /^0x[a-fA-F0-9]{40}$/.test(item));
}

function parseDeadline(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

export const roleBootstrapConfig = {
  distributorAddress: toAddress(process.env.NEXT_PUBLIC_ROLE_BOOTSTRAP_DISTRIBUTOR_ADDRESS),
  claimDeadline: parseDeadline(process.env.NEXT_PUBLIC_ROLE_BOOTSTRAP_CLAIM_DEADLINE),
  curatorAllowlist: parseAddressList(process.env.NEXT_PUBLIC_ROLE_BOOTSTRAP_CURATOR_ALLOWLIST),
  reviewerAllowlist: parseAddressList(process.env.NEXT_PUBLIC_ROLE_BOOTSTRAP_REVIEWER_ALLOWLIST),
};

export function formatClaimDeadline(timestamp: number | null) {
  if (!timestamp) {
    return "Open until manually closed";
  }

  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(timestamp * 1000));
}

export function summarizeRoleBootstrapAddresses() {
  const merged = new Map<string, { address: Address; curator: boolean; reviewer: boolean }>();

  for (const address of roleBootstrapConfig.curatorAllowlist) {
    merged.set(address, { address, curator: true, reviewer: merged.get(address)?.reviewer ?? false });
  }

  for (const address of roleBootstrapConfig.reviewerAllowlist) {
    merged.set(address, { address, curator: merged.get(address)?.curator ?? false, reviewer: true });
  }

  return Array.from(merged.values());
}
