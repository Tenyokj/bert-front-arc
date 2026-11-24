import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";

const root = fileURLToPath(new URL("../", import.meta.url));
const require = createRequire(import.meta.url);
const { parse, stringify } = require("yaml");
const { JsonRpcProvider, Contract, Interface, ZeroAddress } = createRequire(path.join(root, "../../..", "bert-core/package.json"))("ethers");
const graphFixture = process.env.REVENUE_GRAPH_FIXTURE === "true";
const evidencePath = process.env.REVENUE_NATIVE_REPORT || (graphFixture ? "/private/tmp/bert-v24-graph-fixture.json" : "/private/tmp/bert-v24-native-grants.json");
const native = JSON.parse(fs.readFileSync(evidencePath));
assert.match(native.status, graphFixture ? /^passed full local Graph fixture/ : /^passed full native/);
assert.equal(native.chainId, 31337);
assert.equal(native.mockTokenUsed, graphFixture);
const rpc = new JsonRpcProvider(graphFixture ? "http://127.0.0.1:19549" : "http://127.0.0.1:19548", undefined, { cacheTimeout: -1 });
const cli = path.join(root, "node_modules/.bin/graph");
const out = path.join(root, ".revenue-native");
const run = Date.now().toString(36);
const primaryName = `bert-revenue-native-${run}`;
const replayName = `bert-revenue-clean-${run}`;
fs.mkdirSync(out, { recursive: true });
const output = process.env.REVENUE_GRAPH_REPORT || (graphFixture ? "/private/tmp/bert-v24-local-graph.json" : "/private/tmp/bert-v24-native-graph.json");
const report = { status: "started", recordedAt: new Date().toISOString(), publicTransactionsSent: false,
  fixtureEvidenceSha256: createHash("sha256").update(fs.readFileSync(evidencePath)).digest("hex"),
  mockTokenUsed: graphFixture, nativeArcExecution: !graphFixture,
  graphNode: "graphprotocol/graph-node:v0.45.0", scope: "V2 production mappings and revenue Treasury discovery/template", checks: [] };
const query = `{ _meta { block { number hash } hasIndexingErrors }
  protocolRevenueStates(orderBy:id) { id currentPolicyKnown currentTreasury currentShareBps scheduled scheduledTreasury scheduledShareBps readyAt accrued claimed pending }
  protocolRevenueReceivers(orderBy:id) { id discoveryStatus templateStarted payeeCount accrued claimed pending observedCollected observedReleased }
  revenueBeneficiaries(orderBy:id) { id address shareBps observedReleased }
  fundingRoundRevenues(orderBy:id) { id roundId treasuryAddress shareBps baseObserved eligibleFee totalFee accrued }
  revenueEvents(first:1000,orderBy:id) { id kind amount txHash logIndex blockNumber }
}`;
async function gql(name) {
  const r = await fetch(`http://127.0.0.1:19000/subgraphs/name/${name}`, { method: "POST",
    headers: { "content-type": "application/json" }, body: JSON.stringify({ query }), signal: AbortSignal.timeout(10000) });
  const result = await r.json();
  assert(!result.errors, JSON.stringify(result.errors));
  assert.equal(result.data._meta.hasIndexingErrors, false, "Native Graph indexing error");
  return result.data;
}
async function indexed(name, height, hash, canonical = false) {
  const deadline = Date.now() + 180000;
  let error;
  while (Date.now() < deadline) {
    try {
      const d = await gql(name);
      if (d._meta.block.number >= height && (!hash || d._meta.block.hash.toLowerCase() === hash.toLowerCase())) {
        const current = canonical ? await rpc.getBlock(d._meta.block.number) : null;
        if (!canonical || current?.hash.toLowerCase() === d._meta.block.hash.toLowerCase()) return d;
      }
      error = `indexed ${d._meta.block.number}; need ${height} ${hash || ""}`;
    } catch (e) { error = e.message; if (error.includes("Native Graph indexing error")) throw e; }
    await new Promise(r => setTimeout(r, 1000));
  }
  throw Error(`Graph sync timeout: ${error}`);
}
function data(d) { const { _meta, ...entities } = d; return entities; }
function graph(args) {
  const result = execFileSync(cli, args, { cwd: root, encoding: "utf8", timeout: 120000, maxBuffer: 10 * 1024 * 1024 });
  fs.appendFileSync(path.join(out, "cli.log"), result);
  return result;
}
function compose(args) {
  return execFileSync("docker", ["compose", "-p", "bert-v24-native", "-f", path.join(root, "docker-compose.revenue.yml"), ...args],
    { timeout: 60000, encoding: "utf8", env: { ...process.env, REVENUE_LAB_RPC_PORT: graphFixture ? "19549" : "19548" } });
}
async function ready() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch("http://127.0.0.1:19020", { method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "local_health_probe", params: {} }), signal: AbortSignal.timeout(2000) });
      if ((await r.json()).jsonrpc === "2.0") return;
    } catch { /* Wait for only this disposable Graph Node. */ }
    await new Promise(r => setTimeout(r, 1000));
  }
  throw Error("Disposable Graph Node did not start");
}
let snapshot;
try {
  assert.equal((await rpc.getNetwork()).chainId, 31337n);
  const info = await rpc.send("anvil_nodeInfo", []);
  if (graphFixture) assert(info.network == null || info.network === "ethereum", "Non-Arc execution required");
  else assert.equal(info.network, "arc");
  if (graphFixture) assert(!info.forkConfig?.forkUrl && !info.forkConfig?.forkBlockNumber);
  else assert.equal(Number(info.forkConfig.forkBlockNumber), native.block);
  assert.equal((await rpc.getBlock(native.block)).hash, native.blockHash);
  assert((await rpc.getBlockNumber()) >= native.lastBlock);
  assert.equal((await rpc.getBlock(native.lastBlock)).hash, native.receipts.at(-1).blockHash, "Native acceptance history changed");
  const historic = native.receipts.find(r => r.label === "create funding proposal");
  assert(historic, "Missing historical proposal receipt");
  const probe = { to: native.contracts.ideas,
    data: new Interface(["function minimumNetFundingByIdea(uint256) view returns(uint256)"])
      .encodeFunctionData("minimumNetFundingByIdea", [1]) };
  report.historicalRpcProbe = { block: historic.blockNumber, blockHash: historic.blockHash, address: probe.to };
  try {
    const result = await rpc.send("eth_call", [probe, `0x${historic.blockNumber.toString(16)}`]);
    assert.equal(BigInt(result), 20000000n);
    report.historicalRpcProbe.passed = true;
  } catch (e) {
    report.historicalRpcProbe.passed = false;
    report.historicalRpcProbe.rpcError = e.info?.error || { message: e.message };
    throw Error(`Historical Arc RPC cannot serve the fixture; refuse Graph acceptance: ${JSON.stringify(report.historicalRpcProbe.rpcError)}`);
  }
  assert.equal(process.env.REVENUE_GRAPH_RESET_LOCAL, "true", "Explicitly allow resetting only the bert-v24-native lab volumes");
  // Graph Node 0.40 cannot rewind below earliest_block + its 250-block threshold.
  // Keep the reorg far enough from the fixture's indexing start, without changing contracts.
  const padding = graphFixture ? 0 : Math.max(0, native.receipts[0].blockNumber + 300 - await rpc.getBlockNumber());
  for (let i = 0; i < padding; i++) await rpc.send("evm_mine", []);
  report.paddingBlocks = padding;
  compose(["down", "-v"]);
  compose(["up", "-d"]);
  const document = parse(fs.readFileSync(path.join(root, "subgraph.local.yaml"), "utf8"));
  const targets = { VotingSystem: "voting", IdeaRegistry: "ideas", FundingPool: "pool", GrantManager: "grant",
    VoterProgression: "progression", ReputationSystem: "reputation" };
  for (const source of document.dataSources) {
    assert(targets[source.name], source.name);
    source.source.address = native.contracts[targets[source.name]];
    source.source.startBlock = graphFixture ? 0 : native.receipts[0].blockNumber;
  }
  document.schema.file = path.join(root, document.schema.file);
  for (const source of [...document.dataSources, ...document.templates]) {
    source.mapping.file = path.join(root, source.mapping.file);
    for (const abi of source.mapping.abis) abi.file = path.join(root, abi.file);
  }
  async function deploy(name, description) {
    await ready();
    document.description = description;
    const manifest = path.join(out, `${name}.yaml`);
    fs.writeFileSync(manifest, stringify(document));
    graph(["create", "--node", "http://127.0.0.1:19020", name]);
    graph(["deploy", name, manifest, "--version-label", "local-acceptance", "--node", "http://127.0.0.1:19020",
      "--ipfs", "http://127.0.0.1:19501/api/v0", "--output-dir", path.join(out, `build-${name}`)]);
    // Give the ingestor a successor to the final transaction-bearing block.
    await rpc.send("evm_mine", []);
    return indexed(name, native.lastBlock);
  }
  const baseline = await deploy(primaryName, `Isolated native Arc acceptance, primary replay ${run}`);
  const state = baseline.protocolRevenueStates;
  assert.equal(state.length, 1);
  assert.equal(state[0].id, native.contracts.pool.toLowerCase());
  assert.equal(state[0].currentShareBps, "2000");
  assert.equal(state[0].accrued, native.revenuePaid);
  assert.equal(state[0].claimed, native.revenuePaid);
  assert.equal(state[0].pending, "0");
  assert.equal(state[0].scheduled, false);
  assert.equal(baseline.protocolRevenueReceivers.length, 1);
  const receiver = baseline.protocolRevenueReceivers[0];
  assert.equal(receiver.discoveryStatus, "Indexed");
  assert.equal(receiver.templateStarted, true);
  assert.equal(receiver.observedCollected, native.revenuePaid);
  assert.equal(receiver.observedReleased, native.revenuePaid);
  assert.equal(baseline.revenueBeneficiaries.length, 1);
  assert.equal(baseline.revenueBeneficiaries[0].address, native.contracts.payee.toLowerCase());
  assert.equal(baseline.revenueBeneficiaries[0].shareBps, "10000");
  assert.equal(baseline.revenueBeneficiaries[0].observedReleased, native.revenuePaid);
  assert.equal(baseline.fundingRoundRevenues.length, 4);
  assert.deepEqual(baseline.fundingRoundRevenues.map(r => r.accrued).sort(), ["0", "120000", "360000", "600000"]);
  const poolAbi = JSON.parse(fs.readFileSync(path.join(root, "abis/DAO/FundingPoolUpgradeable.json")));
  const treasuryAbi = JSON.parse(fs.readFileSync(path.join(root, "abis/DAO/ProtocolRevenueTreasury.json")));
  const p = new Interface(poolAbi), t = new Interface(treasuryAbi);
  const names = new Set(["RevenuePolicyScheduled", "RevenuePolicyCancelled", "RevenuePolicyActivated",
    "FundingRoundRevenueSnapshotted", "FundingRoundRevenueBaseSet", "ProtocolRevenueAccrued", "ProtocolRevenueClaimed",
    "RevenueCollected", "RevenueReleased"]);
  const logs = await rpc.getLogs({ address: [native.contracts.pool, native.contracts.treasury],
    fromBlock: native.receipts[0].blockNumber, toBlock: native.lastBlock });
  const expected = logs.filter(l => {
    try { return names.has((l.address.toLowerCase() === native.contracts.pool.toLowerCase() ? p : t).parseLog(l).name); } catch { return false; }
  }).map(l => `${l.transactionHash.toLowerCase()}-${l.index}`).sort();
  assert(expected.length > 30);
  assert.deepEqual(baseline.revenueEvents.map(l => l.id).sort(), expected, "Every canonical revenue log is indexed once");
  report.checks.push({ name: "native discovery, immutable payees, round policy and exact RPC log agreement", passed: true, events: expected.length });
  console.log(`[Graph Node] Native WASM mappings match ${expected.length} canonical revenue logs and ${native.revenuePaid} units paid.`);
  compose(["restart", "graph-node"]);
  assert.deepEqual(data(await indexed(primaryName, native.lastBlock)), data(baseline));
  report.checks.push({ name: "Graph Node process restart preserves entities and dynamic template", passed: true });
  snapshot = await rpc.send("evm_snapshot", []);
  const admin = await rpc.getSigner(0);
  const pool = new Contract(native.contracts.pool, poolAbi, admin);
  const receipt = await (await pool.scheduleRevenuePolicy(ZeroAddress, 0)).wait();
  await rpc.send("evm_mine", []);
  const orphanTip = await rpc.getBlock("latest");
  const scheduled = await indexed(primaryName, receipt.blockNumber);
  assert.equal(scheduled.protocolRevenueStates[0].scheduled, true);
  assert.equal(scheduled.revenueEvents.length, expected.length + 1);
  assert.equal(await rpc.send("evm_revert", [snapshot]), true);
  snapshot = undefined;
  await rpc.send("evm_setNextBlockTimestamp", [orphanTip.timestamp + 30]);
  await rpc.send("evm_mine", []);
  await rpc.send("evm_mine", []);
  await rpc.send("evm_mine", []);
  const canonical = await rpc.getBlock("latest");
  const restored = await indexed(primaryName, canonical.number - 1, undefined, true);
  assert.equal(restored._meta.block.hash.toLowerCase(), (await rpc.getBlock(restored._meta.block.number)).hash.toLowerCase());
  assert.deepEqual(data(restored), data(baseline));
  assert(!restored.revenueEvents.some(e => e.txHash === receipt.hash.toLowerCase()));
  report.checks.push({ name: "two-block controlled local reorg removes orphan event and restores policy and financial entities", passed: true,
    orphanTransaction: receipt.hash, orphanTip: orphanTip.hash, canonicalTip: canonical.hash });
  // Recreate only this lab's database and IPFS volumes: no cached Graph store.
  compose(["down", "-v"]);
  compose(["up", "-d"]);
  const replay = await deploy(replayName, `Isolated native Arc acceptance, clean database replay ${run}`);
  assert.deepEqual(data(replay), data(baseline));
  report.checks.push({ name: "fresh Postgres/IPFS store replays canonical history identically after reorg", passed: true });
  report.status = "passed real Graph Node acceptance; not public rollout authorization";
  report.entities = data(baseline);
  report.localSubgraphs = { primaryName, replayName };
  report.harnessSha256 = createHash("sha256").update(fs.readFileSync(fileURLToPath(import.meta.url))).digest("hex");
} catch (e) {
  report.status = "failed"; report.error = e.stack || String(e); process.exitCode = 1; console.error(report.error);
} finally {
  if (snapshot) await rpc.send("evm_revert", [snapshot]).catch(() => {});
  fs.writeFileSync(output, JSON.stringify(report, null, 2) + "\n");
  rpc.destroy();
  console.log(`[Graph Node] Evidence: ${output}`);
}
