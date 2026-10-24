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
