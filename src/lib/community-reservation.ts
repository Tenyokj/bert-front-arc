import { encodeAbiParameters, keccak256, zeroAddress, type Abi, type Address, type PublicClient } from "viem";
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
