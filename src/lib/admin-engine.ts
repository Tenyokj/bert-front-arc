import { getAddress, isAddress, keccak256, parseUnits, stringToHex, toHex, zeroAddress, type Address, type Hex, type PublicClient } from "viem";
import type { AdminContract, AdminOperation } from "./admin-catalog";

export const adminRole = `0x${"0".repeat(64)}` as const;
export function roleId(name: string) { return name === "DEFAULT_ADMIN_ROLE" ? adminRole : keccak256(stringToHex(name)); }
export function jsonValue(value: unknown) { return JSON.stringify(value, (_, item) => typeof item === "bigint" ? item.toString() : item); }
export type AdminIntent = { account: Address; chain: number; target: Address; method: string; data: Hex; createdAt: string; hash?: Hex };
export function parseAdminIntent(raw: string): AdminIntent | null {
  try {
    const value = JSON.parse(raw);
    if (!value || !isAddress(value.account) || !isAddress(value.target) || !Number.isSafeInteger(value.chain) || value.chain <= 0 ||
      typeof value.method !== "string" || !value.method || typeof value.data !== "string" || !/^0x(?:[0-9a-fA-F]{2}){4,}$/.test(value.data) ||
      typeof value.createdAt !== "string" || !Number.isFinite(Date.parse(value.createdAt)) || (value.hash !== undefined && !/^0x[0-9a-fA-F]{64}$/.test(value.hash))) return null;
    return value;
  } catch { return null; }
}
export function explicitlyRejected(error: unknown): boolean {
  let item = error;
  for (let depth = 0; depth < 8 && item && typeof item === "object"; depth++) {
    const nested = item as { code?: number; cause?: unknown };
    if (nested.code === 4001) return true;
    item = nested.cause;
  }
  return false;
}
export async function readAdminIntentReceipt(client: PublicClient, intent: AdminIntent, hash: Hex, expectedChain: number) {
  if (await client.getChainId() !== intent.chain || intent.chain !== expectedChain) throw new Error("Use the original transaction's chain.");
  if (!/^0x[0-9a-fA-F]{64}$/.test(hash)) throw new Error("Paste a transaction hash from your wallet or explorer.");
  const tx = await client.getTransaction({ hash });
  if (tx.from.toLowerCase() !== intent.account.toLowerCase() || tx.to?.toLowerCase() !== intent.target.toLowerCase() || tx.input.toLowerCase() !== intent.data.toLowerCase() || tx.value !== 0n) throw new Error("Transaction sender, target, value or calldata does not match the saved intent.");
  const receipt = await client.getTransactionReceipt({ hash });
  if (receipt.status !== "success" && receipt.status !== "reverted") throw new Error("No final receipt status is available.");
  return receipt;
}
export function parseAdminArgs(op: AdminOperation, values: Record<string, string>, knownRoles: readonly string[]): readonly unknown[] {
  return op.fields.map((field) => {
    const value = (values[field.name] || "").trim();
    if (field.kind === "address") {
      if (!isAddress(value) || value.toLowerCase() === zeroAddress) throw new Error(`${field.label}: enter a nonzero address.`);
      return getAddress(value);
    }
    if (field.kind === "addresses") {
      const entries = value.split(/[\s,]+/).filter(Boolean);
      if (!entries.length || entries.length > 25 || entries.some((entry) => !isAddress(entry) || entry.toLowerCase() === zeroAddress)) throw new Error("Enter 1-25 nonzero wallet addresses.");
      if (new Set(entries.map((entry) => entry.toLowerCase())).size !== entries.length) throw new Error("Duplicate addresses are not allowed.");
      return entries.map((entry) => getAddress(entry));
    }
    if (field.kind === "bool") {
      if (value !== "true" && value !== "false") throw new Error(`Choose ${field.label}.`);
      return value === "true";
    }
    if (field.kind === "role") {
      if (!knownRoles.includes(value)) throw new Error("Select a known protocol role.");
      const user = ["CURATOR_ROLE", "REVIEWER_ROLE"].includes(value);
      if (op.method.includes("SystemRole") && (user || value === "DEFAULT_ADMIN_ROLE")) throw new Error("This operation requires a system role.");
      if (op.method === "revokeUserRole" && !user) throw new Error("Select Curator or Reviewer for this operation.");
      return roleId(value);
    }
    if (!(field.unit === "usdc" ? /^\d+(\.\d{1,6})?$/ : /^\d+$/).test(value)) throw new Error(`${field.label}: enter a nonnegative ${field.unit === "usdc" ? "USDC amount with up to six decimals" : "whole number"}.`);
    const parsed = field.unit === "usdc" ? parseUnits(value, 6) : BigInt(value);
    if (parsed >= 2n ** 256n || (field.min !== undefined && parsed < BigInt(field.min)) || (field.max !== undefined && parsed > BigInt(field.max))) throw new Error(`${field.label}: value is outside the allowed range.`);
    return parsed;
  });
}

export async function prepareAdminOperation(client: PublicClient, config: AdminContract, op: AdminOperation, args: readonly unknown[], account: Address, rolesRegistry: Address, expectedChain: number) {
  if (!isAddress(rolesRegistry) || rolesRegistry.toLowerCase() === zeroAddress) throw new Error("RolesRegistry is not configured.");
  if (!config.address || !isAddress(config.address) || config.address.toLowerCase() === zeroAddress) throw new Error("Contract address is not configured.");
  if (!config.operations.some((allowed) => allowed === op)) throw new Error("Operation is not in the reviewed allowlist.");
  if (await client.getChainId() !== expectedChain) throw new Error("RPC chain mismatch.");
  const code = await client.getBytecode({ address: config.address });
  if (!code || code === "0x") throw new Error("No deployed contract code at this address.");
  const registryAbi = [{ type: "function", name: "hasRole", stateMutability: "view", inputs: [{ type: "bytes32" }, { type: "address" }], outputs: [{ type: "bool" }] }] as const;
  const ownRoles = config.registry ? config.address : await client.readContract({ address: config.address, abi: config.abi, functionName: "roles" });
  if (typeof ownRoles !== "string" || ownRoles.toLowerCase() !== rolesRegistry.toLowerCase()) throw new Error("Target contract uses a different or unavailable RolesRegistry.");
  const permission = await client.readContract({ address: rolesRegistry, abi: registryAbi, functionName: "hasRole", args: [adminRole, account] });
  if (permission !== true) throw new Error("Fresh onchain protocol Admin permission is required.");
  const [latest, pending] = await Promise.all([client.getTransactionCount({ address: account, blockTag: "latest" }), client.getTransactionCount({ address: account, blockTag: "pending" })]);
  if (pending > latest) throw new Error("This wallet has a pending transaction. Resolve it before sending another admin action.");
  for (let index = 0; index < op.fields.length; index++) {
    if (op.fields[index].contract) {
      const destination = args[index] as Address;
      const candidateCode = await client.getBytecode({ address: destination });
      if (!candidateCode || candidateCode === "0x") throw new Error(`${op.fields[index].label}: expected a deployed contract.`);
    }
  }
  let current: unknown = undefined;
  if (op.getter) current = await client.readContract({ address: config.address, abi: config.abi, functionName: op.getter });
  const { request } = await client.simulateContract({ address: config.address, abi: config.abi, functionName: op.method, args, account });
  return { request, current, chainId: expectedChain, target: config.address, account, args };
}

const implementationSlot = toHex(BigInt(keccak256(stringToHex("eip1967.proxy.implementation"))) - 1n, { size: 32 });
const adminSlot = toHex(BigInt(keccak256(stringToHex("eip1967.proxy.admin"))) - 1n, { size: 32 });
export async function inspectProxy(client: PublicClient, address: Address) {
  const block = await client.getBlock();
  const slotAddress = (raw: string | undefined) => !raw || raw === `0x${"0".repeat(64)}` ? null : getAddress(`0x${raw.slice(-40)}`);
  const [implementation, proxyAdmin] = await Promise.all([client.getStorageAt({ address, slot: implementationSlot, blockNumber: block.number }), client.getStorageAt({ address, slot: adminSlot, blockNumber: block.number })]);
  const admin = slotAddress(proxyAdmin);
  let owner: string | null = null;
  if (admin) {
    try { owner = await client.readContract({ address: admin, abi: [{ type: "function", name: "owner", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] }], functionName: "owner", blockNumber: block.number }) as string; } catch { /* Not every admin-slot address exposes owner(). */ }
  }
  return { block: block.number.toString(), implementation: slotAddress(implementation), proxyAdmin: admin, owner };
}
