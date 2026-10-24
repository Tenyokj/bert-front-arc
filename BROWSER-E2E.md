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
```

No manual Hardhat node, MetaMask import, `.env.local` edit, backend or Graph node
is needed. The runner starts its own node on `127.0.0.1:18545` and Next dev server
on `127.0.0.1:13000`. Occupied ports cause an abort: existing nodes are never
reused or reset. It deploys the actual proxy core and V3.2 Factory/module
infrastructure using the existing deployment scripts, allowlists the Factory,
mints 100,000 MockUSDC for eight accounts and records real local PoP attestations.

## Accounts and Network Safety

| Hardhat account | Role |
| --- | --- |
| 0 | Creator, first Admin, fixed execution recipient and local PoP signer |
| 1 | Second Admin, required for two-Admin payment quorum |
| 2 | Validator |
| 3 | Member proposal author; wallet cancellation check |
| 4 | Additional active Member |
| 5, 6, 7 | Three independent winning supporters and milestone reviewers |

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

## Scope

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

Production Solidity deadlines are unchanged. Five-minute demo voting and local
`evm_increaseTime` skip one-day reviews / seven-day payment expiry. No waiting for
real days is required.

## Reports and Limits

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

This is the first bounded browser suite, not every possible user flow. The real
MetaMask extension, WalletConnect mobile, public RPC behavior, backend World ID,
Graph indexing/reorgs, V2.3 browser lifecycle, reward claims, membership exit,
role rotation, pause/archive, correction/rejection and 80/40% partial-payment
refund scenarios still need separate browser/integration coverage. Many of those
contract branches have direct Solidity integration tests; that does not make
them browser E2E. This suite is not an independent audit or mainnet readiness claim.
