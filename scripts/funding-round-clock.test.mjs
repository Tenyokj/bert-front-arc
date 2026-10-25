import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const source = readFileSync(new URL("../src/lib/funding-round-clock.ts", import.meta.url), "utf8");
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const api = {};
new Function("exports", js)(api);
const round = { active: true, ended: false, endTime: 2_000_000_000n };

test("V2 settlement is disabled until chain time is known and strictly past endTime", () => {
  for (const timestamp of [undefined, 0n, round.endTime - 1n, round.endTime]) assert.equal(api.fundingRoundCanSettle(round, timestamp), false);
  assert.equal(api.fundingRoundCanSettle(round, round.endTime + 1n), true);
});
test("ended and inactive V2 rounds never expose settlement", () => {
  assert.equal(api.fundingRoundCanSettle({ ...round, active: false }, round.endTime + 1n), false);
  assert.equal(api.fundingRoundCanSettle({ ...round, ended: true }, round.endTime + 1n), false);
});
test("V2 UI uses the network block timestamp, not the computer clock", () => {
  const page = readFileSync(new URL("../src/app/(dapp)/rounds/[id]/page.tsx", import.meta.url), "utf8");
  assert.match(page, /fundingRoundCanSettle\(round, latestBlock\?\.timestamp\)/);
  assert.doesNotMatch(page, /const canEndRound\s*=.*Date\.now/);
});
