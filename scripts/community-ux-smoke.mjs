import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";
import { decodeFunctionData, encodeFunctionResult, parseAbi, toHex } from "viem";
import ts from "typescript";

const base = process.env.PREVIEW_URL || "http://localhost:3000";
assert(["localhost", "127.0.0.1"].includes(new URL(base).hostname));
const output = new URL("../.e2e-results/community-ux/", import.meta.url);
await mkdir(output, { recursive: true });
const exports = {};
new Function("exports", ts.transpileModule(await readFile(new URL("../src/lib/community-contracts.ts", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText)(exports);
const abis = Object.values(exports).filter(Array.isArray);
abis.unshift(parseAbi(["function aggregate3((address target, bool allowFailure, bytes callData)[] calls) payable returns ((bool success, bytes returnData)[] returnData)"]));
const address = (id) => `0x${id.toString(16).padStart(40, "0")}`;
const hub = address(101), treasury = address(102), recipient = address(103);
const key = "0xe16cd61a21fea97393e6eee3a7f7a26828021dd0-1";
const errors = [], writes = [], checks = [];
let failRounds = false;
function decode(data) { for (const abi of abis) try { return { ...decodeFunctionData({ abi, data }), abi }; } catch { /* Try another ABI. */ } }
function result(data) {
  const decoded = decode(data);
  if (!decoded) throw Error("Unsupported fixture call");
  const { functionName: name, args, abi } = decoded;
  const id = args?.[0] ?? 1n;
  if (name === "aggregate3") return encodeFunctionResult({ abi, functionName: name, result: args[0].map((call) => { try { return { success: true, returnData: result(call.callData) }; } catch { return { success: false, returnData: "0x" }; } }) });
  if (failRounds && name === "roundCount") throw Error("Intentionally unavailable round data");
  const values = {
    getCommunity: { creator: recipient, hub, treasury, createdAt: 100n }, communityCount: 1n,
    membershipModule: address(104), proposalModule: address(105), votingModule: address(106), milestoneManager: address(107), milestones: address(107),
    proposalCount: 9n, roundCount: 9n, communityStatus: 0, communityTime: 1_000_000n, validatorApprovalThreshold: 1n,
    getProposal: { creator: recipient, origin: 1, mode: 0, status: 4, title: `Fixture proposal ${id}`, description: "Synthetic UI evidence only. Not a public Community or financial test.", metadataURI: "", createdAt: 100n, validationDeadline: 200n, votingStartedAt: 300n, votingDeadline: 2_000_000n, bondAmount: 3_000_000n, yesVotes: 10_000_000n, noVotes: 10_000_000n, approvalCount: 1n, rejectionCount: 0n, assignedRoundId: 0n, roundVotes: 0n, accepted: false, settled: false },
    getProposalBond: [3_000_000n, false],
    getRound: { origin: 1, startTime: 100n, endTime: 200n, totalVotes: 10_000_000n, winningProposalId: 0n, winningVotes: 0n, settled: false }, getRoundProposalIds: [1n, 2n],
    getPlan: { proposalId: id, totalBudget: 10_000_000n, eligibleSupportWeight: 10_000_000n, releasedAmount: 0n, refundableAmount: 0n, proofDeadline: 2_000_000n, currentMilestone: 0, status: 7 },
    executionRecipient: recipient, totalSupportWeightByPlan: 10_000_000n, eligibleReviewerCountByPlan: 3n,
    pendingTrancheByPlan: 0, getExecutionTranche: { amount: 2_000_000n, readyAt: 100n, expiresAt: 2_000_000n, approvalThreshold: 1n, paid: false }, getExecutionTrancheApprovers: [],
    voteMinStakeUSDC: 1_000_000n, usdc: address(108),
  };
  if (!(name in values)) throw Error(`Unsupported fixture getter: ${name}`);
  return encodeFunctionResult({ abi, functionName: name, result: values[name] });
}
function rpc(call) {
  const fail = (message) => ({ jsonrpc: "2.0", id: call.id, error: { code: -32000, message } });
  if (/^(eth_send|personal_sign|eth_sign|wallet_)/.test(call.method)) { writes.push(call.method); return fail("Signing prohibited in this fixture"); }
  try {
    const value = call.method === "eth_chainId" ? toHex(5042002) : call.method === "eth_blockNumber" ? "0x100" : call.method === "eth_call" ? result(call.params[0].data) : undefined;
    return value === undefined ? fail("Unsupported RPC fixture") : { jsonrpc: "2.0", id: call.id, result: value };
  } catch (error) { return fail(error.message); }
}
const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1050 } });
  context.setDefaultTimeout(30000);
  await context.route("**/*", (route) => {
    let body; try { body = route.request().postDataJSON(); } catch { /* Not JSON. */ }
    const calls = Array.isArray(body) ? body : [body];
    if (calls.some((call) => /^(eth_|wallet_|personal_sign)/.test(call?.method || ""))) return route.fulfill({ contentType: "application/json", body: JSON.stringify(Array.isArray(body) ? calls.map(rpc) : rpc(body)) });
    if (body?.query || /\/api\/subgraph/.test(route.request().url())) return route.fulfill({ contentType: "application/json", body: JSON.stringify({ errors: [{ message: "Use isolated RPC fixtures" }] }) });
    return route.continue();
  });
  const page = await context.newPage(); page.on("pageerror", (error) => errors.push(error.message));
  const visit = async (path) => { const response = await page.goto(`${base}${path}`, { waitUntil: "domcontentloaded", timeout: 120000 }); assert.equal(response.status(), 200); };
  const sizes = async (name) => {
    for (const width of [1440, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 1050 }); await page.waitForTimeout(150);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${name}: overflow at ${width}`);
      if ([1440, 390].includes(width)) await page.screenshot({ path: new URL(`${name}-${width}.png`, output).pathname });
    }
    checks.push(name); console.log(`PASS ${name}: 1440/768/390/320`);
  };
  await visit("/demo/ideas"); await page.locator("[data-protocol-card=idea]").first().waitFor();
  const badgeColors = await page.locator("[data-protocol-card=idea] [data-status-tone]").evaluateAll((badges) => badges.map((badge) => ({ tone: badge.dataset.statusTone, color: getComputedStyle(badge).color })));
  assert(badgeColors.length > 0); assert(badgeColors.every((badge) => badge.tone !== "neutral"));
  await sizes("v2-badges");
  await visit(`/v3/communities/${key}`); await page.getByRole("heading", { name: "Community #1", exact: true }).waitFor();
  await page.getByRole("heading", { name: "Fixture proposal 9", exact: true }).waitFor();
  const content = page.locator("#community-content");
  await content.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("heading", { name: "Fixture proposal 1", exact: true }).waitFor();
  await sizes("community");
  await page.getByRole("button", { name: "Slate Rounds", exact: true }).click();
  await content.getByText("Awaiting settlement", { exact: true }).first().waitFor();
  await sizes("slate-list");
  await page.getByRole("button", { name: "Execution Plans", exact: true }).click();
  await content.getByText("Awaiting Admin tranche authorization", { exact: true }).first().waitFor();
  assert.equal(await content.locator("article").count(), 6);
  await content.getByRole("button", { name: "Next", exact: true }).click(); await page.waitForTimeout(300);
  assert.equal(await content.locator("article").count(), 3);
  await sizes("execution");
  await visit(`/v3/communities/${key}/proposals/1`); await page.getByRole("heading", { name: "Equal recorded voting weight", exact: true }).waitFor(); await sizes("proposal");
  await visit(`/v3/communities/${key}/rounds/1`); await page.getByText("Awaiting settlement", { exact: true }).first().waitFor(); await sizes("slate-detail");
  failRounds = true; await visit(`/v3/communities/${key}?section=slate`);
  await page.getByRole("button", { name: "Retry read-only", exact: true }).waitFor();
  assert.equal(await page.getByText(/No Slate Rounds match/).count(), 0);
  failRounds = false; await page.getByRole("button", { name: "Retry read-only", exact: true }).click();
  await page.getByText("Awaiting settlement", { exact: true }).first().waitFor(); checks.push("RPC failure and recovery");
  assert.deepEqual(errors, []); assert.deepEqual(writes, []);
  await writeFile(new URL("report.json", output), JSON.stringify({ checkedAt: new Date().toISOString(), base, checks, badgeColors, errors, writes, scope: "Local guest UI with synthetic intercepted read-only RPC. Not signed-wallet or public financial E2E." }, null, 2));
  console.log(JSON.stringify({ checks, errors, writes }));
} finally { await browser.close(); }
