import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createWalletClient, custom, decodeFunctionData, defineChain, parseAbi } from "viem";
import ts from "typescript";

const account = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
const token = "0x3600000000000000000000000000000000000000";
const treasury = "0x1111111111111111111111111111111111111111";
const hash = `0x${"12".repeat(32)}`;
const abi = parseAbi(["function approve(address spender, uint256 amount) returns (bool)"]);
const chain = defineChain({ id: 5042002, name: "Arc Testnet", nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 }, rpcUrls: { default: { http: ["http://127.0.0.1:1"] } } });

function wallet(options = {}) {
  const requests = [];
  const provider = {
    async request(request) {
      requests.push(request);
      if (request.method === "eth_chainId") return options.wrongChain ? "0x1" : "0x4cef52";
      if (request.method === "eth_sendTransaction") {
        if (options.error) throw options.error;
        return hash;
      }
      throw Error(`Unexpected wallet method ${request.method}`);
    },
  };
  return { requests, client: createWalletClient({ account, chain, transport: custom(provider) }) };
}
const request = { address: token, abi, functionName: "approve", args: [treasury, 2_000_000n] };

test("viem sends one ERC-20 approval through the wallet with 6-decimal USDC calldata", async () => {
  const { client, requests } = wallet();
  assert.equal(await client.writeContract(request), hash);
  const sends = requests.filter((item) => item.method === "eth_sendTransaction");
  assert.equal(sends.length, 1);
  const transaction = sends[0].params[0];
  assert.equal(transaction.to.toLowerCase(), token.toLowerCase());
  assert.equal(transaction.from.toLowerCase(), account.toLowerCase());
  assert.ok(requests.some((item) => item.method === "eth_chainId"));
  // eth_sendTransaction may omit chainId after viem validates the wallet's chain.
  if (transaction.chainId !== undefined) assert.equal(Number(transaction.chainId), 5042002);
  assert.equal(transaction.nonce, undefined);
  assert.deepEqual(decodeFunctionData({ abi, data: transaction.data }), { functionName: "approve", args: [treasury, 2_000_000n] });
});

test("wrong wallet chain is rejected before any transaction submission", async () => {
  const { client, requests } = wallet({ wrongChain: true });
  await assert.rejects(client.writeContract(request));
  assert.equal(requests.some((item) => item.method.includes("sendTransaction")), false);
});

test("MetaMask internal already-known errors remain uncertain and are not automatically resent", async () => {
  const { client, requests } = wallet({ error: { code: -32603, message: "RPC 0x4cef52 Custom eth_sendRawTransaction: already known", data: { code: -32000, message: "already known" } } });
  let error;
  try { await client.writeContract(request); } catch (caught) { error = caught; }
  assert.ok(error);
  assert.match(error.message, /already known/);
  const source = readFileSync(new URL("../src/lib/wallet-action.ts", import.meta.url), "utf8");
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const exports = {};
  new Function("exports", js)(exports);
  assert.equal(exports.isUncertainWalletError(error), true);
  assert.equal(requests.filter((item) => item.method === "eth_sendTransaction").length, 1);
  assert.equal(requests.some((item) => item.method === "eth_sendRawTransaction"), false);
});

test("wallet cancellation is not retried or converted into success", async () => {
  const { client, requests } = wallet({ error: { code: 4001, message: "User rejected request" } });
  await assert.rejects(client.writeContract(request), /User rejected/);
  assert.equal(requests.filter((item) => item.method === "eth_sendTransaction").length, 1);
});

test("all viem 2 copies use the tested root version without moving to wagmi 3", () => {
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  const lock = JSON.parse(readFileSync(new URL("../package-lock.json", import.meta.url), "utf8"));
  assert.equal(pkg.dependencies.wagmi, "2.19.5");
  for (const [path, entry] of Object.entries(lock.packages)) {
    if (path.endsWith("node_modules/viem")) assert.equal(entry.version, pkg.dependencies.viem, path);
  }
});
