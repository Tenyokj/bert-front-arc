# Authority Map and Economic Boundary Checks

Reviewed on **2026-11-21**, against local Core base `7dbfac1`. This is a bounded
source review plus the explicitly scoped read-only snapshot below, not an
independent audit. No contract, role, signer, deployment or release was changed.

## 1. Three Different Administrative Authorities

| Authority | Actual capability | What changing it does not do |
| --- | --- | --- |
| Owner of each OZ v5 `ProxyAdmin` | Calls `upgradeAndCall` for that Transparent proxy, replacing its implementation | Does not rotate protocol roles or `RolesRegistry.owner()` automatically |
| `RolesRegistry.DEFAULT_ADMIN_ROLE` | Governs inherited AccessControl role grants/revocations; passes V2 `onlyAdmin` | Does not become a ProxyAdmin owner automatically |
| `RolesRegistry.owner()` | Ownable ownership and its transfer/renunciation | Is not the condition used by V2 `onlyAdmin`; transferring ownership does not transfer DEFAULT_ADMIN_ROLE |

`RolesRegistry` also exposes inherited `grantRole`, `revokeRole` and
`renounceRole`. The admin relationship of each role matters. The custom
`grantSystemRole`/`grantUserRole` helpers are not the only role-management API.
The initial role admins are `DEFAULT_ADMIN_ROLE`; do not infer authority from
an Ownable owner field or from a function's NatSpec alone.

The intended policy is to grant system roles to reviewed contracts. The current
registry does not enforce contract-only recipients for every grant path. A
malicious protocol Admin can change trusted roles without first upgrading code.
Consequently, protecting ProxyAdmin ownership alone is insufficient.

Sources: [registry](https://github.com/Tenyokj/bert-core-arc/blob/arc-usdc-migration/contracts/BERT/extensions/Roles/RolesRegistryUpgradeable.sol),
[role modifiers](https://github.com/Tenyokj/bert-core-arc/blob/arc-usdc-migration/contracts/BERT/extensions/Roles/RolesAwareUpgradeable.sol),
[production proxy deployment](https://github.com/Tenyokj/bert-core-arc/blob/arc-usdc-migration/scripts/deploy/deploy-proxies.ts).

## 2. V2 Authority Surface

| Contract / actor | Authority and scope |
| --- | --- |
| FundingPool protocol Admin | Fee for future rounds; token/reference setters; reserve allocation; Factory approval/revocation; reconciliation; pause/unpause; migration initializers where still available |
| VotingSystem protocol Admin | Dependency addresses, verifier, human gate, vote cap/minimum, future-round backer mode/idea count, voting duration, pause/unpause and paused legacy queue migration |
| IdeaRegistry protocol Admin | Pool/reputation/progression/verifier wiring, author minimum, human gate, legacy migration controls |
| GrantManager protocol Admin | FundingPool/IdeaRegistry/VotingSystem references and pause/unpause; not a direct bypass of the backer-vote API |
| PoPVerifier protocol Admin | Rotate trusted signer and revoke credentials |
| PoP trusted signer | Issue EIP-712 credentials bound to the caller, domain, nonce, expiry and credential hash; does not sign users' USDC transfers or votes |
| `VOTING_ROLE` | Records pledges, opens/settles rounds and invokes vote-related registry/progression paths |
| `GRANT_ROLE` / `DISTRIBUTOR_ROLE` | Grant lifecycle/status and FundingPool distribution/fee/refund capabilities, respectively |
| `IREGISTRY_ROLE` | Author-bond intake, release and slashing capabilities |
| `REPUTATION_MANAGER_ROLE` | Reputation initialization/increase/decrease |
| `AUTO_GRANT_ROLE` | User-role grants through the permitted helper; progression normally holds it |
| Reputation / progression protocol Admin | Emergency reputation changes, progression reset and direct curator/reviewer grants |
| Curator / reviewer | Quality moderation / idea reviews and legacy milestone decisions; REVIEWER_ROLE alone cannot approve a V2.3 backer milestone |

Admin wiring and token setters are substantive trust assumptions, not harmless
UI preferences. Snapshotting a round's fee/mode/verifier does not freeze every
contract reference or eliminate administrative trust. A compromised signer is
different from a compromised protocol Admin, and both differ from an upgrade
controller compromise.

Current testnet Demo credentials are **not unique-personhood proofs**. A count
of addresses, a per-wallet vote cap or the exact execution-recipient exclusion
cannot establish independent human participants.

## 3. Community Layer V3.2.1

| Surface | Who can act / boundary |
| --- | --- |
| Factory implementation | Upgrade controller owns its ProxyAdmin. Current implementation has initialization but no ordinary owner-only dependency setters |
| Create / activate Community | A verified creator reserves Treasury/configuration, deploys matching Hub and activates its own reservation; matching creator, Treasury and config hash are checked |
| Existing Hub / Treasury / modules | Direct deployments, not Transparent proxies. Module addresses/configuration are fixed; Treasury capability bindings are one-time |
| Admin control plane | Community-local Admin requests/approvals/execution for pause, unpause, archive, Admin/Validator roster changes and withdrawal cancellation |
| Free-balance withdrawals | Community Admin requests/approvals/execution in Treasury; reserved execution-plan capital and refund liabilities are unavailable for these withdrawals |
| Execution payments | Each tranche has separate authorization. Current Admin role/incarnation approvals are revalidated at execution; only the fixed amount/recipient can be paid. Any relay may execute a valid payment |
| Milestone proof | The immutable execution recipient submits the evidence |
| Milestone review | Eligible sealed winning supporters; author cannot support its own proposal, and the exact execution-recipient address is excluded from review weight/count |
| Failure refunds | Financial winning-supporter snapshot, including any executor contribution; not the reduced review electorate. Pull claims do not require Admin payout approval |
| Member-proposal validation / rewards | Community Validators validate member proposals and earn epoch rewards through the separate activity/reward rules; they do not replace supporter milestone approval |

Do not confuse Admin control-plane requests with tranche authorizations:
`CommunityAdminActions` stores an approval count, whereas tranche payments use
per-Admin role nonces and execution-time revalidation. This review does not
assert the same stale-approval invalidation policy for both mechanisms.

Immutable Community bytecode does not mean independence from every shared
dependency: a configured PoP proxy can be upgraded, and global reserve routing
depends on FundingPool and its Factory allowlist. Upgrading Factory does not
rewrite existing Community bytecode or their already-bound module addresses.

Sources: [Factory](https://github.com/Tenyokj/bert-core-arc/blob/arc-usdc-migration/contracts/BERT/V3/community/CommunityFactory.sol),
[Hub](https://github.com/Tenyokj/bert-core-arc/blob/arc-usdc-migration/contracts/BERT/V3/community/CommunityHub.sol),
[Treasury](https://github.com/Tenyokj/bert-core-arc/blob/arc-usdc-migration/contracts/BERT/V3/community/CommunityTreasury.sol),
[Admin actions](https://github.com/Tenyokj/bert-core-arc/blob/arc-usdc-migration/contracts/BERT/V3/libraries/CommunityAdminActions.sol),
[milestones](https://github.com/Tenyokj/bert-core-arc/blob/arc-usdc-migration/contracts/BERT/V3/modules/CommunityMilestoneManager.sol).

## 4. Read-Only Arc Testnet Snapshot

On 2026-11-21, RPC `https://arc-testnet.drpc.org`, chain **5042002**, all reads
pinned to block **73383713**. No signer, private key or transaction was used.
Proxy addresses came from [the manifest](https://github.com/Tenyokj/bert-core-arc/blob/arc-usdc-migration/deployments/arc-testnet-v3.json).
The EIP-1967 admin/implementation slots were read from each proxy; `owner()` was
then called on the slot-derived ProxyAdmin, not inferred from deployment logs.

Observed upgrade owner for **all nine** checked proxies:
`0xA4B0a01dB1d68D4CDB007F78bAB63Cb4ebd814bF`.

Checked proxies: RolesRegistry, PoPVerifier, IdeaRegistry, FundingPool,
VotingSystem, GrantManager, VoterProgression, ReputationSystem, and the current
CommunityFactory `0x23E023E0D8B3436319BC6e5e72615Bc7A0c6234E`.
Their implementation/admin slots matched the manifest entries.

| Additional read | Observed value |
| --- | --- |
| RolesRegistry `owner()` | `0xA4B0a01dB1d68D4CDB007F78bAB63Cb4ebd814bF` |
| `hasRole(DEFAULT_ADMIN_ROLE, 0xA4B0...14bF)` | `true` |
| PoPVerifier `trustedSigner()` | `0x94F42D693E4387AdE5b8Ec0AF7323Ade8df766d2` |

This confirms concentrated testnet administrative control, not a proven exploit.
It is not an enumeration of all role holders, a code-hash verification of every
implementation, a backend key-custody assessment, or an audit of every existing
Community/old Factory. Roles/owners can change after this block.

Before valuable funds, separately design independent multisig signers,
timelocked upgrades, application-role governance, signer custody and recovery.
Transferring only `owner()` or only one ProxyAdmin does not migrate all authority.
Timelock notice does not guarantee that locked pledges/membership stakes have
an immediately usable exit path. No such migration was performed here.

## 5. Focused Regression Evidence

New [economic/authority tests](https://github.com/Tenyokj/bert-core-arc/blob/arc-usdc-migration/test/EconomicTrustBoundaries.fully.ts):

- A real V2.3 pledge at the round deadline transfers USDC into custody; settlement
  is still unavailable at that timestamp. Winning pledges cannot be immediately
  refunded before settlement, after settlement, or after initial grant claim.
  Losing pledges remain claimable once; unrelated donated capital is not paid
  to the winning author.
- Disabling global backer mode does not change an existing round's mode. A
  legacy reviewer cannot replace the backer review, and even unanimous eligible
  approval cannot bypass the full review window.
- Transferring RolesRegistry Ownable ownership does not rotate DEFAULT_ADMIN_ROLE.
- The production Transparent-proxy pattern separates upgrade ownership from
  application ownership/roles, rejects unauthorized upgrades, and preserves
  those application authorities across an authorized same-contract upgrade.

Existing V3 [real-module integration tests](https://github.com/Tenyokj/bert-core-arc/blob/arc-usdc-migration/test/V3/CommunityV31EndToEnd.fully.ts)
already cover all four lanes, executor exclusion, separate quorum per tranche,
removed/reappointed Admin approvals, reserved-fund isolation and 100/80/40
unpaid-budget refunds. The suite uses MockUSDC/MockHumanVerifier and a mock global
reserve; it is not browser E2E or validation of Circle USDC / production identity.

```bash
npx hardhat test test/EconomicTrustBoundaries.fully.ts --network hardhat
npm test -- --network hardhat
```

Fresh result on 2026-11-21: baseline **237 passing**; after adding the four
regressions, the complete local suite returned **241 passing** (22 seconds,
exit 0). The new cases are included in that count. Coverage, Slither, dependency
audit and browser E2E were not rerun; no new coverage/security-score claim is made.

The late-pledge case checks necessary custody/time boundaries, not every possible
flash-loan composition. It does not prove protection against ordinary capital
concentration, bribery, related wallets, malicious Admins or all economic attacks.
See [known limitations](KNOWN-LIMITATIONS.md) and [security review](SECURITY-REVIEW-V3.1.md).
