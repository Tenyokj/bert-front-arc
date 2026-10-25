import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const source = (name) => readFileSync(new URL(`../src/${name}`, import.meta.url), "utf8");
const abiSource = source("lib/community-contracts.ts");
const exports = {};
new Function("exports", "process", ts.transpileModule(abiSource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText)(exports, { env: {} });

test("modular lifecycle reads expose real public counters, not a private review-attempt getter", () => {
  assert.ok(exports.communityMilestoneAbi.some((item) => item.name === "unresolvedPlanCount"));
  assert.ok(exports.communityVotingModuleAbi.some((item) => item.name === "hasExitBlockingObligation"));
  assert.ok(!exports.communityMilestoneAbi.some((item) => item.name === "reviewAttemptByVoter"));
  for (const [abi, file] of [[exports.communityMilestoneAbi, "CommunityMilestoneManager"], [exports.communityVotingModuleAbi, "CommunityVotingModule"]]) {
    const artifact = JSON.parse(readFileSync(new URL(`../subgraph-v3/abis/${file}.json`, import.meta.url), "utf8"));
    const actual = artifact.abi ?? artifact;
    for (const name of ["unresolvedPlanCount", "hasExitBlockingObligation"]) {
      if (abi.some((item) => item.name === name)) assert.ok(actual.some((item) => item.type === "function" && item.name === name), `${name} must have a real public ABI getter`);
    }
  }
});

test("archive checks the owning modules and includes unfinished execution plans", () => {
  const panel = source("components/CommunityArchivePanel.tsx");
  assert.match(panel, /address: modules\.proposal,.*functionName: "pendingValidationProposalCount"/);
  assert.match(panel, /address: modules\.voting,.*functionName: "activeBinaryProposalCount"/);
  assert.match(panel, /address: modules\.voting,.*functionName: "activeSlateRoundCount"/);
  assert.match(panel, /address: modules\.milestone,.*functionName: "unresolvedPlanCount"/);
  assert.doesNotMatch(panel, /functionName: "unresolvedMemberProposalCount"/);
  assert.match(panel, /const canArchive = !paused && loaded/);
});

test("corrected proof eligibility uses read-only simulation keyed by proof attempt", () => {
  const panel = source("components/CommunityMilestonePanel.tsx");
  assert.match(panel, /queryKey:.*review\?\.proofAttempts/);
  assert.match(panel, /client\.simulateContract\(\{ address: hub,.*functionName: "castMilestoneReview"/);
  assert.doesNotMatch(panel, /choiceRead\.data === 0/);
  assert.match(panel, /eligibility\.data === true && !eligibility\.isError && !isRecipient/);
});

test("membership exit fails closed until both author obligations and vote locks are read", () => {
  const panel = source("components/CommunityMembershipAction.tsx");
  assert.match(panel, /functionName: "hasExitBlockingObligation"/);
  assert.match(panel, /const locksLoaded = obligationsRead\.data !== undefined && voteLocksRead\.data !== undefined/);
  assert.match(panel, /const exitBlocked = !locksLoaded \|\| .*voteLocks/);
});

test("role fallback reads Membership events, not the thin Hub's legacy events", () => {
  const panel = source("components/CommunityRoleManagementPanel.tsx");
  assert.match(panel, /communityMembershipModuleAbi\.find/);
  assert.equal((panel.match(/client\.getLogs\(\{ address: modules\.membership/g) ?? []).length, 4);
  assert.doesNotMatch(panel, /client\.getLogs\(\{ address: hub/);
});
