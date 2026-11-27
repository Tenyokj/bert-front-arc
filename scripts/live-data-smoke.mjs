import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";

const base = process.env.PREVIEW_URL || "http://localhost:3000";
assert(["localhost", "127.0.0.1"].includes(new URL(base).hostname));
const output = new URL("../.e2e-results/live-data/", import.meta.url);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const errors = [], writes = [];
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1050 } });
  context.setDefaultTimeout(45000);
  await context.route("**/*", (route) => {
    let body; try { body = route.request().postDataJSON(); } catch { /* Not JSON. */ }
    const calls = Array.isArray(body) ? body : [body];
    if (calls.some((call) => /^(eth_send|eth_sign|personal_sign|wallet_)/.test(call?.method || ""))) {
      writes.push("Blocked wallet/signing method"); return route.abort();
    }
    return route.continue();
  });
  const page = await context.newPage(); page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${base}/ideas`, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.locator('[data-protocol-card="idea"]').first().waitFor();
  const indexedCount = await page.locator('[data-protocol-card="idea"]').count();
  assert(indexedCount > 0 && indexedCount <= 15);
  await page.screenshot({ path: new URL("ideas-indexed.png", output).pathname });
  // Fail only the indexer. The following rendered records must come from real RPC reads.
  await page.route("**/api/subgraph", (route) => route.fulfill({ status: 502, contentType: "application/json", body: JSON.stringify({ error: "Intentional indexer outage in local smoke test" }) }));
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByText(/Indexer unavailable. Loading this page directly/).waitFor();
  await page.locator('[data-protocol-card="idea"]').first().waitFor();
  const rpcCount = await page.locator('[data-protocol-card="idea"]').count();
  assert(rpcCount > 0 && rpcCount <= 15);
  await page.getByText("Grant cancelled", { exact: true }).first().waitFor();
  await page.screenshot({ path: new URL("ideas-rpc-fallback.png", output).pathname });
  const relayRejection = await page.evaluate(async () => {
    const response = await fetch("/api/local-demo-proof", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ walletAddress: "0x1111111111111111111111111111111111111111", chainId: 1, verifierAddress: "0x2222222222222222222222222222222222222222" }) });
    return response.status;
  });
  assert.equal(relayRejection, 400, "Wrong-chain request must be rejected before reaching the credential issuer");
  assert.deepEqual(errors, []); assert.deepEqual(writes, []);
  const report = { checkedAt: new Date().toISOString(), indexedCount, rpcCount, relayRejection, errors, writes, scope: "Real public Graph/RPC reads, then an intentionally failed indexer to test real RPC fallback. Only an invalid wrong-chain request sent to the local demo relay. No credential issued, wallet connected or transaction signed." };
  await writeFile(new URL("report.json", output), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
} finally { await browser.close(); }
