# dApp Cyber Hive Local Preview

Date: 26 November 2026. Worktree: `~/bert/bert-landing-preview`,
branch `design/landing-local`. Unpublished visual and UX work only.

## Publication Preparation / 2026-11-27

The owner authorized publication preparation after local acceptance. The design
is committed on its isolated branch and synchronized with `arc-front-migration`,
including the confirmed V2.4 activation status. A separate PR/preview is the next
gate; do not merge or deploy to production until its checks and preview are reviewed.
No secrets, environment files, QA output, dependencies, ABI or Solidity changes
belong to this PR. Earlier no-commit statements below are historical snapshots.

Post-commit preservation tests now use `scripts/fixtures/pre-redesign.json.gz`
(public source at commit `8961884`), not a moving HEAD. This preserves the same
financial AST/layout/news/legal assertions after commit and in shallow CI clones.
All 189 tests passed again against the fixed baseline.

## Final Local Acceptance And Winter Theme / 2026-11-27

The temporary winter layer covers the main site's landing, informational, demo
and dApp routes. Snow, frost and evergreen/red-ribbon accents stay at the edges;
they ignore pointer input. A lower-left snowflake button persists opt-out.
Reduced motion hides snowfall; hidden tabs pause it. The season expires on
January 11, 2027 at 00:00 UTC. See `SEASONAL-THEME.md` for removal instructions.
Separately hosted documentation and Console are not modified by this layer.

Acceptance completed locally:

- 189 Node regression tests, TypeScript and `git diff --check` passed.
- `eslint src` has zero errors and 31 warnings, principally existing workflow
  effect/ref warnings. This is not a claim that repository-wide lint is clean.
- Isolated Next.js production builds passed with both local E2E configuration
  and the current Arc environment. Webpack was used because the preview worktree
  shares dependencies through an external symlink; Turbopack's root restriction
  prevented that build path. No production build command or dependency changed.
  The wallet SDK still emits an optional React Native AsyncStorage resolution
  warning; the web build completes. This warning is not a contract failure.
- Browser V2/revenue E2E passed: 106 UI transaction receipts, exact balances,
  pledges, staged payouts, policy delay/rotation, refunds, collection and fixed
  payee payout. Ten revenue mapping replay tests passed against those receipts.
- Browser V3 financial E2E passed: four voting lanes, correction, review guards,
  Admin quorum, 20/40/40, partial refunds, pause/resume, validator rewards,
  membership return, role handover and archival.
- These financial tests use a fresh local Hardhat chain, MockUSDC and an injected
  EIP-1193 test wallet, not the real MetaMask extension or native Arc USDC. No
  public transactions were sent. They are regression evidence, not an audit.
- Production-preview guest UI checks passed for creation wizards, dashboard,
  Profile, Pool, all six Admin tabs, lists/details, V2 badges and V3 pagination/
  RPC recovery. Responsive checks cover 1440/768/390/320px (Admin: 1440/390/320).
- All 13 informational pages passed shared navigation/footer, anchors, fonts,
  responsive layout and FAQ interaction checks. Seasonal checks passed seven
  representative routes, preference persistence, expiry, reduced motion,
  visibility pause and wallet-modal open/Escape-close. No signing requests or
  uncaught page errors occurred in those read-only checks.

Evidence is under `.e2e-results/`: `redesign-acceptance/`, `browser.log`,
`frontend-build.log`, `seasonal/`, `creation/`, `workspace-ux/`, `admin-ux/`,
`detail-ux/`, `community-ux/` and `site-pages/`. Test selectors were updated for
the new wizard/task UI; financial assertions were retained. The transaction
observer now tolerates navigation destroying its JS context while still requiring
a successful mined receipt. An initial Arc-route smoke against a Hardhat-configured
build was rerun successfully against the matching Arc-configured build.

**Publication remains separate and unapproved:** no redesign commit, push, PR,
merge, Vercel deployment or public wallet operation was performed. Before release,
review the worktree diff, stage source/assets/docs/tests only (never `.env` or
QA output), then publish a preview and smoke its real environment. Existing
warnings and test-scope limits remain explicit; zero bugs are not guaranteed.
Older entries below describe the evidence available at their time.

## V3 Task UX And V2 Status Colors / 2026-11-27

V2 idea cards now use semantic, readable status badges: amber for pending,
cyan for voting, violet for selection, blue for grant start, teal for progress,
green for completion and rose for rejection/cancellation. Labels and explanations
remain visible; color is not the only status signal. Unknown states stay neutral.
The existing demo/live card component is shared, not a fake live-data replacement.

V3 Community workspaces now put task navigation above the content, retaining
the global island header. Role guidance distinguishes Members, Validators and
Admins. Addresses, configuration and Treasury balances remain in disclosures.
URL section links open execution plans directly and follow browser navigation.
Existing create, membership, validation, governance and payment components remain.
The proposal counter explicitly describes the bounded latest-120 sample.

Proposal and Slate cards/details have colored states and next-actor explanations.
Selection, supporter review and Admin authorization never imply a paid tranche.
Equal binary weight is labelled as a tie rather than NO leading. Slate phase
uses the pause-aware Community clock; voting closes at time >= endTime, matching
CommunityVotingModule. Read failures have a read-only retry, not an empty list.
An unreadable registered Community status is not rendered as Active.

Directory/Binary/Slate lists render eight rows per page; execution plans render
six. These paginate the loaded bounded sample, not all onchain history. Failed
plan subcalls explicitly report partial data rather than a confirmed empty result.
Tranche UI explains fixed recipient/amount, Admin approval, transfer and receipt
as separate stages. No financial call arguments, gas, signing targets or wallet
connectors changed; AST tests compare the financial calls with HEAD.

Verification: 187 Node regression tests, TypeScript and changed V3 component lint
pass. Browser smoke covers V2 badges, Community navigation, proposal and round
details, execution pagination, and RPC failure/recovery at 1440/768/390/320px.
No horizontal overflow, page errors or signing calls. Screenshots inspected.
Report: `.e2e-results/community-ux/report.json`.
Browser reads are synthetic intercepted fixtures and the wallet is disconnected;
this is not signed-wallet financial E2E. No production build in this batch.
No ABI, Solidity, dependency, env, commit, push or deployment changes.

Remaining agreed stages: final local acceptance/build, then owner-approved
publication. Older sections below are chronological batch records, not current
remaining-work counts.

## Creation Wizards / 2026-11-27

Local `/ideas/new` now separates description, budget and review/signing.
The bond and post-fee funding target have distinct explanations. Exact USDC
validation rejects excess decimals instead of silently rounding. The review
shows public content, amounts, network, registry, spender and the separate
milestone-plan commitment. New approval/submission requires acknowledgement
of the current draft/wallet/chain/deployment. Unknown required contract reads
and wrong wallet networks fail closed. Confirmed creation cannot be resent
from the same form. Existing errors and transaction references remain visible.
Success requires a receipt with status `success`, not just a successful receipt
query; reverted receipts and receipt-read failures have explicit messages.
An unresolved submitted hash blocks further writes and offers read-only receipt
refresh, not a duplicate submission.

Local `/v3/create` separates identity, people, rules and review/deployment.
All 19 original settings remain; 11 advanced governance/timing fields are
in a disclosure. The full review has 27 rows including roles and addresses.
Guests can prepare drafts, but cannot reserve or deploy. Role overlap, quorum
counts, exact amounts, bps bounds and review-duration bounds are explained
before the wallet stage. Drafts stay in memory, not across reloads.

Original reservation still uses three transactions: Reserve Treasury, Deploy
Hub, Activate. After reservation or an uncertain result, fields are locked.
Transaction-hash recovery is outside the wizard and loads confirmed original
calldata; it does not require retyping or acknowledging a new reservation.
AST tests confirm unchanged build/link/recovery/deploy/activate/refresh
controllers and all original financial write arguments, spenders and gas.

175 regression tests and TypeScript pass. Browser guest UX passes at
1440/768/390/320px, including full reviews and advanced rules without horizontal
overflow, blocked invalid input, back navigation and retained values.
Report: `.e2e-results/creation/report.json`. No page errors or signing requests.
This is not signed-wallet financial E2E. New component/helper lint is clean;
eight pre-existing effect warnings remain in the two workflow controllers.
No env, dependencies, ABI or contract changes, production build, commit, push,
deployment or public transactions in this batch.

Remaining agreed release stages: unified transaction statuses; V3 detail/action
UX; final local acceptance/build; publication after owner approval.

## Current Direction

### Unified Transaction Feedback / 2026-11-27

A compact Transaction activity disclosure appears after a Wagmi contract write
or deployment in this tab. It observes mutations without submitting, resetting
or retrying writes. Latest eight actions retain their submission chain/account;
later wallet switches do not redirect receipt reads or explorer links. The panel
is temporary, not complete/durable wallet history, and disappears on reload.
Existing workflow-specific recovery and errors remain in place.

States distinguish wallet signature, returned hash awaiting confirmation,
matching mined success/revert, explicit wallet rejection and uncertain RPC
outcome. Ambiguous no-hash errors are never advertised as onchain reverts.
Cards provide selectable hashes, clipboard feedback, HTTPS explorer links and
read-only refresh. An unknown original network has no guessed explorer/read.

All 26 receipt workflow files now use a shared adapter; their original financial
call expressions and controller bodies are preserved. Success requires a matching
receipt with status success, not query/broadcast success. The receipt's network
is captured for each hash. A hash with unresolved receipt remains busy, preventing
the existing busy-guarded controls from treating a timeout as permission to retry.
This is not a new universal no-hash action lock: existing per-workflow recovery
continues to govern ambiguous wallet responses without a hash.

Wagmi's installed wait action throws for mined reverts; a shared read-only receipt
fallback handles that separately from network failures and unblocks known reverts.
The panel and adapter share the same observed receipt cache. No calldata, wallet
connector, ABI, dependency, environment or contract changes.

182 regression tests and TypeScript pass. Seven new tests cover status truth,
nested rejection, wallet-switch context, safe URLs, adapter fallback, rendered
state cards and exact financial calls in all 26 workflows. New layer lint is
clean. Guest creation browser smoke passes; financial signed-wallet acceptance
and interactive transaction-center wallet integration remain for the final local
acceptance stage. No public transactions, production build, commits or deployment.

Remaining agreed stages: V3 detail/action UX; final local acceptance/build;
publication after owner approval.

The owner rejected the sidebar/dashboard redesign. The original island header
and dashboard layout were restored. After accepting Cyber Hive, the owner
authorized task-based administration and clearer idea/round objects.
The next owner-approved batch replaces the dashboard's long introduction with
an interactive path selector, rebuilds Profile and replaces the Pool animation.

DappShell differs only by two decorative imports, a scoped class/data marker
and the non-interactive HoneycombBackground component. The new CSS changes paint,
not typography size, padding, radius or layout.

The new palette combines dark navy/violet surfaces, electric cyan and purple
actions, subtle neon borders and hover glows. A fixed repeating hexagonal grid
fills the background. A CSS-driven light wave travels upward across its outlines,
with a slower regional glow. The background is aria-hidden, intercepts no input,
and has no JavaScript frame loop, canvas or network requests. Reduced-motion
preferences stop its animations. Pool now uses a separate GPU attraction visual.

## Preserved Boundaries

WalletConnectButton, RainbowKit providers, dependencies, shared contract
configuration, ABI artifacts, financial helpers and V2/V3 action pages remain
unchanged. The new admin catalog adds the source-confirmed Factory approval
signature locally rather than replacing shared ABI artifacts. Errors, status
colors, receipts, disabled states and original mobile navigation remain present.
Demo fixtures are unchanged and explicitly illustrative.
Landing and informational-page redesigns are not reverted.

No wallet credentials or public-chain writes were used. The owner's local .env
was not read or edited; the browser QA blocks RPC instead of inventing live data.
No commit, push, deployment, wallet connection or public transaction was performed.

## Current UX Batch

- Control Center: six task tabs, eight protocol contracts and 46 explicitly
  allowlisted operations. RolesRegistry and PoPVerifier are included. Factory,
  bootstrap and EIP-1967 ownership inspection are read-only; no upgrades or
  initializers. Community governance stays in the Community interface.
- Every new admin write checks wallet/network, live code, registry binding,
  fresh Admin permission and pending nonce, then simulates. Review shows current
  and proposed values, target and calldata; confirmation requires the target name.
- A session-local intent is stored before a wallet prompt. An unknown response
  blocks another new admin write in that tab, including after reload. Recovery
  matches chain, sender, target, calldata and zero value to a final receipt.
  It never resends a write or raises a nonce. This is not a global transaction
  history across every old workflow or every browser tab.
- Pool keeps public financial figures, but no revenue write callbacks or policy
  forms. Operator forms live in Control Center. Permissionless payout relays and
  activation are not falsely Admin-gated. A beneficiary shortcut in Profile is
  based on actual discovered Treasury payees, not an assumed account role.
- Live and Demo idea/round lists share cards: lifecycle explanation, correctly
  formatted vote amounts, UTC dates, details and explicit actions. Removed the
  unconditional 100% bars. Selected is not paid; finalized is not successful.
- Page-scoped search/status/order/reset retain the existing 15/30 pagination.
  These are not global server-side filters. No mock records enter live pages.
- Dashboard labels distinguish custody, distributions and registered ideas from
  free funding capacity and completed delivery. Incomplete payout aggregation
  does not report a partial sum as a complete total; RPC fallback is bounded.

## Verification

Previous admin/card batch: 137 Node tests and TypeScript passed. The 22 admin checks cover
ABI signatures, units, validation, fresh permissions, wrong networks/registry,
pending nonce, simulation errors, malformed intent and receipt reconciliation.
Full lint still reports an existing `prefer-const` error in
`subgraph/src/revenue-mapping.ts:76`; targeted frontend lint has no errors.

`node scripts/admin-ux-smoke.mjs` passes for 12 routes (all six admin tabs,
Pool, Profile, live idea/round lists and both Demo lists) at 1440/390/320px.
It checks page overflow, no-wallet disabled admin actions, public Pool without
write buttons, filter/reset/status controls, native details and card links.
No uncaught page errors or transaction requests occurred. RPC was blocked.
Report/screenshots: `.e2e-results/admin-ux/`.

Unavailable reads stay unavailable, never fabricated values. New signed admin writes still need
local-chain wallet acceptance before publication. No production build or fresh
full financial E2E has been run in this UX batch.

## Dashboard, Profile and Pool Batch

- Dashboard has four keyboard-operable paths: proposing, supporting, running a
  Community and exploring. Each explains three steps, the applicable product
  and destination. An animated orbital diagram is explicitly decorative, not
  live activity. Public metrics, verification and testnet role/bootstrap tools
  are retained; the preparation tools are in an expandable section.
- Profile is a wallet workspace with balance, real reputation default/initialized
  status, required bond, page-scoped author cards and progression. All profile
  reads use one pinned block and the configured chain. Only 12 visible ideas are
  hydrated per page, in batches of three. The author ID getter still returns its
  full list; this is not an onchain indexed pagination API. Missing values and
  partial read errors never become a false zero or a successful empty history.
- An opt-in recent-actions read checks at most eight V2 rounds. Refunds are
  simulated with the actual wallet but never sent; grant claims are suggested
  only after also matching the winning author. This is not a complete history
  or a V3 action inbox. Every action links to the existing signing workflow.
- Pool replaces the old pixel ring with shader-driven inward spiral trails,
  light heads, a glowing core and an orbital ring. Three.js is lazy-loaded with
  no new dependency. Drawing is capped at 30fps with bounded device pixel ratio;
  pause, reduced motion, tab visibility, offscreen idle, cleanup and static
  WebGL-failure fallback are supported. No transaction data powers the visual.
- Pool custody and donor-ledger labels are explicit. The arbitrary pause-state
  percentage bar is removed: unknown pause state is not an active green bar.
  Existing allowance/deposit controller and both exact write calls match HEAD.

148 tests and TypeScript pass, including 11 new profile/animation boundary checks.
`scripts/workspace-ux-smoke.mjs` passes for /app, /profile and /pool on
1440/768/390/320px: path tabs/keyboard, guest links, disclosure, real WebGL movement,
pause, reduced motion and offscreen idle. No page errors or wallet writes.
RPC is blocked, so this is not connected-wallet/financial acceptance. Profile
account-specific reads and failures are fixture-tested, not certified by public
transactions. Report/screenshots: `.e2e-results/workspace-ux/`.
No production build, commit, push or deployment was performed. New renderer lint
has a set-state-in-effect warning for WebGL fallback; older Pool controller and
subgraph lint findings are not claimed fixed by a visual update.

## Prior Visual Verification

115 Node tests and TypeScript pass. Tests compare all original dApp/Demo pages
and existing workflow/wallet components byte-for-byte with HEAD, and compare the
island shell after removing only the decorative additions.

`node scripts/dapp-design-smoke.mjs` passed for /app, /ideas/new, /pool, /v3 and
/demo/ideas/201 at 1440/768/390/320px. It checked moving CSS light, reduced motion,
the actual RainbowKit modal, original navigation and original mobile GET search.
No uncaught page errors or wallet writes were observed. RPC calls were blocked;
this is local visual/UI QA, not financial E2E or source verification. No production
build was run. Existing dev wallet-SDK warnings have not been declared fixed.

Report/screenshots: `.e2e-results/dapp-cyber/`.
Preview: http://localhost:3000/app.

## Remaining UX Work

The wider UX roadmap is not all complete: recent V2 actions are implemented,
but an all-history/V3 queue, consistent transaction history across workflows,
progressive creation forms and V3 detail-page lifecycle improvements remain.
Do not call this batch a production-ready acceptance of every admin operation.

## V2 Idea And Round Details / 2026-11-27

Local V2 detail pages now include a read-only lifecycle, explicit next actors,
round deadlines in UTC, and links between the selected idea and its round.
Selection, proof submission and actual tranche payout are distinct states.
Cancelled grants stop unpaid stages; an unreadable mode never assumes legacy
30/40/30. Grant review forms wait for the round's mode. Backer milestone review
deadlines read MILESTONE_REVIEW_WINDOW from the contract instead of hardcoding
14 days; review/finalization controls use chain time, not the visitor's clock.

Round labels distinguish upcoming, voting, awaiting settlement and settled.
Unknown chain time/participation disables pledge approval and voting; missing
wallet reads no longer look like an empty pledge. Per-proposal amount help
explains approval versus the separate pledge. Verification remains available in
a disclosure, including its original controls and errors. It is not replaced by
a simulated verification badge or new wallet connector. Detail reads/receipts
use the configured chain, with a wrong-wallet-network write guard.

Reviews display six loaded records per page; idea/round voters display twelve.
This bounds rendered rows, not the underlying legacy full-array RPC getters.
Existing financial calls, arguments and gas match HEAD exactly in AST tests.

156 regression tests and TypeScript pass. Local browser fixture QA covers both
detail pages at 1440/768/390/320px, pagination, guest controls, expired voting
window and missing review mode. Report: `.e2e-results/detail-ux/report.json`.
Fixtures intercept RPC reads; this is NOT real-wallet or public financial E2E.
No ABI, contract, dependency, env, commit, push or deployment changes.
The detail-page lint retains four pre-existing set-state-in-effect warnings;
new components/helper have no lint errors. No production build was run.

## Real Data And Local Demo Fixes / 2026-11-27

The reported profile failure was a frontend decoder regression: the deployed
IdeaStatus enum includes Cancelled = 7, but the new profile helper accepted only
0-6. The shared labels now include Cancelled and the profile uses their length.
An actual pinned Arc read at block 74285605 loaded this wallet's four authored
ideas (two Cancelled), balance, reputation and progression without field errors.
This was a public read, not a wallet connection or transaction.

The pasted Graph v1.1.1 URL returned an HTTP-200 provider message rather than
GraphQL data; v0.4.0 returned indexed data without indexing errors. The current
local env already had the corrected v0.4.0 and public backend URL, so these were
preserved. The proxy now rejects non-GraphQL envelopes with a meaningful error;
the Ideas page falls back to bounded, real RPC reads with an explicit warning.
Local browser QA loaded six indexed ideas and the same six via RPC after an
intentional indexer failure. Report: `.e2e-results/live-data/report.json`.

The demo flag was absent, staging World ID suppresses the production World ID
button, and no backend was listening on port 3001. The public backend's CORS
permits only the deployed site. Added a loopback-development-only relay to that
same backend, with explicit demo/Arc/configured-verifier/same-origin guards,
restricted body and no redirects. Production returns 404; normal production
requests retain the direct backend path. The relay does not sign credentials
or transact. A wrong-chain request was rejected with HTTP 400 without issuance.
Actual credential issuance/activation was intentionally not run by the agent.

Only public local env fields changed: enable the Arc demo flag and remove the
obsolete duplicate Hardhat Factory address (no Arc bytecode). The canonical
Factory/library settings and corrected URLs remain. The env is git-ignored.
Credential values were not copied to source/docs. Keys disclosed in chat still
need owner rotation; a Graph deploy key is not a runtime frontend requirement.

166 regression tests and TypeScript pass, including GraphQL envelope handling,
Cancelled-profile hydration, real demo-button render states and relay denial
guards. New helper/route lint has no errors; three pre-existing verification
component warnings remain. No dependency/ABI/contract changes, public wallet
writes, production build, commit, push or deployment.
