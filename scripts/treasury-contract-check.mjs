import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { createPublicClient, custom } from "viem";

const root = fileURLToPath(new URL("../", import.meta.url));
const core = path.resolve(root, process.env.BERT_CORE_PATH ?? "../../bert-core");
const require = createRequire(import.meta.url);
const coreRequire = createRequire(path.join(core, "package.json"));
const api = {};
new Function("exports", "require", ts.transpileModule(fs.readFileSync(path.join(root, "src/lib/treasury-revenue.ts"), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText)(api, require);
process.env.DEPLOYER_KEY = "";
process.chdir(core);
const { default: hre } = await import(coreRequire.resolve("hardhat"));
const connection = await hre.network.create({ network: "hardhat", override: { chainId: 31337 } });
try {
  const { ethers, networkHelpers } = connection;
  const [admin, backer, payee] = await ethers.getSigners();
  const proxyArtifact = coreRequire("@openzeppelin/contracts/build/contracts/TransparentUpgradeableProxy.json");
  async function proxy(name, args, frozen) {
    const factory = frozen ? new ethers.ContractFactory(frozen.abi, frozen.bytecode, admin) : await ethers.getContractFactory(name);
    const implementation = await factory.deploy(); await implementation.waitForDeployment();
    const deployed = await new ethers.ContractFactory(proxyArtifact.abi, proxyArtifact.bytecode, admin).deploy(
      await implementation.getAddress(), admin.address, factory.interface.encodeFunctionData("initialize", args));
    await deployed.waitForDeployment();
    return new ethers.Contract(await deployed.getAddress(), factory.interface, admin);
  }
  const roles = await proxy("RolesRegistryUpgradeable", []);
  const token = await ethers.deployContract("MockUSDC");
  const args = [await token.getAddress(), admin.address, await roles.getAddress()];
  const pool = await proxy("FundingPoolUpgradeable", args);
  const legacy = await proxy("FundingPoolUpgradeable", args, JSON.parse(fs.readFileSync("test/fixtures/FundingPoolV140.json")));
  const client = createPublicClient({ transport: custom({ request: (request) => connection.provider.request(request) }) });
  assert.equal(await client.getChainId(), 31337);
  const read = (round) => api.readTreasurySnapshot(client, pool.target, 31337, round);
  assert.equal((await api.readTreasurySnapshot(client, legacy.target, 31337)).mode, "legacy");
  assert.equal((await read()).mode, "v2.4");
  await (await pool.unpause()).wait();
  for (const role of ["VOTING_ROLE", "DISTRIBUTOR_ROLE"]) await (await roles.grantSystemRole(await roles[role](), admin.address)).wait();
  const treasury = await ethers.deployContract("ProtocolRevenueTreasury", [pool.target, token.target, [payee.address], [10000]]);
  await (await pool.scheduleRevenuePolicy(treasury.target, 4000)).wait();
  assert.equal(api.policyReady(await read()), false);
  await networkHelpers.time.increaseTo(await pool.revenuePolicyReadyAt());
  assert.equal(api.policyReady(await read()), true);
  await (await pool.executeRevenuePolicy()).wait();
  await (await token.mint(backer.address, 1_000_000n)).wait();
  await (await token.connect(backer).approve(pool.target, 1_000_000n)).wait();
  await (await pool.openFundingRound(1)).wait();
  await (await pool.recordPledgeFrom(backer.address, 1, 1, 1_000_000n)).wait();
  await (await pool.settleFundingRound(1, 1)).wait();
  await (await pool.beginProgressiveFundingRoundFee(1)).wait();
  await (await pool.releaseProgressiveFundingRoundFee(1, 2000)).wait();
  const accrued = await read(1n);
  assert.equal(accrued.revenue, "4000"); assert.equal(accrued.reserve, "6000");
  assert.equal(accrued.round.shareBps, "4000");
  const simulated = await client.simulateContract({ address: treasury.target, abi: api.revenueTreasuryAbi,
    functionName: "collect", args: [4000n], account: backer.address });
  assert.equal(simulated.request.functionName, "collect");
  await (await treasury.connect(backer).collect(4000)).wait();
  const collected = await read(1n);
  assert.equal(collected.revenue, "0"); assert.equal(collected.receivers[0].balance, "4000");
  assert.equal(collected.receivers[0].payees[0].releasable, "4000");
  await (await treasury.connect(backer).release(payee.address)).wait();
  const paid = await read(1n);
  assert.equal(paid.receivers[0].payees[0].released, "4000");
  assert.equal(paid.receivers[0].payees[0].releasable, "0");
  await (await pool.scheduleRevenuePolicy(ethers.ZeroAddress, 0)).wait();
  await networkHelpers.time.increaseTo(await pool.revenuePolicyReadyAt());
  await (await pool.executeRevenuePolicy()).wait();
  const historical = await read(1n);
  assert.equal(historical.policy.shareBps, "0"); assert.equal(historical.round.shareBps, "4000");
  assert.equal(historical.receivers[0].address.toLowerCase(), treasury.target.toLowerCase());
  if (process.env.BERT_REVENUE_INDEXER_FIXTURE_PATH) {
    const names = new Set(["FundingRoundOpened", "RevenuePolicyScheduled", "RevenuePolicyCancelled",
      "RevenuePolicyActivated", "FundingRoundRevenueSnapshotted", "FundingRoundRevenueBaseSet",
      "ProtocolRevenueAccrued", "ProtocolRevenueClaimed", "RevenueCollected", "RevenueReleased"]);
    const logs = [];
    for (const log of await ethers.provider.getLogs({ address: [pool.target, treasury.target], fromBlock: 0, toBlock: "latest" })) {
      const contract = log.address.toLowerCase() === pool.target.toLowerCase() ? pool : treasury;
      let decoded;
      try { decoded = contract.interface.parseLog(log); } catch { continue; }
      if (!decoded || !names.has(decoded.name)) continue;
      const receipt = await ethers.provider.getTransactionReceipt(log.transactionHash);
      assert.equal(receipt.status, 1);
      assert.equal(receipt.blockHash, log.blockHash);
      logs.push({ address: log.address, topics: [...log.topics], data: log.data,
        transactionHash: log.transactionHash, blockHash: log.blockHash,
        blockNumber: log.blockNumber, logIndex: log.index });
    }
    const destination = path.resolve(root, process.env.BERT_REVENUE_INDEXER_FIXTURE_PATH);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, JSON.stringify({ source: "treasury-contract-check.mjs; in-process compiled-contract receipts, not public Arc",
      chainId: 31337, publicTransactionsSent: false, pool: pool.target, treasury: treasury.target,
      token: token.target, payee: payee.address,
      beneficiaries: paid.receivers[0].payees.map(({ address, shareBps }) => ({ address, shareBps })), logs,
      expected: { pending: historical.revenue, accrued: historical.round.accrued,
        claimed: paid.receivers[0].payees[0].released,
        collected: paid.receivers[0].payees[0].released, released: paid.receivers[0].payees[0].released } }, null, 2) + "\n");
    console.log(`Generated local receipt fixture: ${destination}`);
  }
  fs.writeFileSync("/private/tmp/bert-v24-client-contract-check.json", JSON.stringify({ chainId: 31337,
    publicTransactionsSent: false, legacy: "passed", modern: "passed", snapshots: [accrued, collected, paid, historical] }, null, 2));
  console.log("Local compiled-contract client checks passed: legacy, new policy delay, accrued/collected/paid revenue and historical receiver.");
} finally { await connection.close(); }
