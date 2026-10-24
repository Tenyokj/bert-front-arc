import { BaseError, ContractFunctionRevertedError, ContractFunctionZeroDataError, getContractAddress, parseAbi, zeroAddress, type Address, type PublicClient } from "viem";
import { communityFactoryAbi } from "./community-contracts";
import { communityConfigHash } from "./community-reservation";
import type { CommunityCreationContext } from "./community-creation";

type Reader = Pick<PublicClient, "getChainId" | "readContract" | "getBytecode" | "getTransactionCount">;
type Reservation = { id: bigint; factory: Address; treasury: Address };
const hubIdentityAbi = parseAbi([
  "function creator() view returns (address)",
  "function communityTreasury() view returns (address)",
  "function configHash() view returns (bytes32)",
]);

export function isUncertainBroadcast(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /already known|transaction already imported|nonce too low|nonce provided[^\n]*lower|timed? ?out|timeout|failed to fetch|http request failed/i.test(message);
}

export function setupFailureMessage(error: unknown) {
  if (isUncertainBroadcast(error)) return "The wallet/RPC did not reliably return the transaction result. It may already be confirmed. Refresh on-chain status before sending again; do not manually increase the nonce.";
  const message = error instanceof Error && "shortMessage" in error ? String(error.shortMessage) : error instanceof Error ? error.message : "Could not complete this step.";
  return message.split("Request Arguments:")[0].split("Contract Call:")[0].slice(0, 400);
}

export async function assertNoPendingSetupTransaction(client: Reader, context: CommunityCreationContext) {
  if (await client.getChainId() !== context.chainId) throw new Error("Setup RPC is on the wrong network.");
  const latest = await client.getTransactionCount({ address: context.creator, blockTag: "latest" });
  const pending = await client.getTransactionCount({ address: context.creator, blockTag: "pending" });
  if (latest !== pending) throw new Error("This wallet has an unconfirmed transaction. Wait for it to confirm, then refresh setup status before sending another step.");
}

/** After an uncertain Reserve response, only accept a newly allocated exact match. */
export async function findSubmittedReservation(client: Reader, context: CommunityCreationContext, config: Record<string, unknown>, minimumId: bigint) {
  if (await client.getChainId() !== context.chainId) throw new Error("Setup RPC is on the wrong network.");
  const ids = await client.readContract({ address: context.factory, abi: communityFactoryAbi, functionName: "getCreatorCommunityIds", args: [context.creator] });
  for (const id of ids.slice(-20).reverse()) {
    if (id < minimumId) continue;
    const record = await client.readContract({ address: context.factory, abi: communityFactoryAbi, functionName: "getCommunity", args: [id] });
    const hash = await client.readContract({ address: context.factory, abi: communityFactoryAbi, functionName: "configHashByCommunityId", args: [id] });
    if (record.creator.toLowerCase() === context.creator.toLowerCase() && record.treasury !== zeroAddress && hash.toLowerCase() === communityConfigHash(config).toLowerCase()) {
      return { id, factory: context.factory, treasury: record.treasury };
    }
  }
  return null;
}

/** Reconcile chain state before another Hub deployment or activation, never change nonce. */
export async function readCommunitySetup(client: Reader, context: CommunityCreationContext, reservation: Reservation, config: Record<string, unknown>, candidate?: Address | null) {
  if (await client.getChainId() !== context.chainId || reservation.factory.toLowerCase() !== context.factory.toLowerCase()) throw new Error("Reservation network or Factory does not match.");
  const record = await client.readContract({ address: context.factory, abi: communityFactoryAbi, functionName: "getCommunity", args: [reservation.id] });
  const committed = await client.readContract({ address: context.factory, abi: communityFactoryAbi, functionName: "configHashByCommunityId", args: [reservation.id] });
  const expected = communityConfigHash(config);
  if (record.creator.toLowerCase() !== context.creator.toLowerCase() || record.treasury.toLowerCase() !== reservation.treasury.toLowerCase() || committed.toLowerCase() !== expected.toLowerCase()) throw new Error("Factory reservation does not match this setup.");
  const matches = async (address: Address) => {
    const code = await client.getBytecode({ address });
    if (!code || code === "0x") return false;
    try {
      const creator = await client.readContract({ address, abi: hubIdentityAbi, functionName: "creator" });
      const treasury = await client.readContract({ address, abi: hubIdentityAbi, functionName: "communityTreasury" });
      const hash = await client.readContract({ address, abi: hubIdentityAbi, functionName: "configHash" });
      return creator.toLowerCase() === context.creator.toLowerCase() && treasury.toLowerCase() === reservation.treasury.toLowerCase() && hash.toLowerCase() === expected.toLowerCase();
    } catch (error) {
      // An unrelated contract is not a Hub. RPC failures must never mean "not deployed".
      if (error instanceof BaseError) {
        const cause = error.walk((item) => item instanceof ContractFunctionRevertedError || item instanceof ContractFunctionZeroDataError);
        if (cause instanceof ContractFunctionRevertedError || cause instanceof ContractFunctionZeroDataError) return false;
      }
      throw error;
    }
  };
  if (record.hub !== zeroAddress) {
    if (!(await matches(record.hub))) throw new Error("Activated Hub identity could not be verified.");
    return { hub: record.hub, active: true };
  }
  if (candidate) {
    if (!(await matches(candidate))) throw new Error("The supplied Hub does not match this creator, Treasury and configuration, or is not confirmed yet.");
    return { hub: candidate, active: false };
  }
  const count = await client.getTransactionCount({ address: context.creator, blockTag: "latest" });
  // Bounded recent CREATE candidates avoid pruned/unbounded event scans. Older Hubs can be supplied explicitly.
  for (let nonce = count - 1; nonce >= Math.max(0, count - 8); nonce--) {
    const address = getContractAddress({ from: context.creator, nonce: BigInt(nonce) });
    if (await matches(address)) return { hub: address, active: false };
  }
  return { hub: null, active: false };
}
