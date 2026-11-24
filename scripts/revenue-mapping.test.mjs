import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";
import { decodeEventLog } from "viem";

// Execute the actual handlers; native Graph codegen/build separately checks WASM.
// This store double is not a substitute for a Graph Node deployment/reorg test.
class GraphInt {
  constructor(value) { this.value = BigInt(value); }
  static zero() { return new GraphInt(0); }
  static fromI32(value) { return new GraphInt(value); }
  plus(other) { return new GraphInt(this.value + other.value); }
  minus(other) { return new GraphInt(this.value - other.value); }
  times(other) { return new GraphInt(this.value * other.value); }
  div(other) { return new GraphInt(this.value / other.value); }
  equals(other) { return this.value === other.value; }
  ge(other) { return this.value >= other.value; }
  gt(other) { return this.value > other.value; }
  le(other) { return this.value <= other.value; }
  lt(other) { return this.value < other.value; }
  toI32() { return Number(this.value); }
  toString() { return this.value.toString(); }
}
class GraphAddress {
  constructor(value) { this.value = value.toLowerCase(); }
  static zero() { return new GraphAddress(`0x${"0".repeat(40)}`); }
  equals(other) { return this.value === other.value; }
  toHexString() { return this.value; }
}
const n = (value) => new GraphInt(value);
const a = (value) => new GraphAddress(value);
const pool = a(`0x${"1".repeat(40)}`), treasury = a(`0x${"2".repeat(40)}`);
const token = a(`0x${"3".repeat(40)}`), payee = a(`0x${"4".repeat(40)}`);
const other = a(`0x${"5".repeat(40)}`);

export function revenueFixture(bindings = {}, context = { pool, treasury, token, payee }) {
  const { pool, treasury, token, payee } = context;
  const stores = {};
  const entities = {};
  for (const name of ["ProtocolRevenueState", "FundingRoundRevenue", "ProtocolRevenueReceiver", "RevenueBeneficiary", "RevenueEvent", "Round"]) {
    const store = stores[name] = new Map();
    entities[name] = class {
      constructor(id) { this.id = id; }
      save() { store.set(this.id, { ...this }); }
      static load(id) { return store.has(id) ? Object.assign(new this(id), store.get(id)) : null; }
    };
  }
  const templates = [], calls = [];
  const result = (value, reverted = false) => ({ value, reverted });
  const config = { pool, token, payees: [payee], shares: [n(10000)], ...bindings };
  const contracts = {
    try_fundingPool: () => result(config.pool, config.unavailable),
    try_usdc: () => result(config.token),
    try_payeeCount: () => result(n(config.count ?? config.payees.length)),
    try_payeeAt: (index) => { calls.push(index.toI32()); return result(config.payees[index.toI32()]); },
    try_shares: (address) => result(config.shares[config.payees.findIndex((p) => p.equals(address))]),
  };
  const dependencies = {
    "@graphprotocol/graph-ts": { BigInt: GraphInt, Address: GraphAddress },
    "../generated/schema": entities,
    "../generated/FundingPool/FundingPoolUpgradeable": {
      FundingPoolUpgradeable: { bind: () => ({ try_usdc: () => result(config.poolToken ?? token) }) },
    },
    "../generated/templates/ProtocolRevenueTreasury/ProtocolRevenueTreasury": {
      ProtocolRevenueTreasury: { bind: () => contracts },
    },
    "../generated/templates": { ProtocolRevenueTreasury: { create: (address) => templates.push(address.toHexString()) } },
  };
  const source = readFileSync(new URL("../subgraph/src/revenue-mapping.ts", import.meta.url), "utf8");
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const api = {};
  new Function("exports", "require", "assert", js)(api, (name) => {
    assert(name in dependencies, `Unexpected import: ${name}`);
    return dependencies[name];
  }, assert);
  let index = 0;
  const event = (params, address = pool, options = {}) => ({
    address, params, block: { number: n(options.block ?? 10), timestamp: n(options.timestamp ?? 1000) },
    transaction: { hash: { toHexString: () => options.tx ?? "0xtx" } },
    logIndex: n(options.index ?? ++index),
  });
  const get = (name, id) => entities[name].load(id);
  const roundId = (round = 1) => `${pool.toHexString()}-${round}`;
  const open = (round = 1, receiver = treasury, share = 4000) => {
    new entities.Round(String(round)).save();
    api.handleFundingRoundRevenueSnapshotted(event({ roundId: n(round), treasury: receiver, shareBps: n(share) }));
  };
  const base = (eligible = 50000, total = 50000, round = 1) => api.handleFundingRoundRevenueBaseSet(event({ roundId: n(round), eligibleFee: n(eligible), totalFee: n(total) }));
  const accrued = (amount = 4000, round = 1, receiver = treasury) => api.handleProtocolRevenueAccrued(event({ roundId: n(round), treasury: receiver, amount: n(amount) }));
  const schedule = (receiver = treasury, share = 4000) => api.handleRevenuePolicyScheduled(event({ treasury: receiver, shareBps: n(share), readyAt: n(2000) }));
  return { api, config, get, event, open, base, accrued, schedule, roundId, stores, templates, calls,
    state: () => get("ProtocolRevenueState", pool.toHexString()),
    receiver: (address = treasury) => get("ProtocolRevenueReceiver", address.toHexString()),
    beneficiary: (address = payee) => get("RevenueBeneficiary", `${treasury.toHexString()}-${address.toHexString()}`) };
}

test("revenue policy schedule/cancel/activate is not retroactive and zero-share rounds stay explicit", () => {
  const f = revenueFixture();
  f.schedule();
  assert.equal(f.state().currentPolicyKnown, false);
  assert.equal(f.state().scheduled, true);
  assert.equal(f.state().readyAt.value, 2000n);
  f.api.handleRevenuePolicyCancelled(f.event({}));
  assert.equal(f.state().scheduled, false);
  assert.equal(f.state().readyAt.value, 0n);
  f.api.handleRevenuePolicyActivated(f.event({ treasury, shareBps: n(4000) }));
  f.open(); f.base(); f.accrued();
  f.schedule(GraphAddress.zero(), 0);
  f.api.handleRevenuePolicyActivated(f.event({ treasury: GraphAddress.zero(), shareBps: n(0) }));
  f.open(2, GraphAddress.zero(), 0);
  assert.equal(f.state().currentShareBps.value, 0n);
  assert.equal(f.get("FundingRoundRevenue", f.roundId()).shareBps.value, 4000n);
  assert.equal(f.receiver().pending.value, 4000n);
  assert.equal(f.get("FundingRoundRevenue", f.roundId(2)).shareBps.value, 0n);
  assert.equal(f.templates.length, 1);
});

test("immutable beneficiaries hydrate before templates; duplicate discovery preserves payouts", () => {
  const f = revenueFixture();
  f.schedule();
  assert.equal(f.receiver().discoveryStatus, "Indexed");
  assert.equal(f.beneficiary().shareBps.value, 10000n);
  f.api.handleRevenueReleased(f.event({ payee, amount: n(100) }, treasury));
  f.api.handleRevenuePolicyActivated(f.event({ treasury, shareBps: n(4000) }));
  assert.equal(f.beneficiary().observedReleased.value, 100n);
  assert.equal(f.templates.length, 1);
  assert.deepEqual(f.calls, [0]);
});

test("20/40/40 accrual, reserve top-up exclusion, claim/collect/release and duplicate logs conserve pending", () => {
  const f = revenueFixture();
  f.open(); f.base(50000, 100000);
  f.accrued(4000); f.accrued(8000); f.accrued(8000);
  assert.equal(f.state().accrued.value, 20000n);
  const claimed = f.event({ treasury, amount: n(12000) }, pool, { tx: "0xcollection", index: 1 });
  const collected = f.event({ amount: n(12000) }, treasury, { tx: "0xcollection", index: 2 });
  f.api.handleProtocolRevenueClaimed(claimed);
  f.api.handleRevenueCollected(collected);
  f.api.handleProtocolRevenueClaimed(claimed);
  f.api.handleRevenueCollected(collected);
  const released = f.event({ payee, amount: n(12000) }, treasury);
  f.api.handleRevenueReleased(released); f.api.handleRevenueReleased(released);
  assert.equal(f.state().pending.value, 8000n);
  assert.equal(f.receiver().pending.value, 8000n);
  assert.equal(f.receiver().claimed.value, 12000n);
  assert.equal(f.receiver().observedCollected.value, 12000n);
  assert.equal(f.receiver().observedReleased.value, 12000n);
  assert.equal(f.beneficiary().observedReleased.value, 12000n);
  assert.equal(f.get("FundingRoundRevenue", f.roundId()).accrued.value, 20000n);
  assert.equal(f.stores.RevenueEvent.size, 8);
});

test("rotation isolates round receiver credits and preserves previously tracked templates", () => {
  const f = revenueFixture();
  f.open(); f.base(); f.accrued();
  f.api.handleRevenuePolicyActivated(f.event({ treasury: other, shareBps: n(2000) }));
  f.open(2, other, 2000); f.base(50000, 50000, 2); f.accrued(2000, 2, other);
  f.api.handleProtocolRevenueClaimed(f.event({ treasury, amount: n(4000) }));
  assert.equal(f.receiver().pending.value, 0n);
  assert.equal(f.receiver(other).pending.value, 2000n);
  assert.equal(f.state().pending.value, 2000n);
  assert.equal(f.templates.length, 2);
});

test("unavailable getters stay explicit and retry at a later pool event", () => {
  const f = revenueFixture({ unavailable: true });
  f.schedule();
  assert.equal(f.receiver().discoveryStatus, "Unavailable");
  assert.equal(f.templates.length, 0);
  assert.equal(f.beneficiary(), null);
  f.config.unavailable = false;
  f.api.handleRevenuePolicyActivated(f.event({ treasury, shareBps: n(4000) }));
  assert.equal(f.receiver().discoveryStatus, "Indexed");
  assert.equal(f.templates.length, 1);
});

test("discovery rejects wrong pool/token, zero or excessive count, duplicate payees and invalid shares", () => {
  for (const config of [{ pool: other }, { token: other }, { count: 0 }, { count: 17 },
    { payees: [payee, payee], shares: [n(5000), n(5000)] }, { shares: [n(9999)] },
    { shares: [n(0)] }, { payees: [pool] }, { payees: [GraphAddress.zero()] }]) {
    const f = revenueFixture(config); f.schedule();
    assert.equal(f.receiver().discoveryStatus, "Invalid");
    assert.equal(f.templates.length, 0);
    assert.equal(f.stores.RevenueBeneficiary.size, 0);
    if (config.count === 17) assert.equal(f.calls.length, 0);
  }
});

test("missing history and invalid accounting fail rather than inventing zero revenue", () => {
  const missing = revenueFixture();
  assert.throws(() => missing.base(), /no round snapshot/);
  const wrong = revenueFixture(); wrong.open(); wrong.base();
  assert.throws(() => wrong.accrued(1, 1, other), /Wrong round receiver/);
  const excess = revenueFixture(); excess.open(); excess.base();
  assert.throws(() => excess.accrued(20001), /exceeds pledge fee share/);
  const claimed = revenueFixture(); claimed.open(); claimed.base(); claimed.accrued();
  assert.throws(() => claimed.api.handleProtocolRevenueClaimed(claimed.event({ treasury, amount: n(4001) })), /exceeds indexed accrual/);
  const unknown = revenueFixture(); unknown.schedule();
  assert.throws(() => unknown.api.handleRevenueReleased(unknown.event({ payee: other, amount: n(1) }, treasury)), /unknown beneficiary/);
});

test("donation-funded payments are not fabricated as earned pool revenue", () => {
  const f = revenueFixture(); f.schedule();
  f.api.handleRevenueReleased(f.event({ payee, amount: n(500) }, treasury));
  assert.equal(f.state().accrued.value, 0n);
  assert.equal(f.state().pending.value, 0n);
  assert.equal(f.receiver().observedCollected.value, 0n);
  assert.equal(f.receiver().observedReleased.value, 500n);
});

test("both manifests retain historical sources and wire every candidate revenue event", () => {
  const poolAbi = JSON.parse(readFileSync(new URL("../subgraph/abis/DAO/FundingPoolUpgradeable.json", import.meta.url)));
  const treasuryAbi = JSON.parse(readFileSync(new URL("../subgraph/abis/DAO/ProtocolRevenueTreasury.json", import.meta.url)));
  for (const filename of ["subgraph.yaml", "subgraph.local.yaml"]) {
    const manifest = readFileSync(new URL(`../subgraph/${filename}`, import.meta.url), "utf8");
    for (const [abi, names] of [[poolAbi, ["RevenuePolicyScheduled", "RevenuePolicyCancelled", "RevenuePolicyActivated", "FundingRoundRevenueSnapshotted", "FundingRoundRevenueBaseSet", "ProtocolRevenueAccrued", "ProtocolRevenueClaimed"]],
      [treasuryAbi, ["RevenueCollected", "RevenueReleased"]]]) {
      for (const name of names) {
        const event = abi.find((item) => item.type === "event" && item.name === name);
        assert(event, `Missing ABI event ${name}`);
        const signature = `${name}(${event.inputs.map((input) => `${input.indexed ? "indexed " : ""}${input.type}`).join(",")})`;
        assert(manifest.includes(`event: ${signature}`));
        assert(manifest.includes(`handler: handle${name}`));
      }
    }
    if (filename === "subgraph.yaml") {
      const counts = [...manifest.matchAll(/startBlock: (\d+)/g)].map((m) => Number(m[1]));
      assert.deepEqual(counts, [43491899, 43491885, 43491892, 43491905, 43491879, 43491873]);
      assert(manifest.includes('address: "0x5eDdccd772a9E0F079cC6646b529C20e3D46e585"'));
    }
  }
});

test("actual compiled-contract receipts replay into matching balances and deterministic event IDs", () => {
  const paths = [
    new URL("../subgraph/tests/fixtures/revenue-receipts.json", import.meta.url),
    new URL("../subgraph/tests/fixtures/revenue-browser-receipts.json", import.meta.url),
  ];
  if (process.env.BERT_REVENUE_E2E_RECEIPTS) paths.push(process.env.BERT_REVENUE_E2E_RECEIPTS);
  for (const filename of paths) {
  const fixture = JSON.parse(readFileSync(filename));
  assert.equal(fixture.chainId, 31337);
  assert.equal(fixture.publicTransactionsSent, false);
  const context = Object.fromEntries(["pool", "treasury", "token", "payee"].map((key) => [key, a(fixture[key])]));
  const abi = [
    ...JSON.parse(readFileSync(new URL("../subgraph/abis/DAO/FundingPoolUpgradeable.json", import.meta.url))),
    ...JSON.parse(readFileSync(new URL("../subgraph/abis/DAO/ProtocolRevenueTreasury.json", import.meta.url))),
  ];
  function replay() {
    const f = revenueFixture({ payees: fixture.beneficiaries.map((p) => a(p.address)),
      shares: fixture.beneficiaries.map((p) => n(p.shareBps)) }, context);
    for (const log of fixture.logs) {
      const decoded = decodeEventLog({ abi, data: log.data, topics: log.topics, strict: true });
      if (decoded.eventName === "FundingRoundOpened") {
        f.stores.Round.set(decoded.args.roundId.toString(), { id: decoded.args.roundId.toString() });
        continue;
      }
      const params = Object.fromEntries(Object.entries(decoded.args ?? {}).map(([key, value]) => [key,
        typeof value === "bigint" ? n(value) : typeof value === "string" && /^0x[\da-f]{40}$/i.test(value) ? a(value) : value]));
      const event = f.event(params, a(log.address), { block: log.blockNumber, timestamp: log.blockTimestamp,
        tx: log.transactionHash, index: log.logIndex });
      const handler = f.api[`handle${decoded.eventName}`];
      assert.equal(typeof handler, "function", `Missing receipt handler: ${decoded.eventName}`);
      handler(event);
      handler(event); // A duplicate delivery must never double financial amounts.
    }
    assert.equal(f.state().pending.value, BigInt(fixture.expected.pending));
    assert.equal(f.state().accrued.value, BigInt(fixture.expected.accrued));
    assert.equal(f.state().claimed.value, BigInt(fixture.expected.claimed));
    assert.equal(f.state().currentShareBps.value, BigInt(fixture.expected.shareBps ?? "0"));
    assert.equal(f.receiver().observedCollected.value, BigInt(fixture.expected.collected));
    assert.equal(f.receiver().observedReleased.value, BigInt(fixture.expected.released));
    assert.equal(f.beneficiary().observedReleased.value, BigInt(fixture.expected.released));
    assert.equal(f.templates.length, 1);
    if (fixture.rounds) {
      assert.equal(fixture.wallet, "local EIP-1193 test provider; not MetaMask extension");
      assert.equal(fixture.rounds.length, 4);
      for (const round of fixture.rounds) {
        const indexed = f.get("FundingRoundRevenue", f.roundId(round.roundId));
        const legacy = round.scenario === "full-legacy-zero-revenue";
        assert.equal(indexed.shareBps.value, legacy ? 0n : 2000n);
        assert.equal(indexed.accrued.value, legacy || round.scenario.startsWith("no-winner") ? 0n :
          round.scenario.startsWith("full-revenue") ? 300000n : 60000n);
      }
      assert(fixture.uiReceipts.length > 60, "Expected actual browser lifecycle receipts, not the small module fixture");
      assert(fixture.uiReceipts.every((receipt) => receipt.status === 1));
    } else assert.equal(f.get("FundingRoundRevenue", f.roundId()).shareBps.value, 4000n);
    return JSON.stringify(Object.fromEntries(Object.entries(f.stores).map(([key, store]) => [key, [...store]])),
      (_key, value) => value instanceof GraphInt ? value.toString() : value);
  }
  assert.equal(replay(), replay(), "A clean replay must reconstruct identical entities");
  }
});
