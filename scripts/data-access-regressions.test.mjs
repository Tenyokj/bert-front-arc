import { readPreRedesign } from "./pre-redesign-baseline.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import ts from "typescript";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const require = createRequire(import.meta.url);
const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
function load(path, imports = {}, environment = {}, fetcher = fetch) {
  const exports = {};
  const code = ts.transpileModule(read(path), { fileName: path, compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  new Function("exports", "require", "process", "fetch", code)(exports, (name) => imports[name] || require(name), { env: environment }, fetcher);
  return exports;
}
const graphql = load("src/lib/graphql-response.ts");
const demo = load("src/lib/testnet-demo-proxy.ts");
const wallet = "0x1111111111111111111111111111111111111111";
const verifier = "0x2222222222222222222222222222222222222222";
const config = { environment: "development", enabled: true, chain: "arc", backend: "https://backend.test", verifier };
const body = { walletAddress: wallet, chainId: 5042002, verifierAddress: verifier };
const request = (value = body, extra = {}) => new Request("http://localhost:3000/api/local-demo-proof", { method: "POST", headers: { origin: "http://localhost:3000", "content-type": "application/json", ...extra }, body: JSON.stringify(value) });

test("Graph provider message envelopes, null data and HTML never count as loaded data", () => {
  for (const value of [{ message: "Subgraph not found" }, { data: null }, null, [], "<html>error</html>"]) assert.throws(() => graphql.graphqlData(value), /GraphQL/);
  assert.deepEqual(graphql.graphqlData({ data: { ideas: [] } }), { ideas: [] });
  assert.throws(() => graphql.graphqlData({ errors: [{ message: "Indexing error" }] }), /Indexing error/);
});
test("subgraph proxy maps HTTP-200 provider errors to 502 without exposing credentials", async () => {
  const env = { NEXT_PUBLIC_SUBGRAPH_URL: "https://graph.test/query", GRAPH_STUDIO_API_KEY: "fixture-secret-not-to-be-echoed" };
  for (const value of [{ message: "Missing subgraph" }, "not JSON"]) {
    const route = load("src/app/api/subgraph/route.ts", { "@/lib/graphql-response": graphql }, env, async () => new Response(typeof value === "string" ? value : JSON.stringify(value), { status: 200 }));
    const response = await route.POST(new Request("http://localhost:3000/api/subgraph", { method: "POST", body: JSON.stringify({ query: "{ ideas { id } }" }) }));
    assert.equal(response.status, 502); assert(!(await response.text()).includes(env.GRAPH_STUDIO_API_KEY));
  }
});
test("subgraph proxy preserves real GraphQL data and query errors", async () => {
  for (const payload of [{ data: { ideas: [] } }, { errors: [{ message: "Field is not defined" }] }]) {
    const route = load("src/app/api/subgraph/route.ts", { "@/lib/graphql-response": graphql }, { NEXT_PUBLIC_SUBGRAPH_URL: "https://graph.test/query", GRAPH_STUDIO_API_KEY: "fixture" }, async () => Response.json(payload));
    const response = await route.POST(new Request("http://localhost:3000/api/subgraph", { method: "POST", body: "{}" }));
    assert.equal(response.status, 200); assert.deepEqual(await response.json(), payload);
  }
});
test("local demo relay refuses production, disabled flag, other chain and cross-origin requests before any upstream call", async () => {
  let calls = 0; const fetcher = async () => { calls++; return Response.json({ fixture: true }); };
  for (const change of [{ environment: "production" }, { enabled: false }, { chain: "hardhat" }]) assert.equal((await demo.forwardLocalDemo(request(), { ...config, ...change }, fetcher)).status, 404);
  assert.equal((await demo.forwardLocalDemo(request(body, { origin: "https://hostile.test" }), config, fetcher)).status, 403);
  for (const change of [{ chainId: 1 }, { verifierAddress: wallet }, { walletAddress: "bad" }, { upstream: "https://hostile.test" }]) assert.equal((await demo.forwardLocalDemo(request({ ...body, ...change }), config, fetcher)).status, 400);
  assert.equal(calls, 0);
});
test("local demo relay sends only the validated request to its configured backend and never follows redirects", async () => {
  let sent;
  const response = await demo.forwardLocalDemo(request(), config, async (url, options) => { sent = { url: String(url), ...options }; return Response.json({ fixture: "not a real credential" }); });
  assert.equal(response.status, 200); assert.equal(sent.url, "https://backend.test/api/pop/demo-proof");
  assert.deepEqual(JSON.parse(sent.body), body); assert.equal(sent.redirect, "error"); assert.equal(sent.cache, "no-store");
  assert.equal(response.headers.get("cache-control"), "no-store");
});
test("backend errors and invalid local configuration stay errors rather than fake verification success", async () => {
  assert.equal((await demo.forwardLocalDemo(request(), config, async () => new Response("no", { status: 403 }))).status, 502);
  assert.equal((await demo.forwardLocalDemo(request(), config, async () => { throw Error("network"); })).status, 502);
  assert.equal((await demo.forwardLocalDemo(request(), { ...config, backend: "https://name:secret@host.test" })).status, 503);
  assert.equal((await demo.forwardLocalDemo(request({ ...body, excess: "x".repeat(3000) }), config)).status, 413);
});
test("demo URL uses the local relay only for loopback development; production keeps the original backend path", () => {
  assert.equal(demo.demoProofUrl("https://backend.test/", "development", "http://localhost:3000"), "/api/local-demo-proof");
  assert.equal(demo.demoProofUrl("https://backend.test", "development", "http://127.0.0.1:3000"), "/api/local-demo-proof");
  for (const [environment, origin] of [["production", "http://localhost:3000"], ["development", "https://public.test"]]) assert.equal(demo.demoProofUrl("https://backend.test/", environment, origin), "https://backend.test/api/pop/demo-proof");
});
test("missing demo setup is explained and the Arc-only guard and financial send path are retained", () => {
  const path = "src/components/HumanVerificationPanel.tsx", current = read(path);
  const before = readPreRedesign(path);
  const submit = (source) => source.slice(source.indexOf("  async function submitPendingPayload"), source.indexOf("  async function startVerification"));
  assert(submit(before).length > 100); assert.equal(submit(current), submit(before));
  assert.match(current, /demoVerificationEnabled && effectiveChainId === arcTestnetChainId/);
  assert.match(current, /NEXT_PUBLIC_POP_DEMO_ENABLED=true/);
  const ideas = read("src/app/(dapp)/ideas/page.tsx");
  assert.match(ideas, /Indexer unavailable. Loading this page directly/);
  const fallback = ideas.slice(ideas.indexOf("} catch (error)"), ideas.indexOf("const total = await totalPromise"));
  assert(!fallback.includes("return;"), "Indexer failure must continue to RPC, not an empty page");
});
test("demo button renders for enabled Arc wallets, never for a missing flag or another chain", () => {
  const render = (enabled, chainId) => {
    const component = load("src/components/HumanVerificationPanel.tsx", {
      wagmi: { useAccount: () => ({ address: wallet, chainId, isConnected: true }), usePublicClient: () => undefined, useWalletClient: () => ({ data: undefined }) },
      "@worldcoin/idkit": { IDKitRequestWidget: () => null },
      "@/lib/contracts": { contracts: { popVerifier: verifier } },
      "@/lib/dapp-onchain": { formatTokenAmount: String, formatDateTimeFromUnix: String },
      "@/lib/wallet-action": {},
      "@/lib/testnet-demo-proxy": demo,
    }, { NODE_ENV: "development", NEXT_PUBLIC_WORLD_ENVIRONMENT: "staging", NEXT_PUBLIC_POP_BACKEND_URL: "https://backend.test", NEXT_PUBLIC_POP_DEMO_ENABLED: enabled });
    return renderToStaticMarkup(createElement(component.HumanVerificationPanel));
  };
  assert.match(render("true", 5042002), /Use demo verification/);
  assert.doesNotMatch(render("false", 5042002), /Use demo verification/);
  assert.match(render(undefined, 5042002), /Staging World ID values alone/);
  assert.doesNotMatch(render("true", 1), /Use demo verification/);
});
