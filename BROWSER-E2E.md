# Local Browser E2E

This suite drives the real dApp in headless Chrome against newly deployed local
V2 / V3.2 contracts. It is not a mocked contract-state demo. Every submitted UI
transaction is checked against a successful receipt and the important financial
results are read independently from the contracts.

## Run

Requirements: Node.js >=22.13, npm, Google Chrome, and the sibling `bert-core`
repository with its dependencies installed and Solidity artifacts compiled.
The default layout is `bert/bert-core` and `bert/bert_orig/bert-frontend`.
`BERT_CORE_PATH` can override the core path (relative to the frontend root).
Chrome is selected through Playwright's `chrome` channel; no extension or logged-in
Chrome profile is used.

```bash
# In bert-core, once after a fresh checkout:
npm ci --ignore-scripts --no-fund
npm run compile

# In bert-frontend:
npm ci --ignore-scripts --no-fund
npm run test:e2e

# V2.3 funding lifecycle only:
npm run test:e2e:v2

# Both V3.2 and V2.3, with a combined browser report:
npm run test:e2e:all
```

No manual Hardhat node, MetaMask import, `.env.local` edit, backend or Graph node
is needed. The runner starts its own node on `127.0.0.1:18545`, builds Next in
production mode and serves it on `127.0.0.1:13000`. Occupied ports cause an abort: existing nodes are never
reused or reset. It deploys the actual proxy core and V3.2 Factory/module
infrastructure using the existing deployment scripts, allowlists the Factory,
mints 100,000 MockUSDC for eight accounts and records real local PoP attestations.
The default command runs V3.2; `--suite v2` and `--suite all` select the other scopes.

## Accounts and Network Safety

| Hardhat account | V3.2 role | V2.3 role |
| --- | --- | --- |
| 0 | Creator, first Admin, execution recipient and local PoP signer | Round operator, filler author and permissionless review finalizer |
| 1 | Second Admin for payment quorum | Unused |
| 2 | Validator | Losing pledger and ineligible milestone reviewer |
| 3 | Member proposal author; wallet cancellation check | Winning author |
| 4 | Member, then exit and quorum-protected Admin add/remove | Losing author |
| 5, 6, 7 | Independent winning supporters and reviewers | Independent winning pledgers and reviewers |

The injected EIP-1193 wallet represents an already-authorized returning user.
It uses only the disposable node's unlocked development accounts. It refuses
other senders/networks and verifies chain 31337 before broadcasting. Browser
HTTP traffic to non-local hosts is blocked. No personal wallet, production
private key, real USDC, Studio deployment key or public-chain transaction is used.
Local PoP attestations are not identity verification.

The frontend environment is passed only to the child process; `.env.local` is
not overwritten. Next uses a separate `.next-e2e` build and temporary TypeScript
configuration. Its generated `next-env.d.ts` is restored after the run. Do not run
another Next build concurrently in the same checkout. The runner stops its owned
services on completion; local chain state is disposable.
On macOS, the owned runner temporarily inhibits idle sleep with `caffeinate`;
it does not change persistent power settings. The V2 suite switches these local
test accounts in one browser context, without a real wallet extension. V3 now
uses the same account-switching mechanism to avoid many idle polling contexts.

## V3.2 Scope

- Reserve Treasury, deploy the linked Hub with actual modules, activate via UI;
  verify module bytecode and Factory/Treasury wiring.
- Approve stake and join five verified Members through the browser.
- Reject a wallet prompt and verify the account nonce does not change.
- Admin Binary, Member Binary, Admin Slate and Member Slate creation, member
  validation, stake approval, voting and settlement through UI.
- Member Binary: two Admin approvals for each 20/40/40 payment, three independent
  proof reviewers for each later stage, and exact cumulative recipient balances.
  Finalizing a review alone must not move money. Recipient review controls must
  be absent.
- Other three lanes: initial authorization expiry and exact 100% unpaid execution
  budget pull refunds to the three winning supporters.
- Member-origin budgets reflect the separately reserved 15% validator share.
- A single Admin cannot execute a fixed tranche or protected administrative
  action. Reserved plan capital cannot fund an ordinary Treasury withdrawal.
- After 20% is paid, three supporters reject proof, wait the 48-hour cooldown,
  submit/review a correction and reject it again. Exactly 80% returns to the
  supporters; a second refund claim is rejected.
- After 60% is paid, stage-two proof is rejected. Quorum-protected pause freezes
  the correction clock. After resume, an absent executor's overdue cooldown can
  be expired without reopening it; exactly 40% returns to supporters.
- Recipient/outsider reviews, duplicate reviews and early correction are rejected
  through read-only contract calls with unchanged account nonces. Corrected proof
  grants a fresh vote to each eligible supporter despite the old `reviewChoice`.
- A pending exit cannot return stake while vote/milestone locks remain. Another
  unencumbered Member waits its cooldown, exits and receives the exact entry stake.
- Finalize a funded validator epoch and claim the independently reserved reward;
  the transfer leaves execution balance untouched and cannot be repeated.
- Add and remove an Admin through the actual two-Admin queue, reconstructing role
  events from Membership, then archive an idle Community through quorum. Further
  proposal creation is rejected.

Production Solidity deadlines are unchanged. Five-minute demo voting and local
`evm_increaseTime` skip one-day reviews / seven-day payment expiry. No waiting for
real days is required.

## V2.3 Scope

The local operator enables backer-governed milestones and sets five ideas per
round through the actual administrative functions. Production Solidity voting,
proof-review and grace deadlines remain unchanged; local block-time advancement
skips the waits. No public chain is modified.

- Create target funding proposals and commit immutable plans through the UI;
  confirm plan and proof state refreshes without a manual page reload.
- Start rounds, approve MockUSDC, pledge and settle through the UI. Separate
  queue filler proposals and their plans are direct local fixture writes, not
  claimed as browser actions. Their receipts are reported separately.
- Complete a winning grant with three independent backers: initial 20%, then
  approved 40% and 40%. Check exact author balances and progressively earned
  5% protocol fees. An unrelated losing pledger cannot review the winner.
- Refund a losing pledge in full. Keep author bonds distinct from pledges:
  rejected proposals slash their 50-USDC bonds to the reserve; a funded author's
  bond is returned separately from the grant.
- Submit proof but collect no review votes: the first finalization opens grace,
  not a payout. After grace expiry, cancel and refund all unvested gross escrow,
  including unearned fees. With 30 USDC pledged and 20% paid, 24 USDC returns to
  the backers, 8 USDC each; only 0.3 USDC of success fee is earned.
- Settle an underfunded round without a viable winner and refund every pledge
  in full, with no success fee. Rejected author-bond slashing still applies.

## Reports and Limits

### Expanded Combined Run: 25 October 2026

`npm run test:e2e:all` passed both browser tests in 3.3 minutes of Playwright
runtime: 163 confirmed V3 UI transactions and 60 V2.3 UI transactions. Another
44 expected contract rejections were simulated read-only, without broadcasting;
25 direct V2 queue-fixture receipts remain separately labeled. All 63 frontend
regression/source-guard tests and the normal production build with TypeScript
passed. ESLint: no errors, 28 existing warnings.

**Important source/deployment distinction:** this run deploys source Manager
`2.0.1` locally. It found and now regression-tests a real correction deadline
defect in released `2.0.0`: review/cooldown can outlast the original proof window,
and an absent executor can leave correction unexpirable. The source patch assigns
a fixed correction deadline at rejection and permits overdue cooldown expiry.
It does not update immutable Arc Communities. See the core finding and rollout
plan in `docs/V3.2-CORRECTION-DEADLINE-FINDING.md` and
`docs/V3.2-CORRECTION-HOTFIX-ROLLOUT.md` in the core repository. No public deployment
or mainnet readiness is claimed.

Frontend fixes exercised by this run: attempt-aware read-only review eligibility,
both modules' membership-exit blockers, archive blockers from their owning
modules, role-event fallback from Membership rather than Hub, and parent
workspace refresh after quorum actions. No Graph schema/event signature changed.

### Earlier Combined Run: 25 October 2026

`npm run test:e2e:all` passed both browser tests in 2.6 minutes of Playwright
runtime, excluding local deployment and Next build. V3.2 recorded 88 successful
UI receipts; V2.3 recorded 60, plus 25 separately identified queue-fixture
receipts. Both suites use the production-mode local frontend. A separate V2.3
run also passed. All 58 frontend regression tests and the normal production build
(including TypeScript checking) passed; ESLint reported no errors and 28 existing warnings.

The V2 run exposed two real frontend defects, now covered by the checks:
settlement used the visitor's clock rather than the network block timestamp,
and confirmed idea-page writes could leave cached plan/proof state stale.
Settlement now follows the contract's strict `block.timestamp > endTime` rule;
confirmed writes invalidate the relevant active contract queries. No Solidity
behavior, public address or public-chain state was changed.

### Verified Run: 24 October 2026

The complete browser scenario passed in approximately 6.2 minutes on Node.js
26.4.0 / Google Chrome 156, using the current V3.2 Solidity sources. All four
lanes reached the asserted settlement/payment/refund outcomes. The 54 existing
frontend tests and production build (including TypeScript checking) also passed;
ESLint retained the existing 29 warnings and had no errors.

The run exposed a navigation race around delayed receipt-triggered reloads.
Binary lifecycle and milestone effects now cancel their timers when unmounted.
The harness preserves transaction hashes across page reloads and waits for the
expected UI refresh before its next navigation. No Solidity or deployed address
was changed. This dated result applies only to the scope above, not the untested
flows listed below.

Open `.e2e-results/report/index.html` after the run, or use:

```bash
npx playwright show-report .e2e-results/report
```

Logs and fixture addresses are in `.e2e-results/`; failures include screenshots,
browser trace, page text and receipts collected so far. These generated files
are ignored by Git. A nonzero exit code is a failed run, not a successful release
gate. Do not increase retries or remove assertions to hide failures.
The next invocation replaces the last report. Run `test:e2e:all` for both scopes
in one report, or retain a copy before starting a separate suite.

This is the first bounded browser suite, not every possible user flow. The real
MetaMask extension, WalletConnect mobile, public RPC behavior, backend World ID,
Graph indexing/reorgs, positive free-balance withdrawals/cancellations, Validator
nomination/removal, multi-validator inactive/dust reward epochs, rejected binary
NO-side fees/refunds, and V3 no-quorum grace still need separate browser coverage.
V2.3 rejection/correction, claim and proof timeouts, and cancellation after a paid
second tranche are also outside this bounded suite. Many of those
contract branches have direct Solidity integration tests; that does not make
them browser E2E. This suite is not an independent audit or mainnet readiness claim.
