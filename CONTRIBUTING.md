# Contributing to BERT Frontend

Thanks for helping improve BERT. This repository powers a live Arc Testnet application, so every change must preserve the contract as the source of truth.

## Where Help Is Needed

| Contribution area | Current need | Good first contribution |
| --- | --- | --- |
| Frontend development | Wallet UX, accessibility, mobile behavior, transaction recovery and readable state | Fix one focused route with a regression test or manual test evidence. |
| Protocol QA | V2.3/V3.1 role, allowance, error and indexer-lag testing | Reproduce a matrix case with wallet, transaction hash and direct contract read. |
| Web3 integration | ABI synchronization, module-aware V3.1 reads and RPC fallback resilience | Improve a direct-read path without inventing fallback state. |
| Security review | Unsafe transaction construction, stale authorization UI and configuration drift | Submit a private report for exploitable impact; otherwise open a reproducible issue. |
| Community and SMM | Accurate product walkthroughs, screenshots and release education | Coordinate factual content first; do not publish financial, audit or mainnet claims. |

Use the public [BERT Telegram channel](https://t.me/bertdao) or a focused issue
to coordinate. Contribution is open-source collaboration; it does not imply
payment, repository write access, deployment rights or a token allocation.

## Before Opening a Pull Request

1. Create a branch from the current target branch; do not commit directly to protected branches.
2. Keep V2 behavior intact when changing V3 code.
3. Do not add secrets, private keys, deployment keys, Redis tokens, or personal data.
4. Run `npm run lint` and `npm run build`.
5. Explain the user-visible behavior, affected routes, test coverage, and any contract or ABI dependency in the pull request.

## Contract Integration Rules

- Use live contract reads for balances, roles, permissions and action availability.
- Do not invent an on-chain status, permission, transaction result or fallback address.
- Keep public contract addresses in environment configuration, not component source.
- If a Solidity ABI changes, synchronize the generated artifact intentionally and include the ABI diff in review.

## Security Reports

Do not disclose vulnerabilities in issues, pull requests, discussions or commits. Follow [SECURITY.md](./SECURITY.md) and use the private advisory channel instead.

## Review and Deployment

External contributors can fork this repository and open pull requests. Maintainers review, merge and deploy accepted changes. A pull request does not grant write access to the repository or production environments.
