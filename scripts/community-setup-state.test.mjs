import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";
import * as viem from "viem";

function load(path, dependencies) {
  const js = ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const exports = {};
  new Function("exports", "process", "require", js)(exports, { env: {} }, (name) => {
    if (!(name in dependencies)) throw Error(`Unexpected dependency ${name}`);
    return dependencies[name];
  });
  return exports;
}
const contracts = load("../src/lib/community-contracts.ts", {});
const hash = `0x${"11".repeat(32)}`;
const api = load("../src/lib/community-setup-state.ts", { viem, "./community-contracts": contracts, "./community-reservation": { communityConfigHash: () => hash } });
const context = { chainId: 5042002, creator: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", factory: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" };
const reservation = { id: 1n, factory: context.factory, treasury: "0xcccccccccccccccccccccccccccccccccccccccc" };
const hub = viem.getContractAddress({ from: context.creator, nonce: 11n });
function client(options = {}) {
  const reads = [];
  return {
    reads,
    async getChainId() { return options.chainId ?? context.chainId; },
    async getTransactionCount({ blockTag }) { return blockTag === "pending" ? options.pending ?? 12 : 12; },
    async getBytecode({ address }) {
      reads.push(address);
      if (options.rpcError) throw Error("HTTP request failed");
      return options.noHub || address !== hub ? undefined : "0x6000";
    },
    async readContract({ address, functionName }) {
      if (address === context.factory) {
        if (functionName === "getCreatorCommunityIds") return options.ids ?? [1n];
        if (functionName === "getCommunity") return { creator: context.creator, treasury: reservation.treasury, hub: options.active ? hub : viem.zeroAddress, ...options.record };
        if (functionName === "configHashByCommunityId") return options.configHash ?? hash;
      }
      if (functionName === "creator") return options.hubCreator ?? context.creator;
      if (functionName === "communityTreasury") return options.hubTreasury ?? reservation.treasury;
      if (functionName === "configHash") return options.hubHash ?? hash;
      throw Error(`Unexpected read ${functionName}`);
    },
  };
}

test("already-known/nonce wrappers are uncertain broadcasts, not evidence that a contract reverted", () => {
  for (const message of ["Nonce provided for the transaction is lower. Details: already known", "nonce too low", "HTTP request failed", "request timeout"]) assert.equal(api.isUncertainBroadcast(Error(message)), true);
  assert.equal(api.isUncertainBroadcast(Error("User rejected request")), false);
  assert.match(api.setupFailureMessage(Error("RPC already known 0x6100")), /Refresh on-chain status/);
  assert.doesNotMatch(api.setupFailureMessage(Error("RPC already known 0x6100")), /0x6100/);
});

test("preflight blocks pending nonce gaps without increasing or replacing any nonce", async () => {
  await api.assertNoPendingSetupTransaction(client(), context);
  await assert.rejects(api.assertNoPendingSetupTransaction(client({ pending: 13 }), context), /unconfirmed transaction/);
  await assert.rejects(api.assertNoPendingSetupTransaction(client({ chainId: 31337 }), context), /wrong network/);
});

test("a confirmed Hub after a lost wallet response is reused instead of deploying another copy", async () => {
  const c = client();
  assert.deepEqual(await api.readCommunitySetup(c, context, reservation, {}), { hub, active: false });
  assert.equal(c.reads.length, 1);
});

test("already confirmed activation is authoritative even without the wallet transaction hash", async () => {
  assert.deepEqual(await api.readCommunitySetup(client({ active: true }), context, reservation, {}), { hub, active: true });
});

test("wrong creator, Treasury, configuration, chain and explicit Hub candidates fail closed", async () => {
  for (const options of [{ record: { creator: reservation.treasury } }, { record: { treasury: context.creator } }, { configHash: viem.zeroHash }, { chainId: 31337 }]) await assert.rejects(api.readCommunitySetup(client(options), context, reservation, {}));
  for (const options of [{ hubCreator: reservation.treasury }, { hubTreasury: context.creator }, { hubHash: viem.zeroHash }]) await assert.rejects(api.readCommunitySetup(client(options), context, reservation, {}, hub), /supplied Hub/);
});

test("RPC failure is never mistaken for an absent Hub and recent-address discovery is bounded", async () => {
  await assert.rejects(api.readCommunitySetup(client({ rpcError: true }), context, reservation, {}), /HTTP request failed/);
  const c = client({ noHub: true });
  assert.deepEqual(await api.readCommunitySetup(c, context, reservation, {}), { hub: null, active: false });
  assert.equal(c.reads.length, 8);
});

test("Reserve reconciliation cannot attach an older identical Community", async () => {
  assert.equal(await api.findSubmittedReservation(client(), context, {}, 2n), null);
  assert.deepEqual(await api.findSubmittedReservation(client({ ids: [1n, 2n] }), context, {}, 2n), { ...reservation, id: 2n });
});

test("all writes await wallet errors, share a synchronous lock and reconcile before Hub/activation", () => {
  const page = readFileSync(new URL("../src/app/(dapp)/v3/create/page.tsx", import.meta.url), "utf8");
  assert.match(page, /const actionLock = useRef\(false\)/);
  assert.match(page, /await reserve.writeContractAsync/);
  assert.match(page, /await deploy.deployContractAsync/);
  assert.match(page, /await activate.writeContractAsync/);
  assert.match(page, /await syncSetup\(creationContext, reservation, config\)/);
  assert.match(page, /await syncSetup\(creationContext, reservation, config, hub\)/);
  assert.match(page, /const activated = chainActivated/);
  assert.match(page, /deployReceipt.data\?\.status === "success"/);
  assert.match(page, /reserveReceipt.data.status !== "success"/);
  assert.match(page, /activationReceipt.data\?\.status === "success"/);
  assert.doesNotMatch(page, /nonce:\s*/);
});
