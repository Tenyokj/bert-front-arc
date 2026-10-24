import { decodeFunctionData, encodeAbiParameters, keccak256, parseEventLogs, zeroAddress, type Abi, type Address, type Hash, type Hex, type PublicClient } from "viem";
import { communityFactoryAbi } from "./community-contracts";
import type { CommunityCreationContext } from "./community-creation";

export function isAlreadyKnownTransaction(error: { message?: string } | null): boolean {
  return /\balready known\b/i.test(error?.message ?? "");
}

/** Hash exactly the tuple committed by Factory, not a JSON representation. */
export function communityConfigHash(config: Record<string, unknown>) {
  const abi: Abi = communityFactoryAbi;
  const create = abi.find((item) => item.type === "function" && item.name === "createCommunity");
  if (!create || create.type !== "function") throw new Error("Factory configuration ABI is missing.");
  return keccak256(encodeAbiParameters(create.inputs, [config]));
}

export function decodeReservationConfig(data: Hex) {
  const decoded = decodeFunctionData({ abi: communityFactoryAbi, data });
  if (decoded.functionName !== "createCommunity") throw new Error("This is not a Treasury reservation transaction.");
  return decoded.args[0];
}

export type ReservedCommunityConfig = ReturnType<typeof decodeReservationConfig>;

/** Load public calldata rather than asking the creator to reconstruct immutable fields. */
export async function resumeCommunityReservation(
  client: Pick<PublicClient, "getChainId" | "getTransaction" | "getTransactionReceipt" | "readContract">,
  context: CommunityCreationContext,
  hash: Hash,
) {
  if (!/^0x[a-fA-F0-9]{64}$/.test(hash)) throw new Error("Paste the full reservation transaction hash from wallet activity.");
  if (await client.getChainId() !== context.chainId) throw new Error("Reservation transaction is on a different network.");
  const [transaction, receipt] = await Promise.all([
    client.getTransaction({ hash }), client.getTransactionReceipt({ hash }),
  ]);
  if (transaction.hash.toLowerCase() !== hash.toLowerCase() || receipt.transactionHash.toLowerCase() !== hash.toLowerCase()) {
    throw new Error("RPC returned a different transaction.");
  }
  if (receipt.status !== "success" || !transaction.blockHash || transaction.blockHash !== receipt.blockHash) {
    throw new Error("The reservation transaction is not confirmed successfully yet.");
  }
  if (transaction.to?.toLowerCase() !== context.factory.toLowerCase() || transaction.from.toLowerCase() !== context.creator.toLowerCase()) {
    throw new Error("The transaction must be from the connected creator to the configured Community Factory.");
  }
  const config = decodeReservationConfig(transaction.input);
  const configHash = communityConfigHash(config);
  const events = parseEventLogs({
    abi: communityFactoryAbi, eventName: "CommunityTreasuryCreated",
    logs: receipt.logs.filter((log) => log.address.toLowerCase() === context.factory.toLowerCase()),
  });
  if (events.length !== 1 || events[0].args.creator.toLowerCase() !== context.creator.toLowerCase() || events[0].args.configHash.toLowerCase() !== configHash.toLowerCase()) {
    throw new Error("The receipt does not contain one matching Factory reservation.");
  }
  const reservation = await recoverCommunityReservation(client, context, events[0].args.communityId, config);
  if (reservation.treasury.toLowerCase() !== events[0].args.treasury.toLowerCase()) throw new Error("Receipt Treasury does not match the Factory record.");
  return { ...reservation, config };
}

/** Recover only a confirmed reservation belonging to this creator and exact config. */
export async function recoverCommunityReservation(
  client: Pick<PublicClient, "getChainId" | "readContract">,
  context: CommunityCreationContext,
  id: bigint,
  config: Record<string, unknown>,
): Promise<{ id: bigint; factory: Address; treasury: Address }> {
  if (id <= 0n) throw new Error("Reservation ID must be a positive whole number.");
  if (await client.getChainId() !== context.chainId) throw new Error("Recovery RPC is on the wrong network.");
  const deployment = await client.readContract({
    address: context.factory, abi: communityFactoryAbi, functionName: "getCommunity", args: [id],
  });
  if (deployment.creator.toLowerCase() !== context.creator.toLowerCase()) {
    throw new Error("This reservation belongs to a different creator.");
  }
  if (deployment.hub !== zeroAddress) throw new Error("This Community is already activated; open it from the directory.");
  if (deployment.treasury === zeroAddress) throw new Error("The reservation has no Treasury.");
  const committed = await client.readContract({
    address: context.factory, abi: communityFactoryAbi, functionName: "configHashByCommunityId", args: [id],
  });
  if (committed.toLowerCase() !== communityConfigHash(config).toLowerCase()) {
    throw new Error("Configuration differs from the reserved transaction. Restore its exact fields, roles and timing before recovering.");
  }
  return { id, factory: context.factory, treasury: deployment.treasury };
}
