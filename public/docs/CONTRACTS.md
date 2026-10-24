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

Historical contract-version milestones below are not one shared version for all
contracts. The current public protocol layers are V2.3 and V3.1; see
[CURRENT-RELEASE.md](CURRENT-RELEASE.md) for exact payout modes.
- `v1.0.0`: proposal registry, rounds, voting, treasury accounting, winner selection, one-step grant claim
- `v1.1.0`: author stake on idea creation, staged grant release `30 / 40 / 30`, milestone proof review, rejection cooldown, reserve-aware rejected stake flow
- `v1.2.0`: conditional stake-backed grant selection, proposal-level net funding targets, refundable losing pledges, fee escrow, deadline-driven grant refunds, and a bounded `5..50` round size
- `v1.3.0`: V2.3 supporter-reviewed grant delivery, including winner-only milestone review and refund of unreleased failed-plan capital
- `v1.4.0`: additive Community Factory authorization in `FundingPoolUpgradeable`, allowing V3.0 and V3.1 Treasuries to route protocol reserve concurrently without replacing either Factory

## Core Contracts

### `IdeaRegistryUpgradeable`
Reference:
- [IdeaRegistryUpgradeable](https://github.com/Tenyokj/bert-core-arc/blob/arc-usdc-migration/contracts/BERT/docs_contracts/IdeaRegistryUpgradeable.md)

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
- `minimumNetFundingByIdea`

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
- a funding proposal must declare non-zero `minimumNetFunding`
- rejected stake slashing path must remain reserve-safe

### `VotingSystemUpgradeable`
Reference:
- [VotingSystemUpgradeable](https://github.com/Tenyokj/bert-core-arc/blob/arc-usdc-migration/contracts/BERT/docs_contracts/VotingSystemUpgradeable.md)

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
- human-voting policy and per-vote cap

Can mutate:
- anyone may start or settle rounds when the configured preconditions and deadlines are satisfied
- voters record stake-backed pledges through the public vote path

Depends on:
- `IdeaRegistryUpgradeable`
- `FundingPoolUpgradeable`
- `ReputationSystemUpgradeable`
- `VoterProgressionUpgradeable`
- `RolesRegistryUpgradeable`

Critical invariants:
- a round cannot include ideas outside its assigned batch
- outcome resolution must select at most one viable winner
- `lastUsedIdeaId` must preserve one-way batching
- vote weight equals pledged token amount
- round size is constrained to `5..50` to bound settlement gas

### `FundingPoolUpgradeable`
Reference:
- [FundingPoolUpgradeable](https://github.com/Tenyokj/bert-core-arc/blob/arc-usdc-migration/contracts/BERT/docs_contracts/FundingPoolUpgradeable.md)

Role in system:
- treasury and accounting engine

Owns this state:
- `totalPoolBalance`
- `protocolReserve`
- donor balances
- author stake balances
- per-round and per-idea pool accounting
- historical distribution records
- pledge ownership, refund status, and fee escrow state

Can mutate:
- contributors can deposit directly
- idea registry can lock author stake and slash rejected stake
- voting system can record one voter pledge per funding round
- grant manager or distributor-authorized paths can release funds
- grant manager can finalize a successful-round fee, cancel an unclaimed winner, or activate an expired-grant refund

Depends on:
- configured USDC token address
- `IdeaRegistryUpgradeable`
- `RolesRegistryUpgradeable`

Critical invariants:
- reserve must remain separate from distributable pool value
- author stake and round funding are distinct accounting buckets
- payout flow must not double-distribute
- internal accounting should remain reconcilable with token balances
- losing pledges are refundable to their recorded owners, not allocated to a different winner
- a Community Treasury may route protocol reserve only when it is active in an explicitly approved Community Factory
- approving V3.1 must not revoke the historical V3.0 Factory; revocation affects only future reserve inflows from that Factory

### `GrantManagerUpgradeable`
Reference:
- [GrantManagerUpgradeable](https://github.com/Tenyokj/bert-core-arc/blob/arc-usdc-migration/contracts/BERT/docs_contracts/GrantManagerUpgradeable.md)

Role in system:
- payout policy and milestone release coordinator

Owns this state:
- author payout records
- per-round grant payout state
- milestone proof request state
- reviewer approval and rejection counters
- payout flags
- claim, milestone, cancellation, and review deadline state

Can mutate:
- winning author can claim initial grant
- winning author can submit milestone proof
- eligible winning backers can vote on V2.3 proof; protocol reviewers handle legacy-round requests only
- admin can change permitted dependencies and pause state; tranche percentages and review thresholds are contract constants, not ordinary setter parameters

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
- an unclaimed or expired grant must open only the documented refund path

### V3.1 Community Layer

V3.1 is deployed as a new Community Factory, not an upgrade of existing V3.0
Communities. Each Community has a thin `CommunityHub`, a sole
`CommunityTreasury` custodian, and dedicated Membership, Proposal, Voting,
Winner Snapshot, and Milestone Manager modules.

State ownership:
- `CommunityFactory`: reserve/activate a canonical Hub and Treasury pair
- `CommunityHub`: cross-module lifecycle, pause-adjusted time, and Admin quorum routing
- `CommunityMembershipModule`: local roles, entry stake, obligations, and safe exits
- `CommunityProposalModule`: Admin/Member proposal intake and validator review
- `CommunityVotingModule`: Binary and Slate voting, settlement, and vote locks
- `CommunityWinnerSnapshot`: immutable eligible-supporter weight for a winning proposal
- `CommunityMilestoneManager`: `20 / 40 / 40` plan release and supporter-review outcomes
- `CommunityTreasury`: USDC custody, escrows, execution reserves, and pull refunds

Critical invariants:
- only the Factory-bound Hub and one-time configured modules may use their narrow Treasury capabilities
- the immutable Administration execution wallet receives approved tranches only; it has no generic Treasury withdrawal right
- only winning supporters may review; patched Manager 1.0.2 additionally excludes the execution recipient from review weight/count without removing financial refund rights. Original deployed Managers retain the known gap (see CURRENT-RELEASE.md)
- failed-plan refunds cover only unreleased plan capital and only the sealed winning-supporter snapshot
- a FundingPool reserve receiver accepts a Treasury only when its Factory remains explicitly approved

## Supporting Contracts

### `RolesRegistryUpgradeable`
Reference:
- [RolesRegistryUpgradeable](https://github.com/Tenyokj/bert-core-arc/blob/arc-usdc-migration/contracts/BERT/docs_contracts/RolesRegistryUpgradeable.md)

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
- [RolesAwareUpgradeable](https://github.com/Tenyokj/bert-core-arc/blob/arc-usdc-migration/contracts/BERT/docs_contracts/RolesAwareUpgradeable.md)

Role in system:
- shared role enforcement layer used by upgradeable protocol modules

### `ReputationSystemUpgradeable`
Reference:
- [ReputationSystemUpgradeable](https://github.com/Tenyokj/bert-core-arc/blob/arc-usdc-migration/contracts/BERT/docs_contracts/ReputationSystemUpgradeable.md)

Role in system:
- tracks reputation scores as a separate social-performance layer

Owns this state:
- user reputation
- initialization state

Critical note:
- reputation is not treasury value and does not replace vote weight

### `VoterProgressionUpgradeable`
Reference:
- [VoterProgressionUpgradeable](https://github.com/Tenyokj/bert-core-arc/blob/arc-usdc-migration/contracts/BERT/docs_contracts/VoterProgressionUpgradeable.md)

Role in system:
- converts successful voters into higher-trust actors

Owns this state:
- winning vote counters
- role grant tracking for curator and reviewer privileges

Critical thresholds:
- curator threshold: `20`
- reviewer threshold: `60`

### `PoPVerifierUpgradeable`
Reference:
- [PoPVerifierUpgradeable](https://github.com/Tenyokj/bert-core-arc/blob/arc-usdc-migration/contracts/BERT/docs_contracts/PoPVerifierUpgradeable.md)

Role in system:
- stores trusted proof-of-personhood attestations for voting access

Owns this state:
- trusted backend signer
- per-wallet verification expiry
- per-wallet verification nonce progression

Critical note:
- this module does not score humanity itself
- it only records backend-signed verification outcomes in an onchain form that `VotingSystemUpgradeable` can consume

## Shared Types and Utilities

### `IdeaStatus`
Reference:
- [IdeaStatus](https://github.com/Tenyokj/bert-core-arc/blob/arc-usdc-migration/contracts/BERT/docs_contracts/IdeaStatus.md)

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
- [Errors](https://github.com/Tenyokj/bert-core-arc/blob/arc-usdc-migration/contracts/BERT/docs_contracts/Errors.md)

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
