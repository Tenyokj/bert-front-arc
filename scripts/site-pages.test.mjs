import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";

const root = new URL("../", import.meta.url);
const read = (file) => readFileSync(new URL(file, root), "utf8");
const committed = (file) => execFileSync("git", ["show", `HEAD:${file}`], { cwd: root, encoding: "utf8" });
const routes = ["protocol-stats", "faq", "how-it-works", "developer-guide", "bug-bounty", "governance-stack", "on-chain-votes", "policy-docs", "privacy-notice", "security-roadmap", "terms-of-use", "testnet-information", "treasury-policies"];

test("all informational routes share the new frame with no duplicate old chrome", () => {
  for (const route of routes) {
    const page = read(`src/app/${route}/page.tsx`);
    assert.match(page, new RegExp(`SiteFrame route="/${route}"`));
    assert.doesNotMatch(page, /<header|<SiteFooter/);
  }
  const registry = read("src/components/site/routes.ts");
  for (const route of routes) assert(registry.includes(`path: "/${route}"`));
  for (const directory of readdirSync(new URL("src/app/", root), { withFileTypes: true }).filter((entry) => entry.isDirectory() && !["(dapp)", "api", "demo"].includes(entry.name))) {
    assert(routes.includes(directory.name), `Unclassified public route: ${directory.name}`);
  }
});

test("legal content and dates remain unchanged", () => {
  for (const route of ["privacy-notice", "terms-of-use"]) {
    const file = `src/app/${route}/page.tsx`;
    const before = committed(file);
    const after = read(file);
    assert.equal(after.slice(after.indexOf("const "), after.indexOf("export default")), before.slice(before.indexOf("const "), before.indexOf("export default")));
    assert.equal(after.match(/<main[\s\S]*?<\/main>/)[0], before.match(/<main[\s\S]*?<\/main>/)[0]);
  }
});

test("demo fixtures, wallet configuration and shared legacy footer are untouched", () => {
  const changed = execFileSync("git", ["diff", "--name-only", "HEAD", "--", "src/lib/dapp-demo.ts", "src/lib/contracts.ts", "src/lib/web3.ts", "src/lib/community-contracts.ts", "src/components/SiteFooter.tsx", "src/components/WalletConnectButton.tsx", "src/components/Web3Providers.tsx"], { cwd: root, encoding: "utf8" });
  assert.equal(changed.trim(), "");
});

test("metrics retain actual contract reads and do not turn missing round data into zero", () => {
  const file = "src/app/protocol-stats/page.tsx";
  assert.equal((read(file).match(/useReadContract\(/g) || []).length, (committed(file).match(/useReadContract\(/g) || []).length);
  assert.match(read(file), /currentRoundIdValue === undefined \? undefined/);
  assert.match(read(file), /not one atomic/);
  assert.match(read(file), /configured active Factory/);
  assert.match(read(file), /refetchQueries/);
});

test("FAQ has labelled search, accessible expandable answers and an empty state", () => {
  const faq = read("src/components/site/FaqExplorer.tsx");
  for (const term of ["useDeferredValue", "htmlFor=\"faq-search\"", "aria-expanded", "aria-controls", "No matching answers.", "Reset search", "Clear FAQ search"]) assert(faq.includes(term));
  assert.doesNotMatch(faq, /href="#"/);
});

test("shared chrome links work from non-home routes and preserve read-only scope", () => {
  assert.match(read("src/components/landing/LandingExperience.tsx"), /isHome \? "#protocol" : "\/#protocol"/);
  const frame = read("src/components/site/SiteFrame.tsx");
  for (const term of ["LandingHeader", "LandingFooter", "LandingMotion", "Skip to content"]) assert(frame.includes(term));
  assert.doesNotMatch(frame, /writeContract|sendTransaction|wallet_/);
});
