import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { test, expect } from "@playwright/test";
import { installWallet } from "./wallet.mjs";

const fixture = JSON.parse(await readFile(process.env.BERT_E2E_FIXTURE, "utf8"));
assert.equal(fixture.rpc, "http://127.0.0.1:18545");
const require = createRequire(path.join(fixture.core, "package.json"));
const { Contract, JsonRpcProvider, formatUnits, id: hashText } = require("ethers");
const provider = new JsonRpcProvider(fixture.rpc, undefined, { cacheTimeout: -1 });
provider.pollingInterval = 100;
const abi = (name) => require(path.join(fixture.core, `artifacts/contracts/BERT/DAO/${name}.sol/${name}.json`)).abi;
const registry = new Contract(fixture.v2.registry, abi("IdeaRegistryUpgradeable"), provider);
const voting = new Contract(fixture.v2.voting, abi("VotingSystemUpgradeable"), provider);
const grant = new Contract(fixture.v2.grant, abi("GrantManagerUpgradeable"), provider);
const pool = new Contract(fixture.funding, abi("FundingPoolUpgradeable"), provider);
const token = new Contract(fixture.usdc, require(path.join(fixture.core, "artifacts/contracts/Mocks/MockUSDC.sol/MockUSDC.json")).abi, provider);
const USDC = 1_000_000n;
const DAY = 86_400;
const revenue = fixture.revenue;
const treasury = revenue ? new Contract(revenue.treasury, abi("ProtocolRevenueTreasury"), provider) : null;
const share = revenue ? BigInt(revenue.shareBps) : 0n;

test("V2 funding browser: legacy isolation, revenue, 20/40/40 and refunds", async ({ browser }, info) => {
  expect((await provider.getNetwork()).chainId).toBe(31337n);
  expect(await voting.backerMilestonesEnabled()).toBe(true);
  const contexts = [];
  let sharedPage;
  let activeWallet;
  const receipts = [];
  const seedReceipts = [];
  const errors = [];
  const roundEvidence = [];
  async function pageFor(index, url) {
    if (!sharedPage) {
      const context = await browser.newContext({ baseURL: fixture.baseURL, viewport: { width: 1440, height: 1000 } });
      context.setDefaultTimeout(20_000); contexts.push(context);
      await context.addInitScript(installWallet, { account: fixture.accounts[index], accounts: fixture.accounts, rpc: fixture.rpc });
      await context.route("**/*", (route) => new URL(route.request().url()).hostname === "127.0.0.1" ? route.continue() : route.abort());
      sharedPage = await context.newPage();
      sharedPage.on("pageerror", (error) => errors.push(error.message));
      sharedPage.on("dialog", (dialog) => dialog.accept());
    } else if (activeWallet !== index) {
      await sharedPage.evaluate((account) => window.__e2eSetAccount(account), fixture.accounts[index]);
    }
    activeWallet = index;
    const page = sharedPage;
    await page.goto(url);
    await expect(page.getByText("Connected", { exact: true })).toBeVisible();
    return page;
  }
  async function transaction(page, button) {
    const previous = await page.evaluate(() => window.__e2eTransactions.length);
    await expect(button).toBeEnabled(); await button.click();
    await expect.poll(() => page.evaluate(() => window.__e2eTransactions.length)).toBeGreaterThan(previous);
    const hash = await page.evaluate(() => window.__e2eTransactions.at(-1));
    const receipt = await provider.waitForTransaction(hash, 1, 25_000);
    expect(receipt.status, `Mined receipt ${hash}`).toBe(1);
    receipts.push({ hash, blockNumber: receipt.blockNumber, status: receipt.status });
    await expect(page.getByText(/Checking current onchain state|Submitted; waiting for an onchain receipt/)).toHaveCount(0);
  }
  async function advanceTo(timestamp) {
    await provider.send("evm_setNextBlockTimestamp", [Number(timestamp) + 1]);
    await provider.send("evm_mine", []);
  }
  // Only queue filler data is seeded directly. Targets, plans, voting, payouts and refunds use UI.
  async function seedFillers(count) {
    expect((await provider.getNetwork()).chainId).toBe(31337n);
    const signer = await provider.getSigner(fixture.accounts[0]);
    const send = async (promise) => {
      const receipt = await (await promise).wait(); expect(receipt.status).toBe(1);
      seedReceipts.push(receipt.hash);
    };
    await send(token.connect(signer).approve(fixture.funding, 50n * USDC * BigInt(count)));
    for (let index = 0; index < count; index++) {
      const nextId = await registry.totalIdeas() + 1n;
      await send(registry.connect(signer).createFundingProposal(`Fixture filler ${nextId}`, "Queue filler, not a browser-created target", "", 50n * USDC, 100_000n * USDC));
      await send(registry.connect(signer).commitFundingMilestonePlan(nextId, `ipfs://fixture-plan-${nextId}`, hashText(`fixture-plan-${nextId}`)));
    }
  }
  async function createIdea(index, title, minimum) {
    const page = await pageFor(index, "/ideas/new");
    await page.getByLabel("Title", { exact: true }).fill(title);
    await page.getByLabel("Description", { exact: true }).fill("Local V2.3 browser test: deliver an implementation with two reviewable evidence packages.");
    await page.getByPlaceholder("50", { exact: true }).fill("50");
    await page.getByPlaceholder("1000", { exact: true }).fill(String(minimum));
    await transaction(page, page.getByRole("button", { name: "Approve author bond", exact: true }));
    await transaction(page, page.getByRole("button", { name: "Submit funding proposal", exact: true }));
    const ideaId = await registry.totalIdeas();
    expect((await registry.getIdeaStruct(ideaId)).title).toBe(title);
    const details = await pageFor(index, `/ideas/${ideaId}`);
    await details.getByPlaceholder("Public milestone plan URL: IPFS, GitHub, Notion, etc.", { exact: true }).fill(`ipfs://browser-plan-${ideaId}`);
    await details.getByPlaceholder("0x... 32-byte content hash of the plan", { exact: true }).fill(hashText(`browser-plan-${ideaId}`));
    await transaction(details, details.getByRole("button", { name: "Commit milestone plan", exact: true }));
    expect(await registry.hasFundingMilestonePlan(ideaId)).toBe(true);
    await expect(details.getByText("Plan committed", { exact: true })).toBeVisible();
    return ideaId;
  }
  async function startRound() {
    const nextId = await voting.currentRoundId();
    const admin = await pageFor(0, "/rounds");
    await transaction(admin, admin.getByRole("button", { name: "Start funding round", exact: true }));
    expect(await voting.isBackerMilestoneRound(nextId)).toBe(true);
    return nextId;
  }
  async function pledge(index, roundId, ideaId) {
    const page = await pageFor(index, `/rounds/${roundId}`);
    const card = page.getByRole("heading", { name: `Idea #${ideaId}`, exact: true }).locator("../../..");
    await card.getByPlaceholder("How much USDC do you want to pledge?", { exact: true }).fill("10");
    await transaction(page, card.getByRole("button", { name: "Approve USDC", exact: true }));
    await transaction(page, card.getByRole("button", { name: "Pledge USDC", exact: true }));
    const recorded = await pool.getPledge(roundId, fixture.accounts[index]);
    expect(recorded.ideaId).toBe(ideaId); expect(recorded.amount).toBe(10n * USDC);
  }
  async function settle(roundId) {
    const round = await voting.getRoundInfo(roundId);
    await advanceTo(round.endTime);
    const page = await pageFor(0, `/rounds/${roundId}`);
    await transaction(page, page.getByRole("button", { name: "End Round", exact: true }));
    expect((await voting.getRoundInfo(roundId)).ended).toBe(true);
  }
  async function refund(index, roundId, amount) {
    const page = await pageFor(index, `/rounds/${roundId}`);
    const before = await token.balanceOf(fixture.accounts[index]);
    await transaction(page, page.getByRole("button", { name: "Claim pledge refund", exact: true }));
    expect(await token.balanceOf(fixture.accounts[index]) - before).toBe(amount);
    expect((await pool.getPledge(roundId, fixture.accounts[index])).refundClaimed).toBe(true);
  }
  const milestone = (page, stage) => page.getByRole("heading", { name: stage === 1 ? "In-process proof" : "Launch proof", exact: true }).locator("../../..");
  async function submitProof(ideaId, stage) {
    const page = await pageFor(3, `/ideas/${ideaId}`);
    const card = milestone(page, stage);
    await card.getByPlaceholder("Proof package URL: IPFS, GitHub, Notion, etc.", { exact: true }).fill(`ipfs://browser-proof-${ideaId}-${stage}`);
    await card.getByPlaceholder("Short release notes and exactly what backers should verify", { exact: true }).fill("Review the implementation and reproducible delivery evidence.");
    await card.getByPlaceholder("0x... 32-byte hash of the proof package", { exact: true }).fill(hashText(`proof-${ideaId}-${stage}`));
    await transaction(page, card.getByRole("button", { name: /^Open .* review$/ }));
    await expect(card.getByText("Status: Backer review open", { exact: true })).toBeVisible();
  }
  async function finalize(ideaId, stage) {
    const page = await pageFor(0, `/ideas/${ideaId}`);
    await transaction(page, milestone(page, stage).getByRole("button", { name: "Finalize after review window", exact: true }));
  }
  async function policy(enabled, cancellationProbe = false) {
    const page = await pageFor(0, "/pool");
    const destination = enabled ? revenue.treasury : `0x${"0".repeat(40)}`;
    await page.getByLabel("Revenue Treasury address", { exact: true }).fill(destination);
    await page.getByLabel("Revenue share basis points", { exact: true }).fill(enabled ? String(share) : "0");
    if (cancellationProbe) {
      const previous = await pool.revenuePolicyReadyAt();
      const sent = await page.evaluate(() => window.__e2eTransactions.length);
      await page.evaluate(() => { window.__e2eRejectNext = true; });
      await page.getByRole("button", { name: "Schedule settings", exact: true }).click();
      await expect(page.getByRole("status").filter({ hasText: /User rejected/ })).toBeVisible();
      expect(await pool.revenuePolicyReadyAt()).toBe(previous);
      expect(await page.evaluate(() => window.__e2eTransactions.length)).toBe(sent);
    }
    await transaction(page, page.getByRole("button", { name: "Schedule settings", exact: true }));
    const ready = await pool.revenuePolicyReadyAt();
    const scheduledReceipt = await provider.getTransactionReceipt(receipts.at(-1).hash);
    const scheduledBlock = await provider.getBlock(scheduledReceipt.blockNumber);
    expect(ready - BigInt(scheduledBlock.timestamp)).toBe(2n * BigInt(DAY));
    await expect(page.getByRole("button", { name: "Activate announced settings", exact: true })).toBeDisabled();
    if (cancellationProbe) {
      await transaction(page, page.getByRole("button", { name: "Cancel scheduled settings", exact: true }));
      expect(await pool.revenuePolicyReadyAt()).toBe(0n);
      await transaction(page, page.getByRole("button", { name: "Schedule settings", exact: true }));
    }
    await advanceTo(await pool.revenuePolicyReadyAt());
    const relayer = await pageFor(2, "/pool");
    await expect(relayer.getByRole("button", { name: "Schedule settings", exact: true })).toBeDisabled();
    await transaction(relayer, relayer.getByRole("button", { name: "Activate announced settings", exact: true }));
    expect(await pool.revenueShareBps()).toBe(enabled ? share : 0n);
  }
  async function collectAndPay(roundId, pauseProbe = false) {
    const pending = await pool.pendingRevenueByTreasury(revenue.treasury);
    expect(pending).toBeGreaterThan(0n);
    const payeeBefore = await token.balanceOf(revenue.payee);
    const callerBefore = await token.balanceOf(fixture.accounts[2]);
    const page = await pageFor(2, "/pool");
    await page.getByLabel("Revenue round ID", { exact: true }).fill(String(roundId));
    await page.getByRole("button", { name: "Inspect round snapshot", exact: true }).click();
    await expect(page.getByRole("heading", { name: `Round #${roundId} snapshot`, exact: true })).toBeVisible();
    const pendingDisplay = page.getByRole("heading", { name: "Earned revenue awaiting collection", exact: true }).locator("..").locator("strong");
    await expect(pendingDisplay).toHaveText(`${formatUnits(pending, 6).replace(/\.0$/, "")} USDC`);
    const collect = page.getByRole("button", { name: "Collect earned revenue to this Treasury", exact: true });
    if (pauseProbe) {
      const admin = await provider.getSigner(fixture.accounts[0]);
      for (const method of ["pause", "unpause"]) {
        const receipt = await (await pool.connect(admin)[method]()).wait();
        expect(receipt.status).toBe(1); seedReceipts.push(receipt.hash);
        await page.getByRole("button", { name: "Refresh accounting (read-only)", exact: true }).click();
        if (method === "pause") {
          await expect(collect).toBeDisabled();
          expect(await pool.pendingRevenueByTreasury(revenue.treasury)).toBe(pending);
        }
      }
    }
    await transaction(page, collect);
    await expect(pendingDisplay).toHaveText("0 USDC");
    expect(await pool.pendingRevenueByTreasury(revenue.treasury)).toBe(0n);
    expect(await token.balanceOf(revenue.treasury)).toBe(pending);
    await transaction(page, page.getByRole("button", { name: "Pay fixed beneficiary", exact: true }));
    expect(await token.balanceOf(revenue.payee) - payeeBefore).toBe(pending);
    expect(await token.balanceOf(fixture.accounts[2])).toBe(callerBefore);
    expect(await token.balanceOf(revenue.treasury)).toBe(0n);
    const accounting = await pool.getTreasuryAccounting();
    expect(accounting.actual).toBe(await token.balanceOf(fixture.funding));
    expect(accounting.accounted).toBe(accounting.reserve + accounting.revenue + accounting.otherFunds);
    expect(accounting.actual).toBe(accounting.accounted);
    expect(accounting.shortfall).toBe(0n);
  }
  try {
    for (const enabled of revenue ? [false, true] : [false]) {
    if (enabled) await policy(true, true);
    await test.step(`Browser-created winner and loser; revenue ${enabled ? "20%" : "disabled"}`, async () => {
      console.log("[E2E V2.3] Funding targets, plans and pledges");
      await seedFillers(3);
      const winner = await createIdea(3, "V2.3 delivered project", 20);
      const loser = await createIdea(4, "V2.3 losing project", 20);
      const roundId = await startRound();
      expect((await pool.fundingRoundRevenue(roundId)).shareBps).toBe(enabled ? share : 0n);
      for (const index of [5, 6, 7]) await pledge(index, roundId, winner);
      await pledge(2, roundId, loser);
      const reserveBeforeSettlement = await pool.protocolReserve();
      await settle(roundId);
      expect((await voting.getRoundInfo(roundId)).winningIdeaId).toBe(winner);
      // Four rejected ideas slash their distinct 50-USDC author bonds, not voter pledges.
      const reserveBefore = reserveBeforeSettlement + 4n * 50n * USDC;
      expect(await pool.protocolReserve()).toBe(reserveBefore);
      expect(await pool.pendingProtocolFeeByRound(roundId)).toBe(1_500_000n);
      await refund(2, roundId, 10n * USDC);
      const authorBefore = await token.balanceOf(fixture.accounts[3]);
      const net = await pool.poolByRoundAndIdea(roundId, winner);
      expect(net).toBe(28_500_000n);
      const author = await pageFor(3, `/ideas/${winner}`);
      await transaction(author, author.getByRole("button", { name: "Claim initial 20%", exact: true }));
      expect((await grant.getGrantPayout(roundId)).released).toBe(net * 20n / 100n);
      const initialRevenue = enabled ? 300_000n * share / 10000n : 0n;
      expect(await pool.protocolReserve() - reserveBefore).toBe(300_000n - initialRevenue);
      if (enabled) await collectAndPay(roundId, true);
      for (const stage of [1, 2]) {
        console.log(`[E2E V2.3] Milestone ${stage}: independent backers and exact progressive fee`);
        await submitProof(winner, stage);
        const outsider = await pageFor(2, `/ideas/${winner}`);
        await expect(milestone(outsider, stage).getByRole("button", { name: "Approve with my pledge", exact: true })).toHaveCount(0);
        for (const index of [5, 6, 7]) {
          const reviewer = await pageFor(index, `/ideas/${winner}`);
          await transaction(reviewer, milestone(reviewer, stage).getByRole("button", { name: "Approve with my pledge", exact: true }));
        }
        const request = await grant.getMilestoneRequest(roundId, stage);
        await advanceTo(request.submittedAt + BigInt(14 * DAY));
        await finalize(winner, stage);
        const percentage = stage === 1 ? 60n : 100n;
        expect((await grant.getGrantPayout(roundId)).released).toBe(net * percentage / 100n);
        expect(await token.balanceOf(fixture.accounts[3]) - authorBefore).toBe(50n * USDC + net * percentage / 100n);
        const earned = 1_500_000n * percentage / 100n;
        expect(await pool.protocolReserve() - reserveBefore).toBe(earned - (enabled ? earned * share / 10000n : 0n));
        if (enabled) {
          await collectAndPay(roundId);
          if (stage === 1) {
            await policy(false);
            expect((await pool.fundingRoundRevenue(roundId)).shareBps).toBe(share);
            expect((await pool.fundingRoundRevenue(1)).shareBps).toBe(0n);
          }
        }
      }
      expect((await grant.getGrantPayout(roundId)).completionPaid).toBe(true);
      roundEvidence.push({ roundId: String(roundId), scenario: enabled ? "full-revenue-after-policy-disable" : "full-legacy-zero-revenue" });
    });
    }
    if (revenue) await policy(true);
    await test.step("Silence never approves: grace expiry restores unvested gross escrow", async () => {
      console.log("[E2E V2.3] No-quorum cancellation and refunds including unvested fee");
      await seedFillers(4);
      const winner = await createIdea(3, "V2.3 no-quorum project", 20);
      const roundId = await startRound();
      for (const index of [5, 6, 7]) await pledge(index, roundId, winner);
      await settle(roundId);
      const reserveBefore = await pool.protocolReserve();
      const author = await pageFor(3, `/ideas/${winner}`);
      await transaction(author, author.getByRole("button", { name: "Claim initial 20%", exact: true }));
      await submitProof(winner, 1);
      const request = await grant.getMilestoneRequest(roundId, 1);
      await advanceTo(request.submittedAt + BigInt(14 * DAY));
      await finalize(winner, 1);
      const tally = await grant.getBackerMilestoneTally(roundId, 1);
      expect(tally.graceDeadline).toBeGreaterThan(0n);
      expect((await grant.getGrantPayout(roundId)).inProcessPaid).toBe(false);
      expect(await pool.grantRefundActive(roundId)).toBe(false);
      await advanceTo(tally.graceDeadline);
      await finalize(winner, 1);
      expect((await grant.getGrantPayout(roundId)).cancelled).toBe(true);
      expect(await pool.grantRefundTotalByRound(roundId)).toBe(24n * USDC);
      for (const index of [5, 6, 7]) await refund(index, roundId, 8n * USDC);
      expect(await pool.grantRefundPaidByRound(roundId)).toBe(24n * USDC);
      expect(await pool.protocolReserve() - reserveBefore).toBe(300_000n - 300_000n * share / 10000n);
      if (revenue) await collectAndPay(roundId);
      roundEvidence.push({ roundId: String(roundId), scenario: "no-quorum-80-percent-gross-refund" });
    });
    await test.step("No viable winner: every pledge is returned without a success fee", async () => {
      console.log("[E2E V2.3] No viable winner, full refunds");
      await seedFillers(4);
      const ideaId = await createIdea(3, "V2.3 underfunded project", 1000);
      const roundId = await startRound();
      for (const index of [5, 6, 7]) await pledge(index, roundId, ideaId);
      const reserveBefore = await pool.protocolReserve();
      await settle(roundId);
      expect((await voting.getRoundInfo(roundId)).winningIdeaId).toBe(0n);
      for (const index of [5, 6, 7]) await refund(index, roundId, 10n * USDC);
      expect(await pool.protocolReserve()).toBe(reserveBefore + 5n * 50n * USDC);
      expect(await pool.pendingProtocolFeeByRound(roundId)).toBe(0n);
      roundEvidence.push({ roundId: String(roundId), scenario: "no-winner-full-refund-no-fee" });
    });
    if (revenue) {
      expect(await treasury.totalReleased()).toBe(360_000n);
      expect(await pool.totalPendingProtocolRevenue()).toBe(0n);
      await policy(false);
      const names = new Set(["FundingRoundOpened", "RevenuePolicyScheduled", "RevenuePolicyCancelled", "RevenuePolicyActivated",
        "FundingRoundRevenueSnapshotted", "FundingRoundRevenueBaseSet", "ProtocolRevenueAccrued", "ProtocolRevenueClaimed", "RevenueCollected", "RevenueReleased"]);
      const logs = [];
      for (const log of await provider.getLogs({ address: [fixture.funding, revenue.treasury], fromBlock: 0, toBlock: "latest" })) {
        const contract = log.address.toLowerCase() === fixture.funding.toLowerCase() ? pool : treasury;
        const decoded = contract.interface.parseLog(log);
        if (!decoded || !names.has(decoded.name)) continue;
        const receipt = await provider.getTransactionReceipt(log.transactionHash);
        expect(receipt.status).toBe(1);
        expect(receipt.blockHash).toBe(log.blockHash);
        const block = await provider.getBlock(log.blockNumber);
        logs.push({ address: log.address, topics: [...log.topics], data: log.data, transactionHash: log.transactionHash,
          blockHash: log.blockHash, blockNumber: log.blockNumber, blockTimestamp: block.timestamp, logIndex: log.index });
      }
      await writeFile(path.join(path.dirname(process.env.BERT_E2E_FIXTURE), "revenue-browser-receipts.json"), JSON.stringify({
        chainId: 31337, publicTransactionsSent: false, wallet: "local EIP-1193 test provider; not MetaMask extension",
        asset: "MockUSDC; native Arc semantics tested separately", pool: fixture.funding, treasury: revenue.treasury,
        token: fixture.usdc, payee: revenue.payee, beneficiaries: [{ address: revenue.payee, shareBps: 10000 }],
        rounds: roundEvidence, uiReceipts: receipts, fixtureReceipts: seedReceipts, logs,
        expected: { pending: "0", accrued: "360000", claimed: "360000", collected: "360000", released: "360000", shareBps: "0" },
      }, null, 2));
    }
    expect(errors).toEqual([]);
  } finally {
    await info.attach("v2-ui-confirmed-receipts", { body: JSON.stringify(receipts, null, 2), contentType: "application/json" });
    await info.attach("v2-direct-fixture-receipts", { body: JSON.stringify(seedReceipts, null, 2), contentType: "application/json" });
    if (info.status !== info.expectedStatus && sharedPage) {
      await sharedPage.screenshot({ path: info.outputPath(`v2-wallet-${activeWallet}.png`), fullPage: true, timeout: 5_000 }).catch(() => {});
      await info.attach(`v2-wallet-${activeWallet}-text`, { body: await sharedPage.locator("body").innerText({ timeout: 5_000 }).catch(() => "page unavailable"), contentType: "text/plain" });
    }
    for (const context of contexts) await context.close();
    provider.destroy();
  }
});
