# Deployment

This document describes how BERT should be deployed and wired as a multi-contract upgradeable system.

## Contents
1. Deployment Philosophy
2. Expected Deployment Order
3. Wiring Order
4. Role Assignment Order
5. Post-Deploy Checks

## Deployment Philosophy

BERT is not a single-contract deployment. Safe deployment requires:
- correct proxy deployment
- correct implementation initialization
- correct dependency wiring
- correct role assignment

Wrong wiring can break the system even if every contract compiled correctly.

## Expected Deployment Order

Recommended high-level order:
1. deploy role authority
2. deploy reputation and progression services
3. deploy treasury and proposal registry
4. deploy voting system
5. deploy grant manager
6. deploy optional verified-human verifier
7. deploy any test or faucet utilities

## Wiring Order

After deployment, set or validate:
- roles registry in roles-aware modules
- funding pool dependency in idea registry and voting flows
- idea registry dependency in voting and grant flows
- reputation system dependency
- voter progression dependency
- verified-human verifier address in voting, if human-only voting is enabled
- trusted signer in the verifier, if PoP attestations are used

## Role Assignment Order

Assign system roles after deployment and before opening live usage:
- `VOTING_ROLE`
- `GRANT_ROLE`
- `DISTRIBUTOR_ROLE`
- `IREGISTRY_ROLE`
- `REPUTATION_MANAGER_ROLE`
- `AUTO_GRANT_ROLE`

Only after wiring and role assignment should the live flow be considered usable.

## Post-Deploy Checks

Validate:
- proxy addresses
- implementation addresses
- proxy admin ownership
- dependency addresses in each module
- system role assignments
- core parameters such as stake and duration values
- verified-human parameters such as `humanOnlyVoting`, `humanVerifier`, and `maxVoteAmount`
- verifier signer settings such as `trustedSigner`

Recommended smoke tests:
- create idea
- start round
- verify a wallet through the configured human-verification flow
- vote with a verified wallet
- confirm an unverified wallet cannot vote when `humanOnlyVoting = true`
- confirm a vote above `maxVoteAmount` reverts
- end round
- check claimability
