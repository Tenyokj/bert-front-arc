import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";

function moduleAPI(path, env, dependencies = {}) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const exports = {};
  new Function("exports", "process", "require", js)(exports, { env }, (name) => {
    if (!(name in dependencies)) throw new Error(`Unexpected dependency ${name}`);
    return dependencies[name];
  });
  return exports;
}
const factory = "0x1111111111111111111111111111111111111111";
const creator = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const library = "0x2222222222222222222222222222222222222222";
const env = { NEXT_PUBLIC_V3_FACTORY_ADDRESS: factory };
const references = moduleAPI("../src/lib/community-reference.ts", env);
const api = moduleAPI("../src/lib/community-creation.ts", env, { "./community-reference": references });
const input = { creator, chainId: 5042002, factory, adminActionsLibrary: library };

test("creation binds creator, chain, Factory and library, preserving address casing", () => {
  assert.deepEqual(api.communityCreationContext(input), input);
  const context = api.communityCreationContext(input);
  assert.equal(api.matchesCommunityCreator(context, creator.toUpperCase().replace("0X", "0x"), 5042002), true);
  assert.doesNotThrow(() => api.assertCommunityCreator(context, creator, 5042002));
});

test("switching wallet, network or disconnecting blocks continuation without mutating reservation context", () => {
  const context = Object.freeze(api.communityCreationContext(input));
  for (const [wallet, chain] of [[library, 5042002], [creator, 31337], [undefined, undefined]]) {
    assert.equal(api.matchesCommunityCreator(context, wallet, chain), false);
    assert.throws(() => api.assertCommunityCreator(context, wallet, chain), /Switch back/);
  }
  assert.throws(() => api.assertCommunityCreator(null, creator, 5042002));
  assert.deepEqual(context, input);
});

test("creation rejects legacy Factory, wrong network, untrusted Factory and missing deployment fields", () => {
  for (const change of [{ factory: references.ORIGINAL_V31_FACTORY }, { chainId: 31337 }, { factory: library },
    { chainId: undefined }, { adminActionsLibrary: undefined }, { creator: undefined },
    { adminActionsLibrary: "0x0000000000000000000000000000000000000000" }]) {
    assert.throws(() => api.communityCreationContext({ ...input, ...change }));
  }
});

test("UI pins all receipts and writes, validates the original creator, and filters Factory logs", () => {
  const page = readFileSync(new URL("../src/app/(dapp)/v3/create/page.tsx", import.meta.url), "utf8");
  assert.equal((page.match(/chainId: creationContext\?\.chainId/g) || []).length, 3);
  assert.equal((page.match(/assertCommunityCreator\(creationContext, address, chainId\)/g) || []).length, 2);
  assert.match(page, /logs: reserveReceipt\.data\.logs\.filter/);
  assert.match(page, /account: context\.creator/);
  assert.match(page, /args: \[config, reservation\.treasury, creationContext\.creator\]/);
  assert.match(page, /reserveReceipt\.isLoading/);
});
