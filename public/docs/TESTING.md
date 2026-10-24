# BERT Contributor Testing Guide

For the unreleased Manager 2.0.0, also test the complete
[Admin-tranche quorum flow](V3.2-TRANCHE-QUORUM.md): no automatic initial payout,
fresh approvals per stage, current-role nonce validity, permissionless fixed
payment, seven-active-day expiry, 100/80/40 unpaid-budget refunds, pause and
proof deadlines measured from actual payment. Original live Managers differ.

**Source release:** current local commands exercise unreleased V3.2, not original V3.1. Use [V3.2 release scope](V3.2-RELEASE.md). Historical live checks remain separately labelled.

**Status:** public Arc Testnet testing guide for deployed BERT V2.3 and V3.1.
This is not an audit report, a production readiness claim, or permission to
use real funds.

This document is the canonical QA and security-testing playbook for external
testers, frontend contributors, indexer operators, and smart-contract
reviewers. A useful result is reproducible: it names the commit, chain,
contracts, actor, transaction, expected invariant, and observed result.

## 1. Scope and Safety Boundary

| Area | Current target | Primary outcome |
| --- | --- | --- |
| V2.3 | USDC stake-backed grant selection | Conditional pledges, pull refunds, and backer-reviewed delivery |
| V3.1 | Modular Community Layer | Four governance lanes and supporter-reviewed execution plans |
| Frontend | Next.js dApp | Correct state, permissions, transaction preparation, and recovery |
| Indexing | V2/V3 subgraphs | Event-derived history and discovery, never write authorization |
| Operations | Scripts and release configuration | Correct addresses, roles, proxy ownership, and pause behavior |

Use local Hardhat accounts or Arc Testnet assets only. Do not send valuable
assets to BERT test deployments. Do not submit a real personhood credential,
seed phrase, private key, or API secret in an issue or report.

The Arc Testnet Demo PoP path is a test-only signed attestation. It proves that
the onchain access control works; it is not Sybil resistance and must not be
evaluated as a production identity system.

## 2. Required Tooling

| Repository | What to test |
| --- | --- |
| bert-core-arc | Solidity contracts, Hardhat tests, deployment and local E2E scripts |
| bert-front-arc | Wallet UX, transaction flows, ABI/configuration, direct-read fallbacks |
| bert-backend-arc | Demo PoP issuing path, signature boundary, expiry, and error handling |
| bert-docs-arc | Contract addresses, test instructions, and protocol claims |

~~~bash
node --version # Node 22.10 or newer
npm install
npx hardhat compile
npx hardhat test
npx hardhat --coverage
slither . --filter-paths "node_modules|test|legacy"
~~~

Coverage identifies unexecuted paths; it is not proof of correctness. Slither
findings must be reproduced and triaged against the actual capability graph.

## 3. Local E2E Lab

The canonical setup is [LOCAL-V3.1-E2E.md](LOCAL-V3.1-E2E.md). It deploys
disposable V2 and V3.1 contracts to Hardhat chain ID 31337, mints MockUSDC,
and writes local-only PoP attestations. No backend or local subgraph is needed.

Use these eight public development accounts from one `npx hardhat node` run:

| Account | E2E role | Required V3.1 checks |
| --- | --- | --- |
| #0 | Creator, initial Admin, Administration execution wallet | Factory creation, Admin flow, proof submission |
| #1 | Second Admin | Quorum, pause, archive, withdrawal cancellation |
| #2 | Validator | Member proposal validation and reward epoch checks |
| #3 | Member Binary author | Bond, validation, Binary path |
| #4 | Member Slate author | Bond, validation, Slate path |
| #5 | Winning supporter/reviewer | Vote, milestone review, refund claim |
| #6 | Winning supporter/reviewer | Vote, milestone review, refund claim |
| #7 | Winning supporter/reviewer | Vote, milestone review, refund claim |

Do not reuse a previous node's imported MetaMask accounts by label. Verify every
wallet by its address printed by the current node. Restarting Hardhat destroys
all local state and changes every deployed address.

### Required local deployment order

1. Start one local node: `npx hardhat node`.
2. Deploy V2 proxies with `scripts/deploy/deploy-proxies.ts`.
3. Deploy V3.1 with `scripts/deploy/deploy-v3-2.ts` using the local PoP proxy.
4. Run `scripts/deploy/configure-v3-2-funding-pool.ts` once to authorize the
   V3.1 Factory in FundingPool.
5. Mint MockUSDC with `scripts/local/mint-v3-test-usdc.ts`.
6. Record local PoP attestations with `scripts/local/verify-v3-test-wallets.ts`.
7. Point frontend `.env.local` at the fresh addresses and run `npm run dev`.

The one-day V3.1 milestone-review minimum is deliberate. Do not weaken it for a
demo. Advance only the local chain clock with `scripts/local/advance-time.ts`.

## 4. V2.3 Functional Matrix

Run direct reads before and after every terminal transaction. Record transaction
hash, actor, expected result, actual result, and balance/accounting change.

| ID | Scenario | Expected invariant |
| --- | --- | --- |
| V2-01 | Create an idea with valid author bond and minimum net funding target | Bond locks once; target uses 6-decimal USDC units |
| V2-02 | Malformed creation: zero target, invalid metadata, insufficient bond, gated unverified actor | Revert without changing pool or idea state |
| V2-03 | Start a round from eligible queued ideas | Configured bounds hold; used ideas are not silently reused |
| V2-04 | Pledge to one candidate | Pledge remains attributable to voter and selected idea |
| V2-05 | Settle a viable winner | Only winner pledge capital becomes its grant budget after disclosed fee policy |
| V2-06 | Claim losing pledges | Each loser pulls only own amount once; loser capital never funds another idea |
| V2-07 | Settle no viable winner | All pledges are refundable; no grant begins |
| V2-08 | Start and review winning grant | V2.3 backer milestones follow release, correction, expiry, and refund policy |
| V2-09 | Pause deposits, pledges, settlement, claims, and grants | Paused functions fail where specified; recovery reads/claims remain accurate |
| V2-10 | Reconcile token and FundingPool accounting | Internal buckets and actual token balance agree |

For every terminal V2.3 route answer:

1. Which wallets supplied each USDC unit?
2. Which amount is refundable, locked, fee-derived, reserved, or released?
3. Can any voter receive more than their recorded entitlement?
4. Can a failed idea or losing pledge create unaccounted balance?
5. Is author bond distinct from voter capital at every step?

## 5. V3.1 Functional Matrix

Create a Community with two-Admin quorum, one Validator, a dedicated
Administration execution wallet, and short local voting windows. The Community
Treasury remains custodian: the execution wallet receives only approved winner
tranches and has no generic right to withdraw Treasury funds.

| ID | Scenario | Expected invariant |
| --- | --- | --- |
| V3-01 | Factory reserve, matching Hub deployment, activation | Only creator and exact config/Treasury pair activate canonical Community |
| V3-02 | Join and exit lifecycle | Entry stake locks; role overlap and unresolved exits are blocked |
| V3-03 | Admin Binary | Voting has no Validator review and no Validator reward share |
| V3-04 | Member Binary | Bond locks; only Validators decide; threshold/deadline is enforced |
| V3-05 | Admin Slate | One selection per Member, deterministic winner, one settlement |
| V3-06 | Member Slate | Only approved Member proposals enter; winner starts plan |
| V3-07 | Binary NO or tie | Correct reserve route and one-time NO-voter refund claims |
| V3-08 | Validator reward epoch | Only active eligible Validators claim once after finalization |
| V3-09 | Admin action queue | Second Admin approval required for protected roster/pause/archive/cancellation |
| V3-10 | Treasury withdrawal | Reservation, quorum, execution, and cancellation agree |
| V3-11 | Successful plan | Winner gets 20/40/40 only once per tranche |
| V3-12 | Review electorate | Patched Manager rejects recipient approve/reject in ordinary/corrected/grace review; excludes its weight/count from thresholds but includes it in financial refunds. Test all four lanes. Original deployed Managers remain vulnerable until separately handled |
| V3-13 | Review threshold | 40% eligible support-weight participation, 6,667 bps (66.67%) approval, max(3, ceil(3% of eligible supporters)) approvers |
| V3-14 | Rejection and correction | One correction after cooldown; second rejection fails plan |
| V3-15 | No quorum/proof expiry | No automatic payout; unreleased reserve becomes supporter refunds |
| V3-16 | Pause-aware deadlines | Community clock freezes voting, proof, review, and action windows |
| V3-17 | Legacy boundary | V3.0 cannot impersonate V3.1 Factory, Hub, Treasury, or module |

### Required V3.1 balance assertions

~~~text
successful plan:
  Treasury reserves B
  execution wallet receives 20% of B at settlement
  first approved milestone releases 40% of B
  second approved milestone releases remaining 40% of B
  Completed plan has no remaining reserve

failed plan:
  execution wallet keeps only already approved tranches
  unreleased reserve is claimable only by winning supporters
  each eligible supporter claims at most once
  unrelated Members, NO voters, Admins, and Validators cannot claim
~~~

## 6. Security and Adversarial Testing

Try to violate an invariant, not merely complete happy paths.

| Domain | Adversarial cases |
| --- | --- |
| Authorization | Call protected functions as unrelated wallet, Member, Validator, Admin, executor, and removed role holder |
| Token behavior | Use fee-on-transfer, reverting, false-returning, callback/reentrant, and non-standard ERC-20 mocks |
| Reentrancy | Attempt nested join, vote, settlement, tranche, refund, and withdrawal actions from callbacks |
| Time | Call before, at, and after deadlines; repeat while Community is paused and resumed |
| Accounting | Compare token balances, escrow, execution reserve, refund liabilities, and claim flags |
| Upgradeability | Check storage layout, initializer protection, proxy admin ownership, implementation code, and append-only storage |
| Indexing | Restart/redeploy indexer, create Community, compare entities to direct Factory/Hub/Treasury reads |
| Frontend | Change wallet/chain mid-flow, reject prompts, use stale tabs, refresh after receipt, revoke allowance |

Read [SECURITY-REVIEW-V3.1.md](SECURITY-REVIEW-V3.1.md) before opening a
finding. It records known internal triage, not an external audit conclusion.

## 7. Frontend and Indexer QA

For each dApp transaction:

1. Confirm active wallet chain before showing write CTA.
2. Read contract state immediately before preparing calldata.
3. Verify allowance spender is actual FundingPool or Community Treasury.
4. Reject/cancel wallet prompt and confirm UI never claims success.
5. Wait for receipt, refresh direct reads, compare displayed status/balances.
6. Test RPC/indexer delay: UI may load, but may not invent permission, balance, or settlement.

For subgraph testing:

1. Pin Factory and start block from release manifest.
2. Confirm Factory event creates expected Hub/Treasury data sources.
3. Compare Community, proposal, vote, plan, and refund events to direct reads.
4. Confirm pagination/sorting do not duplicate or omit IDs.
5. Treat indexer as discovery/history only; direct reads remain authoritative.

## 8. Test Report Template

~~~text
Title:
Area: V2.3 / V3.1 / frontend / backend / subgraph / operations
Environment: local Hardhat or Arc Testnet, chain ID, commit SHA, addresses
Actor: wallet role and address
Preconditions: configuration, roles, balances, and relevant prior state
Steps: exact reproduction commands, calldata, or UI actions
Expected result:
Actual result:
Evidence: tx hashes, state reads, logs, screenshots, call traces, PoC/test
Impact and suggested severity:
~~~

Never publish a private exploit path before maintainers acknowledge it. For a
high-impact issue, use the repository security contact rather than a public
issue.

## 9. Completion Criteria

A tester cycle is complete only when all are true:

1. Relevant compilation and automated suite passed from clean install.
2. Tester performed happy-path and negative-path checks for the scope.
3. Reported balances/state changes have transaction hashes or direct reads.
4. Every deviation includes minimal reproduction and environment details.
5. No result is described as mainnet guarantee or formal audit.

Next references:

1. [LOCAL-V3.1-E2E.md](LOCAL-V3.1-E2E.md) for exact local environment.
2. [V2.3-BACKER-MILESTONES-SPEC.md](V2.3-BACKER-MILESTONES-SPEC.md) for V2.3 policy.
3. [SECURITY-REVIEW-V3.1.md](SECURITY-REVIEW-V3.1.md) for Slither triage.
4. [OPERATIONS.md](OPERATIONS.md) and deployment scripts for release controls.
