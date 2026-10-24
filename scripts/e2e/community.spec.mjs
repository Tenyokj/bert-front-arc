import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { test, expect } from "@playwright/test";
import { installWallet } from "./wallet.mjs";

const fixture = JSON.parse(await readFile(process.env.BERT_E2E_FIXTURE, "utf8"));
assert.equal(fixture.rpc, "http://127.0.0.1:18545");
const require = createRequire(path.join(fixture.core, "package.json"));
const { Contract, JsonRpcProvider, ZeroAddress } = require("ethers");
const provider = new JsonRpcProvider(fixture.rpc, undefined, { cacheTimeout: -1 });
provider.pollingInterval = 100;
const artifact = (file, name) => require(path.join(fixture.core, "artifacts/contracts", file, `${name}.json`)).abi;
const factory = new Contract(fixture.factory, artifact("BERT/V3/community/CommunityFactory.sol", "CommunityFactory"), provider);
const hubAbi = artifact("BERT/V3/community/CommunityHub.sol", "CommunityHub");
const managerAbi = artifact("BERT/V3/modules/CommunityMilestoneManager.sol", "CommunityMilestoneManager");
const token = new Contract(fixture.usdc, artifact("Mocks/MockUSDC.sol", "MockUSDC"), provider);

test("local browser: Community setup, membership, four lanes, quorum payouts and refunds", async ({ browser }, info) => {
  expect((await provider.getNetwork()).chainId).toBe(31337n);
  const contexts = [];
  const pages = new Map();
  const errors = [];
  const receipts = [];
  let communityPath;
  let hub;
  let manager;
  async function pageFor(index, url = communityPath) {
    let page = pages.get(index);
    if (!page) {
      const context = await browser.newContext({ baseURL: fixture.baseURL, viewport: { width: 1440, height: 1000 } });
      context.setDefaultTimeout(20_000);
      contexts.push(context);
      await context.addInitScript(installWallet, { account: fixture.accounts[index], rpc: fixture.rpc });
      await context.route("**/*", (route) => {
        const url = new URL(route.request().url());
        return url.hostname === "127.0.0.1" || url.protocol === "data:" ? route.continue() : route.abort();
      });
      page = await context.newPage(); pages.set(index, page);
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(url || "/v3/create");
      // This injected wallet exposes an already-authorized local account, like a returning user.
      await expect(page.getByText("Connected", { exact: true })).toBeVisible();
    } else await page.goto(url);
    return page;
  }
  async function transaction(page, button) {
    const count = await page.evaluate(() => window.__e2eTransactions.length);
    await expect(button).toBeEnabled();
    const label = (await button.innerText()).trim();
    const reloadExpected = /^(2\. Join Community|Open binary voting|Settle binary proposal|Approve fixed tranche|Execute fixed transfer|Expire authorization|Submit proof|Approve proof|Finalize review|Claim failed-plan refund)/.test(label);
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
    }
    const { page, card } = await planCard(0, id);
    await transaction(page, card.getByRole("button", { name: "Execute fixed transfer", exact: true }));
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
    expect(errors).toEqual([]);
    await info.attach("confirmed-local-receipts", { body: JSON.stringify(receipts, null, 2), contentType: "application/json" });
  } finally {
    await info.attach("local-receipts-so-far", { body: JSON.stringify(receipts, null, 2), contentType: "application/json" });
    if (info.status !== info.expectedStatus) for (const [index, page] of pages) {
      await page.screenshot({ path: info.outputPath(`wallet-${index}.png`), fullPage: true }).catch(() => {});
      await info.attach(`wallet-${index}-text`, { body: await page.locator("body").innerText().catch(() => "page unavailable"), contentType: "text/plain" });
    }
    for (const context of contexts) await context.close();
    provider.destroy();
  }
});
