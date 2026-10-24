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

test("creation UI offers read-only recovery and blocks resubmission after already-known", () => {
  const page = readFileSync(new URL("../src/app/(dapp)/v3/create/page.tsx", import.meta.url), "utf8");
  assert.match(page, /busy \|\| reservation \|\| alreadyKnown/);
  assert.match(page, /recoverCommunityReservation\(recoveryClient, context/);
  assert.match(page, /assertCommunityCreator\(context, address, chainId\)/);
  assert.match(page, /Recover Treasury \(read-only\)/);
  assert.match(page, /setConfig\(snapshot\)/);
});
