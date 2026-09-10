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

## Post-Upgrade Validation

Immediately after upgrade, validate:
- implementation slot changed as expected
- admin authority still matches expectation
- role wiring remains correct
- dependency addresses remain correct
- critical parameters still match expected values
- key view functions return sane values

Smoke-test the following:
- create idea
- read round info
- vote path
- claimability checks
- milestone request reads
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
