import { defineConfig } from "@playwright/test";

if (!process.env.BERT_E2E_FIXTURE) throw new Error("Use npm run test:e2e to start an isolated local fixture.");
const suite = process.env.BERT_E2E_SUITE || "v3";
export default defineConfig({
  testDir: ".", testMatch: suite === "all" ? ["community.spec.mjs", "funding.spec.mjs"] : suite === "v2" ? "funding.spec.mjs" : "community.spec.mjs", workers: 1, retries: 0,
  timeout: 600_000, expect: { timeout: 25_000 },
  outputDir: "../../.e2e-results/browser",
  reporter: [["list"], ["html", { outputFolder: "../../.e2e-results/report", open: "never" }]],
  use: { baseURL: "http://127.0.0.1:13000", actionTimeout: 20_000, navigationTimeout: 30_000, viewport: { width: 1440, height: 1000 }, trace: "retain-on-failure", screenshot: "only-on-failure", launchOptions: { channel: "chrome" } },
});
