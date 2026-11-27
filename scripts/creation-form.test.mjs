import { readPreRedesign } from "./pre-redesign-baseline.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import ts from "typescript";
import * as viem from "viem";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const api = {};
new Function("exports", "require", ts.transpileModule(read("src/lib/creation-form.ts"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText)(api, (name) => { assert.equal(name, "viem"); return viem; });
const creator = "0x1111111111111111111111111111111111111111";
const validator = "0x2222222222222222222222222222222222222222";
const idea = { title: "Build an SDK", description: "Deliver a documented SDK and example app.", link: "ipfs://example", authorBond: "50", minimumNetFunding: "1000" };
const form = { name: "SDK Community", metadataURI: "https://example.org", executionRecipient: creator, entryStake: "10", proposalBond: "50", voteMinStake: "10", validatorThreshold: "1", adminThreshold: "1", validatorPointsThreshold: "15", rejectionFeeBps: "300", validatorRewardBps: "1500", validatorActivityBps: "6000", exitCooldownMinutes: "1440", validationMinutes: "1440", binaryVotingMinutes: "2880", roundVotingMinutes: "2880", rewardEpochMinutes: "10080", milestoneReviewDays: "14", milestoneProofMinutes: "10080" };
const problems = (step, changes = {}, admins = [], validators = [validator], owner = creator) => api.communityStepProblems(step, { ...form, ...changes }, owner, admins, validators);

test("creation amounts are exact six-decimal uint256 values, never silently rounded", () => {
  assert.equal(api.parseCreationUsdc(" 1.000001 "), 1000001n);
  assert.equal(api.parseCreationUsdc("0"), 0n);
  for (const value of ["", "-1", "+1", "1e3", "NaN", "0.0000001", "1.0000009", "1,000", String(2n ** 256n)]) assert.equal(api.parseCreationUsdc(value), -1n, value);
});
test("idea steps validate public fields and distinguish the author bond from the funding target", () => {
  assert.deepEqual(api.ideaStepProblems(0, idea), []);
  assert.deepEqual(api.ideaStepProblems(1, idea, 50000000n), []);
  assert.equal(api.ideaStepProblems(0, { ...idea, title: " ", description: "", link: "javascript:alert(1)" }).length, 3);
  assert.match(api.ideaStepProblems(1, idea, 51000000n)[0], /minimum/);
  assert.equal(api.ideaStepProblems(1, { ...idea, authorBond: "0", minimumNetFunding: "0.0000001" }).length, 2);
  for (const link of ["", "https://example.org", "http://example.org", "ipfs://example", "ar://example"]) assert.equal(api.referenceProblem(link), null);
});
test("Community role preview includes creator once and rejects overlap, duplicates and impossible quorum", () => {
  assert.deepEqual(api.effectiveCommunityAdmins(creator, []), [creator]);
  assert.deepEqual(api.effectiveCommunityAdmins(creator, [creator]), [creator]);
  assert.deepEqual(problems(1), []);
  assert(problems(1, {}, [], [creator]).some((problem) => /overlap/.test(problem)));
  assert(problems(1, {}, [], [validator, validator]).some((problem) => /duplicate/.test(problem)));
  assert(problems(1, {}, [], []).some((problem) => /at least one/.test(problem)));
  assert(problems(1, { adminThreshold: "2", validatorThreshold: "2" }).length === 2);
  assert(problems(1, {}, [], [viem.zeroAddress]).some((problem) => /nonzero/.test(problem)));
  assert.deepEqual(api.communityStepProblems(1, form, undefined, [], [validator]), []);
});
test("Community rules validate precision, positive durations, enforced review window and bps limits", () => {
  assert.deepEqual(problems(0), []); assert.deepEqual(problems(2), []);
  assert(problems(0, { executionRecipient: viem.zeroAddress }).length > 0);
  for (const key of ["entryStake", "proposalBond", "voteMinStake"]) assert(problems(2, { [key]: "1.0000001" }).length > 0);
  for (const value of ["0", "15", "1.5", "-1"]) assert(problems(2, { milestoneReviewDays: value }).length > 0);
  assert.deepEqual(problems(2, { milestoneReviewDays: "1", rejectionFeeBps: "1000", validatorRewardBps: "10000", validatorActivityBps: "10000", validatorPointsThreshold: "100" }), []);
  for (const [key, value] of [["rejectionFeeBps", "1001"], ["validatorRewardBps", "10001"], ["validatorActivityBps", "10001"], ["validatorPointsThreshold", "101"], ["milestoneProofMinutes", String(2n ** 64n / 60n + 1n)]]) assert(problems(2, { [key]: value }).length > 0);
});
test("review acknowledgement changes with the draft, role holders, wallet, chain or deployment", () => {
  const snapshot = { form, validators: [validator], address: creator, chainId: 5042002, factory: validator };
  for (const change of [{ form: { ...form, entryStake: "20" } }, { validators: [creator] }, { address: validator }, { chainId: 1 }, { factory: creator }]) assert.notEqual(api.reviewIdentity({ ...snapshot, ...change }), api.reviewIdentity(snapshot));
});
const ideaPath = "src/app/(dapp)/ideas/new/page.tsx", communityPath = "src/app/(dapp)/v3/create/page.tsx";
const ast = (path, source) => ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
function extract(file, predicate) {
  const values = [];
  const walk = (node) => { if (predicate(node)) values.push(node.getText(file)); ts.forEachChild(node, walk); };
  walk(file); return values;
}
test("both creation flows keep original write calldata, spenders and gas unchanged", () => {
  for (const path of [ideaPath, communityPath]) {
    const before = ast(path, readPreRedesign(path)), after = ast(path, read(path));
    const writes = (file) => extract(file, (node) => ts.isCallExpression(node) && /^(sendApprove|sendWrite|reserve\.writeContractAsync|deploy\.deployContractAsync|activate\.writeContractAsync)$/.test(node.expression.getText(file)));
    assert(writes(before).length >= 2); assert.deepEqual(writes(after), writes(before));
  }
});
test("Community build, receipt recovery, Hub linking, activation and status refresh retain their exact controllers", () => {
  const before = ast(communityPath, readPreRedesign(communityPath)), after = ast(communityPath, read(communityPath));
  for (const name of ["reservedForm", "linkCommunityHubBytecode", "build", "recoverTreasury", "deployHub", "activateHub", "refreshSetup", "syncSetup"]) {
    const select = (file) => extract(file, (node) => (ts.isFunctionDeclaration(node) || ts.isVariableDeclaration(node)) && node.name?.getText(file) === name);
    assert.equal(select(before).length, 1, name); assert.deepEqual(select(after), select(before), name);
  }
});
test("all 19 original Community settings remain present in the full review", () => {
  const source = read(communityPath), review = source.slice(source.indexOf("<CreationReview"), source.indexOf("</CreationSteps>"));
  assert.equal(Object.keys(form).length, 19);
  for (const key of Object.keys(form)) assert(review.includes(`form.${key}`), key);
  assert(review.includes("initialAdminPreview")); assert(review.includes("validators.join"));
  assert(source.indexOf("Continue an unfinished Community setup") > source.indexOf("</CreationSteps>"));
});
test("signing fails closed until review, correct chain and required reads; uncertain reservations remain locked", () => {
  const source = read(ideaPath), community = read(communityPath);
  assert.match(source, /if \(!canSubmit \|\| !reviewAccepted/);
  assert.match(source, /if \(!canApprove \|\| !needsApproval/);
  assert.equal((source.match(/reviewAccepted && chainReady && deploymentReady/g) || []).length, 2);
  assert.equal((source.match(/!isCreateSuccess &&/g) || []).length, 2);
  assert.match(source, /isApproveReceiptLoaded && approveReceipt\?\.status === "success"/);
  assert.match(source, /isCreateReceiptLoaded && createReceipt\?\.status === "success"/);
  assert.match(source, /createReceipt\?\.status === "reverted"/);
  assert.equal((source.match(/!receiptUnresolved &&/g) || []).length, 2);
  assert.match(source, /Refresh transaction receipts \(read-only\)/);
  assert.match(community, /uncertainStep \|\| !canReserveReview\) return/);
  assert.match(community, /formLocked = Boolean\(reservation\) \|\| busy \|\| Boolean\(uncertainStep\)/);
  assert.match(community, /setForm\(reservedForm\(result.config\)\)/);
});
