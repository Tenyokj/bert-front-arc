import { readPreRedesign } from "./pre-redesign-baseline.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const root = new URL("../", import.meta.url), require = createRequire(import.meta.url);
const read = (file) => readFileSync(new URL(file, root), "utf8");
const load = (file, imports = {}) => {
  const output = {};
  const code = ts.transpileModule(read(file), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  new Function("exports", "require", code)(output, (name) => imports[name] ?? (name.endsWith(".css") ? {} : require(name))); return output;
};
const api = load("src/lib/transaction-status.ts");
const hash = `0x${"1".repeat(64)}`, otherHash = `0x${"2".repeat(64)}`;
const record = { id: 1, label: "Publish proposal", chainId: 5042002, account: "0x1111111111111111111111111111111111111111", hash, status: "success" };
const receipt = { transactionHash: hash, status: "success", blockNumber: 123n };
test("broadcast success never means onchain confirmation; only matching mined receipt does", () => {
  assert.equal(api.transactionPhase(record), "submitted");
  assert.equal(api.transactionPhase(record, receipt), "confirmed");
  assert.equal(api.transactionPhase(record, { ...receipt, status: "reverted" }), "reverted");
  assert.equal(api.transactionPhase(record, { ...receipt, transactionHash: otherHash }), "submitted");
  assert.equal(api.transactionPhase(record, null, new Error("RPC unavailable")), "unknown");
  assert.equal(api.transactionPhase({ status: "pending" }), "signature");
});
test("nested explicit wallet rejection is distinct from ambiguous RPC failures", () => {
  for (const error of [{ cause: { code: 4001, message: "Cancelled" } }, { code: "ACTION_REJECTED" }, { name: "UserRejectedRequestError" }]) assert(api.errorDescription(error).rejected);
  for (const message of ["already known", "nonce too low", "timeout", "execution reverted", "failed to fetch"]) {
    const result = api.captureTransaction(undefined, 1, "writeContract", { status: "error", error: new Error(message) });
    assert.equal(api.transactionPhase(result), "unknown"); assert.equal(result.error, message);
  }
  const cyclic = { message: "RPC failed" }; cyclic.cause = cyclic;
  assert.equal(api.errorDescription(cyclic).message, "RPC failed");
});
test("original chain and account stay captured after wallet switch; missing context is never guessed", () => {
  const first = api.captureTransaction(undefined, 1, "writeContract", { status: "pending", variables: { functionName: "createFundingProposal" } }, { chainId: 5042002, address: record.account });
  const final = api.captureTransaction(first, 1, "writeContract", { status: "success", data: hash }, { chainId: 1, address: "different wallet" });
  assert.equal(final.chainId, 5042002); assert.equal(final.account, record.account); assert.equal(final.hash, hash);
  assert.equal(api.captureTransaction(undefined, 2, "deployContract", { status: "success", data: hash }).chainId, undefined);
  const rejected = api.captureTransaction(undefined, 3, "writeContract", { status: "error", error: { code: 4001 } });
  assert.equal(api.transactionPhase(rejected), "rejected");
  assert.equal(api.transactionPhase({ ...rejected, hash }), "submitted");
});
test("explorer links require a real hash and HTTPS; no hash is fabricated", () => {
  assert.equal(api.transactionExplorer("https://testnet.arcscan.app/", hash), `https://testnet.arcscan.app/tx/${hash}`);
  for (const base of [undefined, "javascript:alert(1)", "http://localhost:8545", "not a URL"]) assert.equal(api.transactionExplorer(base, hash), null);
  assert.equal(api.transactionExplorer("https://testnet.arcscan.app", "0x123"), null);
});
test("shared receipt adapter fails closed and keeps the original hash network", () => {
  let result = { isSuccess: true, data: undefined, isLoading: false, error: new Error("RPC timeout") };
  let observed = { data: null, error: null };
  let captured, chain = 5042002, lastParameters;
  const hook = load("src/hooks/useProtocolReceipt.ts", {
    react: { useState: (initial) => { captured ??= initial; return [captured, (next) => { captured = next; }]; } },
    wagmi: { useChainId: () => chain, useWaitForTransactionReceipt: (parameters) => { lastParameters = parameters; return result; } },
    "@/lib/web3": { defaultChain: { id: 5042002 } }, "@/lib/transaction-status": api,
    "./useObservedReceipt": { useObservedReceipt: () => observed },
  }).useProtocolReceipt;
  assert.equal(hook({ hash }).isSuccess, false); assert.equal(hook({ hash }).isLoading, true);
  result = { ...result, data: receipt, error: null }; assert.equal(hook({ hash }).isSuccess, true);
  chain = 31337; hook({ hash }); assert.equal(lastParameters.chainId, 5042002);
  hook({ hash: otherHash }); assert.equal(lastParameters.chainId, 31337);
  result = { ...result, data: { ...receipt, transactionHash: otherHash, status: "reverted" } };
  assert.equal(hook({ hash: otherHash }).isSuccess, false); assert.equal(hook({ hash: otherHash }).isLoading, false);
  result = { ...result, data: undefined, error: new Error("Wagmi throws for mined revert") };
  observed = { data: { ...receipt, transactionHash: otherHash, status: "reverted" }, error: null };
  assert.equal(hook({ hash: otherHash }).isLoading, false); assert.equal(hook({ hash: otherHash }).isSuccess, false);
  observed = { data: { ...receipt, transactionHash: otherHash }, error: null };
  assert.equal(hook({ hash: otherHash }).isSuccess, true); assert.equal(hook({ hash: otherHash }).error, null);
});
test("transaction cards render every outcome, selectable hash, explorer and read-only refresh", () => {
  let response = { data: receipt, error: null, isFetching: false, refetch() {} };
  const { TransactionRow } = load("src/components/dapp/TransactionCenter.tsx", {
    "@/lib/transaction-status": api,
    wagmi: { useConfig: () => ({ chains: [{ id: 5042002, name: "Arc Testnet", blockExplorers: { default: { url: "https://testnet.arcscan.app" } } }] }) },
    "wagmi/actions": { getAccount: () => { throw new Error("Rendering must not consult current wallet"); }, getPublicClient: () => { throw new Error("SSR must not query or write"); } },
    "@tanstack/react-query": { useQuery: () => response, useQueryClient: () => ({}) },
    "@/hooks/useObservedReceipt": { useObservedReceipt: () => response },
  });
  const markup = (value = record) => renderToStaticMarkup(React.createElement(TransactionRow, { record: value }));
  assert.match(markup(), /Confirmed onchain/); assert(markup().includes(hash));
  assert.match(markup(), /Copy hash/); assert.match(markup(), /Refresh status \(read-only\)/);
  response = { ...response, data: { ...receipt, status: "reverted" } }; assert.match(markup(), /Reverted onchain/);
  response = { ...response, data: null, error: new Error("RPC unavailable") }; assert.match(markup(), /Outcome unconfirmed/);
  response = { ...response, error: null }; assert.match(markup(), /Awaiting confirmation/);
  assert.match(markup({ ...record, hash: undefined, status: "pending" }), /Waiting for wallet/);
  assert.match(markup({ ...record, hash: undefined, status: "rejected" }), /Rejected in wallet/);
  const unknown = markup({ ...record, chainId: undefined }); assert.match(unknown, /Original network unavailable/); assert.doesNotMatch(unknown, /View in explorer/);
});
test("all 26 receipt workflows use shared adapter without changing financial call expressions", () => {
  const files = execFileSync("rg", ["-l", "useProtocolReceipt as useWaitForTransactionReceipt", "src"], { cwd: root, encoding: "utf8" }).trim().split("\n");
  assert.equal(files.length, 26);
  for (const path of files) {
    const previous = readPreRedesign(path);
    const writes = (source) => {
      const file = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX), calls = [];
      const visit = (node) => { if (ts.isCallExpression(node) && /(?:writeContract(?:Async)?|deployContract(?:Async)?|sendTransaction|send[A-Z]\w*)$/.test(node.expression.getText(file))) calls.push(node.getText(file)); ts.forEachChild(node, visit); }; visit(file); return calls;
    };
    assert.deepEqual(writes(read(path)), writes(previous), path);
  }
  const center = read("src/components/dapp/TransactionCenter.tsx");
  assert.doesNotMatch(center, /\.writeContract\(|\.sendTransaction\(|\.deployContract\(/);
  assert.match(center, /event.action.type === "pending" \? getAccount/);
  assert.match(center, /slice\(0, 8\)/);
});
