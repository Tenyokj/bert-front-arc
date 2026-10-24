**FAQ**

**Why does GrantManager still expose a 30% initial payout constant?**
It supports legacy reviewer rounds (30/40/30) and V2.3 backer-governed rounds
(20/40/40). `isBackerMilestoneRound(roundId)` selects the mode snapshotted when
the round started. Constants occupy no ordinary storage slots; legacy values
preserve executable old-round policy, whereas `authorSharePercent` is a retained
storage variable. See [CURRENT-RELEASE.md](CURRENT-RELEASE.md).

**Why do I see multiple ProxyAdmins?**
Each Transparent proxy creates its own ProxyAdmin in OZ v5. This is expected.

**Why does the admin slot show 0x0?**
A zero slot can mean a wrong network/address, an address without code, or a different proxy pattern. Confirm chain ID, code and the intended deployment manifest first. A restarted local node needs fresh local deployments; do not redeploy a public protocol merely because one read failed.

**Why does upgrade fail with owner errors?**
Only the ProxyAdmin owner can upgrade. Use the deployer or transfer ownership.

**Do I need to run `hardhat node` for tests?**
No. `hardhat test` uses in-process network by default.

**Why does `IMPL` not resolve?**
`IMPL` must be the contract name, not the file name.

**Can I use `tsx` to run scripts?**
No. Use `npx hardhat run` to ensure correct network context.

**Why does ProxyAdmin ownership differ from my deployer?**
You likely used a ProxyAdmin address as initial owner or mixed addresses from different deploys.

**How do I confirm role wiring?**
Use `scripts/verify-deploy.ts` or query `RolesRegistryUpgradeable.hasRole` manually.

**What if I lose ProxyAdmin ownership?**
Upgrades will be blocked. You must recover ownership or redeploy proxies.

**Where are the proxy and implementation addresses stored?**
They are printed during deployment and recorded in [deployments/arc-testnet-v3.json](https://github.com/Tenyokj/bert-core-arc/blob/arc-usdc-migration/deployments/arc-testnet-v3.json). Compare EIP-1967 slots against the manifest after upgrades.

**Is there a single ProxyAdmin for all contracts?**
No. Each proxy creates its own ProxyAdmin in the current architecture.

**Can I reduce the number of admins?**
Yes, by changing the deployment pattern, but it requires a different proxy setup.
