import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";

// Execute the actual mapping with a small Graph store double. Native graph
// codegen/build checks AssemblyScript separately; this is not Graph Node replay.
class GraphInt {
  constructor(value) { this.value = BigInt(value); }
  static fromI32(value) { return new GraphInt(value); }
  plus(other) { return new GraphInt(this.value + other.value); }
  minus(other) { return new GraphInt(this.value - other.value); }
  toString() { return this.value.toString(); }
}
const n = (value) => new GraphInt(value);

function fixture() {
  function entityClass() {
    const store = new Map();
    return class {
      constructor(id) { this.id = id; }
      unset(key) { delete this[key]; }
      save() { store.set(this.id, { ...this }); }
      static load(id) { return store.has(id) ? Object.assign(new this(id), store.get(id)) : null; }
    };
  }
  const Plan = entityClass(), Review = entityClass(), Tranche = entityClass();
  const community = { id: "factory-1" };
  const helpers = {
    communityForModule: () => community,
    ensureExecutionPlan: (_community, planId) => Plan.load(`plan-${planId}`) ?? Object.assign(new Plan(`plan-${planId}`), {
      planId, budget: n(0), initialTranche: n(0), releasedAmount: n(0), refundLiability: n(0),
    }),
    ensureMilestoneReview: (_community, plan, milestone) => Review.load(`${plan.id}-review-${milestone}`) ?? Object.assign(new Review(`${plan.id}-review-${milestone}`), {
      yesWeight: n(0), noWeight: n(0), reviewerCount: n(0), releasedAmount: n(0), settled: false,
    }),
  };
  const source = readFileSync(new URL("../subgraph-v3/src/milestone-mapping.ts", import.meta.url), "utf8");
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const api = {};
  const dependencies = {
    "@graphprotocol/graph-ts": { BigInt: GraphInt },
    "../generated/schema": { CommunityExecutionTranche: Tranche, CommunityExecutionRefundClaim: entityClass(), CommunityExecutionTrancheApproval: entityClass() },
    "./helpers": helpers,
  };
  new Function("exports", "require", js)(api, (name) => {
    if (!(name in dependencies)) throw new Error(`Unexpected mapping dependency: ${name}`);
    return dependencies[name];
  });
  const event = (params) => ({ address: "manager", params: { planId: n(1), milestone: 1, ...params }, block: { timestamp: n(5000) }, transaction: { hash: { toHex: () => "0xtx" } }, logIndex: n(1) });
  return { api, event, plan: () => Plan.load("plan-1"), review: () => Review.load("plan-1-review-1"), tranche: (stage) => Tranche.load(`plan-1-tranche-${stage}`) };
}

test("a corrected proof resets previous attempt tallies and terminal flags", () => {
  const { api, event, review } = fixture();
  api.handleMilestoneProofSubmitted(event({ evidenceHash: "first", closesAt: n(10) }));
  api.handleMilestoneReviewCast(event({ approved: true, weight: n(4) }));
  api.handleMilestoneReviewCast(event({ approved: false, weight: n(6) }));
  api.handleMilestoneGraceOpened(event({ closesAt: n(20) }));
  api.handleMilestoneCorrectionOpened(event({ availableAt: n(30) }));
  assert.equal(review().settled, true);
  api.handleMilestoneProofSubmitted(event({ evidenceHash: "corrected", closesAt: n(40) }));
  const current = review();
  assert.equal(current.evidenceHash, "corrected");
  assert.equal(current.yesWeight.value, 0n);
  assert.equal(current.noWeight.value, 0n);
  assert.equal(current.reviewerCount.value, 0n);
  assert.equal(current.settled, false);
  assert.equal(current.approved, undefined);
  assert.equal(current.correctionAvailableAt, null);
  assert.equal(current.graceClosesAt, null);
  api.handleMilestoneReviewCast(event({ approved: true, weight: n(7) }));
  assert.equal(review().yesWeight.value, 7n);
  assert.equal(review().reviewerCount.value, 1n);
});

test("no-quorum grace retains votes from the same proof attempt", () => {
  const { api, event, review } = fixture();
  api.handleMilestoneProofSubmitted(event({ evidenceHash: "proof", closesAt: n(10) }));
  api.handleMilestoneReviewCast(event({ approved: true, weight: n(5) }));
  api.handleMilestoneGraceOpened(event({ closesAt: n(20) }));
  api.handleMilestoneReviewCast(event({ approved: false, weight: n(3) }));
  assert.equal(review().yesWeight.value, 5n);
  assert.equal(review().noWeight.value, 3n);
  assert.equal(review().reviewerCount.value, 2n);
});

test("V3.2 counts actual Paid events, not proof approval or tranche readiness", () => {
  const { api, event, plan } = fixture();
  api.handleExecutionPlanStarted(event({ proposalId: n(1), budget: n(100), initialTranche: n(0) }));
  for (const [stage, amount] of [[0, 20], [1, 40], [2, 40]]) {
    if (stage > 0) api.handleMilestoneApproved(event({ milestone: stage, releasedAmount: n(0) }));
    const before = plan().releasedAmount.value;
    api.handleExecutionTrancheReady(event({ tranche: stage, amount: n(amount), readyAt: n(100), expiresAt: n(200), approvalThreshold: n(2) }));
    assert.equal(plan().status, "AwaitingTranche");
    assert.equal(plan().releasedAmount.value, before);
    api.handleExecutionTranchePaid(event({ tranche: stage, amount: n(amount), recipient: "recipient" }));
    assert.equal(plan().releasedAmount.value, before + BigInt(amount));
  }
  assert.equal(plan().status, "Completed");
  assert.equal(plan().releasedAmount.value, 100n);
});

test("original V3.1 automatic-payment events retain their accounting semantics", () => {
  const { api, event, plan } = fixture();
  api.handleExecutionPlanStarted(event({ proposalId: n(1), budget: n(100), initialTranche: n(20) }));
  api.handleMilestoneApproved(event({ milestone: 1, releasedAmount: n(40) }));
  api.handleMilestoneApproved(event({ milestone: 2, releasedAmount: n(40) }));
  api.handleExecutionPlanCompleted(event({}));
  assert.equal(plan().releasedAmount.value, 100n);
  assert.equal(plan().status, "Completed");
});

test("unpaid expiry records active-time terms and preserves actual released amount", () => {
  const { api, event, plan, tranche } = fixture();
  api.handleExecutionPlanStarted(event({ proposalId: n(1), budget: n(100), initialTranche: n(0) }));
  api.handleExecutionTrancheReady(event({ tranche: 0, amount: n(20), readyAt: n(100), expiresAt: n(200), approvalThreshold: n(2) }));
  assert.equal(tranche(0).readyAt.value, 100n); // Not the wall-clock event timestamp 5000.
  api.handleExecutionTrancheExpired(event({ tranche: 0 }));
  api.handleExecutionPlanFailed(event({ refundableAmount: n(100) }));
  assert.equal(tranche(0).status, "Expired");
  assert.equal(plan().releasedAmount.value, 0n);
  assert.equal(plan().refundLiability.value, 100n);
});
