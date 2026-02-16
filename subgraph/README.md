# BERT Subgraph

This folder now contains a working local setup (Hardhat + local graph-node) and a sepolia template.

## What changed

- `subgraph.local.yaml` - local Hardhat manifest.
- `subgraph.yaml` - sepolia template manifest.
- `src/mapping.ts` - handlers for:
  - `VotingRoundStarted`
  - `VotingRoundEnded`
  - `VoteCast`
  - `IdeaCreated`
  - `IdeaStatusUpdated`
- `docker-compose.local.yml` - local IPFS + Postgres + graph-node.
- `package.json` - graph CLI scripts.

## Local setup (Hardhat) - step by step

1. Start Hardhat node in your contracts repo (`http://127.0.0.1:8545`).
2. Deploy contracts to that local node.
3. In this repo:
```bash
cd subgraph
npm install
docker compose -f docker-compose.local.yml up -d
npm run codegen:local
npm run build:local
npm run create:local
npm run deploy:local
```

4. Set frontend env:
```env
NEXT_PUBLIC_SUBGRAPH_URL=http://127.0.0.1:8000/subgraphs/name/bert-local
```
5. Restart frontend dev server.

## Important for local mode

- If you redeploy contracts on Hardhat and addresses change:
  - update addresses in `subgraph.local.yaml`
  - run deploy again:
```bash
npm run deploy:local
```

## The Graph Studio (later, sepolia)

1. Register/login at The Graph Studio.
2. Create a subgraph.
3. Install graph-cli and authenticate:
```bash
graph auth --studio <DEPLOY_KEY>
```
4. Put Sepolia contract addresses + start blocks into `subgraph.yaml`.
5. Deploy:
```bash
graph deploy --studio <SUBGRAPH_SLUG> subgraph.yaml
```
6. Create API key in Studio and use query URL in frontend:
```env
NEXT_PUBLIC_SUBGRAPH_URL=https://api.studio.thegraph.com/query/<QUERY_ID>/<SUBGRAPH_NAME>/version/latest
```

## Wallet choice for Studio account

- Use standard EVM wallet (MetaMask is fine).
- Best practice: separate wallet for infra/deployment tasks (not your main treasury/deployer wallet).
- You do not need wallet private key inside frontend for queries.

## Cost model (Studio)

- First 100,000 requests/month are free.
- Above that - usage billing.
- GraphQL queries do not spend Sepolia gas.
