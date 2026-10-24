# BERT Community Layer Subgraph: V3.1 / V3.2

This is the separate Graph subgraph for the BERT V3.2 Community Layer with retained V3.1 history. It does not alter or replace the existing V2 subgraph.

Each retained modular `CommunityFactory` is a static data source. Factory creation events register dynamic data sources for every activated `CommunityHub`, `CommunityTreasury`, and modular V3 runtime contract. The module addresses are read from the freshly deployed Hub, so newly created Communities are indexed without a manifest update.

## Indexed data

- Community identity, activation state, Hub and Treasury addresses.
- Community-local Members, Admins, Validators and validator eligibility.
- Proposal validation, all four voting lanes, settlement and bond flows.
- Slate rounds, votes, winners and execution budgets.
- V3.1 winning-supporter snapshots, execution plans, milestone evidence, weighted review, releases and refunds.
- Validator reward epochs and claims.
- Treasury withdrawal requests and quorum approvals.
- Deployed V3.2 Manager 2.0.0 tranche readiness, Admin approvals, actual payments and expiry; historical approvals must be revalidated against current onchain roles.
- Quorum-protected Admin action requests.

Proposal text and full immutable configuration are still read from `CommunityHub` by the frontend. The current contracts do not emit proposal metadata or all config fields in events, so the subgraph deliberately does not invent them.

## Deploy to Arc Testnet

Install the shared CLI from `../subgraph` with `npm ci --ignore-scripts --no-fund`
and run `npm run test:security` there first (Node.js >=22.13.0). V3 build scripts
use that lockfile-backed CLI, not a globally installed `graph`. The reviewed
tooling changes and open advisories are in [Dependency Security](../DEPENDENCY-SECURITY.md#phase-3---subgraph-toolchain).

V3.2 is deployed: use Factory `0xf793786BCecfbfE35a22E36180032b32BD5208Ba` from block `68888068`. Do not use the legacy V3.0 Factory address. The original modular V3.1 Factory (`0xe16Cd61a21feA97393e6eEE3A7F7A26828021dD0`, block `66809847`) is retained automatically. A new Factory adds a data source; it does not replace old Communities.

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

Codegen/build success is not publication or synchronization. For current deployment evidence, see the record below. Run `npm run test:community-routing` from the frontend root before a new release.

The Studio slug stays `bert-v-3-1-arc-testnet`; it is a project identifier, not the release number. Publish a new version of that project, not a replacement of original Factory history. A tooling-only security update does not require another Studio deployment when compiled output is unchanged.

## Current Arc deployment (24 October 2026)

Version **v3.2.0** is deployed and synced at
https://api.studio.thegraph.com/query/1742046/bert-v-3-1-arc-testnet/v3.2.0.
The Studio slug retains its historical name. It indexes V3.1 Factory
`0xe16Cd61a21feA97393e6eEE3A7F7A26828021dD0` from **66809847** and
V3.2 Factory `0xf793786BCecfbfE35a22E36180032b32BD5208Ba` from **68888068**.
Graph deployment: `QmPRRt8FN9ibN4LhSmBBoxEc5WBj55ThE2LjGyRyTNL2oh`.
Old Community records retain their original policy, not the new Manager behavior.
