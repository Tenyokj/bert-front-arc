import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "@playwright/test";

const base = process.env.LANDING_PREVIEW_URL || "http://localhost:3100";
assert(["localhost", "127.0.0.1"].includes(new URL(base).hostname), "Local preview only");
const output = new URL("../.e2e-results/landing-preview/", import.meta.url);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const errors = [];
const blockedWrites = [];
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  await context.route("**/*", (route) => {
    let payload;
    try { payload = route.request().postDataJSON(); } catch { /* Not every request is JSON-RPC. */ }
    const calls = Array.isArray(payload) ? payload : [payload];
    if (calls.some((call) => /^(eth_send|personal_sign|eth_sign|wallet_)/.test(call?.method ?? ""))) {
      blockedWrites.push(route.request().url());
      return route.abort();
    }
    return route.continue();
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  const response = await page.goto(base, { waitUntil: "networkidle", timeout: 90000 });
  assert.equal(response.status(), 200);
  await page.getByRole("heading", { name: "Fund what matters. Build it together." }).waitFor();
  await page.locator("canvas").waitFor({ timeout: 15000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(3000);
  const surfaces = await page.evaluate(() => {
    const opening = document.querySelector("header").parentElement;
    const landing = opening.closest('[class*="landing_landing"], [class*="landing__landing"]') || document.querySelector('[class*="landing"][class*="variable"]');
    const selectors = ["header", "#introduction", "#updates", "#protocol", "#funding", "#world-id", "#console", "footer"];
    return {
      base: getComputedStyle(landing).getPropertyValue("--landing-surface").trim(),
      opening: getComputedStyle(opening).backgroundColor,
      sections: selectors.map((selector) => ({ selector, color: getComputedStyle(document.querySelector(selector)).backgroundColor, image: getComputedStyle(document.querySelector(selector)).backgroundImage })),
    };
  });
  assert.equal(surfaces.base, "#070a18");
  assert.equal(surfaces.opening, "rgba(0, 0, 0, 0)");
  for (const section of surfaces.sections) {
    assert.equal(section.color, "rgba(0, 0, 0, 0)", `${section.selector} shares the page background`);
    assert.equal(section.image, "none", `${section.selector} has no full-width transition gradient`);
  }
  console.log("Nav, hero, news and main share the dark page surface without section gradients");
  await page.screenshot({ path: new URL("desktop-hero.png", output).pathname });
  const canvas = await page.locator("canvas").evaluate((node) => ({ width: node.width, height: node.height }));
  assert(canvas.width > 200 && canvas.height > 200, "WebGL has a real viewport");
  const canvasBounds = await page.locator("canvas").boundingBox();
  const introBounds = await page.locator("#introduction").boundingBox();
  assert(canvasBounds.width >= 1400 && canvasBounds.height >= 850, "Taller immersive canvas gives the logos extra vertical space");
  assert(introBounds.y >= 990, "Introduction is below the animation, not beside it");
  const navBounds = await page.getByRole("navigation", { name: "Main navigation", exact: true }).boundingBox();
  assert(Math.abs(navBounds.x + navBounds.width / 2 - 720) < 2, "Desktop navigation is centered");
  assert.equal(await page.locator('section[aria-label="BERT and Arc particle animation"] button').count(), 0, "Hero has no motion button");
  assert.match(await page.locator("h1").evaluate((node) => getComputedStyle(node).fontFamily), /Outfit/i);
  assert.match(await page.locator("header a[aria-label='BERTDAO home']").evaluate((node) => getComputedStyle(node).fontFamily), /Outfit/i);
  await page.getByRole("button", { name: "Pause page animations" }).click();
  assert.equal(await page.locator("[data-landing-motion]").getAttribute("data-landing-motion"), "paused");
  await page.getByRole("button", { name: "Resume page animations" }).click();
  console.log("Logo renders, fonts changed, hero has no button; footer motion control works");
  await page.getByRole("tab", { name: "Community governance" }).click();
  await page.getByRole("heading", { name: "Build a place for collective decisions." }).waitFor();
  await page.getByRole("tab", { name: "Community governance" }).press("Home");
  assert.equal(await page.getByRole("tab", { name: "Global funding" }).getAttribute("aria-selected"), "true");
  console.log("Layer tabs and keyboard work");
  await page.getByRole("slider", { name: "Winning pledges" }).fill("10000");
  await page.getByRole("button", { name: "+40% Delivery approved" }).click();
  const payouts = await page.locator("#funding dl").innerText();
  for (const amount of ["9,500", "400", "100"]) assert(payouts.includes(amount));
  console.log("Funding slider and stages work");
  await page.getByRole("button", { name: "Scroll news right", exact: true }).click();
  await page.waitForFunction(() => document.querySelector(".news-track").scrollLeft > 500);
  await page.waitForTimeout(800);
  await page.getByRole("button", { name: "Scroll news left", exact: true }).click();
  await page.waitForFunction(() => document.querySelector(".news-track").scrollLeft < 5);
  const newsBounds = await page.locator("#updates").boundingBox();
  const refreshedIntro = await page.locator("#introduction").boundingBox();
  assert(Math.abs(newsBounds.y - refreshedIntro.y - refreshedIntro.height) < 2, "Production news immediately follows the hero");
  await page.locator("summary").filter({ hasText: "Is this real money?" }).click();
  await page.getByText("No. The current deployment is on Arc Testnet.", { exact: false }).waitFor({ state: "visible" });
  await page.locator("summary").filter({ hasText: "Is this real money?" }).click();
  await page.getByRole("slider", { name: "Winning pledges" }).fill("1000");
  await page.getByRole("button", { name: "20% Grant claimed" }).click();
  console.log("News and FAQ work");
  await page.getByRole("tab", { name: "Deliver", exact: true }).click();
  await page.getByRole("heading", { name: "Approved does not mean paid in full." }).waitFor();
  await page.getByRole("tab", { name: "Deliver", exact: true }).press("Home");
  await page.getByRole("heading", { name: "An idea people can evaluate." }).waitFor();
  await page.getByRole("combobox", { name: "Select a country" }).selectOption("JP");
  assert((await page.locator('[aria-label="Cities listed in Japan"]').innerText()).includes("Tokyo"));
  await page.getByRole("combobox", { name: "Select a country" }).selectOption("DE");
  await page.locator("#world-id").getByRole("heading", { name: "Germany", exact: true }).waitFor();
  assert((await page.locator("#world-id").innerText()).includes("Munich"));
  await page.getByRole("combobox", { name: "Select a country" }).selectOption("ES");
  await page.getByText("Coverage not established", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Zoom in map", exact: true }).click();
  await page.waitForFunction(() => document.querySelector('[aria-label="Reset map zoom"]').textContent === "125%");
  await page.getByRole("button", { name: "Reset map zoom" }).click();
  await page.getByRole("combobox", { name: "Select a country" }).selectOption("JP");
  await page.getByRole("button", { name: "Pause technology carousel" }).click();
  await page.getByRole("button", { name: "Play technology carousel" }).waitFor();
  const screen = page.locator('img[src*="console-snapshot"]');
  await screen.scrollIntoViewIfNeeded();
  await screen.evaluate((node) => node.decode());
  assert(await screen.evaluate((node) => node.naturalWidth) >= 1000, "Console screenshot is served at a readable desktop resolution");
  const footer = page.getByRole("contentinfo");
  assert(await footer.getByRole("link").count() >= 35);
  const crop = await footer.locator('[aria-hidden="true"]').last().evaluate((node) => ({ height: node.clientHeight, text: node.firstElementChild.getBoundingClientRect().height }));
  assert(crop.text > crop.height, "Footer wordmark is deliberately cropped");
  console.log("Journey, map, technology controls, real Console image and footer work");
  for (const section of await page.locator("section").all()) { await section.scrollIntoViewIfNeeded(); await page.waitForTimeout(160); }
  await page.waitForTimeout(750);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.screenshot({ path: new URL("desktop-overview.png", output).pathname });
  // Section captures avoid Chromium's tall-page GPU surface limit.
  for (const selector of ["#protocol", "#world-id", "#console", "footer"]) {
    await page.locator(selector).screenshot({ style: "aside { visibility: hidden !important; }", path: new URL(`desktop-${selector.replace(/[#]/g, "")}.png`, output).pathname });
  }
  assert.equal(await page.getByRole("heading", { name: "From a proposal to reviewed execution." }).evaluate((node) => getComputedStyle(node.parentElement.parentElement).opacity), "1", "Section introduction is not hidden pending a scroll trigger");
  await page.locator("#introduction").screenshot({ style: "aside { visibility: hidden !important; }", path: new URL("desktop-introduction.png", output).pathname });
  for (const width of [768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.waitForTimeout(300);
    const size = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }));
    assert(size.scroll <= size.width, `No horizontal overflow at ${width}: ${JSON.stringify(size)}`);
    if (width === 390) {
      await page.getByLabel("Open navigation", { exact: true }).click();
      await page.getByRole("navigation", { name: "Mobile navigation" }).getByText("The protocol", { exact: true }).click();
      await page.getByLabel("Open navigation", { exact: true }).waitFor();
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
      await page.screenshot({ path: new URL("mobile-hero.png", output).pathname });
      assert(await page.getByRole("banner").getByRole("link", { name: "Launch app", exact: true }).isVisible(), "Launch app remains visible on mobile");
      const sectionCapture = { style: "aside { visibility: hidden !important; }" };
      await page.locator("#introduction").screenshot({ ...sectionCapture, path: new URL("mobile-introduction.png", output).pathname });
      await page.locator("#protocol").screenshot({ ...sectionCapture, path: new URL("mobile-protocol.png", output).pathname });
      await page.locator("#funding").screenshot({ ...sectionCapture, path: new URL("mobile-funding.png", output).pathname });
      await page.locator("#world-id").screenshot({ ...sectionCapture, path: new URL("mobile-world-id.png", output).pathname });
      assert(await page.locator('#world-id svg[viewBox="0 0 1000 435"]').evaluate((node) => node.getBoundingClientRect().width <= node.parentElement.clientWidth + 1), "Whole world is visible before mobile zoom");
      await page.locator("#console").screenshot({ ...sectionCapture, path: new URL("mobile-console.png", output).pathname });
      await page.locator("footer").screenshot({ ...sectionCapture, path: new URL("mobile-footer.png", output).pathname });
    }
  }
  assert.deepEqual(errors, [], "No uncaught browser errors");
  assert.deepEqual(blockedWrites, [], "Landing never attempts a wallet write");
  const reduced = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 390, height: 900 } });
  const reducedPage = await reduced.newPage();
  await reducedPage.goto(base, { waitUntil: "networkidle" });
  await reducedPage.getByRole("button", { name: "Resume page animations" }).waitFor();
  console.log(JSON.stringify({ status: "passed", desktop: "1440x1000", responsiveWidths: [768, 390, 320], webglViewport: canvas, checks: ["WebGL", "pause", "tabs + keyboard", "funding example", "unchanged news", "FAQ", "proposal journey", "country selection + unknown coverage", "map zoom", "technology pause", "real Console screenshot", "cropped footer", "mobile menu", "reduced motion", "no horizontal overflow", "no uncaught errors", "no wallet writes"], screenshots: output.pathname }, null, 2));
} finally {
  await browser.close();
}
