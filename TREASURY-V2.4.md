# Treasury UI and V2.4 Rollout

Status: **V2.4 contracts installed, clients and V2 Graph v0.4.0 published and
verified; revenue policy scheduled, not active**. Updated 2026-11-24.
The proxy address is unchanged and legacy-pool compatibility is retained.
Treasury: `0xeCF9D2fD1914D1aFa124498931fdAA976D4e143b`. A separate activation
is required at/after 2026-11-26 22:03:24 UTC. A public revenue pilot is recommended
follow-up, not a technical prerequisite for activation or this testnet release.
See core `docs/V2.4-ARC-TESTNET-RELEASE.md` for receipts and payout instructions.

## Behavior

- `/pool` reads one mined block: actual USDC, recorded custody, protocol reserve,
  pending earned revenue, other recorded funds, surplus and shortfall.
- Legacy deployments show base accounting and unavailable revenue, not an
  invented zero. Runtime selector detection is a compatibility hint, not code
  verification; failure to decode a detected V2.4 getter is an error.
- Current/scheduled settings and an optional round ID expose round snapshots.
  Older rounds locate their original Treasury after rotation or disabling.
  Cumulative accrual includes collected amounts; it is not pending credit.
- Each Treasury shows its pool credit, balance and up to 16 fixed payees with
  shares, released and releasable amounts. Bindings and share arithmetic are
  checked; identity getters are not an independent bytecode audit.
- Admin schedule/cancel and permissionless delayed execution are simulated
  before one wallet submission. Wallet/network are rechecked, duplicate clicks
  locked, changed pending settings rejected, and receipt status inspected.
  Ambiguous broadcasts require an explicit read-only refresh; no automatic resend.
- Collection goes only to Treasury; release goes only to a fixed beneficiary.
  Neither requires a token approval. Donations follow the fixed split, but are
  not counted as pool-earned revenue. Pool pause does not pause already collected
  Treasury payouts; issuer restrictions may independently block them.
- The old donor "Share of pool" display is removed. Its ledger is not ownership,
  an investor share, APY or a general withdrawal right. Payment records are not
  described as unique funded projects.

## Verification

```bash
npm test
npm run typecheck
npm run lint
npm run build
node scripts/treasury-contract-check.mjs
```

The contract check requires the adjacent core checkout and ordinary compiled
V2.4 artifacts (`BERT_CORE_PATH` overrides the core path). It creates an in-process
Hardhat chain 31337, checks compiled legacy/new proxies and Treasury through the
same client reader, and closes the connection. No public signer is used. It
covers delayed settings, accrual/collection/payment and historical receiver lookup,
not the complete GrantManager lifecycle or browser wallet confirmations.

The 17 pool and 10 Treasury ABI signatures were compared with compiled core.
Existing deployable V2 artifacts were not replaced with unreleased bytecode.
The reader/readout are mirrored in Console; keep signatures and tests aligned.

`scripts/treasury-ui-smoke.mjs` targets local built servers on ports 13500/13501
(URLs configurable). Run the contract check first for its fixture. The browser
check covers anonymous legacy reads, a local-contract modern readout fixture,
RPC-error rendering and desktop/mobile layout. It never confirms wallet writes.
Build explicitly for the intended network if a personal `.env.local` overrides
Arc configuration; that file was not changed by these checks.

Results: 77 frontend tests and TypeScript pass; treasury files lint clean.
Full frontend lint retains 28 existing warnings. Browser smoke and local compiled-
contract checks pass. This is bounded UI/integration verification, not full E2E.

## Before Publishing

The earlier Next.js 16.4.3 security blocker is resolved locally by the November 24
patch to Next.js and eslint-config-next 16.4.6. Both client production builds now
pass without bypassing the guard, and Next is absent from audit. See
[dependency security](DEPENDENCY-SECURITY.md) for dated counts and remaining risks:
the dApp still has high/moderate wallet/transitive findings. RainbowKit/Wagmi
were not migrated. Local verification does not patch public deployments.
The bounded wallet/contracts/indexer acceptance is recorded as complete in core's
`docs/V2.4-E2E-ACCEPTANCE.md`; public pilot and publication remain step 6.

## V2 Indexer Follow-up

The separately implemented local [revenue indexer candidate](subgraph/REVENUE-V2.4.md)
adds event-derived policy/round/receiver/payment history without changing the
RPC-backed panel above. Ten mapping/manifest tests bring the root suite to 87.
Both Graph manifests build; compiled local receipts match replay. Graph Node
public sync and both client GraphQL proxies were subsequently verified; the separate Graph acceptance check
is described below. A subsequent bounded
[browser acceptance run](BROWSER-E2E.md#v24-candidate-24-november-2026) now covers
the actual GrantManager success/refund path and revenue actions with a local
EIP-1193 test wallet and MockUSDC (106 UI receipts). It does not test the MetaMask
extension or complete native-Arc lifecycle. Core's `V2.4-E2E-ACCEPTANCE.md` records
the remaining acceptance gates. The subsequent native GrantManager acceptance
passes separately with 160 receipts and exact 1.08-USDC earned payments; it is
not this browser test. Real Graph Node discovery/query/restart matches 38 logs,
and the subsequent fresh-chain MockUSDC run passes clean replay and controlled
reorg too. The earlier Arc-fork history limitation is retained, not bypassed.
See [indexer lab](subgraph/NATIVE-REVENUE-ACCEPTANCE.md).
