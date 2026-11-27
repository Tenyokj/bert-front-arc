import { getAddress, isAddress, zeroAddress, type Address, type PublicClient } from "viem";
import { IDEA_STATUS_LABELS } from "./dapp-onchain";
import { contracts, fundingPoolAbi, ideaRegistryAbi, reputationSystemAbi, usdcAbi, voterProgressionAbi, votingSystemAbi, grantManagerAbi } from "./contracts";

export const PROFILE_PAGE_SIZE = 12;
export type ProfileIdea = { id: number; title: string; description: string; totalVotes: bigint; status: number; createdAt: bigint; lockedStake: bigint | null };
export type ProfileSnapshot = {
  account: Address; chain: number; block: bigint; totalIdeas: number; page: number; ideas: ProfileIdea[];
  balance: bigint | null; reputation: bigint | null; initialized: boolean | null; requiredBond: bigint | null;
  progression: { wins: bigint; curator: boolean; reviewer: boolean; toCurator: bigint; toReviewer: bigint } | null;
  errors: { label: string; message: string }[];
};
type Deployment = typeof contracts;
const asUint = (value: unknown): bigint => { if (typeof value !== "bigint" || value < 0n) throw Error("Invalid unsigned contract value."); return value; };
const asBool = (value: unknown): boolean => { if (typeof value !== "boolean") throw Error("Invalid boolean contract value."); return value; };
const configured = (value: unknown): value is Address => typeof value === "string" && isAddress(value) && value.toLowerCase() !== zeroAddress;
const errorMessage = (value: unknown) => value instanceof Error ? value.message : String(value);

export async function readProfileSnapshot(client: PublicClient, wallet: Address, chain: number, requestedPage: number, deployment: Deployment = contracts): Promise<ProfileSnapshot> {
  if (!configured(wallet) || !Number.isSafeInteger(requestedPage) || requestedPage < 1) throw Error("Invalid wallet or profile page.");
  if (await client.getChainId() !== chain) throw Error("Profile RPC is connected to a different network.");
  if (!configured(deployment.ideaRegistry)) throw Error("IdeaRegistry is not configured for this preview.");
  const header = await client.getBlock();
  if (header.number === null || !header.hash) throw Error("No confirmed block header is available.");
  const read = (address: Address, abi: typeof ideaRegistryAbi, functionName: string, args?: readonly unknown[]) => client.readContract({ address, abi, functionName, args, blockNumber: header.number });
  const rawIds = await read(deployment.ideaRegistry, ideaRegistryAbi, "getIdeasByAuthor", [wallet]);
  if (!Array.isArray(rawIds) || rawIds.some((id) => typeof id !== "bigint" || id <= 0n || id > BigInt(Number.MAX_SAFE_INTEGER)) || new Set(rawIds.map(String)).size !== rawIds.length) throw Error("Author idea index is invalid; no empty history was assumed.");
  const ids = (rawIds as bigint[]).toSorted((a, b) => a > b ? -1 : a < b ? 1 : 0);
  const page = Math.min(requestedPage, Math.max(1, Math.ceil(ids.length / PROFILE_PAGE_SIZE)));
  const snapshot: ProfileSnapshot = { account: getAddress(wallet), chain, block: header.number, page, totalIdeas: ids.length, ideas: [], balance: null, reputation: null, initialized: null, requiredBond: null, progression: null, errors: [] };
  async function optional<T>(label: string, target: Address | undefined, action: (target: Address) => Promise<T>): Promise<T | null> {
    try { if (!configured(target)) throw Error("Contract not configured."); return await action(target); }
    catch (error) { snapshot.errors.push({ label, message: errorMessage(error) }); return null; }
  }
  // Only the visible page is hydrated; never scan all historic rounds for a profile.
  const selected = ids.slice((page - 1) * PROFILE_PAGE_SIZE, page * PROFILE_PAGE_SIZE);
  for (let start = 0; start < selected.length; start += 3) {
    const batch = await Promise.all(selected.slice(start, start + 3).map(async (id) => {
      const raw = await read(deployment.ideaRegistry!, ideaRegistryAbi, "getIdea", [id]);
      if (!Array.isArray(raw) || raw.length !== 8 || raw[0] !== id || typeof raw[1] !== "string" || raw[1].toLowerCase() !== wallet.toLowerCase() || typeof raw[2] !== "string" || typeof raw[3] !== "string") throw Error("Idea payload does not match the connected author.");
      const status = Number(raw[7]);
      if (!["number", "bigint"].includes(typeof raw[7]) || !Number.isSafeInteger(status) || status < 0 || status >= IDEA_STATUS_LABELS.length) throw Error("Unknown idea status.");
      return { id: Number(id), title: raw[2], description: raw[3], createdAt: asUint(raw[5]), totalVotes: asUint(raw[6]), status, lockedStake: await optional(`Idea #${id} bond`, deployment.fundingPool, async (target) => asUint(await read(target, fundingPoolAbi, "authorStakeByIdea", [id]))) };
    }));
    snapshot.ideas.push(...batch);
  }
  snapshot.balance = await optional("Wallet token balance", deployment.usdc, async (target) => asUint(await read(target, usdcAbi, "balanceOf", [wallet])));
  snapshot.requiredBond = await optional("Required author bond", deployment.ideaRegistry, async (target) => asUint(await read(target, ideaRegistryAbi, "authorMinStake")));
  snapshot.reputation = await optional("Reputation", deployment.reputationSystem, async (target) => asUint(await read(target, reputationSystemAbi, "getReputation", [wallet])));
  snapshot.initialized = await optional("Reputation initialization", deployment.reputationSystem, async (target) => asBool(await read(target, reputationSystemAbi, "isInitialized", [wallet])));
  snapshot.progression = await optional("Voter progression", deployment.voterProgression, async (target) => {
    const raw = await read(target, voterProgressionAbi, "getProgressionStatus", [wallet]);
    if (!Array.isArray(raw) || raw.length !== 5) throw Error("Invalid progression result.");
    return { wins: asUint(raw[0]), curator: asBool(raw[1]), reviewer: asBool(raw[2]), toCurator: asUint(raw[3]), toReviewer: asUint(raw[4]) };
  });
  const pinned = await client.getBlock({ blockNumber: header.number });
  if (pinned.hash !== header.hash) throw Error("The pinned profile block changed. Refresh before using this snapshot.");
  return snapshot;
}

export type WalletAction = { round: bigint; idea: bigint; title: string; description: string; href: string };
export async function readRecentWalletActions(client: PublicClient, wallet: Address, chain: number, deployment: Deployment = contracts) {
  if (!configured(wallet) || await client.getChainId() !== chain) throw Error("Invalid wallet or RPC network.");
  if (!configured(deployment.votingSystem) || !configured(deployment.fundingPool) || !configured(deployment.ideaRegistry)) throw Error("Funding contracts are not configured.");
  const block = await client.getBlock();
  if (block.number === null || !block.hash) throw Error("No confirmed actions block is available.");
  const read = (address: Address, abi: typeof votingSystemAbi, functionName: string, args?: readonly unknown[]) => client.readContract({ address, abi, functionName, args, blockNumber: block.number });
  const nextId = asUint(await read(deployment.votingSystem, votingSystemAbi, "currentRoundId"));
  const lastId = nextId > 0n ? nextId - 1n : 0n;
  const actions: WalletAction[] = [];
  const errors: { round: bigint; message: string }[] = [];
  const firstId = lastId > 7n ? lastId - 7n : 1n;
  for (let id = lastId; id >= firstId; id--) {
    try {
      const info = await read(deployment.votingSystem, votingSystemAbi, "getRoundInfo", [id]);
      const pledge = await read(deployment.fundingPool, fundingPoolAbi, "getPledge", [id, wallet]);
      if (!Array.isArray(info) || info.length < 8 || !Array.isArray(pledge) || pledge.length !== 3) throw Error("Malformed round or pledge result.");
      const pledgedIdea = asUint(pledge[0]); const amount = asUint(pledge[1]); const refunded = asBool(pledge[2]);
      if (amount > 0n && !refunded) {
        try {
          const simulated = await client.simulateContract({ address: deployment.fundingPool, abi: fundingPoolAbi, functionName: "claimPledgeRefund", args: [id], account: wallet, blockNumber: block.number });
          const refundable = asUint(simulated.result);
          if (refundable > 0n) actions.push({ round: id, idea: pledgedIdea, title: "Review a pledge refund", description: "A read-only refund simulation succeeded for this wallet at the pinned block. Check the live amount before signing.", href: `/rounds/${id}` });
        } catch { actions.push({ round: id, idea: pledgedIdea, title: "Inspect your pledge", description: "An unclaimed pledge is recorded. A refund was not confirmed by simulation; check the round outcome and any RPC error on its page.", href: `/rounds/${id}` }); }
      }
      const winner = asUint(info[7]);
      if (winner > 0n && configured(deployment.grantManager)) {
        const author = await read(deployment.ideaRegistry, ideaRegistryAbi, "getIdeaAuthor", [winner]);
        if (typeof author !== "string" || !isAddress(author)) throw Error("Unknown winning author.");
        if (author.toLowerCase() === wallet.toLowerCase()) {
          const eligibility = await read(deployment.grantManager, grantManagerAbi, "canClaimGrant", [id]);
          if (!Array.isArray(eligibility) || typeof eligibility[0] !== "boolean") throw Error("Unknown grant eligibility.");
          actions.push({ round: id, idea: winner, title: eligibility[0] ? "Review your initial grant claim" : "Track your selected idea", description: eligibility[0] ? "The grant eligibility getter returned true and this wallet is the winning author. The idea page checks again before signing." : String(eligibility[1] || "Open milestone and payout status."), href: `/ideas/${winner}` });
        }
      }
    } catch (error) { errors.push({ round: id, message: errorMessage(error) }); }
  }
  const pinned = await client.getBlock({ blockNumber: block.number });
  if (pinned.hash !== block.hash) throw Error("The actions snapshot changed. Run the read-only scan again.");
  return { actions, errors, block: block.number, firstId, lastId, account: wallet };
}
