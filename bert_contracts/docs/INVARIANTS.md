# Invariants

This document records the core protocol invariants BERT is expected to preserve across normal operation, upgrades, and incident response.

## Contents
1. State Ownership Invariants
2. Lifecycle Invariants
3. Treasury Invariants
4. Role and Permission Invariants
5. Milestone Review Invariants
6. Upgrade Invariants

## State Ownership Invariants

1. idea metadata is owned only by `IdeaRegistryUpgradeable`
2. round membership and outcome are owned only by `VotingSystemUpgradeable`
3. treasury and reserve accounting are owned only by `FundingPoolUpgradeable`
4. grant payout state is owned only by `GrantManagerUpgradeable`
5. role assignments are owned only by `RolesRegistryUpgradeable`
6. reputation scores are owned only by `ReputationSystemUpgradeable`
7. winning-vote progression state is owned only by `VoterProgressionUpgradeable`

## Lifecycle Invariants

1. ideas must enter the lifecycle through `Pending`
2. only batched round membership can move an idea into `Voting`
3. only valid round resolution can move an idea into `WonVoting` or `Rejected`
4. only valid grant claim can move a winning idea into `Funded`
5. completion payout should not occur before in-process payout
6. terminal or rejected states should not be bypassed by arbitrary mutation

## Treasury Invariants

1. author stake and vote capital are not the same accounting bucket
2. protocol reserve remains separate from active distributable balances
3. the same grant tranche must not be released twice
4. rejected author stake must not remain unaccounted after valid slashing
5. round and idea accounting must remain scoped to the correct round and idea pair

## Role and Permission Invariants

1. system roles are not intended for arbitrary EOAs
2. user roles cannot be self-granted by arbitrary users
3. progression-based role grants must flow through `AUTO_GRANT_ROLE`
4. unauthorized actors must not be able to mutate treasury, lifecycle, or reputation state

## Milestone Review Invariants

1. a reviewer cannot count twice in the same active milestone request
2. rejected proof must respect cooldown before resubmission
3. inactive or already-settled requests must not reopen payout accidentally
4. stage ordering must be preserved

## Upgrade Invariants

1. storage must not be reordered
2. storage additions must be appended
3. dependency wiring must remain valid after upgrade
4. role wiring must remain valid after upgrade
5. a storage-safe upgrade is not considered safe if it breaks runtime dependency assumptions
