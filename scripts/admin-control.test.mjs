import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";
import { zeroAddress, toHex } from "viem";

const require = createRequire(import.meta.url);
const root = new URL("../", import.meta.url);
const read = (file) => readFileSync(new URL(file, root), "utf8");
const cache = new Map();
function load(name) {
  if (cache.has(name)) return cache.get(name);
  const result = {};
  const js = ts.transpileModule(read(`src/lib/${name}.ts`), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
  new Function("exports", "require", js)(result, (dependency) => dependency === "./contracts" ? load("contracts") : dependency.startsWith("@/abi/") ? JSON.parse(read(`src/${dependency.slice(2)}`)) : require(dependency));
  cache.set(name, result);
  return result;
}
const api = load("admin-engine");
const { adminContracts, protocolRoles } = load("admin-catalog");
const address = "0x1111111111111111111111111111111111111111";
const registry = "0x2222222222222222222222222222222222222222";
const account = "0x3333333333333333333333333333333333333333";
const hash = `0x${"a".repeat(64)}`;
const op = adminContracts.find((item) => item.id === "votingSystem").operations.find((item) => item.method === "setMinStake");
const config = { ...adminContracts.find((item) => item.id === "votingSystem"), address };
function fixture() {
  const calls = [];
  const client = {
    getChainId: async () => 5042002,
    getBytecode: async () => "0x6000",
    getTransactionCount: async () => 7,
    readContract: async (request) => { calls.push(request); return request.functionName === "roles" ? registry : request.functionName === "hasRole" ? true : 2000000n; },
    simulateContract: async (request) => { calls.push({ ...request, simulation: true }); return { request }; },
  };
  return { client, calls };
}
const prepare = (f, operation = op, contract = config) => api.prepareAdminOperation(f.client, contract, operation, [1000000n], account, registry, 5042002);

test("every reviewed operation and zero-argument getter exists in the supplied ABI", () => {
  assert.equal(adminContracts.length, 8);
  for (const contract of adminContracts) {
    const functions = contract.abi.filter((item) => item.type === "function");
    for (const operation of contract.operations) {
      const method = functions.find((item) => item.name === operation.method);
      assert(method, `${contract.name}.${operation.method}`);
      assert(!["view", "pure"].includes(method.stateMutability));
      assert.equal(method.inputs.length, operation.fields.length, operation.method);
      for (let i = 0; i < method.inputs.length; i++) {
        const kind = operation.fields[i].kind;
        assert.equal(method.inputs[i].type, { address: "address", addresses: "address[]", bool: "bool", uint: "uint256", role: "bytes32" }[kind], operation.method);
      }
      assert(!/^(initialize|reinitialize|upgrade|executeCall|delegatecall)/i.test(operation.method));
    }
    for (const getter of new Set([...contract.reads, ...contract.operations.map((operation) => operation.getter).filter(Boolean)])) {
      const method = functions.find((item) => item.name === getter);
      assert(method, `${contract.name}.${getter}`);
      assert.equal(method.inputs.length, 0, getter);
      assert(["view", "pure"].includes(method.stateMutability));
    }
  }
});
test("USDC fields retain exact six decimals, rejecting extra precision and invalid uints", () => {
  assert.deepEqual(api.parseAdminArgs(op, { stake: "1.234567" }, protocolRoles), [1234567n]);
  for (const value of ["1.2345678", "-1", "1e6", "", "Infinity"]) assert.throws(() => api.parseAdminArgs(op, { stake: value }, protocolRoles));
  const fee = adminContracts[0].operations.find((item) => item.method === "setPledgeFeeBps");
  assert.deepEqual(api.parseAdminArgs(fee, { fee: "1000" }, protocolRoles), [1000n]);
  assert.throws(() => api.parseAdminArgs(fee, { fee: "1001" }, protocolRoles));
});
test("role controls reject unknown roles, user roles in system operations and zero addresses", () => {
  const roles = adminContracts.find((item) => item.registry);
  const grant = roles.operations.find((item) => item.method === "grantSystemRole");
  for (const role of ["NOT_A_ROLE", "CURATOR_ROLE", "DEFAULT_ADMIN_ROLE"]) assert.throws(() => api.parseAdminArgs(grant, { role, account }, protocolRoles));
  assert.throws(() => api.parseAdminArgs(grant, { role: "VOTING_ROLE", account: zeroAddress }, protocolRoles));
  assert.equal(api.parseAdminArgs(grant, { role: "VOTING_ROLE", account }, protocolRoles)[0], api.roleId("VOTING_ROLE"));
});
test("small batch rejects duplicates and unknown boolean choices", () => {
  const batch = adminContracts.at(-1).operations.find((item) => item.method === "batchInitializeReputation");
  assert.throws(() => api.parseAdminArgs(batch, { accounts: `${account},${account}` }, protocolRoles));
  const gate = config.operations.find((item) => item.method === "setHumanOnlyVoting");
  assert.throws(() => api.parseAdminArgs(gate, { enabled: "yes" }, protocolRoles));
  assert.deepEqual(api.parseAdminArgs(gate, { enabled: "false" }, protocolRoles), [false]);
});
test("preflight checks fresh permissions, registry, pending nonce and exact simulation", async () => {
  const f = fixture(); const prepared = await prepare(f);
  assert.equal(prepared.current, 2000000n);
  assert(f.calls.some((call) => call.functionName === "hasRole" && call.args[1] === account));
  assert.deepEqual(f.calls.at(-1).args, [1000000n]);
  assert.equal(f.calls.at(-1).account, account);
  assert.equal(f.calls.at(-1).simulation, true);
});
for (const [label, mutate, pattern] of [
  ["wrong network", (f) => { f.client.getChainId = async () => 1; }, /chain mismatch/],
  ["no code", (f) => { f.client.getBytecode = async () => "0x"; }, /No deployed/],
  ["wrong registry", (f) => { f.client.readContract = async () => account; }, /different or unavailable RolesRegistry/],
  ["revoked permission", (f) => { f.client.readContract = async (r) => r.functionName === "roles" ? registry : false; }, /Admin permission/],
  ["pending wallet transaction", (f) => { f.client.getTransactionCount = async (r) => r.blockTag === "pending" ? 8 : 7; }, /pending transaction/],
  ["reverting simulation", (f) => { f.client.simulateContract = async () => { throw Error("simulation reverted"); }; }, /simulation reverted/],
]) test(`preflight fails closed: ${label}`, async () => { const f = fixture(); mutate(f); await assert.rejects(() => prepare(f), pattern); });
test("a fabricated operation cannot bypass the reviewed allowlist", async () => {
  await assert.rejects(() => prepare(fixture(), { ...op, method: "upgradeToAndCall" }), /allowlist/);
});

const intent = { account, chain: 5042002, target: address, method: "setMinStake", data: "0x1234567800000000", createdAt: "2026-11-26T10:00:00Z" };
function receiptClient() { return { getChainId: async () => intent.chain, getTransaction: async () => ({ from: account, to: address, input: intent.data, value: 0n }), getTransactionReceipt: async () => ({ status: "success" }) }; }
test("stored intents validate their shape; malformed journal never unlocks writes", () => {
  assert.deepEqual(api.parseAdminIntent(JSON.stringify(intent)), intent);
  for (const value of ["null", "unavailable", "{", "[]", JSON.stringify({ ...intent, target: null }), JSON.stringify({ ...intent, data: "0x" }), JSON.stringify({ ...intent, hash: "0xno" })]) assert.equal(api.parseAdminIntent(value), null);
  assert.match(read("src/components/admin/AdminControlCenter.tsx"), /journalBlocked = Boolean\(rawJournal\)/);
});
test("only explicit EIP-1193 user rejection clears an unconfirmed broadcast intent", () => {
  assert.equal(api.explicitlyRejected({ cause: { code: 4001 } }), true);
  assert.equal(api.explicitlyRejected(Error("unknown wallet failure")), false);
  assert.equal(api.explicitlyRejected({ code: -32000 }), false);
});
test("matching receipts resolve intents without a single write call", async () => {
  assert.equal((await api.readAdminIntentReceipt(receiptClient(), intent, hash, intent.chain)).status, "success");
});
for (const field of ["from", "to", "input", "value"]) test(`receipt reconciliation rejects changed ${field}`, async () => {
  const client = receiptClient(); const original = await client.getTransaction();
  client.getTransaction = async () => ({ ...original, [field]: field === "value" ? 1n : field === "input" ? "0xdeadbeef" : registry });
  await assert.rejects(() => api.readAdminIntentReceipt(client, intent, hash, intent.chain), /does not match/);
});
test("pending or unavailable receipts keep intent unresolved", async () => {
  const client = receiptClient(); client.getTransactionReceipt = async () => { throw Error("not found"); };
  await assert.rejects(() => api.readAdminIntentReceipt(client, intent, hash, intent.chain), /not found/);
});
test("EIP-1967 inspector reads both canonical slots at one block", async () => {
  const slots = []; const client = { getBlock: async () => ({ number: 9n }), getStorageAt: async (request) => { slots.push(request); return toHex(0n, { size: 32 }); } };
  const result = await api.inspectProxy(client, address);
  assert.equal(result.implementation, null); assert.equal(result.proxyAdmin, null);
  assert(slots.every((request) => request.blockNumber === 9n));
  assert.equal(slots[0].slot, "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc");
  assert.equal(slots[1].slot, "0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103");
});
test("public Pool is read-only while operator relay actions remain permissionless", () => {
  const panel = read("src/components/RevenueTreasuryPanel.tsx");
  assert.match(panel, /mode = "public"/);
  assert.match(panel, /mode === "operator" && snapshot\?\.mode/);
  assert.match(panel, /onCollect=\{mode === "operator"/);
  assert.match(panel, /onRelease=\{mode === "operator"/);
  assert.match(read("src/components/admin/AdminControlCenter.tsx"), /RevenueTreasuryPanel mode="operator"/);
  assert.match(read("src/components/RevenueAccessLink.tsx"), /do not require an Admin role/);
});
