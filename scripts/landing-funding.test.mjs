import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const source = readFileSync(new URL("../src/lib/landing-funding.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const exports = {};
new Function("exports", compiled)(exports);
const { fundingExample } = exports;

test("illustrative example vests fees with 20/40/40 payouts, not all upfront", () => {
  assert.deepEqual(fundingExample(1000, 0), { author: 190, reserve: 8, revenue: 2, escrow: 800 });
  assert.deepEqual(fundingExample(1000, 1), { author: 570, reserve: 24, revenue: 6, escrow: 400 });
  assert.deepEqual(fundingExample(1000, 2), { author: 950, reserve: 40, revenue: 10, escrow: 0 });
});

test("all slider values conserve pledges at every stage", () => {
  for (let pledged = 100; pledged <= 10000; pledged += 100) {
    for (let stage = 0; stage < 3; stage++) {
      const result = fundingExample(pledged, stage);
      assert(Math.abs(Object.values(result).reduce((a, b) => a + b, 0) - pledged) < 1e-8);
      assert(Object.values(result).every((amount) => amount >= 0));
    }
  }
});

test("invalid amounts or stages fail closed", () => {
  for (const amount of [-1, 0, 99, 10001, NaN, Infinity, 150.5]) assert.throws(() => fundingExample(amount, 0));
  for (const stage of [-1, 3, NaN, Infinity, 0.5]) assert.throws(() => fundingExample(1000, stage));
});

test("landing preserves financial boundaries without wallet-write imports", () => {
  const landing = readFileSync(new URL("../src/components/landing/LandingExperience.tsx", import.meta.url), "utf8");
  assert.match(landing, /ILLUSTRATIVE, NOT LIVE/);
  assert.match(landing, /policy was activated before the round opened/);
  assert.doesNotMatch(landing, /writeContract|sendTransaction|useWalletClient|wallet_switchEthereumChain/);
});
