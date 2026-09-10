# BERT Frontend

The public web application for the BERT Protocol on Arc Testnet.

It presents two on-chain protocol layers:

- **BERT V2**: ideas, rounds, voting, funding and grants.
- **BERT V3 Community Layer**: independent Community Hubs with membership, validation, binary proposals, Slate Rounds, validator rewards and quorum-protected treasury actions.

The deployed testnet app is available at [bertdao.vercel.app](https://bertdao.vercel.app). This repository contains only public client-side configuration and ABIs. Never put private keys, World ID signing keys, deployment keys, or Redis tokens in `NEXT_PUBLIC_*` variables.

## Repository Map

| Path | Purpose |
| --- | --- |
| `src/app` | Next.js routes, including the V2 dApp and V3 Community Layer. |
| `src/components` | Wallet, voting, Community, PoP and shared UI components. |
| `src/lib` | Contract clients, ABIs, Graph queries and chain-aware data helpers. |
| `src/abi` | V2 and V3 contract ABI artifacts used by the client. |
| `subgraph` | The existing V2 Graph subgraph. |
| `subgraph-v3` | The separate V3 Graph subgraph. |
| `public/docs` | Protocol documentation rendered by the public site. |
| `scripts` | Explicit maintenance scripts for synchronizing public V3 ABI artifacts. |

## Local Development

Requirements: Node.js 20 or newer and npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. Use a local Hardhat node for contract development, or select Arc Testnet through the environment configuration and wallet.

Useful checks:

```bash
npm run lint
npm run build
```

## Environment Configuration

Copy `.env.example` to `.env.local`. The example deliberately contains placeholders only.

| Group | Required purpose |
| --- | --- |
| `NEXT_PUBLIC_*_RPC_URL` | Arc Testnet and local Hardhat RPC endpoints. |
| `NEXT_PUBLIC_*_ADDRESS` | Public deployed V2/V3 contract addresses. |
| `NEXT_PUBLIC_SUBGRAPH_URL` | V2 Graph query endpoint. |
| `NEXT_PUBLIC_V3_SUBGRAPH_URL` | V3 Graph query endpoint. Direct RPC reads remain a fallback while indexing catches up. |
| `NEXT_PUBLIC_V3_EVENT_FROM_BLOCK` | Arc deployment block used to avoid querying pruned RPC history. |
| `NEXT_PUBLIC_POP_BACKEND_URL` | Public URL of the BERT PoP backend. |
| `NEXT_PUBLIC_POP_DEMO_ENABLED` | Set `true` only for Arc Testnet. Enables the clearly labelled test-only Demo verification path. |
| `NEXT_PUBLIC_WORLD_*` | Public World ID client configuration. |
| `GRAPH_STUDIO_API_KEY` | Server/build-time key only. Do not prefix it with `NEXT_PUBLIC_`. |

## Verification By Environment

### Arc Testnet: current public deployment

The dApp uses **Demo verification** so every Arc Testnet wallet can access protected flows. It creates a real on-chain `PoPVerifier` record with provider ID `BERT_TESTNET_DEMO`, but it is not proof of personhood and provides no Sybil resistance. Set `NEXT_PUBLIC_POP_DEMO_ENABLED=true` only alongside a backend configured with `POP_DEMO_ENABLED=true`.

### Mainnet: planned production policy

Demo verification is disabled. The frontend will open World ID, the backend will validate the proof and bind its unique World nullifier to one wallet, then the wallet will finalize a signed payload through `PoPVerifierUpgradeable`. The frontend, backend, World action, Arc chain ID and deployed verifier address must match exactly.

Read the full [Testnet Guide](https://bertdao.vercel.app/testnet-information) before using the public deployment.

## Data and Contract Sources

The browser reads public contract state directly through viem/wagmi. The Graph is used for indexing and discovery, not as a source of authority:

- V2 uses the existing V2 subgraph for protocol activity.
- V3 uses its own subgraph for Community discovery, role/activity views and event history.
- Permission checks, balances, settlement availability and transaction actions are always derived from live on-chain state.

When changing V3 Solidity ABIs, synchronize the public frontend artifact deliberately:

```bash
BERT_CORE_PATH=../../bert-core npm run sync:v3-artifact
```

Then inspect the ABI diff, run lint/build, and update the V3 subgraph artifacts if relevant. Never copy private deployment files into this repository.

## Deployment

The application is deployed on Vercel. Configure environment variables in the Vercel project for the target environment, redeploy, then check:

1. Wallet connection on Arc Testnet.
2. V2 and V3 public contract reads.
3. V3 subgraph availability and RPC fallback.
4. PoP backend health and Demo verification with a fresh Arc Testnet wallet.
5. Before mainnet, a complete production World ID verification with a real credential.
5. `npm run lint` and `npm run build` locally before merging.

## Security and Responsible Disclosure

Do not open public issues for vulnerabilities. Read [SECURITY.md](./SECURITY.md) and submit reports through the central [BERT Core private advisory channel](https://github.com/Tenyokj/bert-core-arc/security/advisories/new). The public [Bug Bounty page](https://bertdao.vercel.app/bug-bounty) explains the testnet scope and non-cash validator-seat reward policy.

## Contributing

Read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening a pull request. Forks and pull requests are welcome; only repository maintainers can merge or deploy changes.

## Related Repositories

- [BERT Core](https://github.com/Tenyokj/bert-core-arc): Solidity protocol and deployment tooling.
- [BERT Backend](https://github.com/Tenyokj/bert-backend-arc): Arc Testnet Demo and production World ID verification-signing service.
