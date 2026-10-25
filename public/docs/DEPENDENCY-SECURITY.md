# Core Dependency Security - 24 October 2026

## Scope

This patch updates development/deployment tooling, not the deployed protocol.
Hardhat stays on major 3 (3.0.15 -> 3.21.0), ethers stays on major 6
(6.15.0 -> 6.17.0), viem stays on major 2 (2.43.3 -> 2.57.11), and the
official plugins are updated within compatible major versions. Mocha stays on
major 11 (11.8.0); toolbox/mocha plugins are not migrated to their Mocha 12 line.

Solidity sources, OpenZeppelin 5.0.2, compiler 0.8.28, Prague target, optimizer
settings, storage layouts, deployment addresses and network configuration are
unchanged. No public-chain transaction was signed or sent. No new contract
version or deployment is required for this dependency-only patch.

Use Node.js >=22.13.0 per the [Hardhat requirements](https://hardhat.org/docs/getting-started).
This verification ran on Node.js 26.4.0 / npm 11.17.0; it is not a test matrix
of every supported Node release.

## Audit Snapshot

| Entire dependency tree | Before | After |
| --- | --- | --- |
| Critical | 0 | 0 |
| High | 17 | 14 |
| Moderate | 4 | 1 |
| Low | 9 | 1 |
| Total | 30 | 16 |

The 16 package-level findings include ancestor/metavulnerability chains. They
do not establish 16 separate exploitable flaws in BERT contracts. Conversely,
passing contract tests does not close dependency advisories.

Compatible fixes used `npm install --ignore-scripts --no-fund` and
`npm audit fix --ignore-scripts --no-fund`. No `--force`, Hardhat downgrade,
major-version override or blanket alert dismissal was used.

### Remaining Findings - Open

| Underlying package | Boundary and follow-up |
| --- | --- |
| [zod 3](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5) | Hardhat and official plugins still require zod 3. The patched zod 4 line is not an API-compatible override. Review untrusted configuration/plugin input and track the upstream migration. |
| [serialize-javascript 6](https://github.com/advisories/GHSA-5c6j-r48x-rmvq) | Mocha 11 dependency; also affected by [CPU exhaustion](https://github.com/advisories/GHSA-qj8w-gfj5-8c6v) and [script escaping](https://github.com/advisories/GHSA-m5mm-p8h7-m29v) advisories. Requires a coordinated Mocha/plugin upgrade, not a forced replacement. |
| [diff 7](https://github.com/advisories/GHSA-73rr-hh4g-fpgx) | Mocha dependency. The audit-proposed Mocha 12 migration is intentionally separate. |

Reachability was not exhaustively proven. Run contributor branches/tests without
production credentials, private deployment keys or privileged filesystem access.
Do not execute untrusted Hardhat plugins, configs or tests merely because
`npm ci` succeeded. These packages execute on developer/CI machines; there is no
Node package installation inside already deployed EVM contracts.

## Verification

- `npm ci --ignore-scripts --no-fund`: clean lockfile installation passed.
- `npm run compile -- --force`: 69 Solidity files compiled successfully.
- Compared fresh pre/post-update artifacts: all 67 project contract/interface/mock
  artifacts have identical ABI, creation bytecode and runtime bytecode hashes.
- `npm test`: 232 passed, repeated successfully after the clean install. Existing
  V2 legacy/V2.3 modes, four Community voting lanes, self-review exclusion,
  tranche Admin quorum, expiry/refunds and malicious ERC-20 cases remain covered.
- Hardhat emits a deprecation warning for `hre.network.connect()`. It is not a
  test failure; migrating that test harness API is separate maintenance.

```bash
npm ci --ignore-scripts --no-fund
npm run compile -- --force
npm test
npm audit
```

`npm audit` still exits nonzero because the above findings remain. Do not weaken
tests or dismiss findings to make this command green. This verification is not
browser-wallet E2E, live deployment verification or an independent security audit.

Release via a PR into `arc-usdc-migration`. Continue tracking upstream fixes;
do not redeploy contracts just to publish a toolchain lockfile change.
