import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";
import { decodeFunctionData, encodeFunctionResult, toHex } from "viem";

const base = process.env.PREVIEW_URL || "http://localhost:3000";
assert(["localhost", "127.0.0.1"].includes(new URL(base).hostname));
const output = new URL("../.e2e-results/detail-ux/", import.meta.url);
await mkdir(output, { recursive: true });
const abis = {};
for (const name of ["VotingSystem", "IdeaRegistry", "GrantManager"]) abis[name] = JSON.parse(await readFile(new URL(`../src/abi/DAO/${name}Upgradeable.sol/${name}Upgradeable.json`, import.meta.url))).abi;
for (const name of ["FundingPool"]) abis[name] = JSON.parse(await readFile(new URL(`../src/abi/DAO/${name}Upgradeable.sol/${name}Upgradeable.json`, import.meta.url))).abi;
const author = "0x1111111111111111111111111111111111111111";
const voters = Array.from({ length: 25 }, (_, i) => `0x${(i + 2).toString(16).padStart(40, "0")}`);
const errors = [], writes = [], checks = [];
let mode = true, ended = false, grantAddress;
function decode(call) {
  for (const [contract, abi] of Object.entries(abis)) try { return { ...decodeFunctionData({ abi, data: call.params[0].data }), contract, abi }; } catch { /* Try the next ABI. */ }
  return null;
}
function rpc(call) {
  const reply = (result) => ({ jsonrpc: "2.0", id: call.id, result });
  const fail = () => ({ jsonrpc: "2.0", id: call.id, error: { code: -32000, message: "Intentionally unavailable in UI fixture" } });
  if (/^(eth_send|personal_sign|eth_sign|wallet_)/.test(call.method)) { writes.push(call.method); return fail(); }
  if (call.method === "eth_chainId") return reply(toHex(5042002));
  if (call.method === "eth_blockNumber") return reply("0x100");
  if (call.method === "eth_getBlockByNumber") return reply({ number: "0x100", timestamp: "0xc9", hash: `0x${"1".repeat(64)}`, parentHash: `0x${"0".repeat(64)}`, transactions: [], gasLimit: "0x1c9c380", gasUsed: "0x0", baseFeePerGas: "0x1" });
  if (call.method !== "eth_call") return fail();
  const decoded = decode(call); if (!decoded) return fail();
  let { functionName: name, abi } = decoded;
  if (["getGrantPayout", "canClaimGrant", "MILESTONE_REVIEW_WINDOW"].includes(name)) grantAddress = call.params[0].to.toLowerCase();
  if (name === "getRoundInfo") abi = call.params[0].to.toLowerCase() === grantAddress ? abis.GrantManager : abis.VotingSystem;
  const round = decoded.args?.[0] === 1n ? [1n, [1n], 100n, 200n, !ended, ended, 25000000n, ended ? 1n : 0n, 25000000n] : [0n, [], 0n, 0n, false, false, 0n, 0n, 0n];
  const values = {
    currentRoundId: 2n,
    getRoundInfo: abi === abis.GrantManager ? [1n, author, 3] : round,
    getIdea: [1n, author, "A builder's public proposal", "A scoped delivery with public evidence and milestone review.", "https://example.com/proof", 90n, 25000000n, 3],
    getIdeaStruct: { id: 1n, author, title: "A builder's public proposal", description: "A scoped delivery with public evidence and milestone review.", link: "https://example.com/proof", createdAt: 90n, totalVotes: 25000000n, isLowQuality: false, status: 3 },
    getIdeaReviews: Array.from({ length: 8 }, (_, i) => ({ reviewer: voters[i], comment: `Review ${i + 1}: useful scope and verifiable delivery evidence.` })),
    getReviewCount: 8n, getVotesForIdea: 25000000n, getVotersForIdea: voters,
    minimumNetFundingByIdea: 10000000n, minStake: 1000000n, maxVoteAmount: 10000000000n,
    isBackerMilestoneRound: mode, hasFundingMilestonePlan: true,
    fundingMilestonePlanURIByIdea: "https://example.com/plan", fundingMilestonePlanHashByIdea: `0x${"2".repeat(64)}`,
    canClaimGrant: [false, "Initial tranche already claimed"],
    getGrantPayout: [1n, author, 23750000n, 4750000n, true, false, false, 90n, 0n, false],
    getFundingRoundSettlement: [true, ended, ended ? 1n : 0n, 25000000n, 23750000n, 1250000n],
    grantRefundActive: false, winningGrossPledgeByRound: 25000000n,
    MILESTONE_REVIEW_WINDOW: 100n,
    getMilestoneRequest: decoded.args?.[1] === 2 ? [0n, "", "", 0n, 0n, 0, 0, 3, 2, false] : [1n, "https://example.com/proof", "Evidence to inspect", 50n, 0n, 0, 0, 5, 3, true],
    getBackerMilestoneTally: [0n, 0n, 0n, 0n], getBackerMilestoneProofHash: `0x${"3".repeat(64)}`,
  };
  if (values[name] === undefined) return fail();
  try { return reply(encodeFunctionResult({ abi, functionName: name, result: values[name] })); } catch { return fail(); }
}
const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1050 } });
  context.setDefaultTimeout(30000);
  await context.route("**/*", async (route) => {
    let body; try { body = route.request().postDataJSON(); } catch { /* Not JSON. */ }
    const calls = Array.isArray(body) ? body : [body];
    if (calls.some((call) => call?.method?.startsWith("eth_") || call?.method?.startsWith("wallet_"))) {
      // Learn the two addresses before decoding their shared getRoundInfo selector.
      for (const call of calls) if (call.method === "eth_call" && ["getGrantPayout", "canClaimGrant", "MILESTONE_REVIEW_WINDOW"].includes(decode(call)?.functionName)) grantAddress = call.params[0].to.toLowerCase();
      return route.fulfill({ contentType: "application/json", body: JSON.stringify(Array.isArray(body) ? calls.map(rpc) : rpc(body)) });
    }
    if (body?.query || route.request().url().includes("/api/subgraph")) return route.fulfill({ contentType: "application/json", body: JSON.stringify({ errors: [{ message: "Use the isolated RPC fixture" }] }) });
    return route.continue();
  });
  const page = await context.newPage(); page.on("pageerror", (error) => errors.push(error.message));
  for (const path of ["/rounds/1", "/ideas/1"]) {
    ended = path.startsWith("/ideas");
    const response = await page.goto(`${base}${path}`, { waitUntil: "domcontentloaded", timeout: 120000 });
    assert.equal(response.status(), 200);
    await page.locator("[data-lifecycle]").waitFor();
    await page.getByRole("button", { name: "Connect Wallet", exact: true }).first().waitFor();
    if (ended) {
      await page.getByText("Initial claim recorded by GrantManager.", { exact: true }).waitFor();
      assert(await page.getByRole("button", { name: "Finalize after review window", exact: true }).first().isDisabled());
      await page.getByRole("navigation", { name: "Proposal reviews pages" }).getByRole("button", { name: "Next proposal reviews" }).click();
      await page.getByText("Review 8: useful scope and verifiable delivery evidence.", { exact: true }).waitFor();
      assert.equal(await page.getByText("Review 1: useful scope and verifiable delivery evidence.", { exact: true }).count(), 0);
      const pager = page.getByRole("navigation", { name: "Idea voters pages" }); await pager.getByRole("button", { name: "Next idea voters" }).click();
      await page.waitForFunction(() => document.querySelector('nav[aria-label="Idea voters pages"]')?.textContent.includes("Page 2 of 3"));
      // A real-mode getter failure must not display legacy milestone controls.
      mode = undefined; await page.reload(); await page.getByText(/Milestone controls wait for a confirmed mode/).waitFor();
      assert.equal(await page.getByText("Validation mode: Protocol reviewers", { exact: true }).count(), 0);
      mode = true; await page.reload(); await page.locator("[data-lifecycle]").waitFor();
    } else {
      await page.getByText("Awaiting settlement", { exact: true }).first().waitFor();
      const pager = page.getByRole("navigation", { name: "Round voter pages" }); await pager.getByRole("button", { name: "Next voters", exact: true }).click();
      await page.waitForFunction(() => document.querySelector('nav[aria-label="Round voter pages"]')?.textContent.includes("Page 2 of 3"));
      assert(await page.getByRole("button", { name: "End Round", exact: true }).isDisabled());
      assert(await page.getByRole("button", { name: "Pledge USDC", exact: true }).isDisabled());
      await page.getByLabel("Pledge amount for idea #1 (USDC)").fill("3");
      assert(await page.getByRole("button", { name: "Approve USDC", exact: true }).isDisabled());
      await page.locator("#round-verification > summary").click();
      assert.equal(await page.locator("#round-verification").getAttribute("open"), "");
      await page.locator("#round-verification > summary").click();
    }
    for (const width of [1440, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 1050 }); await page.waitForTimeout(150);
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${path}: overflow ${width}`);
      if ([1440, 390].includes(width)) await page.screenshot({ path: new URL(`${ended ? "idea" : "round"}-${width}.png`, output).pathname });
    }
    checks.push(path); console.log(`PASS ${path}: lifecycle, guest controls, pagination, 1440/768/390/320`);
  }
  assert.deepEqual(errors, []); assert.deepEqual(writes, []);
  await writeFile(new URL("report.json", output), JSON.stringify({ checkedAt: new Date().toISOString(), checks, errors, writes, scope: "Local UI with intercepted, synthetic read-only RPC fixtures. No real wallet, signed transaction or public financial E2E." }, null, 2));
} finally { await browser.close(); }
