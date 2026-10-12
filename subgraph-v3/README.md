# BERT V3.1 Subgraph

This is the separate Graph subgraph for the BERT V3.1 Community Layer. It does not alter or replace the existing V2 subgraph.

`CommunityFactory` is the single static data source. Its creation events register dynamic data sources for every activated `CommunityHub`, `CommunityTreasury`, and V3.1 module. The module addresses are read from the freshly deployed Hub, so newly created Communities are indexed without a manifest update.

## Indexed data

- Community identity, activation state, Hub and Treasury addresses.
- Community-local Members, Admins, Validators and validator eligibility.
- Proposal validation, all four voting lanes, settlement and bond flows.
- Slate rounds, votes, winners and execution budgets.
- V3.1 winning-supporter snapshots, execution plans, milestone evidence, weighted review, releases and refunds.
- Validator reward epochs and claims.
- Treasury withdrawal requests and quorum approvals.
- Quorum-protected Admin action requests.

Proposal text and full immutable configuration are still read from `CommunityHub` by the frontend. The current contracts do not emit proposal metadata or all config fields in events, so the subgraph deliberately does not invent them.

## Deploy to Arc Testnet

After the V3.1 Factory proxy is deployed, record its proxy address and deployment block. Do not use the legacy V3.0 Factory address.

```bash
cd subgraph-v3
export V3_FACTORY_ADDRESS=0x...
export V3_FACTORY_START_BLOCK=123456
npm run build
```

Then authenticate and deploy through The Graph Studio. The installed Graph CLI does not use a `--studio` flag:

```bash
read -rs "GRAPH_STUDIO_DEPLOY_KEY?Graph Studio deploy key: "
echo
../subgraph/node_modules/.bin/graph auth "$GRAPH_STUDIO_DEPLOY_KEY"
../subgraph/node_modules/.bin/graph deploy <SUBGRAPH_SLUG> subgraph.yaml --version-label v3.1.0
unset GRAPH_STUDIO_DEPLOY_KEY
```

Wait for the deployment to report `SYNCED`, then set the returned query endpoint in the frontend as `NEXT_PUBLIC_V3_SUBGRAPH_URL` and redeploy Vercel. The frontend can continue to use direct RPC reads until that endpoint has fully synced.
