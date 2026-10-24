import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const core = path.resolve(root, process.env.BERT_CORE_PATH || "../../bert-core");
const output = path.join(root, ".e2e-results");
const rpc = "http://127.0.0.1:18545";
const baseURL = "http://127.0.0.1:13000";
const children = [];
const address = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
const nextEnvBefore = await readFile(path.join(root, "next-env.d.ts"), "utf8");
// Explicit local network selection and public development accounts only. Never read a deployer key.
const env = { ...process.env, DEPLOYER_KEY: "", ARC_TESTNET_RPC_URL: "", SEPOLIA_RPC_URL: "", LOCAL_RPC_URL: rpc };
const hardhat = [path.join(core, "node_modules/hardhat/dist/src/cli.js")];
for (const signal of ["SIGINT", "SIGTERM"]) process.once(signal, () => {
  for (const child of children) if (child.exitCode === null && child.signalCode === null) child.kill("SIGTERM");
});

async function freePort(port) {
  const server = net.createServer();
  server.listen(port, "127.0.0.1");
  await once(server, "listening");
  await new Promise((resolve) => server.close(resolve));
}
function start(name, args, cwd, childEnv) {
  const child = spawn(process.execPath, args, { cwd, env: childEnv, stdio: ["ignore", "pipe", "pipe"] });
  children.push(child);
  let log = "";
  const collect = (chunk) => { log += chunk.toString(); };
  child.stdout.on("data", collect); child.stderr.on("data", collect);
  child.log = () => log;
  child.logName = name;
  return child;
}
async function run(name, args, childEnv = env) {
  const child = start(name, args, core, childEnv);
  const timeout = setTimeout(() => child.kill("SIGTERM"), 180_000);
  const [code] = await once(child, "exit");
  clearTimeout(timeout);
  await writeFile(path.join(output, `${name}.log`), child.log());
  assert.equal(code, 0, `${name} failed:\n${child.log().slice(-6000)}`);
  return child.log();
}
async function waitFor(check, child) {
  for (let attempt = 0; attempt < 180; attempt++) {
    if (child.exitCode !== null || child.signalCode !== null) throw new Error(child.log().slice(-6000));
    try { if (await check()) return; } catch { /* wait for owned service */ }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Timed out waiting for ${child.logName}: ${child.log().slice(-4000)}`);
}
async function rpcCall(method, params = []) {
  const body = await (await fetch(rpc, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }) })).json();
  if (body.error) throw new Error(body.error.message);
  return body.result;
}
const extract = (log, label) => {
  const match = log.match(new RegExp(`^${label}: (0x[0-9a-fA-F]{40})$`, "m"));
  assert.ok(match, `Missing ${label} in deployment output`);
  return match[1];
};

try {
  await mkdir(output, { recursive: true });
  const tsconfig = JSON.parse(await readFile(path.join(root, "tsconfig.json"), "utf8"));
  await writeFile(path.join(output, "tsconfig.json"), JSON.stringify({
    ...tsconfig,
    compilerOptions: { ...tsconfig.compilerOptions, baseUrl: root },
    include: [...tsconfig.include, ".next-e2e/types/**/*.ts", ".next-e2e/dev/types/**/*.ts"].map((pattern) => path.resolve(root, pattern)),
    exclude: tsconfig.exclude.map((pattern) => path.resolve(root, pattern)),
  }, null, 2));
  await freePort(18545); await freePort(13000);
  const node = start("hardhat", [...hardhat, "node", "--network", "hardhat", "--hostname", "127.0.0.1", "--port", "18545"], core, env);
  await waitFor(async () => node.log().includes(rpc) && await rpcCall("eth_chainId") === "0x7a69", node);
  console.log("[E2E] Owned local chain 31337 ready; deploying protocol.");
  const v2 = await run("deploy-v2", [...hardhat, "run", "scripts/deploy/deploy-proxies.ts", "--network", "localhost"], {
    ...env, USDC_ADDRESS: "", PROXY_ADMIN_OWNER: address, TRUSTED_SIGNER_ADDRESS: address,
    HUMAN_ONLY_VOTING: "true", HUMAN_ONLY_IDEA_CREATION: "true",
  });
  const summary = v2.split("Deployment summary:")[1].split("ProxyAdmin per proxy:")[0];
  const usdc = extract(summary, "USDC asset");
  const verifier = extract(summary, "PoPVerifierUpgradeable");
  const funding = extract(summary, "FundingPoolUpgradeable");
  const v3 = await run("deploy-v3", [...hardhat, "run", "scripts/deploy/deploy-v3-2.ts", "--network", "localhost"], { ...env, POP_VERIFIER_ADDRESS: verifier, V3_PROXY_ADMIN_OWNER: address });
  const factory = extract(v3, "CommunityFactory proxy");
  const library = extract(v3, "CommunityAdminActions library");
  await run("configure-reserve", [...hardhat, "run", "scripts/deploy/configure-v3-2-funding-pool.ts", "--network", "localhost"], { ...env, FUNDING_POOL_ADDRESS: funding, V3_2_FACTORY_ADDRESS: factory });
  await run("mint", [...hardhat, "run", "scripts/local/mint-v3-test-usdc.ts", "--network", "localhost"], { ...env, MOCK_USDC_ADDRESS: usdc, LOCAL_TEST_WALLET_COUNT: "8", MOCK_USDC_AMOUNT: "100000" });
  await run("verify", [...hardhat, "run", "scripts/local/verify-v3-test-wallets.ts", "--network", "localhost"], { ...env, POP_VERIFIER_ADDRESS: verifier, LOCAL_TEST_WALLET_COUNT: "8", LOCAL_POP_VALIDITY_DAYS: "365" });
  const fixture = { rpc, baseURL, core, usdc, verifier, funding, factory, library, accounts: (await rpcCall("eth_accounts")).slice(0, 8) };
  const fixturePath = path.join(output, "fixture.json");
  await writeFile(fixturePath, JSON.stringify(fixture, null, 2));
  const frontendEnv = {
    ...env, NEXT_PUBLIC_DEFAULT_CHAIN: "hardhat", NEXT_PUBLIC_HARDHAT_RPC_URL: rpc,
    NEXT_PUBLIC_SUBGRAPH_URL: "", NEXT_PUBLIC_V3_SUBGRAPH_URL: "", NEXT_PUBLIC_V3_LEGACY_FACTORY_ADDRESSES: "",
    NEXT_PUBLIC_V3_FACTORY_ADDRESS: factory, NEXT_PUBLIC_V3_ADMIN_ACTIONS_LIBRARY_ADDRESS: library,
    NEXT_PUBLIC_V3_EVENT_FROM_BLOCK: "0", NEXT_PUBLIC_USDC_ADDRESS: usdc,
    NEXT_PUBLIC_FUNDING_POOL_ADDRESS: funding, NEXT_PUBLIC_POP_VERIFIER_ADDRESS: verifier,
  };
  for (const [key, contract] of Object.entries({ VOTING_SYSTEM: "VotingSystemUpgradeable", IDEA_REGISTRY: "IdeaRegistryUpgradeable", REPUTATION_SYSTEM: "ReputationSystemUpgradeable", VOTER_PROGRESSION: "VoterProgressionUpgradeable", ROLES_REGISTRY: "RolesRegistryUpgradeable", GRANT_MANAGER: "GrantManagerUpgradeable" })) {
    frontendEnv[`NEXT_PUBLIC_${key}_ADDRESS`] = extract(summary, contract);
  }
  // Separate output directory avoids contaminating the developer's regular .next build.
  const next = start("frontend", [path.join(root, "node_modules/next/dist/bin/next"), "dev", "--webpack", "--hostname", "127.0.0.1", "--port", "13000"], root, { ...frontendEnv, BERT_E2E: "1" });
  await waitFor(async () => (await fetch(`${baseURL}/v3/create`)).ok, next);
  console.log("[E2E] Local dApp ready; starting browser flows.");
  const tests = start("browser", [path.join(root, "node_modules/@playwright/test/cli.js"), "test", "--config", "scripts/e2e/playwright.config.mjs"], root, { ...env, BERT_E2E_FIXTURE: fixturePath });
  tests.stdout.on("data", (chunk) => process.stdout.write(chunk));
  tests.stderr.on("data", (chunk) => process.stderr.write(chunk));
  const [code] = await once(tests, "exit");
  process.exitCode = code || 0;
} catch (error) {
  console.error(error.message); process.exitCode = 1;
} finally {
  for (const child of children.reverse()) {
    if (child.exitCode === null) child.kill("SIGTERM");
    await writeFile(path.join(output, `${child.logName}.log`), child.log()).catch(() => {});
  }
  // next dev owns this generated file; do not leave its temporary distDir in the regular build.
  await writeFile(path.join(root, "next-env.d.ts"), nextEnvBefore);
}
