# Native Revenue Indexer Lab

This is an isolated local acceptance harness, not Graph Studio deployment.
It runs the production V2 WASM mappings, real Graph Node/Postgres and Treasury
dynamic template against the sibling core's native Arc GrantManager fixture.
The MetaMask/browser suite is separate and uses MockUSDC.

## Accepted Fresh-Chain Run

2026-11-24: the bounded Graph gate now **passes** on a separate fresh non-fork
chain with MockUSDC, production modules and real Graph Node 0.45.0/Postgres.
169 fixture receipts, all four grant outcomes, exact agreement with 38 revenue
logs/1.08 USDC, process restart, two-block reorg and clean-database replay pass.
This is not native Arc execution; that financial test passed separately.
Core `docs/V2.4-GRAPH-ACCEPTANCE.md` contains the canonical result and raw evidence.

Start the verified Anvil on a free loopback port, then use the two checkouts:

```bash
"$ARC_ANVIL" --network ethereum --chain-id 31337 --host 127.0.0.1 --port 19549 --silent
# core (another terminal)
REVENUE_GRAPH_FIXTURE=true node scripts/local/accept-v2-4-native-grants.mjs
# frontend, Docker Desktop running
REVENUE_GRAPH_FIXTURE=true REVENUE_GRAPH_RESET_LOCAL=true \
  node subgraph/scripts/accept-revenue-graph-node.mjs
```

Mock mode is explicit and checked against the report, non-fork chain and separate
port/output. It does not overwrite the native Arc evidence. The runner selects
Docker's matching local port itself and starts indexing at genesis. The cleanup
and isolated-volume restrictions below apply to both modes.

## Earlier Arc-Fork Run (Historical Limitation)

Status of this earlier path (2026-11-24): **partial evidence, not accepted**. Graph Node 0.40
matched 38 native revenue logs and 1.08-USDC totals and passed process restart.
Clean replay/reorg remains blocked by the Arc fork returning `missing bytecode
for code hash` on an earlier local-contract call. Version 0.45 was also tried;
the harness now checks this historical call before Docker reset/deployment and
fails closed. Do not substitute latest state for historical reads. Core records
both partial results and the failed preflight. A fresh archive-capable fixture
or a separate disposable-chain Graph run is needed before gate 5 closes.

1. Compile ordinary core artifacts and complete the sibling core's
   `node scripts/local/accept-v2-4-native-grants.mjs` on the verified, disposable
   Arc Anvil at `127.0.0.1:19548`, chain 31337. Follow core
   `docs/V2.4-NATIVE-ACCEPTANCE.md`; leave that owned node running.
2. Install the frontend and V2 subgraph dependencies; run the normal V2 revenue
   ABI sync/codegen. Docker Desktop must be available, and ports 19000, 19020,
   19030 and 19501 must be free. Reserve at least 3 GiB free disk before pulling
   images; the observed three compressed downloads total about 290 MiB, with
   additional extraction/database/runtime space needed.
3. From the frontend checkout:

```bash
REVENUE_GRAPH_RESET_LOCAL=true node subgraph/scripts/accept-revenue-graph-node.mjs
```

The explicit flag authorizes resetting **only** Docker project `bert-v24-native`
and its named disposable IPFS/Postgres volumes at setup and clean replay.
Never place personal or shared data in this lab project. There is no daemon-wide
prune. Generated manifests/builds go to Git-ignored `subgraph/.revenue-native/`;
the normal local/public manifests, start blocks and environment files are not
rewritten. `REVENUE_NATIVE_REPORT` may select the core JSON evidence input;
`REVENUE_GRAPH_REPORT` changes only the output evidence path.

## Assertions and Limits

- Check local chain 31337, Arc mode, pinned fork header and canonical native
  acceptance receipt before writes. No Graph Studio key or public signer.
- Rebuild/deploy production mappings to loopback Graph Node 0.45.0; discover
  the receiver through its real immutable getters and instantiate its template.
- Compare all revenue event IDs to canonical RPC logs, exact earned/claimed/
  collected/released values, four round snapshots and the fixed beneficiary.
- Restart Graph Node, then compare entities without double counting.
- Create a local policy event, observe it in GraphQL, revert its two-block branch,
  wait for the indexed hash to match RPC, and check that the orphan event and
  scheduled policy disappear without changing financial entitlements.
- Destroy only this lab's database/IPFS volumes and replay canonical history
  into a clean store; compare the queried revenue entities with the baseline.

The fixture ensures 300 blocks of history from the indexing start before this test. Graph Node 0.40's
[revert guard](https://github.com/graphprotocol/graph-node/blob/v0.40.0/store/postgres/src/deployment.rs)
requires the rewind target to be at least its 250-block reorg threshold beyond
`earliest_block`; a shorter fixture failed that guard. This padding changes no
Solidity rule, accrued amount or public chain. Canonical hash agreement is
required: `Synced` alone is insufficient, and GraphQL may briefly serve the old
branch during a reorg. This does not simulate every provider failure or deep reorg.

The compose file publishes only loopback HTTP endpoints, keeps Postgres private,
limits memory and uses offline IPFS. The native fork still reads the selected
public upstream for historical state; all transactions are on the owned local
chain. The script deliberately does not stop the operator-owned Anvil process.

## Cleanup

Save the generated JSON and needed logs, then:

```bash
docker compose -p bert-v24-native -f subgraph/docker-compose.revenue.yml down -v
```

Stop only the Arc Anvil started for this run. Do not reset a shared node or use
these public development accounts with real assets. No public deployment,
public synchronization check, independent audit or mainnet approval is implied.
