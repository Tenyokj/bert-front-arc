import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";
import * as viem from "viem";

function load(path, dependencies = {}) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const exports = {};
  new Function("exports", "process", "require", js)(exports, { env: {} }, (name) => {
    if (!(name in dependencies)) throw Error(`Unexpected dependency ${name}`);
    return dependencies[name];
  });
  return exports;
}
const contracts = load("../src/lib/community-contracts.ts");
const api = load("../src/lib/community-reservation.ts", { viem, "./community-contracts": contracts });
const context = { chainId: 5042002, creator: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", factory: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb", adminActionsLibrary: "0xcccccccccccccccccccccccccccccccccccccccc" };
const treasury = "0xdddddddddddddddddddddddddddddddddddddddd";
const config = {
  name: "Reserved Community", metadataURI: "https://example.com", usdc: context.creator, globalBertReserve: context.factory,
  initialAdmins: [context.creator], initialValidators: [treasury], entryStakeUSDC: 2_000_000n, proposalBondUSDC: 3_000_000n,
  voteMinStakeUSDC: 4_000_000n, membershipExitCooldown: 240n, validatorApprovalThreshold: 1n, adminApprovalThreshold: 1n,
  binaryRejectionFeeBps: 300n, validatorRewardShareBps: 1500n, validationWindow: 86400n, binaryVotingDuration: 300n,
  roundVotingDuration: 600n, validatorRewardEpoch: 604800n, validatorActiveThresholdBps: 6000n,
  validatorProposalPointsThreshold: 15n, executionRecipient: context.creator, milestoneReviewDuration: 1209600n, milestoneProofDuration: 604800n,
};
function client(overrides = {}) {
  return {
    async getChainId() { return overrides.chainId ?? context.chainId; },
    async readContract(request) {
      assert.equal(request.address, context.factory);
      assert.deepEqual(request.args, [1n]);
      if (request.functionName === "getCommunity") return { creator: context.creator, treasury, hub: viem.zeroAddress, ...overrides.deployment };
      if (request.functionName === "configHashByCommunityId") return overrides.hash ?? api.communityConfigHash(config);
      throw Error("Unexpected read");
    },
  };
}

test("RPC already-known is classified separately from rejection or contract revert", () => {
  assert.equal(api.isAlreadyKnownTransaction({ message: "ContractFunctionExecutionError: RPC eth_sendRawTransaction: already known" }), true);
  for (const message of ["User rejected the request", "execution reverted: unauthorized", "nonce too low"]) {
    assert.equal(api.isAlreadyKnownTransaction({ message }), false);
  }
  assert.equal(api.isAlreadyKnownTransaction(null), false);
});

test("recovery restores only the canonical pending Treasury without any wallet writes", async () => {
  assert.deepEqual(await api.recoverCommunityReservation(client(), context, 1n, config), { id: 1n, factory: context.factory, treasury });
  const encoded = viem.encodeFunctionData({ abi: contracts.communityFactoryAbi, functionName: "createCommunity", args: [config] });
  const decoded = viem.decodeFunctionData({ abi: contracts.communityFactoryAbi, data: encoded });
  assert.equal(api.communityConfigHash(decoded.args[0]), api.communityConfigHash(config));
});

test("recovery fails closed on wrong chain, creator, active Hub, zero Treasury and invalid ID", async () => {
  for (const overrides of [
    { chainId: 31337 }, { deployment: { creator: treasury } },
    { deployment: { hub: treasury } }, { deployment: { treasury: viem.zeroAddress } },
  ]) await assert.rejects(api.recoverCommunityReservation(client(overrides), context, 1n, config));
  await assert.rejects(api.recoverCommunityReservation(client(), context, 0n, config));
  await assert.rejects(api.recoverCommunityReservation(client(), context, -1n, config));
});

test("changing any immutable configuration field cannot recover an incompatible reservation", async () => {
  for (const [field, value] of Object.entries(config)) {
    const changed = { ...config, [field]: typeof value === "bigint" ? value + 1n : Array.isArray(value) ? [context.adminActionsLibrary] : field === "executionRecipient" || field === "usdc" || field === "globalBertReserve" ? treasury : `${value}/changed` };
    await assert.rejects(api.recoverCommunityReservation(client(), context, 1n, changed), /Configuration differs/);
  }
});

test("creation UI loads confirmed calldata, locks original settings and blocks duplicate reservation", () => {
  const page = readFileSync(new URL("../src/app/(dapp)/v3/create/page.tsx", import.meta.url), "utf8");
  assert.match(page, /busy \|\| reservation \|\| alreadyKnown/);
  assert.match(page, /resumeCommunityReservation\(recoveryClient, context/);
  assert.match(page, /assertCommunityCreator\(context, address, chainId\)/);
  assert.match(page, /Load original setup \(read-only\)/);
  assert.match(page, /setConfig\(result.config\)/);
  assert.match(page, /setForm\(reservedForm\(result.config\)\)/);
  assert.match(page, /fieldset disabled=\{Boolean\(reservation\) \|\| busy\}/);
  assert.match(page, /<details open=\{alreadyKnown \|\| undefined\}/);
});

const hash = `0x${"11".repeat(32)}`;
const blockHash = `0x${"22".repeat(32)}`;
function transactionClient(overrides = {}) {
  const event = contracts.communityFactoryAbi.find((item) => item.name === "CommunityTreasuryCreated");
  const log = {
    address: context.factory,
    topics: viem.encodeEventTopics({ abi: [event], eventName: event.name, args: { communityId: 1n, creator: context.creator } }),
    data: viem.encodeAbiParameters(event.inputs.filter((input) => !input.indexed), [treasury, api.communityConfigHash(config), config.name, config.metadataURI]),
    transactionHash: hash, blockHash, blockNumber: 1n, transactionIndex: 0, logIndex: 0, removed: false,
  };
  return {
    ...client(overrides),
    async getTransaction() {
      return { hash, from: context.creator, to: context.factory, blockHash, input: viem.encodeFunctionData({ abi: contracts.communityFactoryAbi, functionName: "createCommunity", args: [config] }), ...overrides.transaction };
    },
    async getTransactionReceipt() {
      return { transactionHash: hash, blockHash, status: "success", logs: [log], ...overrides.receipt };
    },
  };
}

test("resume decodes all original config fields from confirmed transaction, independent of the current form", async () => {
  const result = await api.resumeCommunityReservation(transactionClient(), context, hash);
  const decodedConfig = Object.fromEntries(Object.entries(config).map(([key, value]) => [key,
    Array.isArray(value) ? value.map((address) => viem.getAddress(address)) : typeof value === "string" && viem.isAddress(value) ? viem.getAddress(value) : value,
  ]));
  assert.deepEqual(result, { id: 1n, factory: context.factory, treasury, config: decodedConfig });
});

test("explicit status-resume mode may load activated config for subsequent canonical Hub checks", async () => {
  const c = transactionClient({ deployment: { hub: treasury } });
  await assert.rejects(api.resumeCommunityReservation(c, context, hash), /already activated/);
  const result = await api.resumeCommunityReservation(c, context, hash, { allowActivated: true });
  assert.equal(result.id, 1n);
});

test("resume rejects pending/reverted transactions, wrong wallet/Factory, inconsistent receipts and missing events", async () => {
  for (const overrides of [
    { chainId: 31337 }, { transaction: { from: treasury } }, { transaction: { to: treasury } },
    { transaction: { blockHash: null } }, { receipt: { status: "reverted" } },
    { receipt: { blockHash: hash } }, { receipt: { transactionHash: blockHash } },
    { receipt: { logs: [] } },
    { transaction: { input: viem.encodeFunctionData({ abi: contracts.communityFactoryAbi, functionName: "activateCommunity", args: [1n, treasury] }) } },
  ]) await assert.rejects(api.resumeCommunityReservation(transactionClient(overrides), context, hash));
  await assert.rejects(api.resumeCommunityReservation(transactionClient(), context, "1"));
});
