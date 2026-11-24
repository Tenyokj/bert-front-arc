# V2.4 Revenue Indexer Candidate

Status: **implemented and checked locally on 2026-11-24, not deployed**.
The existing public V2 pool has not been upgraded. This source change does not
activate revenue, choose beneficiaries or publish a Graph deployment.

## Indexed Data

| Entity | Meaning |
| --- | --- |
| `ProtocolRevenueState` | Event-derived current/scheduled policy, accrued, claimed and pending revenue per pool |
| `FundingRoundRevenue` | Immutable receiver/share snapshot, eligible pledge fee, total fee and cumulative earned accrual per round |
| `ProtocolRevenueReceiver` | A discovered Treasury, its binding/discovery status, credits and observed collection/payment totals |
| `RevenueBeneficiary` | Fixed address/share and observed actual payments, not an investor share |
| `RevenueEvent` | Immutable transaction-hash/log-index record for each policy/snapshot/base/accrual/claim/collection/payment event |

Amounts are raw six-decimal USDC integers. `4000` means **0.004 USDC**, not
4,000 USDC. They are not the pool's balance, reserve, donor ownership or APY.
Existing round, pledge, refund, idea and grant entities/handlers are retained.
The six Arc proxy addresses and their original start blocks are unchanged.
The V3 manifest and its history are untouched.

Scheduling does not change current policy; activation affects future snapshots
only. Zero-address/zero-share snapshots remain explicit. An older receiver's
credits, beneficiaries and template remain tracked after rotation or disabling.
`currentPolicyKnown: false` means no activation has been observed, not proof of
a zero on-chain policy. No revenue entity before candidate events means no
observed revenue history; it is not an invented zero accounting snapshot.

`pending = accrued - claimed`, updated only by pool events. A Treasury's
`RevenueCollected` confirms the same transfer already recorded by the pool's
`ProtocolRevenueClaimed`; it does not subtract pending again. Released payments
do not create new revenue or reduce pool custody again. A Treasury can also
receive donations, so `observedReleased` may exceed `observedCollected`; neither
field is asserted to be total lifetime receipts or current token balance.

## Treasury Discovery and Boundaries

Pool scheduling, activation, snapshot, accrual or claim can discover a Treasury.
The mapping verifies its pool/token getters and loads **1-16** unique fixed
payees with nonzero shares summing to 10,000 bps. Only immutable getters are
used: block-end `released` counters would double count same-block payment logs.
The constructor's earlier `PayeeAdded` events are not required for hydration.
Successful discovery creates one dynamic template for subsequent collection and
payment logs. This follows the [Graph data-source template model](https://thegraph.com/docs/en/subgraphs/developing/creating/subgraph-manifest/).

Failed getter calls leave `discoveryStatus: Unavailable`; invalid bindings or
splits leave `Invalid`. Neither becomes an indexed zero-payee success. A later
pool event retries discovery. `trackingStartedAtBlock` records actual template
creation; events before that block are not backfilled by the template. Review
discovery failures and any observation gap before relying on payment history.
These identity checks are not bytecode verification or an independent audit.

Freshly indexing the original pool history is required; do not move its start
block past prior accruals. Missing snapshots, over-accrual, wrong receivers or
claims exceeding indexed pending credit fail indexing rather than inventing
balances. Graph Node owns canonical-chain rollback; the offline store-double
tests do not establish native Graph Node reorg behavior.

## Reproduce the Checks

With root and `subgraph` lockfile dependencies installed, compile the candidate
core using its ordinary Hardhat build first. Then from the frontend root:

```bash
npm --prefix subgraph run sync:revenue-abis
npm --prefix subgraph run codegen:arc
npm --prefix subgraph run build:arc
npm --prefix subgraph run codegen:local
npm --prefix subgraph run build:local
node --test scripts/revenue-mapping.test.mjs
npm test
npm --prefix subgraph run test:security
```

ABI sync reads only `FundingPoolUpgradeable` and `ProtocolRevenueTreasury` ABI
from adjacent `bert-core/artifacts`. `BERT_CORE_PATH` can override that core
directory. It never copies candidate deployment bytecode into the dApp.

Regenerate the committed local raw-log fixture only intentionally:

```bash
BERT_REVENUE_INDEXER_FIXTURE_PATH=subgraph/tests/fixtures/revenue-receipts.json \
node scripts/treasury-contract-check.mjs
```

This starts a disposable in-process chain 31337, uses compiled contracts and
public development accounts, verifies mined receipt status/block hashes and
captures 11 logs across nine blocks. It exercises a 1 USDC pledge, 20% initial
fee vesting, 40% revenue share, collection, fixed payment and future-policy
disable. Final getters and replay agree on 0.004 USDC accrued/claimed/collected/
paid, zero pending, and the old round's unchanged 4,000-bps receiver snapshot.
The harness invokes authorized pool-module paths directly; it is not the full
real GrantManager/browser acceptance flow. No public transactions are sent.

Ten new mapping/manifest tests pass; root total is **87**. They execute the real
handler source with a Graph store/RPC double, decode the raw compiled-contract
receipt fixture, deliver duplicate events and repeat clean replay. Both manifests
codegen/build to WASM; seven toolchain-security tests, root TypeScript and focused
script lint pass. No new native Graph Node deployment/query/reorg test or public
sync is claimed here. Those remain end-to-end/deployment gates.

Follow-up on November 24: the V2.4 browser suite now produces 36 event logs from
106 successful UI transactions across four full GrantManager rounds. The same
handlers replay these receipts with duplicate delivery, reconstructing 0.36
MockUSDC accrued/claimed/collected/paid and zero pending. Argumentless policy
cancellation is decoded as an empty parameter object. Run
`npm run test:e2e:revenue` from the frontend; after browser success the runner
executes the replay automatically. This still uses the Graph store/RPC double,
not a native Graph Node or public sync. See frontend `BROWSER-E2E.md` and core
`docs/V2.4-E2E-ACCEPTANCE.md` for the scenario matrix and open gates.

## Bounded Query Examples

After publishing and syncing a reviewed candidate, this query reads the pool's
policy and at most ten receivers with sixteen beneficiaries each:

```graphql
{
  protocolRevenueState(id: "0x5eddccd772a9e0f079cc6646b529c20e3d46e585") {
    currentPolicyKnown
    currentTreasury
    currentShareBps
    scheduled
    scheduledTreasury
    scheduledShareBps
    readyAt
    accrued
    claimed
    pending
    receivers(first: 10, orderBy: id) {
      id
      discoveryStatus
      trackingStartedAtBlock
      observedCollected
      observedReleased
      pending
      beneficiaries(first: 16, orderBy: id) {
        address
        shareBps
        observedReleased
      }
    }
  }
}
```

For event pagination, use `first: 25`, `orderBy: id`, `orderDirection: asc` and
`where: { pool: "<lowercase pool address>", id_gt: "<last returned id>" }` on
`revenueEvents`. Omit `id_gt` for the first page. This gives a deterministic ID
cursor, not chronological sorting by transaction hash. Request `blockNumber`,
`logIndex`, `txHash`, `kind`, `amount` and optional `treasury`/`round` for context.
Check `_meta` for sync/errors and verify sensitive amounts against pinned RPC
reads. The existing dApp/Console treasury panel remains RPC-backed; this step
does not silently replace it with indexed values or add Console catalog tabs.

## Public Rollout Still Required

The local Graph gate is now passed on a fresh MockUSDC chain: 169 production-
module fixture receipts, 38 matching revenue logs, exact 1.08-USDC totals,
restart, two-block reorg and clean Postgres/IPFS replay. See
[reproduction](NATIVE-REVENUE-ACCEPTANCE.md) and core `docs/V2.4-GRAPH-ACCEPTANCE.md`.
Native Arc financial acceptance remains a separate passing layer; the earlier
Arc-fork historical-bytecode failure below is not reclassified as passing.

The earlier [native indexer lab](NATIVE-REVENUE-ACCEPTANCE.md) runs actual Graph
Node/WASM and Postgres, not a store double. Discovery, exact agreement with 38
native revenue logs/1.08 USDC and process restart passed. Clean replay/reorg did
not pass: the local Arc execution provider cannot serve earlier fixture bytecode.
The fail-closed historical-RPC check now aborts setup in that condition. Current
scope and machine evidence are in core `docs/V2.4-E2E-ACCEPTANCE.md`; this is not
a passing public Graph synchronization check.

Review with the core candidate, then deploy a new **V2** subgraph version to the
existing V2 Studio project only when authorized. Replay from retained start
blocks, confirm sync/no indexing errors and query the new entities against
known post-upgrade receipts. Do not create a V3 Factory or publish this candidate
as already live. Testnet terms are now selected in core's
`release-config/arc-testnet-v2.4.json`: 20% of eligible earned fees to Treasury,
100% of Treasury receipts to the recorded single beneficiary, and 48-hour notice.
That configuration is not a deployed Treasury or active policy. Complete E2E and
the actual upgrade/Graph/Vercel rollout remain separate release gates; follow
core's `docs/V2.4-RELEASE-CONFIGURATION.md` before any public operation.
