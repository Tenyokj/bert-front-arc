import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1, reducedMotion: "reduce" });
  await page.route("**/*", (route) => {
    let payload;
    try { payload = route.request().postDataJSON(); } catch { /* Asset request. */ }
    if ((Array.isArray(payload) ? payload : [payload]).some((call) => /^(eth_send|personal_sign|eth_sign|wallet_)/.test(call?.method ?? ""))) return route.abort();
    return route.continue();
  });
  const response = await page.goto("https://bertdao-console.vercel.app/", { waitUntil: "domcontentloaded", timeout: 45000 });
  if (response.status() !== 200) throw new Error(`Console HTTP ${response.status()}`);
  await page.getByRole("heading", { name: "Every move. In the open." }).waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(10000);
  const directory = new URL("../public/landing/", import.meta.url);
  await mkdir(directory, { recursive: true });
  await page.screenshot({ path: new URL("console-snapshot.png", directory).pathname });
  console.log("Captured real public Console, 1440x1000, 2026-11-25. This is a screenshot, not a live embed.");
} finally { await browser.close(); }
