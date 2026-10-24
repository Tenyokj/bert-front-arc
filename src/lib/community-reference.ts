import type { Address } from "viem";

export const ORIGINAL_V31_FACTORY = "0xe16Cd61a21feA97393e6eEE3A7F7A26828021dD0" as Address;
const addressPattern = /^0x[a-fA-F0-9]{40}$/;
const configuredChain = (process.env.NEXT_PUBLIC_DEFAULT_CHAIN || "arc").toLowerCase() === "hardhat" ? 31337 : 5042002;

/** Only configured, trusted Factories can resolve a route into transaction targets. */
export function getCommunityFactories(chainId = configuredChain): Address[] {
  if (chainId !== configuredChain) return [];
  const candidates = [process.env.NEXT_PUBLIC_V3_FACTORY_ADDRESS];
  if (chainId === 5042002) {
    candidates.push(ORIGINAL_V31_FACTORY, ...(process.env.NEXT_PUBLIC_V3_LEGACY_FACTORY_ADDRESSES || "").split(","));
  }
  return [...new Map(candidates.map((value) => value?.trim()).filter((value): value is Address => Boolean(value && addressPattern.test(value) && !/^0x0{40}$/i.test(value)))
    .map((value) => [value.toLowerCase(), value])).values()];
}

export function communityRouteKey(factory: Address, id: bigint | number): string {
  return `${factory.toLowerCase()}-${id.toString()}`;
}

/** Numeric Arc bookmarks always refer to the original V3.1 Factory, never a new env default. */
export function resolveCommunityReference(value: string, chainId = configuredChain): { factory: Address; id: number; key: string } | null {
  const factories = getCommunityFactories(chainId);
  const qualified = /^(0x[a-fA-F0-9]{40})-([1-9]\d*)$/.exec(value);
  const numeric = /^[1-9]\d*$/.test(value);
  const factory = qualified
    ? factories.find((item) => item.toLowerCase() === qualified[1].toLowerCase())
    : numeric ? factories.find((item) => chainId === 31337 || item.toLowerCase() === ORIGINAL_V31_FACTORY.toLowerCase()) : undefined;
  const id = Number(qualified?.[2] ?? value);
  if (!factory || !Number.isSafeInteger(id) || id < 1) return null;
  return { factory, id, key: communityRouteKey(factory, id) };
}
