# Security Policy

## Testnet Responsible Disclosure

BERT welcomes good-faith reports for the frontend, including unsafe transaction flows, incorrect representation of on-chain state, account or permission bypasses, and proof-of-personhood integration defects.

Submit reports privately through [GitHub Private Security Advisories](https://github.com/Tenyokj/bert-core-arc/security/advisories/new). Do not publish exploitable details in public issues. The frontend repository intentionally contains no private keys, World ID signing keys, RPC credentials, or deployment secrets; report any accidental secret exposure immediately and privately.

Include the affected route or component, prerequisites, reproducible steps, expected and actual behavior, impact, screenshots or transaction hashes, and a proposed mitigation if available. Do not access another user's data, perform phishing, or attempt denial of service.

For a confirmed, previously unknown high-impact report before mainnet launch, BERT may include the researcher's wallet in `initialValidators` when the official BERT Community is deployed. This is not a cash reward or transferable asset; seats are limited and subject to conduct requirements. After launch, new Validator appointments follow the standard on-chain eligibility path.

See the [BERT Testnet Guide](https://bertdao.vercel.app/testnet-information) for full scope, rewards, and World ID Simulator instructions.
