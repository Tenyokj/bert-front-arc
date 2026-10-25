import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("current public entry points identify deployed V3.2, not a pending release", () => {
  for (const path of [
    "src/app/(dapp)/layout.tsx",
    "src/app/(dapp)/v3/page.tsx",
    "src/app/(dapp)/communities/page.tsx",
    "src/app/(dapp)/app/page.tsx",
    "src/app/how-it-works/page.tsx",
    "src/app/faq/page.tsx",
    "src/app/treasury-policies/page.tsx",
  ]) {
    const source = read(path);
    assert.match(source, /V3\.2/, path);
    assert.doesNotMatch(source, /prepared, not deployed|unreleased V3\.2|V3\.2 pending|not yet deployed/i, path);
  }
  assert.match(read("src/app/(dapp)/v3/page.tsx"), /Existing V3\.1 Communities keep their original contracts/);
});

test("published release evidence and env distinguish new creation from retained history", () => {
  const env = read(".env.example");
  assert.match(env, /NEXT_PUBLIC_V3_FACTORY_ADDRESS=0x23E023E0D8B3436319BC6e5e72615Bc7A0c6234E/);
  assert.match(env, /NEXT_PUBLIC_V3_EVENT_FROM_BLOCK=66809847/);
  assert.match(env, /bert-v-3-1-arc-testnet\/v3\.2\.1/);
  const record = read("public/docs/V3.2.1-ARC-TESTNET-RELEASE.md");
  assert.match(record, /69044184/);
  assert.match(record, /69044535/);
  assert.match(record, /not upgraded/);
  assert.match(read("public/docs/CURRENT-RELEASE.md"), /Current release: Community Layer V3\.2\.1, deployed/);
});
