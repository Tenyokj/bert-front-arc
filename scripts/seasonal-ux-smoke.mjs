import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";

const base = process.env.PREVIEW_URL || "http://localhost:3000";
assert(["localhost", "127.0.0.1"].includes(new URL(base).hostname));
const output = new URL("../.e2e-results/seasonal/", import.meta.url);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const errors = [], writes = [], checks = [];
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1050 } });
  context.setDefaultTimeout(20000);
  await context.route("**/*", (route) => {
    let body; try { body = route.request().postDataJSON(); } catch { /* Not JSON. */ }
    const calls = Array.isArray(body) ? body : [body];
    if (calls.some((call) => /^(eth_send|eth_sign|personal_sign|wallet_)/.test(call?.method || ""))) writes.push(route.request().url());
    if (calls.some((call) => /^(eth_|wallet_)/.test(call?.method || ""))) return route.abort();
    return route.continue();
  });
  const page = await context.newPage(); page.on("pageerror", (error) => errors.push(error.message));
  // Keep timers and WebGL on the real clock during visual capture.
  for (const path of ["/", "/faq", "/privacy-notice", "/app", "/ideas/new", "/v3/create", "/demo/ideas"]) {
    const response = await page.goto(`${base}${path}`, { waitUntil: "domcontentloaded", timeout: 120000 });
    assert.equal(response.status(), 200);
    try { await page.locator("[data-winter-theme]").waitFor(); }
    catch (error) { console.log(JSON.stringify(await page.evaluate((path) => ({ path, now: new Date().toISOString(), toggle: document.querySelector('button[aria-label*="winter effects"]')?.outerHTML }), path))); throw error; }
    assert.equal(await page.locator("[data-winter-theme]").count(), 1);
    const toggle = page.getByRole("button", { name: "Disable winter effects", exact: true });
    await toggle.waitFor();
    for (const width of [1440, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 1050 });
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${path} overflow ${width}`);
      const edgeBounds = await page.locator("[data-winter-theme] > div").evaluateAll((nodes) => nodes.map((node) => { const bounds = node.getBoundingClientRect(); return { x: bounds.x, right: bounds.right, width: bounds.width, pointer: getComputedStyle(node).pointerEvents }; }));
      assert(edgeBounds.every((bounds) => bounds.pointer === "none" && bounds.width <= 100 && (bounds.right <= 110 || bounds.x >= width - 110)));
    }
    if (["/", "/app"].includes(path)) {
      await page.setViewportSize({ width: 1440, height: 1050 });
      await page.screenshot({ path: new URL(`${path === "/" ? "landing" : "dapp"}-1440.png`, output).pathname });
      await page.setViewportSize({ width: 390, height: 1050 });
      await page.screenshot({ path: new URL(`${path === "/" ? "landing" : "dapp"}-390.png`, output).pathname });
    }
    checks.push(path); console.log(`PASS winter ${path}`);
  }
  await page.getByRole("button", { name: "Disable winter effects", exact: true }).click();
  assert.equal(await page.locator("[data-winter-theme]").count(), 0);
  await page.reload(); await page.getByRole("button", { name: "Enable winter effects", exact: true }).waitFor();
  assert.equal(await page.locator("[data-winter-theme]").count(), 0);
  await page.getByRole("button", { name: "Enable winter effects", exact: true }).click(); await page.locator("[data-winter-theme]").waitFor();
  await page.emulateMedia({ reducedMotion: "reduce" });
  assert(await page.locator("[data-winter-theme] span").evaluateAll((flakes) => flakes.every((flake) => getComputedStyle(flake).animationName === "none" && getComputedStyle(flake).display === "none")));
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, value: true }); document.dispatchEvent(new Event("visibilitychange")); });
  assert(await page.locator("[data-winter-theme] span").evaluateAll((flakes) => flakes.every((flake) => getComputedStyle(flake).animationPlayState === "paused")));
  await page.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, value: false }); document.dispatchEvent(new Event("visibilitychange")); });
  await page.goto(`${base}/app`, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Connect Wallet", exact: true }).first().click();
  await page.getByRole("dialog").waitFor();
  await page.keyboard.press("Escape");
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await page.clock.setFixedTime(new Date("2027-01-11T00:01:00Z"));
  await page.evaluate(() => window.dispatchEvent(new Event("storage")));
  await page.locator("[data-winter-theme]").waitFor({ state: "detached" });
  assert.equal(await page.locator("[data-winter-theme]").count(), 0);
  assert.equal(await page.getByRole("button", { name: /winter effects/ }).count(), 0);
  checks.push("opt-out persists; reduced motion; hidden tab; wallet modal; expiry");
  assert.deepEqual(errors, []); assert.deepEqual(writes, []);
  await writeFile(new URL("report.json", output), JSON.stringify({ checkedAt: new Date().toISOString(), checks, errors, writes, scope: "Local guest visual checks with RPC blocked. No financial writes." }, null, 2));
  console.log(JSON.stringify({ checks, errors, writes }));
} finally { await browser.close(); }
