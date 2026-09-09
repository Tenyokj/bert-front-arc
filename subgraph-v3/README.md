# BERT V3 Subgraph

This is a separate Graph subgraph for the BERT V3 Community Layer. It does not alter or replace the existing V2 subgraph.

`CommunityFactory` is the single static data source. Its creation events register dynamic data sources for every activated `CommunityHub` and every reserved `CommunityTreasury`, so newly created Communities are indexed without a manifest update.

## Indexed data

- Community identity, activation state, Hub and Treasury addresses.
- Community-local Members, Admins, Validators and validator eligibility.
- Proposal validation, binary voting, settlement and bond flows.
- Slate rounds, votes and settlement.
- Validator reward epochs and claims.
- Treasury withdrawal requests and quorum approvals.
- Quorum-protected Admin action requests.

Proposal text and full immutable configuration are still read from `CommunityHub` by the frontend. The current contracts do not emit proposal metadata or all config fields in events, so the subgraph deliberately does not invent them.

## Deploy to Arc Testnet

After V3 Factory is deployed, record its proxy address and deployment block:

```bash
cd subgraph-v3
export V3_FACTORY_ADDRESS=0x...
export V3_FACTORY_START_BLOCK=123456
npm run build
```

Then authenticate and deploy through The Graph Studio:

```bash
../subgraph/node_modules/.bin/graph auth --studio <DEPLOY_KEY>
../subgraph/node_modules/.bin/graph deploy --studio <SUBGRAPH_SLUG> subgraph.yaml
```

Set the returned query endpoint in the frontend as `NEXT_PUBLIC_V3_SUBGRAPH_URL`. The frontend can continue to use direct RPC reads until that endpoint has fully synced.
