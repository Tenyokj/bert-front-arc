# BERT Community Layer Subgraph: V3.1 / V3.2

This is the separate Graph subgraph for the BERT V3.1 Community Layer. It does not alter or replace the existing V2 subgraph.

Each retained modular `CommunityFactory` is a static data source. Factory creation events register dynamic data sources for every activated `CommunityHub`, `CommunityTreasury`, and V3.1 module. The module addresses are read from the freshly deployed Hub, so newly created Communities are indexed without a manifest update.

## Indexed data

- Community identity, activation state, Hub and Treasury addresses.
- Community-local Members, Admins, Validators and validator eligibility.
- Proposal validation, all four voting lanes, settlement and bond flows.
- Slate rounds, votes, winners and execution budgets.
- V3.1 winning-supporter snapshots, execution plans, milestone evidence, weighted review, releases and refunds.
- Validator reward epochs and claims.
- Treasury withdrawal requests and quorum approvals.
- Source-only Manager 2.0.0 tranche readiness, Admin approvals, actual payments and expiry; historical approvals must be revalidated against current onchain roles.
- Quorum-protected Admin action requests.

Proposal text and full immutable configuration are still read from `CommunityHub` by the frontend. The current contracts do not emit proposal metadata or all config fields in events, so the subgraph deliberately does not invent them.

## Deploy to Arc Testnet

For the pending V3.2 release, after the new Factory proxy is deployed, record its proxy address and deployment block. Do not use the legacy V3.0 Factory address. The original modular V3.1 Factory (`0xe16Cd61a21feA97393e6eEE3A7F7A26828021dD0`, block `66809847`) is retained automatically. A new Factory adds a data source; it does not replace old Communities.

```bash
cd subgraph-v3
export V3_FACTORY_ADDRESS=0x...
export V3_FACTORY_START_BLOCK=123456
npm run build
```

For more than one new/historical modular Factory, use `V3_FACTORY_SOURCES` instead of the two single-Factory variables: a JSON array of `{"address":"0x...","startBlock":"actual deployment block"}`. Invalid/duplicate sources and a changed original deployment block are rejected. Never use a placeholder address/block in a published manifest.

Community entity IDs and frontend routes include `factory-address + Community ID`. Factory A's Community #1 and Factory B's Community #1 are different records. The V3.0 monolithic deployment remains a separate compatibility concern, not a source for these module templates.

Then authenticate and deploy through The Graph Studio **only after** the new contracts and real deployment evidence exist. The installed Graph CLI does not use a `--studio` flag:

```bash
read -rs "GRAPH_STUDIO_DEPLOY_KEY?Graph Studio deploy key: "
echo
../subgraph/node_modules/.bin/graph auth "$GRAPH_STUDIO_DEPLOY_KEY"
../subgraph/node_modules/.bin/graph deploy bert-v-3-1-arc-testnet subgraph.yaml --version-label v3.2.0
unset GRAPH_STUDIO_DEPLOY_KEY
```

Wait for the deployment to report `SYNCED`, then set the returned query endpoint in the frontend as `NEXT_PUBLIC_V3_SUBGRAPH_URL` and redeploy Vercel. The frontend can continue to use direct RPC reads until that endpoint has fully synced.

Codegen/build success is not publication or synchronization. This repository does not claim that the new Factory or tranche schema has already been deployed. Run `npm run test:community-routing` from the frontend root before release.

The Studio slug stays `bert-v-3-1-arc-testnet`; it is a project identifier, not the release number. Publish a new version of that project, not a replacement of original Factory history. V3.2 has not been deployed by these source changes.
