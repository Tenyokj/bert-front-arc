import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";
import { factorySources, originalFactory, previousFactory, renderManifest } from "../subgraph-v3/scripts/manifest-config.mjs";

const nextFactory = "0x1111111111111111111111111111111111111111";
const unknownFactory = "0x2222222222222222222222222222222222222222";
const source = readFileSync(new URL("../src/lib/community-reference.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
function routing(env = {}) {
  const exports = {};
  // Exercise the actual TS implementation with isolated build-time env values.
  new Function("exports", "process", compiled)(exports, { env: { NEXT_PUBLIC_V3_FACTORY_ADDRESS: nextFactory, ...env } });
  return exports;
}

test("same Community ID on two Factories has distinct routes; numeric bookmarks stay pinned", () => {
  const api = routing();
  const old = api.resolveCommunityReference("1", 5042002);
  const next = api.resolveCommunityReference(`${nextFactory}-1`, 5042002);
  assert.equal(old.factory, originalFactory.address);
  assert.equal(next.factory, nextFactory);
  assert.notEqual(old.key, next.key);
  assert.equal(api.resolveCommunityReference(old.key, 5042002).factory, old.factory);
});

test("untrusted, malformed, unsafe IDs and wrong networks fail closed", () => {
  const api = routing();
  for (const key of [`${unknownFactory}-1`, `${nextFactory}-0`, "NaN", "1.2", "-1", "9007199254740992"]) {
    assert.equal(api.resolveCommunityReference(key, 5042002), null);
  }
  assert.equal(api.resolveCommunityReference(`${nextFactory}-1`, 1), null);
  assert.equal(api.resolveCommunityReference("1", 31337), null);
});

test("local deployment never resolves numeric bookmarks to Arc infrastructure", () => {
  const api = routing({ NEXT_PUBLIC_DEFAULT_CHAIN: "hardhat" });
  assert.equal(api.resolveCommunityReference("1", 31337).factory, nextFactory);
  assert.equal(api.resolveCommunityReference(`${originalFactory.address}-1`, 31337), null);
  assert.equal(api.resolveCommunityReference("1", 5042002), null);
});

test("configured historical Factories are deduplicated, and address casing is ignored", () => {
  const api = routing({ NEXT_PUBLIC_V3_LEGACY_FACTORY_ADDRESSES: `${nextFactory},${unknownFactory},bad` });
  assert.equal(api.getCommunityFactories().length, 4);
  assert.equal(api.resolveCommunityReference(`${originalFactory.address.toUpperCase().replace("0X", "0x")}-2`).id, 2);
});

test("a zero-address env placeholder never becomes a trusted transaction target", () => {
  const api = routing({ NEXT_PUBLIC_V3_FACTORY_ADDRESS: "0x0000000000000000000000000000000000000000" });
  assert.deepEqual(api.getCommunityFactories(), [originalFactory.address, previousFactory.address]);
  assert.equal(api.resolveCommunityReference("0x0000000000000000000000000000000000000000-1"), null);
});

test("indexed metadata queries bind both Factory and local ID", async () => {
  const graphSource = readFileSync(new URL("../src/lib/community-v3-subgraph.ts", import.meta.url), "utf8");
  const graphJS = ts.transpileModule(graphSource, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const exports = {};
  const requests = [];
  const fetchMock = async (_url, init) => {
    requests.push(JSON.parse(init.body));
    return { ok: true, json: async () => ({ data: { communities: [] } }) };
  };
  new Function("exports", "process", "fetch", graphJS)(exports, { env: { NEXT_PUBLIC_V3_SUBGRAPH_URL: "https://example.invalid/graphql" } }, fetchMock);
  await exports.fetchIndexedCommunities(1, 1n, originalFactory.address);
  await exports.fetchIndexedCommunities(1, 1n, nextFactory);
  assert.equal(requests[0].variables.where.communityId, "1");
  assert.equal(requests[0].variables.where.factory, originalFactory.address.toLowerCase());
  assert.equal(requests[1].variables.where.factory, nextFactory);
  assert.match(requests[0].query, /communityId factory creator/);
});

test("manifest preserves original history and adds distinct Factory sources, not templates", () => {
  const template = readFileSync(new URL("../subgraph-v3/subgraph.template.yaml", import.meta.url), "utf8");
  const sources = factorySources({ V3_FACTORY_ADDRESS: nextFactory, V3_FACTORY_START_BLOCK: "70000000" });
  const rendered = renderManifest(template, sources);
  assert.deepEqual(sources[0], originalFactory);
  assert.equal((rendered.match(/name: CommunityFactory_2\n/g) || []).length, 1);
  assert.ok(rendered.includes(`address: "${nextFactory}"`));
  assert.ok(rendered.includes("startBlock: 66809847"));
  assert.deepEqual(sources[1], previousFactory);
  assert.equal(sources[2].address, nextFactory);
  assert.ok(rendered.includes("startBlock: 68888068"));
  assert.equal(rendered.slice(rendered.indexOf("\ntemplates:")), template.slice(template.indexOf("\ntemplates:")));
  assert.equal(rendered.includes("__V3_FACTORY_"), false);
});

test("manifest rejects duplicate sources, missing blocks and an altered historical block", () => {
  for (const list of [[], [{ address: nextFactory }], [{ address: nextFactory, startBlock: "bad" }],
    [originalFactory, originalFactory], [{ ...previousFactory, startBlock: "1" }], [{ ...originalFactory, startBlock: "1" }],
    [{ address: nextFactory, startBlock: 9007199254740992 }]]) {
    assert.throws(() => factorySources({ V3_FACTORY_SOURCES: JSON.stringify(list) }));
  }
});

test("V3.2.1 switch keeps old V3.2 routes, but never trusts Arc history locally", () => {
  const api = routing({ NEXT_PUBLIC_V3_FACTORY_ADDRESS: "0x23E023E0D8B3436319BC6e5e72615Bc7A0c6234E" });
  assert.equal(api.resolveCommunityReference(`${previousFactory.address}-1`).factory, previousFactory.address);
  const local = routing({ NEXT_PUBLIC_DEFAULT_CHAIN: "hardhat" });
  assert.equal(local.resolveCommunityReference(`${previousFactory.address}-1`, 31337), null);
});

test("explicit three-generation manifest sources keep their exact blocks without duplicates", () => {
  const current = { address: "0x23E023E0D8B3436319BC6e5e72615Bc7A0c6234E", startBlock: "69044184" };
  const expected = [originalFactory, previousFactory, current];
  assert.deepEqual(factorySources({ V3_FACTORY_SOURCES: JSON.stringify(expected) }), expected);
});
