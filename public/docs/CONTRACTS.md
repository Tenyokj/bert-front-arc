# Contracts

This document maps the major BERT protocol contracts, their responsibilities, their state ownership, and their dependency boundaries.

## Contents
1. Version Scope
2. Core Contracts
3. Supporting Contracts
4. Shared Types and Utilities
5. Authority Boundaries
6. Upgradeability Notes

## Version Scope

Current documented core flow:
- `v1.0.0`: proposal registry, rounds, voting, treasury accounting, winner selection, one-step grant claim
- `v1.1.0`: author stake on idea creation, staged grant release `30 / 40 / 30`, milestone proof review, rejection cooldown, reserve-aware rejected stake flow

## Core Contracts

### `IdeaRegistryUpgradeable`
Reference:
- [IdeaRegistryUpgradeable](../contracts/BERT/docs_contracts/IdeaRegistryUpgradeable.md)

Role in system:
- source of truth for proposal metadata and lifecycle state

Owns this state:
- idea metadata
- author address
- created timestamp
- aggregate idea vote total
- idea status
- low-quality flag
- review records

Can mutate:
- the author can create a new idea
- voting system can register vote-linked updates and status changes
- grant manager can advance funded lifecycle status
- curators can mark low-quality ideas
- reviewers can add reviews

Depends on:
- `FundingPoolUpgradeable`
- `ReputationSystemUpgradeable`
- `VoterProgressionUpgradeable`
- `RolesRegistryUpgradeable`

Critical invariants:
- proposal metadata is owned only here
- idea status transitions are explicit and gated
- author stake must satisfy `authorMinStake`
- rejected stake slashing path must remain reserve-safe

### `VotingSystemUpgradeable`
Reference:
- [VotingSystemUpgradeable](../contracts/BERT/docs_contracts/VotingSystemUpgradeable.md)

Role in system:
- round orchestrator and vote engine

Owns this state:
- round membership
- round start and end timing
- per-round vote totals
- winner resolution
- per-round voter participation tracking
- `lastUsedIdeaId`
- `currentRoundId`

Can mutate:
- admin or authorized operator starts and ends rounds
- voters commit stake-backed votes through the public vote path

Depends on:
- `IdeaRegistryUpgradeable`
- `FundingPoolUpgradeable`
- `ReputationSystemUpgradeable`
- `VoterProgressionUpgradeable`
- `RolesRegistryUpgradeable`

Critical invariants:
- a round cannot include ideas outside its assigned batch
- outcome resolution must not produce multiple winners
- `lastUsedIdeaId` must preserve one-way batching
- vote weight equals committed token amount

### `FundingPoolUpgradeable`
Reference:
- [FundingPoolUpgradeable](../contracts/BERT/docs_contracts/FundingPoolUpgradeable.md)

Role in system:
- treasury and accounting engine

Owns this state:
- `totalPoolBalance`
- `protocolReserve`
- donor balances
- author stake balances
- per-round and per-idea pool accounting
- historical distribution records

Can mutate:
- contributors can deposit directly
- idea registry can lock author stake and slash rejected stake
- voting system can move vote capital into round/idea accounting
- grant manager or distributor-authorized paths can release funds
- admin can allocate reserve back into round/idea accounting

Depends on:
- configured USDC token address
- `IdeaRegistryUpgradeable`
- `RolesRegistryUpgradeable`

Critical invariants:
- reserve must remain separate from distributable pool value
- author stake and round funding are distinct accounting buckets
- payout flow must not double-distribute
- internal accounting should remain reconcilable with token balances

### `GrantManagerUpgradeable`
Reference:
- [GrantManagerUpgradeable](../contracts/BERT/docs_contracts/GrantManagerUpgradeable.md)

Role in system:
- payout policy and milestone release coordinator

Owns this state:
- author payout records
- per-round grant payout state
- milestone proof request state
- reviewer approval and rejection counters
- payout flags
- author share configuration

Can mutate:
- winning author can claim initial grant
- winning author can submit milestone proof
- reviewers can approve or reject proof
- admin can adjust payout policy parameters

Depends on:
- `VotingSystemUpgradeable`
- `FundingPoolUpgradeable`
- `IdeaRegistryUpgradeable`
- `RolesRegistryUpgradeable`

Critical invariants:
- the same tranche cannot be released twice
- proof review cannot be duplicated by a single reviewer
- stage order must be enforced
- rejected proof must respect cooldown

## Supporting Contracts

### `RolesRegistryUpgradeable`
Reference:
- [RolesRegistryUpgradeable](../contracts/BERT/docs_contracts/RolesRegistryUpgradeable.md)

Role in system:
- single permission authority for system and user roles

Owns this state:
- all role assignments

Critical roles:
- `VOTING_ROLE`
- `GRANT_ROLE`
- `DISTRIBUTOR_ROLE`
- `IREGISTRY_ROLE`
- `REPUTATION_MANAGER_ROLE`
- `AUTO_GRANT_ROLE`
- `CURATOR_ROLE`
- `REVIEWER_ROLE`

### `RolesAwareUpgradeable`
Reference:
- [RolesAwareUpgradeable](../contracts/BERT/docs_contracts/RolesAwareUpgradeable.md)

Role in system:
- shared role enforcement layer used by upgradeable protocol modules

### `ReputationSystemUpgradeable`
Reference:
- [ReputationSystemUpgradeable](../contracts/BERT/docs_contracts/ReputationSystemUpgradeable.md)

Role in system:
- tracks reputation scores as a separate social-performance layer

Owns this state:
- user reputation
- initialization state

Critical note:
- reputation is not treasury value and does not replace vote weight

### `VoterProgressionUpgradeable`
Reference:
- [VoterProgressionUpgradeable](../contracts/BERT/docs_contracts/VoterProgressionUpgradeable.md)

Role in system:
- converts successful voters into higher-trust actors

Owns this state:
- winning vote counters
- role grant tracking for curator and reviewer privileges

Critical thresholds:
- curator threshold: `20`
- reviewer threshold: `60`

## Shared Types and Utilities

### `IdeaStatus`
Reference:
- [IdeaStatus](../contracts/BERT/docs_contracts/IdeaStatus.md)

Defines the protocol idea lifecycle:
- `Pending`
- `Voting`
- `WonVoting`
- `Funded`
- `Rejected`
- `Completed`
- `InProcess`

### `Errors`
Reference:
- [Errors](../contracts/BERT/docs_contracts/Errors.md)

Provides protocol-wide custom errors for:
- validation
- authorization
- treasury logic
- grant release logic
- upgrade-safe failure reporting

## Authority Boundaries

State ownership is intentionally split:
- idea metadata and lifecycle: `IdeaRegistryUpgradeable`
- round composition and outcome: `VotingSystemUpgradeable`
- treasury and reserve accounting: `FundingPoolUpgradeable`
- payout and milestone release state: `GrantManagerUpgradeable`
- system and user permissions: `RolesRegistryUpgradeable`
- reputation: `ReputationSystemUpgradeable`
- winning-vote progression: `VoterProgressionUpgradeable`

This boundary design is central to BERT. No single contract should become the implicit source of truth for every dimension of the protocol.

## Upgradeability Notes

Most core modules are upgradeable and deployed behind proxies. That means every contract description above should be read together with:
- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [UPGRADES.md](./UPGRADES.md)
- [INVARIANTS.md](./INVARIANTS.md)

When reviewing or modifying contracts, always ask:
- which state does this module truly own
- which permissions allow it to mutate that state
- which downstream modules trust this state to remain valid
