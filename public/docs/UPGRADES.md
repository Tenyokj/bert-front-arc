# Upgrades

BERT is built from upgradeable modules. That gives the protocol flexibility, but it also introduces one of the most important trust and safety boundaries in the system.

## Contents
1. Upgrade Model
2. Why Upgrades Exist
3. Storage Layout Rules
4. Dependency Rewiring Rules
5. Pre-Upgrade Checklist
6. Upgrade Procedure
7. Post-Upgrade Validation
8. Rollback Considerations
9. Common Failure Modes
10. Versioning Guidance

## Upgrade Model

Core protocol modules are deployed behind proxies. The proxy keeps state, while the implementation contract can be replaced.

This allows:
- bug fixes
- feature additions
- parameter surface extensions
- dependency and policy evolution

Without requiring:
- migration of all existing onchain state into a new contract set

## Why Upgrades Exist

BERT’s architecture is intentionally modular. Upgrades are expected when the protocol needs to:
- extend grant logic
- improve treasury accounting
- add security checks
- evolve social systems such as progression or reputation
- fix edge cases discovered in testing or production

An upgrade is justified when the change cannot be expressed safely through existing admin-setter parameters alone.

## Storage Layout Rules

These rules are non-negotiable for upgrade safety:

1. do not reorder existing state variables
2. do not insert new variables in the middle of storage
3. only append new variables at the end of the existing layout
4. preserve storage gaps
5. preserve inheritance order unless the storage impact is explicitly understood and validated
6. do not repurpose old storage slots for new semantics

Specific lesson from the August 18, 2026 voting hotfix:
- adding `humanVerifier`, `humanOnlyVoting`, or other new voting fields before legacy voting storage is unsafe
- new voting fields must remain appended after the pre-existing voting storage layout
- post-upgrade validation must read live config values immediately, not only check transaction success

Specific lesson from the v1.2.0 conditional-pledge upgrade:
- preserve legacy slots even when their economic meaning is retired; `GrantManagerUpgradeable.authorSharePercent` remains reserved and is not reused
- append pledge, fee escrow, settlement, and refund state after existing funding-pool storage
- rehearse both successful and refund outcomes, not only the happy-path grant claim
- after the proxy upgrades, call `initializeConditionalPledges(500)` directly from the protocol admin; proxy initializers never run a second time
- after the proxy upgrades, call `initializeConditionalPledgeMigration()` directly from the protocol admin; legacy idea authors must explicitly set their own `minimumNetFunding` with `configureLegacyFundingProposal`
- never infer a legacy target or silently repurpose its author bond; the pre-upgrade proposal remains the author's property until it opts into the new model
- the legacy round queue remains ordered by idea ID. A legacy proposal must be explicitly configured by its author or handled by a dedicated, one-time migration; an unconfigured ID at the front of the queue causes `startFundingRound()` to revert rather than silently skipping an author’s proposal

If a change breaks these rules, the upgrade can preserve admin control while silently corrupting live state.

## Dependency Rewiring Rules

Storage-safe code is not sufficient by itself. BERT modules depend on correct live addresses.

Any upgrade or deployment replacement must validate:
- funding pool address
- idea registry address
- voting system address
- grant manager address
- reputation system address
- voter progression address
- roles registry address

A protocol can be storage-safe and still broken if the dependencies point to the wrong live contracts.

## Pre-Upgrade Checklist

Before any upgrade:
1. confirm the reason for the upgrade
2. document the exact behavioral change
3. validate storage layout compatibility
4. deploy and test the new implementation locally
5. rehearse the upgrade on Sepolia or staging
6. confirm proxy admin ownership
7. confirm target proxy address
8. confirm expected post-upgrade dependency wiring
9. prepare post-upgrade validation steps in advance

If the upgrade touches grant logic, treasury logic, or lifecycle state transitions, the rehearsal should include:
- idea creation
- round creation
- voting
- round resolution
- grant claim
- milestone review
- losing pledge refund
- no-winner refund
- unclaimed-winner expiry and refund
- expired live-grant refund

For a conditional-pledge upgrade from a legacy V2 deployment, also record:
- the raw USDC balance held by FundingPool
- `totalPoolBalance` and `protocolReserve`
- `totalIdeas`, `lastUsedIdeaId`, and the current round state
- every legacy pending proposal that has no funding target

Do not upgrade an active legacy round into the conditional-pledge implementation. Resolve it first with the legacy implementation. A legacy queue may be preserved by having each author configure a minimum net target after upgrade; it must not be automatically treated as a conditional pledge round.

For the live Arc Testnet snapshot taken on September 21, 2026, IDs `1` through `4` are pending pre-V2.3 test proposals. The V2.3 migration may retire exactly this fixed range through `retire-v2-3-legacy-queue.ts`: every legacy ID must still be `Pending`; its author bond is returned; its status becomes `Cancelled`; and the cursor advances exactly to `4`. The live policy keeps `IDEAS_PER_ROUND` at `30`, so the first V2.3 round selects IDs `5` through `34`, each with a committed milestone plan. No V2.3 proposal can be skipped through this migration path.

## Upgrade Procedure

1. deploy the new implementation
2. verify the implementation bytecode and contract identity
3. execute the proxy upgrade through the correct admin path
4. if required, execute any post-upgrade initializer or reconfiguration step
5. record:
   - old implementation
   - new implementation
   - proxy address
   - tx hash
   - operator

Recommended practice:
- never upgrade "blind"
- never rely only on deployment memory
- always use a written checklist

For BERT V2.2 conditional pledges, upgrade all four proxies without a delegated
initializer call. Then call `initializeConditionalPledges(500)` on FundingPool
and `initializeConditionalPledgeMigration()` on IdeaRegistry directly from the
protocol-admin wallet. `ProxyAdmin.upgradeAndCall` is intentionally not used for
these `onlyAdmin` functions because its delegated caller is ProxyAdmin rather
than the protocol admin. VotingSystem and GrantManager do not need an initializer
call for this release, but all four proxies must be upgraded as one coordinated release.

For the V2.3 testnet migration, upgrade `IdeaRegistryUpgradeable` and
`VotingSystemUpgradeable` while V2 remains paused. After the proxy upgrades and before
enabling V2.3 rules, retire the fixed legacy test queue:

```bash
IDEA_REGISTRY_PROXY_ADDRESS=0x... \
VOTING_SYSTEM_PROXY_ADDRESS=0x... \
npx hardhat run scripts/deploy/retire-v2-3-legacy-queue.ts --network arcTestnet
```

The script refuses to run on the wrong chain, with an active/non-pristine queue, if voting
is unpaused, if a legacy idea is no longer pending, or if the migration has already run. It
returns all retired legacy author bonds and verifies the cursor before V2 may be unpaused.

## Post-Upgrade Validation

Immediately after upgrade, validate:
- implementation slot changed as expected
- admin authority still matches expectation
- role wiring remains correct
- dependency addresses remain correct
- critical parameters still match expected values
- key view functions return sane values

For BERT V2.2, run the repository's read-only validator before unpausing:

```bash
npx hardhat run scripts/deploy/verify-v2-conditional-pledges.ts --network arcTestnet
```

It checks that all four proxy implementations are reachable through their existing proxies,
that the new migration state was initialized, that the fee is bounded, that module wiring still
matches the expected proxy addresses, and that the treasury snapshot is readable. It does not
send a transaction.

If the upgrade touches voting access policy, also validate:
- `humanOnlyVoting`
- `humanVerifier`
- `maxVoteAmount`
- `trustedSigner` on the verifier contract
- `pledgeFeeBps` and the configured `IDEAS_PER_ROUND` bound

Smoke-test the following:
- create idea
- read round info
- vote path
- claimability checks
- milestone request reads
- pledge and refund reads
- role checks

If any of these fail, treat the system as potentially inconsistent until proven otherwise.

## Rollback Considerations

Rollback in an upgradeable system usually means upgrading the proxy back to the previous implementation.

This is only safe when:
- the new implementation did not write incompatible state
- the old implementation can still interpret live storage correctly
- dependency wiring remains compatible

Rollback is not magic. It is a controlled re-upgrade, not a guaranteed undo button.

## Common Failure Modes

Common operational upgrade mistakes include:
- using the wrong proxy address
- using the wrong admin signer
- confusing implementation address with proxy address
- changing storage order
- forgetting to validate dependency wiring
- upgrading only one module in a multi-module change
- deploying correct code but wrong configuration
- assuming new verifier-related storage can be inserted near existing voting parameters without layout impact

Protocol-specific risks include:
- grant manager upgrade that no longer matches funding pool assumptions
- voting system upgrade that breaks idea status propagation
- idea registry upgrade that breaks author stake or slashing paths

## Versioning Guidance

Each protocol upgrade should document:
- version number
- rationale
- modules touched
- storage impact
- runtime behavior impact
- dependency rewiring impact
- operational follow-up required

Relevant references:
- `CHANGELOG.md`
- `ARCHITECTURE.md`
- `SECURITY.md`
- `DEPLOYMENT.md`
