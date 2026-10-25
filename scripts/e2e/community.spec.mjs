import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { test, expect } from "@playwright/test";
import { installWallet } from "./wallet.mjs";

const fixture = JSON.parse(await readFile(process.env.BERT_E2E_FIXTURE, "utf8"));
assert.equal(fixture.rpc, "http://127.0.0.1:18545");
const require = createRequire(path.join(fixture.core, "package.json"));
const { Contract, Interface, JsonRpcProvider, ZeroAddress } = require("ethers");
const provider = new JsonRpcProvider(fixture.rpc, undefined, { cacheTimeout: -1 });
provider.pollingInterval = 100;
const artifact = (file, name) => require(path.join(fixture.core, "artifacts/contracts", file, `${name}.json`)).abi;
const factory = new Contract(fixture.factory, artifact("BERT/V3/community/CommunityFactory.sol", "CommunityFactory"), provider);
const hubAbi = artifact("BERT/V3/community/CommunityHub.sol", "CommunityHub");
const managerAbi = artifact("BERT/V3/modules/CommunityMilestoneManager.sol", "CommunityMilestoneManager");
const actionEvents = new Interface(artifact("BERT/V3/libraries/CommunityAdminActions.sol", "CommunityAdminActions"));
const token = new Contract(fixture.usdc, artifact("Mocks/MockUSDC.sol", "MockUSDC"), provider);

test("local browser: four lanes, partial refunds, correction, admin quorum, pause, roles and exit", async ({ browser }, info) => {
  expect((await provider.getNetwork()).chainId).toBe(31337n);
  const contexts = [];
  const pages = new Map();
  const errors = [];
  const receipts = [];
  const rejectedCalls = [];
  let communityPath;
  let hub;
  let manager;
  let treasury;
  let sharedPage;
  let activeWallet;
  async function pageFor(index, url = communityPath) {
    if (!sharedPage) {
      const context = await browser.newContext({ baseURL: fixture.baseURL, viewport: { width: 1440, height: 1000 } });
      context.setDefaultTimeout(20_000);
      contexts.push(context);
      await context.addInitScript(installWallet, { account: fixture.accounts[index], accounts: fixture.accounts, rpc: fixture.rpc });
      await context.route("**/*", (route) => {
        const url = new URL(route.request().url());
        return url.hostname === "127.0.0.1" || url.protocol === "data:" ? route.continue() : route.abort();
      });
      sharedPage = await context.newPage();
      sharedPage.on("pageerror", (error) => errors.push(error.message));
    } else if (activeWallet !== index) {
      await sharedPage.evaluate((account) => window.__e2eSetAccount(account), fixture.accounts[index]);
    }
    activeWallet = index;
    pages.clear(); pages.set(index, sharedPage);
    await sharedPage.goto(url || "/v3/create");
    await expect(sharedPage.getByText("Connected", { exact: true })).toBeVisible();
    return sharedPage;
  }
  async function transaction(page, button, reload) {
    const count = await page.evaluate(() => window.__e2eTransactions.length);
    await expect(button).toBeEnabled();
    const label = (await button.innerText()).trim();
    const reloadExpected = reload ?? /^(2\. Join Community|Open binary voting|Settle binary proposal|Approve fixed tranche|Execute fixed transfer|Expire authorization|Submit proof|Approve proof|Reject proof|Open correction|Fail expired plan|Finalize review|Claim failed-plan refund|Request membership exit|Return \d)/.test(label);
    const navigation = reloadExpected ? page.waitForEvent("framenavigated", {
      predicate: (frame) => frame === page.mainFrame(), timeout: 20_000,
    }).then(() => true, () => false) : null;
    await button.click();
    await expect.poll(() => page.evaluate(() => window.__e2eTransactions.length)).toBeGreaterThan(count);
    const hash = await page.evaluate(() => window.__e2eTransactions.at(-1));
    const receipt = await provider.waitForTransaction(hash, 1, 25_000);
    expect(receipt.status, `Receipt ${hash}`).toBe(1);
    receipts.push({ hash, blockNumber: receipt.blockNumber, status: receipt.status });
    if (navigation) {
      expect(await navigation, `Expected UI refresh after ${label}`).toBe(true);
      await page.waitForLoadState("domcontentloaded");
      await expect(page.getByText("Connected", { exact: true })).toBeVisible();
    }
    // Receipt success, not a toast, is authoritative. Wait for React receipt observers too.
    await expect.poll(() => page.getByText(/Transaction failed|reverted with|transaction was mined but reverted/i).count()).toBe(0);
    return receipt;
  }
  async function section(index, label) {
    const page = await pageFor(index);
    await page.locator("aside").getByRole("button", { name: label, exact: true }).click();
    return page;
  }
  async function advance(seconds) {
    await provider.send("evm_increaseTime", [seconds]); await provider.send("evm_mine", []);
  }
  async function planCard(index, id) {
    const page = await section(index, "Execution Plans");
    const card = page.locator("article").filter({ hasText: `Plan #${id} ·` });
    await expect(card).toBeVisible();
    return { page, card };
  }
  async function pay(id) {
    for (const index of [0, 1]) {
      const { page, card } = await planCard(index, id);
      await transaction(page, card.getByRole("button", { name: "Approve fixed tranche", exact: true }));
      if (index === 0) {
        const single = await planCard(0, id);
        await expect(single.card.getByRole("button", { name: "Execute fixed transfer", exact: true })).toHaveCount(0);
        await rejected(0, "executeExecutionTranche", [id, [fixture.accounts[0]]], "tranche quorum not met");
      }
    }
    const { page, card } = await planCard(0, id);
    await transaction(page, card.getByRole("button", { name: "Execute fixed transfer", exact: true }));
  }
  async function rejected(index, method, args, reason, target = hub) {
    const before = await provider.getTransactionCount(fixture.accounts[index]);
    await assert.rejects(() => target.connect(signers.get(index))[method].staticCall(...args), reason ? new RegExp(reason) : { code: "CALL_EXCEPTION" });
    expect(await provider.getTransactionCount(fixture.accounts[index])).toBe(before);
    rejectedCalls.push({ index, method, reason: reason || "CALL_EXCEPTION", broadcast: false });
  }
  const signers = new Map();
  async function requestAction(label, button, page, reload = false) {
    const receipt = await transaction(page, button, reload);
    const event = receipt.logs.filter((log) => log.address.toLowerCase() === hub.target.toLowerCase())
      .map((log) => { try { return actionEvents.parseLog(log); } catch { return null; } })
      .find((log) => log?.name === "AdminActionRequested");
    expect(event, "Admin action emitted by the selected Hub").toBeTruthy();
    const id = event.args.requestId;
    const first = await section(0, "Admin Panel");
    const row = first.getByText(`#${id} · ${label}`, { exact: true }).locator("../..");
    await expect(row.getByRole("button", { name: "Execute", exact: true })).toHaveCount(0);
    await rejected(0, "executeAdminActionRequest", [id]);
    const second = await section(1, "Admin Panel");
    const approval = second.getByText(`#${id} · ${label}`, { exact: true }).locator("../..");
    await transaction(second, approval.getByRole("button", { name: "Approve", exact: true }), true);
    const executor = await section(0, "Admin Panel");
    await transaction(executor, executor.getByText(`#${id} · ${label}`, { exact: true }).locator("../..").getByRole("button", { name: "Execute", exact: true }), true);
    return executor;
  }
  async function binaryPlan(title) {
    const id = await create(0, "admin Binary", title);
    const admin = await pageFor(0, `${communityPath}/proposals/${id}`);
    await transaction(admin, admin.getByRole("button", { name: "Open binary voting", exact: true }));
    for (const index of [5, 6, 7]) {
      const page = await pageFor(index, `${communityPath}/proposals/${id}`);
      await page.getByPlaceholder("USDC stake", { exact: true }).fill("10");
      await transaction(page, page.getByRole("button", { name: "1. Approve stake", exact: true }));
      await transaction(page, page.getByRole("button", { name: "2. Vote YES", exact: true }));
    }
    await advance(301);
    const settled = await pageFor(0, `${communityPath}/proposals/${id}`);
    await transaction(settled, settled.getByRole("button", { name: "Settle binary proposal", exact: true }));
    expect((await manager.getPlan(id)).totalBudget).toBe(30_000_000n);
    expect(await treasury.availableExecutionBalance()).toBe(0n);
    const withdrawal = await section(0, "Admin Panel");
    await withdrawal.getByPlaceholder("Recipient address", { exact: true }).fill(fixture.accounts[0]);
    await withdrawal.getByPlaceholder("Amount in USDC", { exact: true }).fill("1");
    await withdrawal.getByPlaceholder("Reason", { exact: true }).fill("Must not consume reserved plan funds");
    await expect(withdrawal.getByRole("button", { name: "Create withdrawal request", exact: true })).toBeDisabled();
    await rejected(0, "createWithdrawalRequest", [fixture.accounts[0], 1_000_000n, "Reserved budget", ""], undefined, treasury);
    return id;
  }
  async function proof(id, digit) {
    const { page, card } = await planCard(0, id);
    await card.getByPlaceholder("0x... 32-byte evidence hash", { exact: true }).fill(`0x${digit.repeat(64)}`);
    await transaction(page, card.getByRole("button", { name: "Submit proof", exact: true }));
    const executor = await planCard(0, id);
    await expect(executor.card.getByRole("button", { name: "Approve proof", exact: true })).toHaveCount(0);
    await rejected(0, "castMilestoneReview", [id, true], "execution recipient cannot review");
    const outsider = await planCard(4, id);
    await expect(outsider.card.getByRole("button", { name: "Approve proof", exact: true })).toHaveCount(0);
    await rejected(4, "castMilestoneReview", [id, true], "not winning supporter");
  }
  async function review(id, approved) {
    for (const index of [5, 6, 7]) {
      const { page, card } = await planCard(index, id);
      await transaction(page, card.getByRole("button", { name: approved ? "Approve proof" : "Reject proof", exact: true }));
      await rejected(index, "castMilestoneReview", [id, approved], "already reviewed");
    }
    await advance(86_401);
    const finalizer = await planCard(0, id);
    await transaction(finalizer.page, finalizer.card.getByRole("button", { name: "Finalize review", exact: true }));
  }
  async function partialRefund(id, expected, released) {
    expect((await manager.getPlan(id)).releasedAmount).toBe(released);
    expect((await manager.getPlan(id)).refundableAmount).toBe(expected);
    expect(await treasury.availableExecutionBalance()).toBe(0n);
    for (const index of [5, 6, 7]) {
      const before = await token.balanceOf(fixture.accounts[index]);
      const { page, card } = await planCard(index, id);
      await transaction(page, card.getByRole("button", { name: "Claim failed-plan refund", exact: true }));
      expect(await token.balanceOf(fixture.accounts[index]) - before).toBe(expected / 3n);
      await rejected(index, "claimFailedPlanRefund", [id], "refund unavailable");
    }
    expect(await manager.refundPaidByPlan(id)).toBe(expected);
  }
  async function create(index, kind, title) {
    const page = await section(index, "Create Proposal");
    await page.getByRole("button", { name: kind, exact: true }).click();
    await page.getByPlaceholder("Proposal title", { exact: true }).fill(title);
    await page.getByPlaceholder("Full description", { exact: true }).fill("Local browser E2E: scoped delivery and acceptance criteria.");
    if (kind.startsWith("member")) {
      await transaction(page, page.getByRole("button", { name: "1. Approve proposal bond", exact: true }));
      await transaction(page, page.getByRole("button", { name: "2. Submit for validation", exact: true }));
    } else await transaction(page, page.getByRole("button", { name: "Submit proposal", exact: true }));
    const proposalModule = new Contract(await hub.proposalModule(), artifact("BERT/V3/modules/CommunityProposalModule.sol", "CommunityProposalModule"), provider);
    const id = await proposalModule.proposalCount();
    expect((await hub.getProposal(id)).title).toBe(title);
    if (kind.startsWith("member")) {
      const validator = await section(2, "Validator Queue");
      const item = validator.locator("article").filter({ has: validator.getByRole("heading", { name: title, exact: true }) });
      await transaction(validator, item.getByRole("button", { name: "Approve", exact: true }));
    }
    return id;
  }
  try {
    for (let index = 0; index < 8; index++) signers.set(index, await provider.getSigner(fixture.accounts[index]));
    await test.step("Reserve Treasury, deploy linked Hub/modules and activate through UI", async () => {
      console.log("[E2E] Creating Community via browser");
      const page = await pageFor(0, "/v3/create");
      await page.getByLabel("Community name", { exact: true }).fill("Browser E2E V3.2");
      await page.getByRole("button", { name: "Hackathon demo", exact: true }).click();
      await page.getByLabel("Validator approvals", { exact: true }).fill("1");
      await page.getByLabel("Admin quorum", { exact: true }).fill("2");
      for (const [label, account] of [["Additional admins", fixture.accounts[1]], ["Validators", fixture.accounts[2]]]) {
        const input = page.getByText(label, { exact: true }).locator("..").getByPlaceholder("0x...", { exact: true });
        await input.fill(account);
        await input.press("Enter");
      }
      for (const label of ["1. Reserve Treasury", "2. Deploy Hub", "3. Activate"]) {
        await transaction(page, page.getByText(label, { exact: true }).locator("..").getByRole("button", { name: "Continue", exact: true }));
      }
      const deployment = await factory.getCommunity(1n);
      expect(deployment.hub).not.toBe(ZeroAddress);
      expect(await factory.isActiveCommunityTreasury(deployment.treasury)).toBe(true);
      hub = new Contract(deployment.hub, hubAbi, provider);
      for (const name of ["membershipModule", "proposalModule", "votingModule", "milestoneManager"]) {
        expect(await provider.getCode(await hub[name]())).not.toBe("0x");
      }
      manager = new Contract(await hub.milestoneManager(), managerAbi, provider);
      treasury = new Contract(deployment.treasury, artifact("BERT/V3/community/CommunityTreasury.sol", "CommunityTreasury"), provider);
      communityPath = `/v3/communities/${fixture.factory.toLowerCase()}-1`;
    });
    await test.step("Approve and join as five verified Members; wallet cancellation sends nothing", async () => {
      console.log("[E2E] Joining five local wallets");
      for (const index of [3, 4, 5, 6, 7]) {
        const page = await pageFor(index);
        if (index === 3) {
          const before = await provider.getTransactionCount(fixture.accounts[index]);
          await page.evaluate(() => { window.__e2eRejectNext = true; });
          await page.getByRole("button", { name: "1. Approve entry stake", exact: true }).click();
          await expect(page.getByText(/cancelled|rejected/i).last()).toBeVisible();
          expect(await provider.getTransactionCount(fixture.accounts[index])).toBe(before);
        }
        await transaction(page, page.getByRole("button", { name: "1. Approve entry stake", exact: true }));
        await transaction(page, page.getByRole("button", { name: "2. Join Community", exact: true }));
        await expect.poll(async () => (await hub.getMember(fixture.accounts[index])).active).toBe(true);
      }
    });
    for (const lane of ["admin Binary", "member Binary", "admin Slate", "member Slate"]) {
      await test.step(`${lane}: create, validate if needed, vote and settle through UI`, async () => {
        console.log(`[E2E] ${lane}`);
        const author = lane.startsWith("admin") ? 0 : 3;
        const id = await create(author, lane, `${lane} winner`);
        let roundId;
        if (lane.endsWith("Slate")) {
          await create(author, lane, `${lane} alternative`);
          const admin = await section(0, "Admin Panel");
          const creator = admin.locator("section").filter({ has: admin.getByText("Create Slate Round", { exact: true }) }).last();
          await creator.getByRole("button", { name: lane.startsWith("admin") ? "Admin" : "Member", exact: true }).click();
          await creator.getByRole("button").filter({ hasText: `${lane} winner` }).click();
          await creator.getByRole("button").filter({ hasText: `${lane} alternative` }).click();
          await transaction(admin, creator.getByRole("button", { name: "Create Slate Round (2)", exact: true }));
          roundId = (await hub.getProposal(id)).assignedRoundId;
        } else {
          const admin = await pageFor(0, `${communityPath}/proposals/${id}`);
          await transaction(admin, admin.getByRole("button", { name: "Open binary voting", exact: true }));
        }
        for (const index of [5, 6, 7]) {
          const page = await pageFor(index, roundId ? `${communityPath}/rounds/${roundId}` : `${communityPath}/proposals/${id}`);
          if (roundId) await page.getByRole("combobox").selectOption(String(id));
          await page.getByPlaceholder("USDC stake", { exact: true }).fill("10");
          await transaction(page, page.getByRole("button", { name: "1. Approve stake", exact: true }));
          await transaction(page, page.getByRole("button", { name: roundId ? "2. Vote" : "2. Vote YES", exact: true }));
        }
        await advance(301);
        const admin = await pageFor(0, roundId ? `${communityPath}/rounds/${roundId}` : `${communityPath}/proposals/${id}`);
        await transaction(admin, admin.getByRole("button", { name: roundId ? "Settle after on-chain deadline" : "Settle binary proposal", exact: true }));
        const plan = await manager.getPlan(id);
        expect(plan.releasedAmount).toBe(0n);
        expect(plan.totalBudget).toBe(lane.startsWith("member") ? 25_500_000n : 30_000_000n);
        if (lane === "member Binary") {
          const before = await token.balanceOf(fixture.accounts[0]);
          await pay(id);
          for (const stage of [1, 2]) {
            const { page, card } = await planCard(0, id);
            await card.getByPlaceholder("0x... 32-byte evidence hash", { exact: true }).fill(`0x${String(stage).repeat(64)}`);
            await transaction(page, card.getByRole("button", { name: "Submit proof", exact: true }));
            const executor = await planCard(0, id);
            await expect(executor.card.getByRole("button", { name: "Approve proof", exact: true })).toHaveCount(0);
            for (const index of [5, 6, 7]) {
              const { page, card } = await planCard(index, id);
              await transaction(page, card.getByRole("button", { name: "Approve proof", exact: true }));
            }
            await advance(86_401);
            const review = await planCard(0, id);
            const paid = (await manager.getPlan(id)).releasedAmount;
            await transaction(review.page, review.card.getByRole("button", { name: "Finalize review", exact: true }));
            expect((await manager.getPlan(id)).releasedAmount).toBe(paid);
            await pay(id);
            expect((await manager.getPlan(id)).releasedAmount).toBe(plan.totalBudget * (stage === 1 ? 60n : 100n) / 100n);
          }
          expect((await manager.getPlan(id)).status).toBe(5n);
          expect(await token.balanceOf(fixture.accounts[0]) - before).toBe(plan.totalBudget);
        } else {
          // Unpaid first tranche expires: 100% execution budget returns to winning supporters.
          await advance(7 * 86_400 + 1);
          const expired = await planCard(0, id);
          await transaction(expired.page, expired.card.getByRole("button", { name: "Expire authorization and enable refunds", exact: true }));
          for (const index of [5, 6, 7]) {
            const before = await token.balanceOf(fixture.accounts[index]);
            const refund = await planCard(index, id);
            await transaction(refund.page, refund.card.getByRole("button", { name: "Claim failed-plan refund", exact: true }));
            expect(await token.balanceOf(fixture.accounts[index]) - before).toBe(plan.totalBudget / 3n);
          }
        }
      });
    }
    await test.step("20% paid: reject twice with one correction; exact 80% refund", async () => {
      console.log("[E2E] Correction, duplicate/self/outsider review guards and 80% refund");
      const id = await binaryPlan("Twice rejected delivery");
      await pay(id);
      await proof(id, "a");
      await review(id, false);
      expect((await manager.getPlan(id)).status).toBe(3n);
      const cooldown = await planCard(0, id);
      await expect(cooldown.card.getByRole("button", { name: "Open correction", exact: true })).toHaveCount(0);
      await rejected(0, "reopenAfterCorrection", [id], "cooldown active");
      await advance(48 * 3_600 + 1);
      const correction = await planCard(0, id);
      await transaction(correction.page, correction.card.getByRole("button", { name: "Open correction", exact: true }));
      const cleared = await manager.getReview(id, 1);
      expect(cleared.rejectingWeight).toBe(0n);
      expect(cleared.participatingAddresses).toBe(0n);
      await proof(id, "b");
      expect((await manager.getReview(id, 1)).proofAttempts).toBe(2n);
      await review(id, false);
      expect((await manager.getPlan(id)).status).toBe(6n);
      await partialRefund(id, 24_000_000n, 6_000_000n);
    });
    await test.step("60% paid: pause freezes correction clock; absent executor returns 40%", async () => {
      console.log("[E2E] Admin pause/resume quorum, frozen clock and 40% refund");
      const id = await binaryPlan("Partially delivered project");
      await pay(id);
      await proof(id, "c");
      await review(id, true);
      await pay(id);
      expect((await manager.getPlan(id)).releasedAmount).toBe(18_000_000n);
      await proof(id, "d");
      await review(id, false);
      expect((await manager.getPlan(id)).status).toBe(3n);
      const admin = await section(0, "Admin Panel");
      const paused = await requestAction("Pause Community", admin.getByRole("button", { name: "Request Community pause", exact: true }), admin);
      expect(await hub.communityStatus()).toBe(1n);
      await expect(paused.getByText("Paused", { exact: true }).first()).toBeVisible();
      const frozenTime = await hub.communityTime();
      const deadline = (await manager.getPlan(id)).proofDeadline;
      await advance(14 * 86_400);
      expect(await hub.communityTime()).toBe(frozenTime);
      expect((await manager.getPlan(id)).proofDeadline).toBe(deadline);
      const frozen = await planCard(0, id);
      await expect(frozen.card.getByText(/Community time is frozen while paused/)).toBeVisible();
      await rejected(0, "reopenAfterCorrection", [id]);
      const resume = await section(0, "Admin Panel");
      await requestAction("Resume Community", resume.getByRole("button", { name: "Request Community resume", exact: true }), resume);
      expect(await hub.communityStatus()).toBe(0n);
      expect(await hub.communityTime()).toBeLessThan(deadline);
      const member = await pageFor(5);
      await transaction(member, member.getByRole("button", { name: "Request membership exit", exact: true }));
      await advance(301);
      const blocked = await pageFor(5);
      await expect(blocked.getByRole("button", { name: "Return 10 USDC", exact: true })).toBeDisabled();
      await rejected(5, "finalizeMembershipExit", []);
      await advance(Number(deadline - await hub.communityTime()) + 1);
      const expired = await planCard(4, id);
      await transaction(expired.page, expired.card.getByRole("button", { name: "Fail expired plan", exact: true }));
      await partialRefund(id, 12_000_000n, 18_000_000n);
    });
    await test.step("Validator activity earns its separate epoch reward exactly once", async () => {
      console.log("[E2E] Validator epoch finalization and reward claim");
      const proposals = new Contract(await hub.proposalModule(), artifact("BERT/V3/modules/CommunityProposalModule.sol", "CommunityProposalModule"), provider);
      const current = await proposals.currentValidatorRewardEpochId();
      let epochId;
      for (let id = 1n; id <= current; id++) {
        const epoch = await hub.getValidatorRewardEpoch(id);
        if (epoch.availableValidationCases > 0n && await treasury.rewardAmountByEpoch(id) > 0n) { epochId = id; break; }
      }
      expect(epochId, "A funded epoch with real validator activity exists").toBeDefined();
      const epoch = await hub.getValidatorRewardEpoch(epochId);
      const deadline = epoch.endTime + await proposals.validationWindow();
      if (await hub.communityTime() <= deadline) await advance(Number(deadline - await hub.communityTime()) + 1);
      async function epochPage() {
        const page = await section(2, "Validator Queue");
        await page.getByRole("combobox").selectOption(String(epochId));
        await expect(page.getByRole("heading", { name: `Epoch #${epochId}`, exact: true })).toBeVisible();
        return page;
      }
      const finalizer = await epochPage();
      await transaction(finalizer, finalizer.getByRole("button", { name: "Finalize reward epoch", exact: true }), true);
      expect(await hub.isValidatorActiveForEpoch(epochId, fixture.accounts[2])).toBe(true);
      const amount = await treasury.rewardPerValidatorByEpoch(epochId);
      expect(amount).toBeGreaterThan(0n);
      const before = await token.balanceOf(fixture.accounts[2]);
      const executionBefore = await treasury.executionBalance();
      const claimant = await epochPage();
      await transaction(claimant, claimant.getByRole("button", { name: /^Claim [\d.]+ USDC$/ }), true);
      expect(await token.balanceOf(fixture.accounts[2]) - before).toBe(amount);
      expect(await treasury.executionBalance()).toBe(executionBefore);
      expect(await treasury.validatorRewardClaimed(epochId, fixture.accounts[2])).toBe(true);
      await rejected(2, "claimValidatorReward", [epochId], undefined, treasury);
    });
    await test.step("Unencumbered member exits, role handover uses quorum, clean archive", async () => {
      console.log("[E2E] Membership stake return, Admin add/remove and archival");
      const member = await pageFor(4);
      const before = await token.balanceOf(fixture.accounts[4]);
      await transaction(member, member.getByRole("button", { name: "Request membership exit", exact: true }));
      await advance(301);
      const ready = await pageFor(4);
      await transaction(ready, ready.getByRole("button", { name: "Return 10 USDC", exact: true }));
      expect((await hub.getMember(fixture.accounts[4])).active).toBe(false);
      expect(await token.balanceOf(fixture.accounts[4]) - before).toBe(10_000_000n);
      const admin = await section(0, "Admin Panel");
      await admin.getByPlaceholder("0x admin address", { exact: true }).fill(fixture.accounts[4]);
      await requestAction("Add Admin", admin.getByRole("button", { name: "Request Admin addition", exact: true }), admin, true);
      expect(await hub.isAdminAccount(fixture.accounts[4])).toBe(true);
      const remove = await section(0, "Admin Panel");
      const role = remove.locator("code").filter({ hasText: new RegExp(fixture.accounts[4], "i") }).locator("..");
      await requestAction("Remove Admin", role.getByRole("button", { name: "Request removal", exact: true }), remove, true);
      expect(await hub.isAdminAccount(fixture.accounts[4])).toBe(false);
      const clean = await section(0, "Admin Panel");
      await requestAction("Archive Community", clean.getByRole("button", { name: "Request Community archive", exact: true }), clean, true);
      expect(await hub.communityStatus()).toBe(2n);
      await rejected(0, "createAdminProposal", ["After archive", "Must be rejected", ""]);
    });
    expect(errors).toEqual([]);
    await info.attach("confirmed-local-receipts", { body: JSON.stringify(receipts, null, 2), contentType: "application/json" });
  } finally {
    await info.attach("read-only-rejected-calls", { body: JSON.stringify(rejectedCalls, null, 2), contentType: "application/json" });
    await info.attach("local-receipts-so-far", { body: JSON.stringify(receipts, null, 2), contentType: "application/json" });
    if (info.status !== info.expectedStatus) for (const [index, page] of pages) {
      await page.screenshot({ path: info.outputPath(`wallet-${index}.png`), fullPage: true }).catch(() => {});
      await info.attach(`wallet-${index}-text`, { body: await page.locator("body").innerText().catch(() => "page unavailable"), contentType: "text/plain" });
    }
    for (const context of contexts) await context.close();
    provider.destroy();
  }
});
