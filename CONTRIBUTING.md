# Contributing to BERT Frontend

Thanks for helping improve BERT. This repository powers a live Arc Testnet application, so every change must preserve the contract as the source of truth.

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
