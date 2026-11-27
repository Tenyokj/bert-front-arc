import { readPreRedesign, preRedesignFiles } from "./pre-redesign-baseline.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const root = new URL("../", import.meta.url);
const read = (file) => readFileSync(new URL(file, root), "utf8");
const committed = (file) => readPreRedesign(file);

test("only explicitly approved UX surfaces differ; wallet, contract and financial flows stay unchanged", () => {
  const files = preRedesignFiles.filter((file) => /^(src\/(app\/\(dapp\)|app\/demo|lib|components)\/|package(?:-lock)?\.json$)/.test(file));
  const visual = new Set(["src/components/DappShell.tsx", "src/components/HeroLogo3D.tsx", "src/components/HeroLogo3DClient.tsx", "src/components/TestnetBanner.tsx"]);
  visual.add("src/app/(dapp)/app/page.tsx");
  visual.add("src/components/FundingPoolHero.tsx");
  visual.add("src/components/PoolStats.tsx");
  visual.add("src/app/(dapp)/ideas/[id]/page.tsx");
  visual.add("src/app/(dapp)/rounds/[id]/page.tsx");
  visual.add("src/app/(dapp)/ideas/new/page.tsx");
  visual.add("src/app/(dapp)/v3/create/page.tsx");
  visual.add("src/lib/dapp-onchain.ts");
  visual.add("src/lib/subgraph.ts");
  visual.add("src/components/HumanVerificationPanel.tsx");
  for (const file of ["src/components/CommunityWorkspacePage.tsx", "src/components/CommunitySidebar.tsx", "src/components/CommunityDirectory.tsx", "src/components/BinaryProposalWorkspace.tsx", "src/components/SlateRoundWorkspace.tsx", "src/components/CommunityMilestonePanel.tsx", "src/components/CommunityTranchePayment.tsx", "src/app/(dapp)/v3/communities/[id]/page.tsx", "src/app/(dapp)/v3/communities/[id]/proposals/[proposalId]/page.tsx", "src/app/(dapp)/v3/communities/[id]/rounds/[roundId]/page.tsx"]) visual.add(file);
  for (const file of ["src/app/(dapp)/admin/page.tsx", "src/app/(dapp)/ideas/page.tsx", "src/app/(dapp)/rounds/page.tsx", "src/app/(dapp)/profile/page.tsx", "src/app/demo/ideas/page.tsx", "src/app/demo/rounds/page.tsx", "src/components/RevenueTreasuryPanel.tsx", "src/components/DappDashboardLiveStats.tsx"]) visual.add(file);
  for (const file of files.filter((file) => !visual.has(file))) {
    const original = committed(file);
    const current = read(file).replace('import { useProtocolReceipt as useWaitForTransactionReceipt } from "@/hooks/useProtocolReceipt";\n', "");
    const originalImport = original.match(/import\s*\{[^}]*\}\s*from "wagmi";/g)?.find((value) => value.includes("useWaitForTransactionReceipt"));
    const currentImport = current.match(/import\s*\{[^}]*\}\s*from "wagmi";/g)?.[0];
    assert.equal(originalImport && currentImport ? current.replace(currentImport, originalImport) : current, original, file);
  }
});

test("island shell retains the exact original layout after removing decorative additions", () => {
  const restored = read("src/components/DappShell.tsx")
    .replace('import { HoneycombBackground } from "@/components/dapp/HoneycombBackground";\n', "")
    .replace('import { TransactionCenter } from "@/components/dapp/TransactionCenter";\n', "")
    .replace('        <TransactionCenter />\n', "")
    .replace('import styles from "./dapp/cyber.module.css";\n', "")
    .replace('<div data-dapp-theme="cyber-hive" className={`${styles.shell} min-h-screen bg-[#20232f] text-slate-100`}>\n      <HoneycombBackground />', '<div className="min-h-screen bg-[#20232f] text-slate-100">');
  assert.equal(restored, committed("src/components/DappShell.tsx"));
  assert.doesNotMatch(read("src/components/DappShell.tsx"), /sidebar|drawer|DappOverview/);
});

test("honeycomb uses decorative CSS only, with no interaction interception or wallet activity", () => {
  const background = read("src/components/dapp/HoneycombBackground.tsx");
  assert.match(background, /aria-hidden="true"/);
  assert.doesNotMatch(background, /useEffect|requestAnimationFrame|<canvas|fetch\(|writeContract|sendTransaction/);
  const css = read("src/components/dapp/cyber.module.css");
  assert.match(css, /pointer-events: none/);
  assert.match(css, /mask-repeat: repeat/);
  assert.match(css, /@keyframes hiveWave/);
  assert.match(css, /translateY\(110%\)/);
  assert.match(css, /translateY\(-110%\)/);
});

test("new paint retains status colors, visible focus and reduced-motion support", () => {
  const css = read("src/components/dapp/cyber.module.css");
  for (const term of ["border-rose", "border-red", "border-amber", "border-emerald", "focus-visible", "prefers-reduced-motion", "animation: none"]) assert(css.includes(term));
  assert.doesNotMatch(css, /font-size:|padding:|border-radius:/);
});
