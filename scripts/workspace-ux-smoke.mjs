import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";

const base = process.env.PREVIEW_URL || "http://localhost:3000";
assert(["localhost", "127.0.0.1"].includes(new URL(base).hostname));
const output = new URL("../.e2e-results/workspace-ux/", import.meta.url);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const errors = [], writes = [], checks = [];
let animationState;
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1050 } });
  context.setDefaultTimeout(25000);
  await context.route("**/*", (route) => {
    let body; try { body = route.request().postDataJSON(); } catch { /* Not JSON. */ }
    const requests = Array.isArray(body) ? body : [body];
    if (requests.some((request) => /^(eth_send|personal_sign|eth_sign|wallet_)/.test(request?.method || ""))) writes.push(route.request().url());
    if (requests.some((request) => request?.method?.startsWith("eth_") || request?.method?.startsWith("wallet_"))) return route.abort();
    return route.continue();
  });
  for (const route of ["/app", "/profile", "/pool"]) {
    const page = await context.newPage();
    page.on("pageerror", (error) => errors.push(`${route}: ${error.message}`));
    const response = await page.goto(`${base}${route}`, { waitUntil: "domcontentloaded", timeout: 120000 });
    assert.equal(response.status(), 200); await page.getByRole("heading", { level: 1 }).waitFor();
    await page.getByRole("button", { name: "Connect Wallet", exact: true }).first().waitFor();
    await page.evaluate(() => document.fonts.ready);
    if (route === "/app") {
      const paths = [["Propose an idea", "/ideas/new"], ["Support builders", "/rounds"], ["Run a Community", "/v3"], ["Just exploring", "/demo"]];
      for (const [name, target] of paths) {
        await page.getByRole("tab", { name, exact: true }).click();
        await page.waitForFunction((name) => [...document.querySelectorAll('[role="tab"]')].some((tab) => tab.textContent === name && tab.getAttribute("aria-selected") === "true"), name);
        assert.equal(await page.getByRole("tabpanel").locator("a").first().getAttribute("href"), target);
      }
      await page.getByRole("tab", { name: "Just exploring", exact: true }).press("Home");
      assert.equal(await page.getByRole("tab", { name: "Propose an idea", exact: true }).getAttribute("aria-selected"), "true");
      const access = page.locator("#dashboard-access"); await access.locator("summary").click(); assert.equal(await access.getAttribute("open"), ""); await access.locator("summary").click();
    }
    if (route === "/profile") {
      await page.getByRole("heading", { name: "Your workspace starts with your wallet." }).waitFor();
      assert.equal(await page.getByRole("link", { name: /demo profile/ }).getAttribute("href"), "/demo/profile");
      assert.equal(await page.getByRole("button", { name: "Check recent V2 rounds", exact: true }).count(), 0);
      const details = page.getByText("How grant payouts differ across versions", { exact: true }); await details.click();
      assert(await page.getByText(/Legacy V2.2 grants follow reviewer-gated/).isVisible());
    }
    if (route === "/pool") {
      const canvas = page.locator("[data-attractor-state]");
      await canvas.waitFor();
      await page.waitForFunction(() => ["running", "fallback"].includes(document.querySelector("[data-attractor-state]")?.getAttribute("data-attractor-state")));
      animationState = await canvas.getAttribute("data-attractor-state");
      if (animationState === "running") {
        const frame = await canvas.getAttribute("data-frame"); await page.waitForTimeout(700); assert.notEqual(await canvas.getAttribute("data-frame"), frame);
        await page.getByRole("button", { name: "Pause visual", exact: true }).click();
        await page.waitForFunction(() => document.querySelector("[data-attractor-state]")?.getAttribute("data-attractor-state") === "paused");
        const paused = await canvas.getAttribute("data-frame"); await page.waitForTimeout(300); assert.equal(await canvas.getAttribute("data-frame"), paused);
        await page.getByRole("button", { name: "Resume visual", exact: true }).click();
        await page.emulateMedia({ reducedMotion: "reduce" }); await page.waitForFunction(() => document.querySelector("[data-attractor-state]")?.getAttribute("data-attractor-state") === "paused");
        await page.emulateMedia({ reducedMotion: "no-preference" });
        await page.setViewportSize({ width: 1440, height: 400 });
        await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
        await page.waitForFunction(() => document.querySelector("[data-attractor-state]").getBoundingClientRect().bottom < -50);
        await page.waitForTimeout(400);
        const offscreen = await canvas.getAttribute("data-frame"); await page.waitForTimeout(400);
        assert.equal(await canvas.getAttribute("data-frame"), offscreen, "Offscreen renderer is idle");
        await page.setViewportSize({ width: 1440, height: 1050 });
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
      }
      assert(await page.getByLabel("Contribution amount (USDC)", { exact: true }).isVisible());
      for (const button of await page.getByRole("button", { name: /^(Approve USDC|Contribute to treasury)$/ }).all()) assert(await button.isDisabled());
    }
    for (const width of [1440, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 1050 }); await page.waitForTimeout(200);
      await page.evaluate(() => window.scrollTo(0, 0));
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${route}: overflow ${width}`);
      if ([1440, 390].includes(width)) await page.screenshot({ path: new URL(`${route.slice(1)}-${width}.png`, output).pathname });
    }
    checks.push(route); console.log(`PASS ${route}: navigation/guest/motion, 1440/768/390/320`); await page.close();
  }
  assert.deepEqual(errors, []); assert.deepEqual(writes, []);
  await writeFile(new URL("report.json", output), JSON.stringify({ checkedAt: new Date().toISOString(), base, checks, animationState, errors, writes, scope: "Disconnected-wallet local UI. RPC blocked. Not signed financial E2E." }, null, 2));
} finally { await browser.close(); }
