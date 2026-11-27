import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";

const base = process.env.PREVIEW_URL || "http://localhost:3000";
assert(["localhost", "127.0.0.1"].includes(new URL(base).hostname));
const output = new URL("../.e2e-results/admin-ux/", import.meta.url);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const errors = [], writes = [], checks = [];
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  context.setDefaultTimeout(20000);
  await context.route("**/*", (route) => {
    let body; try { body = route.request().postDataJSON(); } catch { /* Not a JSON body. */ }
    const requests = Array.isArray(body) ? body : [body];
    if (requests.some((request) => /^(eth_send|personal_sign|eth_sign|wallet_)/.test(request?.method || ""))) writes.push(route.request().url());
    if (requests.some((request) => request?.method?.startsWith("eth_") || request?.method?.startsWith("wallet_"))) return route.abort();
    return route.continue();
  });
  for (const route of ["/admin", "/admin?tab=treasury", "/admin?tab=governance", "/admin?tab=access", "/admin?tab=reputation", "/admin?tab=infrastructure", "/pool", "/profile", "/ideas", "/rounds", "/demo/ideas", "/demo/rounds"]) {
    const page = await context.newPage();
    page.on("pageerror", (error) => errors.push(`${route}: ${error.message}`));
    const response = await page.goto(`${base}${route}`, { waitUntil: "domcontentloaded", timeout: 120000 });
    assert.equal(response.status(), 200, route);
    if (!route.startsWith("/demo/")) await page.locator("[data-dapp-theme]").waitFor();
    await page.evaluate(() => document.fonts.ready);
    if (route.startsWith("/admin")) {
      await page.getByRole("heading", { name: "Control Center", exact: true }).waitFor();
      for (const button of await page.getByRole("button", { name: "Simulate & review", exact: true }).all()) assert(await button.isDisabled());
    }
    if (route === "/pool") assert.equal(await page.getByRole("button", { name: /Schedule|Cancel scheduled|Activate|Collect|Release/ }).count(), 0);
    if (route.startsWith("/demo/")) {
      await page.locator('[data-collection-ready="true"]').waitFor();
      const cards = page.locator("[data-protocol-card]"); await cards.first().waitFor();
      const before = await cards.count(); assert(before > 0);
      await page.getByRole("searchbox", { name: "Find on this page" }).fill("no-such-record-94817");
      await page.getByText("No matching records on this page.", { exact: false }).waitFor();
      await page.getByRole("button", { name: "Reset filters" }).click();
      await cards.first().waitFor(); assert.equal(await cards.count(), before);
      await cards.first().locator("summary").click(); assert.equal(await cards.first().locator("details[open]").count(), 1);
      assert.equal(await cards.locator("a a, button button").count(), 0);
      assert.equal(await cards.locator('[style*="100%"] ').count(), 0);
      const status = page.getByLabel("Filter by status", { exact: true });
      const option = await status.locator("option").nth(1).getAttribute("value");
      await status.selectOption(option || await status.locator("option").nth(1).innerText());
      assert((await cards.count()) <= before);
      await page.getByRole("button", { name: "Reset filters" }).click();
    }
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.waitForTimeout(100);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${route}: overflow at ${width}`);
      if (width !== 320 && ["/admin", "/admin?tab=governance", "/demo/ideas", "/demo/rounds"].includes(route)) await page.screenshot({ path: new URL(`${route.replaceAll(/[^a-z0-9]/gi, "-")}-${width}.png`, output).pathname, fullPage: true });
    }
    checks.push(route); console.log(`PASS ${route}: no-wallet/read-only UI, desktop/mobile`); await page.close();
  }
  assert.deepEqual(errors, []); assert.deepEqual(writes, []);
  await writeFile(new URL("report.json", output), JSON.stringify({ checkedAt: new Date().toISOString(), base, checks, widths: [1440, 390, 320], errors, writes, scope: "Read-only preview. RPC blocked. Not a signed-wallet or public-chain E2E acceptance." }, null, 2));
} finally { await browser.close(); }
