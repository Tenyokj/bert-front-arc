import assert from "node:assert/strict";
import fs from "node:fs";
import { chromium } from "@playwright/test";

const front = process.env.BERT_TREASURY_DAPP_URL ?? "http://127.0.0.1:13500";
const consoleUrl = process.env.BERT_TREASURY_CONSOLE_URL ?? "http://127.0.0.1:13501";
const fixture = JSON.parse(fs.readFileSync("/private/tmp/bert-v24-client-contract-check.json", "utf8"));
assert.equal(fixture.publicTransactionsSent, false);
const browser = await chromium.launch({ headless: true,
  executablePath: process.env.BERT_CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
const errors = [];
try {
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  desktop.on("pageerror", (error) => errors.push(error.message));
  await desktop.goto(`${front}/pool`, { waitUntil: "domcontentloaded" });
  await desktop.getByRole("heading", { name: "Transparent treasury", exact: true }).waitFor({ timeout: 45000 });
  await desktop.getByText(/Legacy accounting: V2.4 revenue is not available/).waitFor({ timeout: 45000 });
  assert.equal(await desktop.getByRole("button", { name: "Schedule settings", exact: true }).count(), 0);
  assert.equal(await desktop.getByText("Share of pool", { exact: true }).count(), 0);
  await desktop.screenshot({ path: "/private/tmp/bert-v24-dapp-legacy.png", fullPage: true });

  const modern = fixture.snapshots[1];
  await desktop.route("**/api/treasury**", (route) => route.fulfill({ status: 200,
    contentType: "application/json", body: JSON.stringify({ data: modern, error: null }) }));
  await desktop.goto(`${consoleUrl}/funding`, { waitUntil: "domcontentloaded" });
  await desktop.getByText("V2.4 accounting detected", { exact: false }).waitFor({ timeout: 20000 });
  await desktop.getByRole("cell", { name: "0.004 USDC", exact: true }).waitFor();
  assert.equal(await desktop.getByRole("button", { name: "Pay fixed beneficiary", exact: true }).count(), 0);
  await desktop.screenshot({ path: "/private/tmp/bert-v24-console-modern.png", fullPage: true });
  await desktop.getByRole("textbox", { name: "Revenue round ID" }).fill("-1");
  await desktop.getByRole("button", { name: "Inspect round snapshot" }).click();
  await desktop.getByText("Enter a positive uint256 round ID.").waitFor();

  await desktop.unroute("**/api/treasury**");
  await desktop.route("**/api/treasury**", (route) => route.fulfill({ status: 503,
    contentType: "application/json", body: JSON.stringify({ data: null, error: "Unavailable" }) }));
  await desktop.getByRole("button", { name: "Refresh accounting (read-only)" }).click();
  await desktop.getByText(/Treasury accounting unavailable. Refresh to retry/).waitFor();
  assert.equal(await desktop.locator(".revenue-panel").count(), 0, "Stale financial values must not survive an error");

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  mobile.on("pageerror", (error) => errors.push(error.message));
  await mobile.route("**/api/treasury**", (route) => route.fulfill({ status: 200,
    contentType: "application/json", body: JSON.stringify({ data: modern, error: null }) }));
  await mobile.goto(`${consoleUrl}/funding`, { waitUntil: "domcontentloaded" });
  await mobile.getByRole("heading", { name: "Transparent treasury", exact: true }).waitFor();
  const widths = await mobile.evaluate(() => ({ viewport: innerWidth, content: document.documentElement.scrollWidth }));
  assert(widths.content <= widths.viewport, `Mobile overflow: ${JSON.stringify(widths)}`);
  await mobile.screenshot({ path: "/private/tmp/bert-v24-console-mobile.png", fullPage: true });
  await mobile.goto(`${front}/pool`, { waitUntil: "domcontentloaded" });
  await mobile.getByText(/Legacy accounting: V2.4 revenue is not available/).waitFor({ timeout: 45000 });
  const dappWidths = await mobile.evaluate(() => ({ viewport: innerWidth, content: document.documentElement.scrollWidth }));
  assert(dappWidths.content <= dappWidths.viewport, `dApp mobile overflow: ${JSON.stringify(dappWidths)}`);
  assert.deepEqual(errors, []);
  console.log("Treasury browser smoke passed: real legacy dApp reads, local-contract modern readout fixture, RPC failure, read-only Console and desktop/mobile layout. No wallet writes.");
} finally { await browser.close(); }
