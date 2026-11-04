import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";

const root = new URL("../", import.meta.url);
const json = (path) => JSON.parse(readFileSync(new URL(path, root), "utf8"));
const manifest = json("package.json");
const lock = json("package-lock.json");
const consumerRequire = (name) => createRequire(new URL(`node_modules/${name}/package.json`, root));

test("reviewed RainbowKit/Wagmi versions agree across manifest, lock and installation", () => {
  // Changing this boundary requires a reviewed wallet migration, not --force.
  for (const [name, version] of Object.entries({ "@rainbow-me/rainbowkit": "2.2.11", wagmi: "2.19.5" })) {
    assert.equal(manifest.dependencies[name], version);
    assert.equal(lock.packages[""].dependencies[name], version);
    assert.equal(lock.packages[`node_modules/${name}`].version, version);
    assert.equal(json(`node_modules/${name}/package.json`).version, version);
  }
  assert.equal(json("node_modules/@rainbow-me/rainbowkit/package.json").peerDependencies.wagmi, "^2.9.0");
});

test("Zod overrides do not replace legacy consumers with the incompatible v4 API", () => {
  assert.equal(manifest.overrides.zod, undefined);
  assert.equal(manifest.overrides["zod@>=3.0.0 <4.0.0"], undefined);
  for (const name of ["@coinbase/cdp-sdk", "@reown/appkit-wallet"]) {
    const require = consumerRequire(name);
    assert.match(require("zod/package.json").version, /^3\./, name);
    const { z } = require("zod");
    assert.deepEqual(z.record(z.array(z.string())).parse({ roles: ["member"] }), { roles: ["member"] });
  }
});

test("actual Reown frame schemas accept valid payloads and reject malformed ones", async () => {
  const schemas = await import(new URL("node_modules/@reown/appkit-wallet/dist/esm/src/W3mFrameSchema.js", root));
  assert.deepEqual(schemas.AppSyncThemeRequest.parse({ themeVariables: { accent: "blue", radius: 8 } }), {
    themeVariables: { accent: "blue", radius: 8 },
  });
  assert.equal(schemas.AppConnectEmailRequest.safeParse({ email: "builder@example.com" }).success, true);
  assert.equal(schemas.AppConnectEmailRequest.safeParse({ email: ["not-an-email"] }).success, false);
});

test("actual Coinbase policy schemas retain validation on the pinned SDK", async () => {
  const { CreatePolicyBodySchema } = await import(new URL("node_modules/@coinbase/cdp-sdk/_esm/policies/types.js", root));
  const policy = { scope: "account", rules: [{ action: "accept", operation: "signEvmMessage", criteria: [{ type: "evmMessage", match: "^BERT test$" }] }] };
  assert.deepEqual(CreatePolicyBodySchema.parse(policy), policy);
  assert.equal(CreatePolicyBodySchema.safeParse({ ...policy, scope: "unknown" }).success, false);
  assert.equal(CreatePolicyBodySchema.safeParse({ ...policy, rules: [] }).success, false);
  assert.equal(CreatePolicyBodySchema.safeParse({ ...policy, rules: Array(11).fill(policy.rules[0]) }).success, false);
});

test("KNOWN OPEN: legacy Zod still validates every element beyond an array maximum", () => {
  // Bounded reproduction of GHSA-mrhx-c7xc-m3w5, not a fix or an OOM stress test.
  // If upstream changes this behavior, reassess the advisory and these assertions.
  for (const name of ["@coinbase/cdp-sdk", "@reown/appkit-wallet"]) {
    const { z } = consumerRequire(name)("zod");
    let visited = 0;
    const input = Array.from({ length: 32 }, () => null);
    for (let index = 0; index < input.length; index += 1) {
      Object.defineProperty(input, index, { get() { visited += 1; return null; } });
    }
    const result = z.array(z.string()).max(1).safeParse(input);
    assert.equal(result.success, false, name);
    assert.equal(visited, 32, name);
    assert.equal(result.error.issues.length, 33, name);
  }
});
