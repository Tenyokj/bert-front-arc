import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";

const source = readFileSync(new URL("../src/lib/contract-results.ts", import.meta.url), "utf8");
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const api = {};
new Function("exports", js)(api);

test("search decodes actual multi-output tuples without losing bigint weights", () => {
  const weight = 123456789012345678901234567890n;
  assert.deepEqual(api.searchIdeaResult([1n, "0x123", "Idea", "description", "uri", 2n, weight, 0]), { id: 1, title: "Idea", totalVotes: weight });
  assert.deepEqual(api.searchRoundResult([2n, [1n], 3n, 4n, false, true, weight, 1n, weight]), { id: 2, totalVotes: weight });
});

test("named results and zero vote totals are valid", () => {
  assert.deepEqual(api.searchIdeaResult({ id: 1n, title: "Idea", totalVotes: 0n }), { id: 1, title: "Idea", totalVotes: 0n });
  assert.deepEqual(api.searchRoundResult({ id: 2n, totalVotes: 0n }), { id: 2, totalVotes: 0n });
});

test("missing, truncated, wrong-type or unsafe search results fail closed", () => {
  for (const value of [null, undefined, [], [1n], { id: 0n, title: "Idea", totalVotes: 0n },
    { id: BigInt(Number.MAX_SAFE_INTEGER) + 1n, title: "Idea", totalVotes: 0n },
    { id: 1n, title: "Idea", totalVotes: "100" }, { id: 1n, title: "Idea", totalVotes: -1n }]) {
    assert.equal(api.searchIdeaResult(value), null);
    assert.equal(api.searchRoundResult(value), null);
  }
});

test("distribution amounts remain bigint; invalid data is not an asserted tuple", () => {
  assert.equal(api.distributionAmount([1n, 2n, 50_000_000n, 3n]), 50_000_000n);
  assert.equal(api.distributionAmount({ amount: 0n }), 0n);
  for (const value of [null, [], [1n, 2n], { amount: "50" }, { amount: -1n }]) assert.equal(api.distributionAmount(value), null);
});

test("release builds may not bypass type checking or include graph AssemblyScript", () => {
  const config = JSON.parse(readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8"));
  assert.equal(config.compilerOptions.strictNullChecks, true);
  assert.ok(config.exclude.includes("subgraph-v3/**"));
  const next = readFileSync(new URL("../next.config.ts", import.meta.url), "utf8");
  assert.equal(/ignoreBuildErrors\s*:\s*true/.test(next), false);
});
