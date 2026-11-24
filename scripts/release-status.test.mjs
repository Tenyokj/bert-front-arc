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
  assert.match(read("public/docs/CURRENT-RELEASE.md"), /Current releases: V2\.4, installed/);
  assert.match(read("public/docs/CURRENT-RELEASE.md"), /Community Layer V3\.2\.1, deployed/);
});

test("V2.4 public copy distinguishes installed contracts from scheduled activation and public pilot", () => {
  for (const path of ["src/app/faq/page.tsx", "src/app/treasury-policies/page.tsx"]) {
    const source = read(path);
    assert.match(source, /scheduled/);
    assert.match(source, /November 26, 2026, 22:03:24 UTC/);
    assert.doesNotMatch(source, /V2\.4 is a locally prepared candidate|V2\.4: Unreleased Treasury Candidate/);
  }
  const release = read("public/docs/V2.4-ARC-TESTNET-RELEASE.md");
  assert.match(release, /0xeCF9D2fD1914D1aFa124498931fdAA976D4e143b/);
  assert.match(release, /Collect earned revenue to this Treasury/);
  assert.match(release, /Pay fixed beneficiary/);
  assert.match(release, /public pilot remain pending/);
});
