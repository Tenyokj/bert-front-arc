import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

function load(path, dependencies = {}) {
  const js = ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const exports = {};
  new Function("exports", "require", js)(exports, (name) => {
    if (!(name in dependencies)) throw Error(`Unexpected dependency ${name}`);
    return dependencies[name];
  });
  return exports;
}
const api = load("../src/lib/wallet-action.ts");
const errors = load("../src/lib/community-errors.ts", { "./wallet-action": api });

function action({ reads = [false], sendError, status = "success", waitError } = {}) {
  const calls = { send: 0, wait: 0, read: 0 };
  return {
    calls,
    options: {
      async isApplied() { const value = reads[Math.min(calls.read++, reads.length - 1)]; if (value instanceof Error) throw value; return value; },
      async send() { calls.send++; if (sendError) throw sendError; return "0x1234"; },
      async wait() { calls.wait++; if (waitError) throw waitError; return { status }; },
      async pause() {},
    },
  };
}

test("an already-applied verification, approval or membership never sends again", async () => {
  const a = action({ reads: [true] });
  await api.confirmWalletAction(a.options);
  assert.equal(a.calls.send, 0);
});
test("already-known and viem nonce wrappers reconcile state without repeating writes", async () => {
  for (const message of ["already known", "Nonce provided for the transaction is lower than the current nonce", "transaction already imported"]) {
    const a = action({ reads: [false, false, true], sendError: Error(message) });
    await api.confirmWalletAction(a.options);
    assert.equal(a.calls.send, 1);
    assert.equal(a.calls.wait, 0);
  }
});
test("receipt timeout can reconcile a successful on-chain action", async () => {
  const a = action({ reads: [false, true], waitError: Error("request timeout") });
  await api.confirmWalletAction(a.options);
  assert.equal(a.calls.send, 1);
});
test("unconfirmed or unavailable postconditions remain uncertain, never success", async () => {
  for (const reads of [[false], [false, Error("RPC unavailable")]]) {
    const a = action({ reads, sendError: Error("already known") });
    await assert.rejects(api.confirmWalletAction(a.options), /Refresh on-chain status before sending again/);
    assert.equal(a.calls.send, 1);
    assert.equal(a.calls.read, 4);
  }
});
test("unavailable initial read fails closed before a wallet prompt", async () => {
  const a = action({ reads: [Error("RPC unavailable")] });
  await assert.rejects(api.confirmWalletAction(a.options), /RPC unavailable/);
  assert.equal(a.calls.send, 0);
});
test("reverted receipts and cancelled prompts are not reported as success", async () => {
  for (const options of [{ status: "reverted" }, { sendError: Error("User rejected request") }]) {
    const a = action(options);
    await assert.rejects(api.confirmWalletAction(a.options));
    assert.equal(a.calls.read, 1);
  }
});
test("community errors distinguish PoP gating from an ambiguous broadcast", () => {
  assert.match(errors.communityErrorMessage(Error("HumanVerificationRequired")), /human verification in Profile/);
  assert.match(errors.communityErrorMessage(Error("already known")), /may already be confirmed/);
  assert.match(errors.communityErrorMessage(Error(api.uncertainWalletMessage)), /Do not manually increase the nonce/);
});
test("membership gates entry with its own verifier, simulates and pins writes to the selected chain", () => {
  const source = readFileSync(new URL("../src/components/CommunityMembershipAction.tsx", import.meta.url), "utf8");
  assert.match(source, /functionName: "humanVerifier"/);
  assert.match(source, /verificationRead.data !== true/);
  assert.match(source, /client.simulateContract/);
  assert.match(source, /writeContractAsync\(\{ \.\.\.request, chainId \}\)/);
  assert.match(source, /actionLock.current = true/);
  assert.doesNotMatch(source, /onClick=.*\.writeContract\(/);
});
test("verification clears obsolete saved credentials on confirmed state and checks receipt status through reconciliation", () => {
  const source = readFileSync(new URL("../src/components/HumanVerificationPanel.tsx", import.meta.url), "utf8");
  assert.match(source, /if \(verification\[0\]\) \{[\s\S]*?setPendingPayload\(null\)/);
  assert.match(source, /await confirmWalletAction/);
  assert.match(source, /pendingPayload && !verified/);
  assert.doesNotMatch(source, /World ID passed, waiting/);
});
