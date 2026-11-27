import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";

const base = process.env.PREVIEW_URL || "http://localhost:3000";
assert(["localhost", "127.0.0.1"].includes(new URL(base).hostname));
const output = new URL("../.e2e-results/dapp-cyber/", import.meta.url);
await mkdir(output, { recursive: true });
const routes = ["/app", "/ideas/new", "/pool", "/v3", "/demo/ideas/201"];
const browser = await chromium.launch({ headless: true });
const errors = [], writes = [];
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.route("**/*", (route) => {
    let payload;
    try { payload = route.request().postDataJSON(); } catch { /* Not JSON. */ }
    const calls = Array.isArray(payload) ? payload : [payload];
    if (calls.some((call) => /^(eth_send|personal_sign|eth_sign|wallet_)/.test(call?.method || ""))) writes.push(route.request().url());
    if (calls.some((call) => call?.method?.startsWith("eth_") || call?.method?.startsWith("wallet_"))) return route.abort();
    return route.continue();
  });
  let page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  for (const route of routes) {
    if (route !== routes[0]) {
      await page.close();
      page = await context.newPage();
      page.on("pageerror", (error) => errors.push(error.message));
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    const response = await page.goto(`${base}${route}`, { waitUntil: "domcontentloaded", timeout: 120000 });
    assert.equal(response.status(), 200);
    await page.locator("[data-honeycomb]").waitFor({ state: "attached" });
    assert.equal(await page.locator("[data-dapp-theme] header").count(), 1);
    assert.equal(await page.locator('[aria-label="Application sidebar"]').count(), 0);
    assert.equal(await page.locator("[data-honeycomb]").evaluate((el) => getComputedStyle(el).pointerEvents), "none");
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(300);
    await page.screenshot({ path: new URL(`${route.replaceAll("/", "-")}-desktop.png`, output).pathname });
    for (const width of [768, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      assert((await page.evaluate(() => document.documentElement.scrollWidth)) <= width, `${route}: overflow ${width}`);
      if (width === 390) await page.screenshot({ path: new URL(`${route.replaceAll("/", "-")}-mobile.png`, output).pathname });
    }
    console.log(`PASS ${route}: island layout, honeycomb, 1440/768/390/320`);
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${base}/app`, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Connect Wallet", exact: true }).waitFor();
  const wave = page.locator("[data-honeycomb] > div").nth(2).locator(":scope > div").first();
  const before = await wave.evaluate((el) => getComputedStyle(el).transform);
  await page.waitForTimeout(450);
  assert.notEqual(await wave.evaluate((el) => getComputedStyle(el).transform), before, "Wave moves");
  await page.emulateMedia({ reducedMotion: "reduce" });
  assert.equal(await wave.evaluate((el) => getComputedStyle(el).animationName), "none");
  await page.getByRole("button", { name: "Connect Wallet", exact: true }).click();
  await page.getByRole("dialog").waitFor();
  assert.match(await page.getByRole("dialog").innerText(), /Connect a Wallet|MetaMask/);
  await page.keyboard.press("Escape");
  await page.locator("header").getByRole("link", { name: "Rounds", exact: true }).click();
  await page.waitForURL("**/rounds", { waitUntil: "domcontentloaded" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator("header input:visible").fill("test");
  await page.locator("header input:visible").press("Enter");
  await page.waitForURL("**/search?q=test", { waitUntil: "domcontentloaded" });
  assert.deepEqual(writes, []);
  assert.deepEqual(errors, []);
  const report = { status: "passed", routes, viewports: [1440, 768, 390, 320], interactions: ["CSS wave moves", "reduced motion", "original RainbowKit modal", "original navigation", "original mobile GET search"], writes, note: "Local visual/UI check only. No wallet connection, public transactions or financial E2E." };
  await writeFile(new URL("report.json", output), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
} finally { await browser.close(); }
