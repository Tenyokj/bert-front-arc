# Dependency Security Update - 2026-10-24

## Scope

- Next.js and eslint-config-next: 16.1.6 -> 16.4.3, pinned in package.json and package-lock.json.
- Resolved sharp: 0.35.5. React, wagmi, viem, contracts, deployment addresses and subgraph packages are unchanged.
- Install used `npm install --ignore-scripts --no-fund`, not `npm audit fix --force`.

The Next.js advisories include [image optimization RCE](https://github.com/advisories/GHSA-2464-fhr4-w9xw)
and [typed-array cache RCE](https://github.com/advisories/GHSA-673q-mjm6-r5xr).
Matching a vulnerable version does not by itself establish exploitability in this deployment.

## Audit Results

| Root application scope | Before | After |
| --- | --- | --- |
| All dependencies | 57: 1 critical, 31 high, 24 moderate, 1 low | 50: 0 critical, 27 high, 23 moderate |
| `--omit=dev` | 49: 1 critical, 26 high, 22 moderate | 44: 0 critical, 23 high, 21 moderate |

Next.js no longer appears in the audit findings. These counts are a dated snapshot,
not a guarantee of future vulnerability-free operation. Remaining wallet/connector
and transitive advisories require separate compatibility and reachability reviews.
The separate `subgraph/package-lock.json` still has its own findings, including a
critical archive-extraction dependency; this update does not close those alerts.

## Verification

- `npm test`: 49 passed.
- `npm run typecheck` and `npm run build`: passed on Next.js 16.4.3.
- ESLint: 0 errors, 29 warnings. New compiler-oriented `refs`, `purity` and
  `set-state-in-effect` rules remain enabled as warnings. Existing state/clock
  behavior was not refactored as part of this dependency patch.
- Headless Chrome checked production routes `/`, `/app`, `/profile`, `/v3`,
  `/v3/create`, `/how-it-works`, plus the mobile creation layout: passed with no
  page errors. No wallet transaction was signed or submitted.
- Old generated `.next/dev/types` were moved to a temporary backup after the
  version change. Source files were not removed to bypass type checking.

## Release

Merge this security branch into `arc-front-migration`, then deploy the resulting
commit on Vercel. Local checks do not patch an already deployed application.
Verify the deployed commit and repeat a read-only production smoke check.
Do not dismiss remaining Dependabot alerts just to reduce their count.
This is not a complete wallet-flow E2E or an independent security audit.

## Phase 2 - Wallet Dependency Compatibility

This section supersedes the phase-one dependency snapshot above. Next.js remains
16.4.3; React, wagmi 2.19.5, protocol addresses and contract sources are unchanged.

- viem: 2.45.2 -> 2.57.11, including nested viem 2 copies in WalletConnect.
- RainbowKit: range ^2.2.10 -> pinned 2.2.11.
- Compatible transitive fixes were applied with `npm audit fix --ignore-scripts`,
  without `--force`. Scoped overrides retain viem 2, abitype 1 and zod 4 within
  their existing major versions; legacy zod 3 is not forced onto zod 4.
- Coinbase CDP SDK stays at the previous working 1.44.1. Its automatic update to
  1.60.0 introduced unresolved optional x402 imports in the SSR build. Adding new
  payment SDKs or hiding those build errors is not part of this security patch.
- `npm ci --ignore-scripts --no-fund` verified the lockfile can be installed cleanly.

| Root application audit | Before phase 2 | After phase 2 |
| --- | --- | --- |
| All dependencies | 50: 27 high, 23 moderate | 29: 12 high, 17 moderate |
| `--omit=dev` | 44: 23 high, 21 moderate | 29: 12 high, 17 moderate |

All counts have zero critical findings. The remaining package-level counts include
ancestor/metavulnerability chains; they are not 29 separately proven attack paths.

### Remaining Findings - Open, Not Dismissed

| Underlying package | Current dependency path / decision |
| --- | --- |
| [zod 3](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5) | Reown wallet / Coinbase dependency paths; requires coordinated SDK changes. No incompatible zod 4 override is applied to zod 3 consumers. |
| [uuid 8/9](https://github.com/advisories/GHSA-w5hq-g745-h8pq) | MetaMask SDK and related utilities. A forced move to uuid 11+ changes the supported major/API boundary. |
| [decode-uri-component](https://github.com/advisories/GHSA-vcc3-ghjq-m6fr) | query-string -> WalletConnect utils. Keep open pending an upstream compatible fix or reviewed connector migration. |
| [stream-json](https://github.com/advisories/GHSA-528h-pc64-c93x) | Coinbase/Solana dependency chain retained for build compatibility; requires upstream/migration review. |

The existing MetaMask/Valtio peer warning about React 18 remains; this patch does
not downgrade React or claim every external wallet integration has been verified.

### Regression Checks

- `npm test`: 54 passed, including new actual-viem tests against an in-memory
  EIP-1193 provider: allowance calldata, selected-chain validation, cancellation,
  and the observed MetaMask internal `already known` error shape.
- Backend signatures are checked separately in the backend repository. Browser
  and provider mocks do not establish end-to-end behavior of the MetaMask extension,
  WalletConnect mobile sessions, real World ID or all RPC error shapes.
- Production build and TypeScript check passed; ESLint has the same 29 warnings
  and zero errors as phase one. No additional lint rules were relaxed.
- Headless Chrome checked `/`, `/app`, `/profile`, `/v3` and `/v3/create`, then
  connected RainbowKit to a read-only injected test provider. Desktop/mobile
  checks passed with no page errors or signing/transaction calls. This is not a
  test of the real MetaMask extension or a live wallet session.

Release through a separate PR into `arc-front-migration`. Repeat the production
smoke check after Vercel deploys the merged commit. The subgraph dependency tree
is still outside this patch.

## Phase 3 - Subgraph Toolchain

This section supersedes the earlier statement that the critical subgraph finding
is unaddressed. It does not change the phase-two root application audit results.

Graph CLI remains 0.98.1 and graph-ts remains 0.38.2, now pinned rather than
floating ranges. AssemblyScript remains on the CLI's existing compiler line.
The canonical installation is `subgraph/package-lock.json`; V3 scripts already
invoke `../subgraph/node_modules/.bin/graph`. Both package manifests retain the
same security overrides to avoid reintroducing old dependencies in an independent
installation; only the shared lockfile installation is verified here.

### Archive Extraction and Compatible Fixes

The latest reviewed Graph CLI still depends on unscoped `decompress` 4.2.1,
which has no patched release. The [maintainer advisory](https://github.com/advisories/GHSA-hrh2-vp3x-79xf)
recommends migrating to `@xhmikosr/decompress`, fixed in 11.1.4. An npm alias
override resolves Graph CLI's `decompress` import to that exact maintained
release. This is a deliberate replacement, not an assumed drop-in semver patch:
the actual CLI extraction helper was exercised with valid and malicious ZIPs.

Graph CLI uses it when installing a local graph-node binary, not in deployed
AssemblyScript mappings. The fix protects the developer toolchain. Tests download
or execute no binaries and keep all malicious fixture paths inside temporary
sandboxes. The maintained fork is ESM; its default export works with the CLI's
existing ESM import. The archive library and CLI still must not be treated as a
sandbox for arbitrary untrusted archives.

Same-major overrides update CLI-pinned glob 11, immutable 5, js-yaml 4, undici 7,
yaml 2 and Gluegun-pinned cross-spawn 7, ejs 3 and semver 7. Brace-expansion stays
on major 2 for its affected consumers. Compatible transitive fixes and a fresh
lockfile resolution were also applied; `npm ls` verifies the installed tree
satisfies the overrides. No forced Graph CLI downgrade was accepted.

| Shared subgraph dependency tree | Before | After |
| --- | --- | --- |
| Critical | 1 | 0 |
| High | 23 | 9 |
| Moderate | 8 | 3 |
| Total | 32 | 12 |

These are dated package-level audit counts, including ancestor findings, not
proof of 12 separate exploitable paths. Deprecation warnings for older CLI
dependencies are not equivalent to an exhaustive security review.

### Remaining Findings - Open

| Underlying package | Dependency boundary / decision |
| --- | --- |
| [axios 0.x](https://github.com/advisories/GHSA-jr5f-v2jv-69x6) | Gluegun -> apisauce. Do not force axios 1 into consumers expecting 0.x. Avoid secrets/untrusted endpoints when using CLI HTTP helpers; upstream migration/reachability review remains needed. |
| [stream-json](https://github.com/advisories/GHSA-528h-pc64-c93x) | Graph CLI -> jayson. Major API migration is outside this compatible update. Do not feed arbitrary hostile JSON streams into trusted CLI jobs. |
| [uuid 8](https://github.com/advisories/GHSA-w5hq-g745-h8pq) | jayson dependency. A move to uuid 11+ needs review of the consuming API. |
| [zod 3](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5) | web3 ABI/validator tooling. No incompatible zod 4 replacement is forced. |

These are not dismissed or proven unreachable. `npm audit` continues to exit
nonzero. Run untrusted contributor jobs without Studio deploy keys, production
credentials or privileged access. No change here closes every GitHub alert.

### Verification and Release

On Node.js 26.4.0 / npm 11.17.0 (recommended contributor minimum: Node 22.13.0):

- Clean `npm ci --ignore-scripts --no-fund` passed.
- `npm run test:security`: seven tests passed: actual dependency identity, actual
  CLI executable extraction/ambiguity checks, parent/absolute path traversal,
  archive symlink chain and a pre-existing destination symlink.
- V2 `codegen:arc` and `build:arc`, plus V3 `npm run build`: passed with the
  current V3.2 Factory/address/block and retained V3.1 history.
- All 13 pre/post-update WASM, schema and manifest files have identical SHA-256
  hashes. Mapping sources, ABI files, schema, addresses and start blocks are
  unchanged. No Studio deployment, wallet signature or public transaction occurred.

```bash
cd subgraph
npm ci --ignore-scripts --no-fund
npm run test:security
npm run codegen:arc
npm run build:arc
cd ../subgraph-v3
V3_FACTORY_SOURCES= \
V3_FACTORY_ADDRESS=0xf793786BCecfbfE35a22E36180032b32BD5208Ba \
V3_FACTORY_START_BLOCK=68888068 npm run build
```

Merge through a separate PR into `arc-front-migration`. These are tooling-only
changes: unchanged artifacts do not need a new Graph Studio version or contract
deployment. Frontend runtime dependencies are untouched. Full browser-wallet E2E
and independent security review remain separate work.
