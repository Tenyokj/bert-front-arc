import { readPreRedesign } from "./pre-redesign-baseline.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import ts from "typescript";

const root = new URL("../", import.meta.url);
const read = (file) => readFileSync(new URL(file, root), "utf8");
const api = {};
new Function("exports", ts.transpileModule(read("src/lib/detail-lifecycle.ts"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText)(api);
const round = { active: true, ended: false, startTime: 100n, endTime: 200n, winningIdeaId: 0n };
const idea = { ideaId: 1n, roundId: 4, round: { ...round, ended: true, winningIdeaId: 1n }, payout: null, backer: undefined };
test("round labels distinguish upcoming, live, awaiting settlement, inactive and unknown chain time", () => {
  assert.equal(api.roundPhase(round, 99n), "Upcoming");
  assert.equal(api.roundPhase(round, 100n), "Voting open");
  assert.equal(api.roundPhase(round, 200n), "Voting open");
  assert.equal(api.roundPhase(round, 201n), "Awaiting settlement");
  assert.equal(api.roundPhase(round, undefined), "Checking chain time");
  assert.equal(api.roundPhase({ ...round, active: false }, 150n), "Inactive");
  assert.equal(api.roundPhase({ ...round, ended: true }, undefined), "Settled");
});
test("vote readiness fails closed for unknown participation/time and wrong wallet network", () => {
  const ready = { connected: true, correctChain: true, round, timestamp: 200n, hasVoted: false };
  assert.equal(api.voteReadiness(ready), null);
  for (const changed of [{ connected: false }, { correctChain: false }, { timestamp: undefined }, { hasVoted: undefined }, { hasVoted: true }, { timestamp: 201n }, { timestamp: 99n }]) assert.equal(typeof api.voteReadiness({ ...ready, ...changed }), "string");
});
test("selection or a submitted proof never implies a tranche was paid", () => {
  let steps = api.ideaJourney(idea);
  assert.equal(steps[1].state, "done"); assert.equal(steps[2].state, "unknown");
  assert(!steps.slice(2).some((step) => step.state === "done"));
  steps = api.ideaJourney({ ...idea, payout: { initialClaimed: true, inProcessPaid: false, completionPaid: false, cancelled: false }, stageOneActive: true });
  assert.equal(steps[2].state, "done"); assert.equal(steps[3].state, "current"); assert.equal(steps[4].state, "waiting");
});
test("unknown mode is never silently rendered as legacy 30-40-30", () => {
  assert.equal(api.milestoneMode(undefined), "Review mode unavailable");
  assert.match(api.milestoneMode(false), /30-40-30/); assert.match(api.milestoneMode(true), /20-40-40/);
  assert(!api.ideaJourney(idea).some((step) => /30%|20%/.test(step.title)));
  assert(api.ideaJourney({ ...idea, backer: true })[2].title.includes("20%"));
  assert(api.ideaJourney({ ...idea, backer: false })[4].title.includes("30%"));
});
test("cancelled grants and non-selected ideas stop unpaid stages rather than show success", () => {
  const steps = api.ideaJourney({ ...idea, payout: { initialClaimed: true, inProcessPaid: false, completionPaid: false, cancelled: true } });
  assert.equal(steps[2].state, "done"); assert.equal(steps[3].state, "stopped"); assert.equal(steps[4].state, "stopped");
  assert(api.ideaJourney({ ...idea, ideaId: 2n }).slice(1).every((step) => step.state === "stopped"));
  assert.equal(api.roundJourney({ ...round, ended: true }, 300n)[3].state, "stopped");
});
test("deadlines are explicit UTC and missing dates do not become epoch dates", () => {
  assert.equal(api.utcDeadline(100n), "1970-01-01 00:01:40 UTC");
  for (const value of [undefined, 0n, -1n, 9999999999999999999999n]) assert.equal(api.utcDeadline(value), "Unavailable");
});
test("every pre-existing idea/round financial write retains identical call arguments and gas", () => {
  for (const path of ["src/app/(dapp)/ideas/[id]/page.tsx", "src/app/(dapp)/rounds/[id]/page.tsx"]) {
    const before = readPreRedesign(path);
    const writes = (source) => {
      const file = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX), calls = [];
      const walk = (node) => { if (ts.isCallExpression(node) && /^send[A-Z]/.test(node.expression.getText(file))) calls.push(node.getText(file)); ts.forEachChild(node, walk); }; walk(file); return calls;
    };
    assert(writes(before).length >= 6); assert.deepEqual(writes(read(path)), writes(before));
  }
});
test("milestone window comes from the contract, and missing mode hides wrong review forms", () => {
  const source = read("src/app/(dapp)/ideas/[id]/page.tsx");
  assert.match(source, /functionName: "MILESTONE_REVIEW_WINDOW"/);
  assert.doesNotMatch(source, /request.submittedAt \+ 14n/);
  assert.match(source, /chainTime >= reviewEndsAt/);
  assert.match(source, /!payoutModeKnown \? <p role="status"/);
  assert.match(source, /pickField<boolean>\(row, 9, "cancelled"/);
  assert.match(source, /reviews.slice\(\(currentReviewPage - 1\) \* 6/);
  assert.match(source, /voters.slice\(\(currentVoterPage - 1\) \* 12/);
});
