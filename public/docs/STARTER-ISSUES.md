# First Contributor Issues

These are ready-to-publish issue drafts, not claims that GitHub Issues already
exist. Publish each in the named repository, check for duplicates first, and
assign one owner before inviting contributors. `good first issue` fits the
documentation task; the transaction and accounting tasks need an experienced
tester. No issue promises compensation.

## 1. Docs: test the V3.2 pilot instructions with a new reader

**Repository:** `Tenyokj/bert-docs-arc`  
**Suggested labels:** `documentation`, `good first issue`

**Problem:** A new community organizer may not know whether to open the
read-only Console, connect a test wallet, or set up the local Hardhat lab.

**Task:** Follow the public Community Pilot page from a clean browser session.
Without asking a maintainer, identify the first read-only step, the first
optional testnet write, and the safety warning. Report confusing labels or
missing links. Edit only the documentation; do not change protocol behavior.

**Done when:** The report lists the exact page/anchor, the confusing sentence,
what the reader expected, and a suggested replacement. A PR, if needed,
updates the affected copy and checks all internal anchors and external links.

## 2. Frontend QA: wallet/account switch during V3.2 Community entry

**Repository:** `Tenyokj/bert-front-arc`  
**Suggested labels:** `help wanted`

**Problem:** Cached role, balance, or allowance state after an account switch
could show an invalid action to a different wallet.

**Task:** On Arc Testnet or a disposable local chain, open a V3.2 Community as
one wallet, switch to an unrelated wallet, and inspect entry, proposal, and
vote controls before any transaction. Then switch back. Record whether all
read-only labels and available actions match direct contract state. Reject one
wallet prompt; do not spend real assets.

**Done when:** The issue or PR contains the chain ID, app commit, Community
address, both wallet roles (addresses may be redacted in screenshots but must
be reproducible), exact UI steps, expected/actual state, and screenshots or
logs. If a bug is found, a narrow regression test or fix is welcome.

## 3. Console QA: reconcile one V3.2 proposal across three sources

**Repository:** `Tenyokj/bert-console-arc`  
**Suggested labels:** `help wanted`

**Problem:** The Console may show indexed history that lags or disagrees with
live Hub/module reads, especially shortly after a transaction.

**Task:** Pick one public testnet Community proposal (record its Factory and policy) and compare its identity,
status, vote totals, and relevant budget fields in BERT Console, the V3.2
subgraph, and direct contract reads. Repeat just after a new event if you own
a suitable test Community. Do not mistake normal indexing lag for a contract
bug.

**Done when:** Provide the proposal/Community IDs, transaction and block,
query and direct-read method, each observed value, indexed block/time, and a
clear classification: consistent, expected lag, UI bug, mapping bug, or
unresolved. No private keys or Graph deploy keys in the report.

## 4. Core QA: replay one V3.2 failed-plan refund locally

**Repository:** `Tenyokj/bert-core-arc`  
**Suggested labels:** `help wanted`

**Problem:** A successful first tranche followed by a failed review must not
make released funds refundable or allow duplicate supporter claims.

**Task:** Use [LOCAL-V3.1-E2E.md](LOCAL-V3.1-E2E.md) and the V3.2 cases in
[TESTING.md](TESTING.md) to drive one Admin Binary winner to its first payout,
then fail the plan through the documented review route. Check the eligible
supporter set, unreleased reserve, one valid claim, duplicate claim, and one
ineligible claim. Use the time-travel script; do not weaken contract durations.

**Done when:** Submit a minimal reproducible test or report with commit SHA,
wallet roles, contract addresses, before/after MockUSDC balances, expected
accounting equation, transaction traces, and exact commands. Send a possible
exploit privately through the repository security advisory instead of
publishing it here.
