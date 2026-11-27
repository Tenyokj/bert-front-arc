import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import ts from "typescript";

const root = new URL("../", import.meta.url);
const read = (file) => readFileSync(new URL(file, root), "utf8");
const require = createRequire(import.meta.url);
function load(name) {
  const api = {};
  new Function("exports", "require", ts.transpileModule(read(`src/lib/${name}.ts`), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText)(api, (name) => name === "./contracts" || name === "./dapp-onchain" ? load(name.slice(2)) : name.startsWith("@/abi/") ? JSON.parse(read(`src/${name.slice(2)}`)) : require(name));
  return api;
}
const api = load("profile-snapshot");
const wallet = "0x1111111111111111111111111111111111111111";
const other = "0x2222222222222222222222222222222222222222";
const targets = { ideaRegistry: other, fundingPool: other, reputationSystem: other, voterProgression: other, votingSystem: other, grantManager: other, usdc: other };
function fixture(count = 28) {
  const calls = [], simulations = [];
  let checkedBlocks = 0;
  const client = {
    getChainId: async () => 5042002,
    getBlock: async () => { checkedBlocks++; return { number: 100n, hash: "0x1234", timestamp: 200n }; },
    readContract: async (request) => {
      calls.push(request); const id = request.args?.[0];
      switch (request.functionName) {
        case "getIdeasByAuthor": return Array.from({ length: count }, (_, i) => BigInt(i + 1));
        case "getIdea": return [id, wallet, `Idea ${id}`, "Description", "", 90n, 1234567n, 1];
        case "authorStakeByIdea": return 3000000n;
        case "balanceOf": return 123456789n;
        case "authorMinStake": return 5000000n;
        case "getReputation": return 10000n;
        case "isInitialized": return false;
        case "getProgressionStatus": return [4n, true, false, 0n, 6n];
        case "currentRoundId": return 100n;
        case "getRoundInfo": return [id, [], 50n, 90n, false, true, 0n, id, 1n];
        case "getPledge": return [id, 2000000n, false];
        case "getIdeaAuthor": return wallet;
        case "canClaimGrant": return [true, ""];
        default: throw Error(request.functionName);
      }
    },
    simulateContract: async (request) => { simulations.push(request); return { result: 2000000n }; },
  };
  return { client, calls, simulations, checkedBlocks: () => checkedBlocks };
}
test("profile hydrates only 12 visible ideas and pins every read to one chain/block", async () => {
  const f = fixture(); const result = await api.readProfileSnapshot(f.client, wallet, 5042002, 2, targets);
  assert.equal(result.totalIdeas, 28); assert.equal(result.ideas.length, 12); assert.equal(result.ideas[0].id, 16); assert.equal(result.ideas.at(-1).id, 5);
  assert.equal(f.calls.filter((call) => call.functionName === "getIdea").length, 12);
  assert(f.calls.every((call) => call.blockNumber === 100n)); assert.equal(f.checkedBlocks(), 2);
  assert(!f.calls.some((call) => /Round/.test(call.functionName))); assert.equal(f.simulations.length, 0);
});
test("uninitialized reputation is its real contract default, not an invented zero", async () => {
  const result = await api.readProfileSnapshot(fixture(0).client, wallet, 5042002, 1, targets);
  assert.equal(result.reputation, 10000n); assert.equal(result.initialized, false); assert.equal(result.balance, 123456789n);
  assert.equal(result.totalIdeas, 0); assert.equal(result.ideas.length, 0);
});
test("Cancelled status 7 from the deployed enum does not break the entire profile", async () => {
  const f = fixture(4), original = f.client.readContract;
  f.client.readContract = async (request) => {
    const row = await original(request);
    return request.functionName === "getIdea" ? [...row.slice(0, 7), 7] : row;
  };
  const snapshot = await api.readProfileSnapshot(f.client, wallet, 5042002, 1, targets);
  assert.equal(snapshot.ideas.length, 4); assert(snapshot.ideas.every((idea) => idea.status === 7));
  assert.equal(snapshot.balance, 123456789n); assert.equal(snapshot.reputation, 10000n);
  assert.equal(load("dapp-onchain").mapIdeaStatus(7), "Cancelled");
});
test("partial balance/bond/progression failures stay null and labelled, never zero", async () => {
  const f = fixture(1); const readContract = f.client.readContract;
  f.client.readContract = async (request) => { if (["balanceOf", "authorStakeByIdea", "getProgressionStatus"].includes(request.functionName)) throw Error("RPC unavailable"); return readContract(request); };
  const result = await api.readProfileSnapshot(f.client, wallet, 5042002, 1, targets);
  assert.equal(result.balance, null); assert.equal(result.progression, null); assert.equal(result.ideas[0].lockedStake, null); assert.equal(result.errors.length, 3);
});
test("invalid author payload, author-index failure and reorg never masquerade as empty success", async () => {
  for (const method of ["getIdeasByAuthor", "getIdea"]) {
    const f = fixture(1), original = f.client.readContract;
    f.client.readContract = async (request) => request.functionName === method ? method === "getIdea" ? [1n, other, "title", "text", "", 0n, 0n, 1] : [1n, 1n] : original(request);
    await assert.rejects(() => api.readProfileSnapshot(f.client, wallet, 5042002, 1, targets), /invalid|does not match/);
  }
  const f = fixture(0); let headers = 0; f.client.getBlock = async () => ({ number: 100n, hash: headers++ ? "0x9876" : "0x1234" });
  await assert.rejects(() => api.readProfileSnapshot(f.client, wallet, 5042002, 1, targets), /block changed/);
});
test("profile rejects wrong chain before reading balances or ideas and clamps large page requests", async () => {
  const f = fixture(1); f.client.getChainId = async () => 1;
  await assert.rejects(() => api.readProfileSnapshot(f.client, wallet, 5042002, 1, targets), /different network/); assert.equal(f.calls.length, 0);
  const result = await api.readProfileSnapshot(fixture(1).client, wallet, 5042002, 999, targets); assert.equal(result.page, 1);
});
test("recent actions scan at most 8 existing rounds, simulates refunds without sending", async () => {
  const f = fixture(); const result = await api.readRecentWalletActions(f.client, wallet, 5042002, targets);
  assert.equal(result.firstId, 92n); assert.equal(result.lastId, 99n);
  assert.equal(f.calls.filter((call) => call.functionName === "getRoundInfo").length, 8); assert.equal(f.simulations.length, 8);
  assert(f.simulations.every((call) => call.functionName === "claimPledgeRefund" && call.account === wallet && call.blockNumber === 100n));
  assert.equal(result.actions.length, 16); assert.equal(result.errors.length, 0);
});
test("grant eligibility alone cannot grant another author's action", async () => {
  const f = fixture(); const original = f.client.readContract;
  f.client.readContract = async (request) => request.functionName === "getIdeaAuthor" ? other : original(request);
  const result = await api.readRecentWalletActions(f.client, wallet, 5042002, targets);
  assert(!result.actions.some((action) => action.title.includes("grant claim")));
  assert(!f.calls.some((call) => call.functionName === "canClaimGrant"));
});
test("failed refund simulation is an inspection link, not an asserted claimable payment", async () => {
  const f = fixture(); f.client.simulateContract = async () => { throw Error("not eligible or unavailable"); };
  const result = await api.readRecentWalletActions(f.client, wallet, 5042002, targets);
  assert(!result.actions.some((action) => action.title === "Review a pledge refund")); assert(result.actions.some((action) => action.title === "Inspect your pledge"));
});
test("no created rounds does not scan ID zero; unknown rounds stay errors", async () => {
  const f = fixture(), original = f.client.readContract;
  f.client.readContract = async (request) => request.functionName === "currentRoundId" ? 1n : original(request);
  assert.equal((await api.readRecentWalletActions(f.client, wallet, 5042002, targets)).actions.length, 0); assert.equal(f.simulations.length, 0);
  f.client.readContract = async (request) => { if (request.functionName === "getRoundInfo") throw Error("RPC unavailable"); return original(request); };
  const result = await api.readRecentWalletActions(f.client, wallet, 5042002, targets);
  assert.equal(result.errors.length, 8); assert.equal(result.actions.length, 0);
});
test("pool approval/contribution controller and exact financial writes are unchanged", () => {
  const path = "src/components/FundingPoolHero.tsx";
  const original = execFileSync("git", ["show", `HEAD:${path}`], { cwd: root, encoding: "utf8" });
  const current = read(path);
  const controller = (source) => source.slice(source.indexOf("  const { address, isConnected }"), source.indexOf("  const formatUsdc ="));
  assert.equal(controller(current), controller(original));
  function writes(source) {
    const file = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX), calls = [];
    const walk = (node) => { if (ts.isCallExpression(node) && ["sendApprove", "sendDeposit"].includes(node.expression.getText(file))) calls.push(node.getText(file)); ts.forEachChild(node, walk); }; walk(file); return calls;
  }
  assert.deepEqual(writes(current), writes(original)); assert.equal(writes(current).length, 2);
  assert.doesNotMatch(read("src/components/PoolStats.tsx"), /w-\[35%\]|w-\[92%\]/);
});
test("decorative animation has bounded GPU work, disposal, pause, reduced motion and no wallet imports", () => {
  const source = read("src/components/dapp/PoolAttractorCanvas.tsx");
  for (const token of ["IntersectionObserver", "ResizeObserver", "document.hidden", "prefers-reduced-motion", "cancelAnimationFrame", "resource.dispose()", "renderer.dispose()", "webglcontextlost", "1000 / 30", "Math.min(window.devicePixelRatio"]) assert(source.includes(token), token);
  assert.doesNotMatch(source, /wagmi|writeContract|fetch\(|eth_send|setInterval/);
  assert.match(read("src/components/dapp/PoolAttractor.tsx"), /ssr: false/);
  assert.match(read("src/components/dapp/ProtocolNavigator.tsx"), /Not a live transaction feed/);
});
