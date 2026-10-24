**Getting Started**

Current code: BERT V2.3 and V3.2 on Arc Testnet. Read
[CURRENT-RELEASE.md](CURRENT-RELEASE.md) before interpreting legacy payout constants.

**Requirements**
1. `node >= 22.10`
2. `npm`

**Clone**
```bash
git clone <repo-url>
cd <repo-name>
```

**Install**
```bash
npm i
```

**Compile**
```bash
npx hardhat compile
```

**Run Tests**
```bash
npx hardhat test
```

**Local Node (Optional)**
```bash
npx hardhat node
```

**Deploy (Localhost)**
```bash
npx hardhat run scripts/deploy/deploy-proxies.ts --network localhost
```
For a complete local V3.2 environment, wallet minting, Demo attestations and
clock advancement, follow [LOCAL-V3.1-E2E.md](LOCAL-V3.1-E2E.md). There is no
current `deploy-faucet.ts` script in this repository.

**Arc Testnet Setup**
1. Copy `.env.example` to `.env`
2. Set `ARC_TESTNET_RPC_URL`, `DEPLOYER_KEY`, and the addresses required by the [deployment runbook](DEPLOYMENT.md).

**Deploy (Arc Testnet)**
```bash
npx hardhat run scripts/deploy/deploy-proxies.ts --network arcTestnet
```

This deploys a fresh core, not an upgrade of live proxies. For the existing
release use the [versioned deployment record](https://github.com/Tenyokj/bert-core-arc/blob/arc-usdc-migration/deployments/arc-testnet-v3.json)
and [current V3.2 release record](V3.2-ARC-TESTNET-RELEASE.md). Configure V2.3 backer
milestones explicitly using the documented deployment scripts.
