import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "@playwright/test";

const base = process.env.PREVIEW_URL || "http://localhost:3100";
assert(["localhost", "127.0.0.1"].includes(new URL(base).hostname), "Local preview only");
const routes = ["how-it-works", "protocol-stats", "faq", "developer-guide", "governance-stack", "on-chain-votes", "treasury-policies", "policy-docs", "testnet-information", "security-roadmap", "bug-bounty", "privacy-notice", "terms-of-use"];
const output = new URL("../.e2e-results/site-pages/", import.meta.url);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const errors = [];
const writes = [];
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, permissions: ["clipboard-read", "clipboard-write"] });
  // Deterministic unavailable-data check, not a claim of fresh Arc/RPC verification.
  await context.route("**/*", (route) => {
    let payload;
    try { payload = route.request().postDataJSON(); } catch { /* Not JSON. */ }
    const calls = Array.isArray(payload) ? payload : [payload];
    if (calls.some((call) => /^(eth_send|personal_sign|eth_sign|wallet_)/.test(call?.method ?? ""))) writes.push(route.request().url());
    if (calls.some((call) => call?.method?.startsWith("eth_") || call?.method?.startsWith("wallet_"))) return route.abort();
    if (/\/api\/subgraph/.test(route.request().url())) return route.fulfill({ status: 503, body: "Unavailable during UI check" });
    return route.continue();
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  for (const route of routes) {
    await page.setViewportSize({ width: 1440, height: 1000 });
    const response = await page.goto(`${base}/${route}`, { waitUntil: "domcontentloaded", timeout: 90000 });
    assert.equal(response.status(), 200, route);
    await page.locator(`[data-site-page="/${route}"]`).waitFor();
    await page.locator("h1").waitFor();
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(400);
    assert.equal(await page.getByRole("banner").count(), 1, `${route}: exactly one header`);
    assert.equal(await page.getByRole("contentinfo").count(), 1, `${route}: exactly one footer`);
    assert.equal(await page.locator("h1").count(), 1, `${route}: exactly one h1`);
    assert.match(await page.locator("h1").evaluate((element) => getComputedStyle(element).fontFamily), /Outfit/i);
    assert.equal(await page.getByRole("navigation", { name: "Main navigation", exact: true }).getByText("The protocol", { exact: true }).getAttribute("href"), "/#protocol");
    const anchors = await page.locator('a[href^="#"]').evaluateAll((links) => links.map((link) => link.getAttribute("href")).filter((href) => href.length > 1 && !document.getElementById(decodeURIComponent(href.slice(1)))));
    assert.deepEqual(anchors, [], `${route}: section links resolve`);
    await page.screenshot({ path: new URL(`${route}-desktop.png`, output).pathname });
    for (const width of [768, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      const size = await page.evaluate(() => ({ width: innerWidth, content: document.documentElement.scrollWidth }));
      assert(size.content <= width, `${route} overflow at ${width}: ${JSON.stringify(size)}`);
      if (width === 390) await page.screenshot({ path: new URL(`${route}-mobile.png`, output).pathname });
    }
    console.log(`PASS /${route}: shared chrome, anchors, fonts, 1440/768/390/320px`);
  }
  await page.goto(`${base}/faq`);
  await page.getByRole("searchbox", { name: "Search all FAQ sections" }).fill("zzzz-no-matching-answer");
  await page.getByRole("heading", { name: "No matching answers." }).waitFor();
  await page.getByRole("button", { name: "Reset search", exact: true }).click();
  await page.getByRole("searchbox").fill("RevenueTreasury");
  await page.getByRole("button", { name: "Can the team redirect a RevenueTreasury payment?", exact: true }).click();
  await page.getByText("The deployed immutable RevenueTreasury fixes", { exact: false }).waitFor();
  await page.getByRole("button", { name: "Clear FAQ search" }).click();
  await page.getByRole("button", { name: "Copy page link", exact: true }).click();
  await page.getByRole("button", { name: "Link copied", exact: true }).waitFor();
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), `${base}/faq`);
  await page.locator("summary").filter({ hasText: "Explore all guides" }).click();
  await page.getByRole("navigation", { name: "Information pages", exact: true }).getByRole("link", { name: "Build Developer guide" }).click();
  await page.waitForURL("**/developer-guide");
  await page.goto(`${base}/protocol-stats`);
  await page.getByText("A dash means a value is not available", { exact: false }).waitFor();
  const rounds = page.locator("article").filter({ has: page.getByText("Total Rounds", { exact: true }) });
  assert((await rounds.innerText()).includes("—"), "RPC-unavailable rounds are not a fake zero");
  await page.getByRole("button", { name: "Refresh reads", exact: true }).click();
  await page.goto(`${base}/how-it-works`);
  await page.getByRole("tab", { name: "Community governance" }).click();
  await page.getByRole("heading", { name: "Build a place for collective decisions." }).waitFor();
  assert.deepEqual(writes, [], "No wallet writes attempted");
  assert.deepEqual(errors, [], "No uncaught/hydration errors");
  console.log(JSON.stringify({ status: "passed", routes: routes.length, note: "UI/empty-state checks with RPC blocked; no public-chain verification or financial E2E", screenshots: output.pathname }, null, 2));
} finally { await browser.close(); }
