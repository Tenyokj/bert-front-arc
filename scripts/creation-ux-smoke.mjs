import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";

const base = process.env.PREVIEW_URL || "http://localhost:3000";
assert(["localhost", "127.0.0.1"].includes(new URL(base).hostname));
const output = new URL("../.e2e-results/creation/", import.meta.url);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const errors = [], writes = [], checks = [];
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1050 }, reducedMotion: "reduce" });
  context.setDefaultTimeout(30000);
  await context.route("**/*", (route) => {
    let body; try { body = route.request().postDataJSON(); } catch { /* Not JSON. */ }
    const calls = Array.isArray(body) ? body : [body];
    if (calls.some((call) => /^(eth_send|eth_sign|personal_sign|wallet_)/.test(call?.method || ""))) {
      writes.push("Blocked signing request"); return route.abort();
    }
    return route.continue();
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  const step = async (index) => { await page.locator(`[data-creation-step="${index}"][data-creation-ready="true"]`).waitFor(); };
  const noOverflow = async (label) => {
    const size = await page.evaluate(() => ({ width: innerWidth, content: document.documentElement.scrollWidth }));
    assert(size.content <= size.width + 1, `${label}: ${JSON.stringify(size)}`); checks.push(label);
  };

  await page.goto(`${base}/ideas/new`, { waitUntil: "domcontentloaded", timeout: 120000 });
  await step(0);
  assert(await page.getByRole("button", { name: "Continue to budget" }).isDisabled());
  await page.getByLabel("Title", { exact: true }).fill("Community SDK and example app");
  await page.getByLabel("Description", { exact: true }).fill("Build a documented TypeScript SDK, with reproducible tests and one working example application.");
  await page.getByLabel("Reference link", { exact: true }).fill("https://example.org/sdk");
  await page.getByRole("button", { name: "Continue to budget" }).click(); await step(1);
  await page.getByLabel("Author bond", { exact: true }).fill("50.0000009");
  await page.getByLabel("Minimum net funding target", { exact: true }).fill("2500");
  assert(await page.getByRole("button", { name: "Continue to review & sign" }).isDisabled());
  await page.getByText("Author bond must be positive, with at most 6 decimal places.", { exact: true }).waitFor();
  await page.getByLabel("Author bond", { exact: true }).fill("50000.123456");
  await page.getByRole("button", { name: "Continue to review & sign" }).click(); await step(2);
  await page.getByRole("heading", { name: "Check the exact proposal." }).waitFor();
  assert(await page.getByRole("button", { name: "Submit funding proposal" }).isDisabled());
  assert(await page.getByRole("checkbox").isDisabled());
  await noOverflow("idea review / desktop");
  await page.screenshot({ path: new URL("idea-review-desktop.png", output).pathname });
  for (const width of [768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 }); await noOverflow(`idea review / ${width}`);
  }
  await page.screenshot({ path: new URL("idea-review-mobile.png", output).pathname });
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.getByRole("button", { name: "Back to budget" }).click(); await step(1);
  assert.equal(await page.getByLabel("Author bond", { exact: true }).inputValue(), "50000.123456");
  await page.getByRole("button", { name: "Back to describe" }).click(); await step(0);
  assert.equal(await page.getByLabel("Title", { exact: true }).inputValue(), "Community SDK and example app");
  checks.push("idea: validation, full review, backwards navigation and retained draft; guest cannot sign");

  for (const width of [768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 }); await noOverflow(`idea describe / ${width}`);
  }
  await page.screenshot({ path: new URL("idea-mobile.png", output).pathname });
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.goto(`${base}/v3/create`, { waitUntil: "domcontentloaded", timeout: 120000 }); await step(0);
  await page.getByLabel("Community name", { exact: true }).fill("Open SDK Collective");
  await page.getByLabel("Metadata URI", { exact: true }).fill("https://example.org/community");
  await page.getByLabel("Administration execution wallet", { exact: true }).fill("0x1111111111111111111111111111111111111111");
  await page.getByRole("button", { name: "Continue to people" }).click(); await step(1);
  assert(await page.getByRole("button", { name: "Continue to rules" }).isDisabled());
  await page.getByLabel("Validators wallet address", { exact: true }).fill("0x2222222222222222222222222222222222222222");
  await page.getByRole("button", { name: "Add validators address", exact: true }).click();
  await page.getByLabel("Validator approvals", { exact: true }).fill("1");
  await page.getByRole("button", { name: "Continue to rules" }).click(); await step(2);
  await page.getByRole("button", { name: "Hackathon demo", exact: true }).click();
  await page.getByText("Advanced governance & timing / 11 settings", { exact: true }).click();
  assert.equal(await page.getByLabel("Milestone review", { exact: false }).inputValue(), "1");
  await page.getByLabel("Milestone review", { exact: false }).fill("15");
  assert(await page.getByRole("button", { name: "Continue to review & deploy" }).isDisabled());
  await page.getByLabel("Milestone review", { exact: false }).fill("1");
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 1000 }); await noOverflow(`Community advanced rules / ${width}`);
  }
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.getByRole("button", { name: "Continue to review & deploy" }).click(); await step(3);
  assert.equal(await page.locator('[data-creation-step="3"] dt').count(), 27);
  await page.getByText("0x2222222222222222222222222222222222222222", { exact: true }).waitFor();
  assert(await page.getByRole("checkbox").isDisabled());
  for (const button of await page.getByRole("button", { name: "Continue", exact: true }).all()) assert(await button.isDisabled());
  await noOverflow("Community review / desktop");
  await page.screenshot({ path: new URL("community-review-desktop.png", output).pathname });
  for (const width of [768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 }); await noOverflow(`Community review / ${width}`);
  }
  await page.screenshot({ path: new URL("community-review-mobile.png", output).pathname });
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.getByRole("button", { name: "Back to rules" }).click(); await step(2);
  assert.equal(await page.getByLabel("Milestone review", { exact: false }).inputValue(), "1");
  await page.getByRole("button", { name: "Back to people" }).click(); await step(1);
  await page.getByRole("button", { name: "Remove validators 0x2222222222222222222222222222222222222222", exact: true }).waitFor();
  checks.push("Community: four steps, explicit role addition, immutable timing validation, 27 review rows and retained draft; guest cannot deploy");
  for (const width of [768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 }); await noOverflow(`Community people / ${width}`);
  }
  await page.screenshot({ path: new URL("community-mobile.png", output).pathname });
  assert.deepEqual(errors, []); assert.deepEqual(writes, []);
  const report = { checkedAt: new Date().toISOString(), checks, errors, writes, scope: "Local guest creation-form UX only. Real configured read providers may load minimums. No wallet attached, credential issued or transaction signed; not a financial end-to-end test." };
  await writeFile(new URL("report.json", output), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
} finally { await browser.close(); }
