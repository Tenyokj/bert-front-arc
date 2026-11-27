import { readPreRedesign } from "./pre-redesign-baseline.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import ts from "typescript";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const api = {};
new Function("exports", ts.transpileModule(read("src/lib/protocol-status.ts"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText)(api);

test("V2 stages have explicit semantic colors, including cancellation and unknown values", () => {
  const expected = { Pending: "amber", Voting: "cyan", WonVoting: "violet", Funded: "blue", InProcess: "teal", Completed: "green", Rejected: "rose", Cancelled: "rose" };
  for (const [status, tone] of Object.entries(expected)) assert.equal(api.ideaStatusTone(status), tone);
  assert.equal(api.ideaStatusTone("FutureStatus"), "neutral");
  assert.match(read("src/components/dapp/ProtocolCards.tsx"), /StatusBadge tone=\{ideaStatusTone\(status\)\}/);
  const badge = read("src/components/dapp/status.module.css");
  for (const tone of new Set(Object.values(expected))) assert(badge.includes(`data-status-tone="${tone}"`));
  assert.match(badge, /flex: 0 0/); assert.match(badge, /overflow-wrap: anywhere/);
});

test("V3 guides distinguish selection, supporter review, Admin authorization and payment", () => {
  assert.match(api.proposalGuidance(8), /Selection is not a payout/);
  assert.match(api.executionGuidance(2), /not immediate payment/);
  assert.match(api.executionGuidance(7), /Current Community Admins/);
  assert.match(api.executionGuidance(6), /refund claim is a separate transaction/);
  assert.match(api.proposalGuidance(999), /unconfirmed/);
  assert.equal(api.proposalStatusTone(999), "neutral");
  assert.equal(api.executionStatusTone(999), "neutral");
  assert.match(api.executionGuidance(3), /existing proof deadline/);
});

test("Slate phases use the Community clock, never the host clock or unsettled winner guesses", () => {
  const round = { settled: false, startTime: 100n, endTime: 200n, winningProposalId: 0n };
  assert.equal(api.slatePhase(round).label, "Checking Community time");
  assert.equal(api.slatePhase(round, 99n).label, "Upcoming");
  assert.equal(api.slatePhase(round, 100n).label, "Voting open");
  assert.equal(api.slatePhase(round, 199n).label, "Voting open");
  assert.equal(api.slatePhase(round, 200n).label, "Awaiting settlement");
  assert.equal(api.slatePhase(round, 201n).label, "Awaiting settlement");
  assert.match(api.slatePhase({ ...round, settled: true }).next, /No winner/);
  assert.match(api.slatePhase({ ...round, settled: true, winningProposalId: 1n }).next, /not payment/);
});

test("every V3 financial call retains its original arguments and signing targets", () => {
  const paths = ["src/components/CommunityMilestonePanel.tsx", "src/components/CommunityTranchePayment.tsx", "src/components/BinaryLifecycleActions.tsx", "src/components/BinaryVoteAction.tsx", "src/components/SlateRoundActions.tsx", "src/components/CreateCommunityProposal.tsx", "src/components/CommunityAdminPanel.tsx"];
  const calls = (path, source) => {
    const file = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX), result = [];
    const visit = (node) => { if (ts.isCallExpression(node) && /(writeContract|sendTransaction|send[A-Z]\w*)$/.test(node.expression.getText(file))) result.push(node.getText(file)); ts.forEachChild(node, visit); }; visit(file); return result;
  };
  for (const path of paths) {
    const original = readPreRedesign(path);
    assert(calls(path, original).length > 0, path);
    assert.deepEqual(calls(path, read(path)), calls(path, original), path);
  }
});

test("workspace keeps role actions, bounded lists, deep links and explicit unavailable states", () => {
  const workspace = read("src/components/CommunityWorkspacePage.tsx");
  for (const component of ["CommunityMembershipAction", "CommunityTreasuryPanel", "ValidatorQueue", "CommunityAdminPanel", "CommunityMilestonePanel"]) assert(workspace.includes(`<${component}`));
  assert.match(workspace, /searchParams.get\("section"\)/);
  assert.match(read("src/components/CommunitySidebar.tsx"), /aria-pressed=\{active === id\}/);
  assert.match(read("src/components/CommunityMilestonePanel.tsx"), /plans.slice\(\(currentPage - 1\) \* 6/);
  assert.match(read("src/components/CommunityMilestonePanel.tsx"), /failedReads/);
  assert.match(read("src/components/SlateRoundWorkspace.tsx"), /Retry read-only/);
  assert.match(read("src/components/CommunityDirectory.tsx"), /community.status === 0 \? "Active" : "Status unavailable"/);
  assert.match(read("src/app/(dapp)/v3/communities/[id]/proposals/[proposalId]/page.tsx"), /Equal recorded voting weight/);
});
