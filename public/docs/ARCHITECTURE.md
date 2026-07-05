# Architecture Overview

BERT is a modular, upgradeable, stablecoin-native grant allocation protocol built around proposal intake, round-based capital signaling, controlled treasury accounting, and milestone-based payout release.

The protocol is not just a “grant voting app”. It is a multi-layer system with:
- a proposal registry layer
- a voting and round orchestration layer
- a treasury and accounting layer
- a grant release layer
- a role authority layer
- a reputation layer
- a voter progression layer

The settlement asset is USDC. Proposal stake, vote commitments, treasury accounting, reserve accounting, and staged grant release are all denominated in USDC on Arc.

## Contents
1. Purpose
2. Design Principles
3. System Layers
4. End-to-End Protocol Flow
5. Core Modules
6. Supporting Modules
7. Access Control Model
8. State and Lifecycle Model
9. Capital and Treasury Model
10. Reputation and Progression Model
11. Milestone Release Model
12. Cross-Contract Dependency Graph
13. Trust Boundaries
14. Upgradeability and Storage
15. Arc Fit
16. ASCII Diagrams

## Purpose

BERT exists to make grant capital:
- transparent
- stake-backed
- round-coordinated
- milestone-released
- role-governed
- upgradeable without rewriting the full protocol

Instead of distributing funds through an opaque or one-shot grant model, BERT separates the process into distinct stages:
- idea creation
- round participation
- vote-backed winner resolution
- treasury allocation
- staged author payout
- reviewer-gated milestone release

## Design Principles

1. Economic actions should be explicit.
   Proposal creation, voting, and grant release are tied to token-denominated accounting rather than soft signaling alone.

2. State should have a single source of truth.
   Idea metadata lives in the idea registry, round data lives in the voting system, payout state lives in the grant manager, and treasury accounting lives in the funding pool.

3. Permissions should be centralized.
   Protocol roles and user roles are managed through a dedicated role registry rather than duplicated access logic in each module.

4. Social trust should be mediated by protocol signals.
   Reputation and voter progression are separate service layers that react to protocol outcomes instead of being manually embedded into treasury logic.

5. Grants should not be paid blindly.
   Winning a round does not imply full immediate release. Funds move through a 30 / 40 / 30 milestone schedule with reviewer checkpoints.

6. Upgradeability should preserve boundaries.
   Modules remain separate even when upgraded, and storage extensions are appended rather than reordered.

## System Layers

### 1. Proposal Layer
Handled by `IdeaRegistryUpgradeable`.

Responsibilities:
- create ideas
- store proposal metadata
- track idea lifecycle status
- collect and lock author submission stake
- record reviews and low-quality flags
- slash rejected author stake into reserve

### 2. Round and Voting Layer
Handled by `VotingSystemUpgradeable`.

Responsibilities:
- batch ideas into rounds
- accept vote commitments
- enforce minimum vote stake
- track round totals and per-idea totals
- resolve winners and losers
- update idea statuses after round resolution

### 3. Treasury and Accounting Layer
Handled by `FundingPoolUpgradeable`.

Responsibilities:
- hold USDC treasury balances
- record donor balances
- record author stake balances
- record per-round and per-idea voting capital
- move unused or slashed value into protocol reserve
- execute actual grant transfers when instructed

### 4. Grant Release Layer
Handled by `GrantManagerUpgradeable`.

Responsibilities:
- validate grant claim eligibility
- calculate author vs protocol share
- release initial tranche
- manage milestone proof submission
- manage reviewer approval/rejection flow
- release later tranches only after proof approval

### 5. Permission Layer
Handled by `RolesRegistryUpgradeable` plus `RolesAwareUpgradeable`.

Responsibilities:
- define all protocol and user roles
- grant system roles to contracts
- grant user roles via progression logic
- provide consistent access control checks across modules

### 6. Reputation Layer
Handled by `ReputationSystemUpgradeable`.

Responsibilities:
- initialize reputation for new actors
- increase or decrease reputation based on outcomes
- expose score state as a separate social-performance system

### 7. Voter Progression Layer
Handled by `VoterProgressionUpgradeable`.

Responsibilities:
- count winning votes by voter
- grant elevated user roles at thresholds
- convert successful participation into curation/review authority

## End-to-End Protocol Flow

### A. Idea Creation
1. A builder calls `createIdea` in `IdeaRegistryUpgradeable`.
2. The idea includes:
   - title
   - description
   - optional external link
   - author stake amount
3. `IdeaRegistryUpgradeable` checks:
   - non-empty fields
   - funding pool is configured
   - amount is at least `authorMinStake`
   - token balance and allowance are sufficient
4. The author’s stake is moved into `FundingPoolUpgradeable` through `depositAuthorStakeFrom`.
5. If the author has no reputation entry yet, reputation is initialized.
6. The new idea is stored with `Pending` status.

### B. Round Formation
1. An admin/operator starts a round in `VotingSystemUpgradeable`.
2. The voting system checks that enough unused ideas exist:
   - `availableIdeas = totalIdeas - lastUsedIdeaId`
   - `availableIdeas >= IDEAS_PER_ROUND`
3. A contiguous batch of ideas is selected into the new round.
4. Their statuses move from `Pending` to `Voting`.
5. `lastUsedIdeaId` advances so ideas are not reused in later rounds.
6. `currentRoundId` is incremented for the next future round.

### C. Voting
1. A voter commits token-denominated voting stake through `vote(roundId, ideaId, amount)`.
2. `VotingSystemUpgradeable` checks:
   - round exists
   - round is active
   - idea belongs to the round
   - amount is at least `minStake`
3. Treasury accounting is updated by calling `FundingPoolUpgradeable.depositForIdeaFrom`.
4. The vote is recorded in round state and reflected in idea vote totals.

### D. Round Resolution
1. After the voting window closes, the round is ended.
2. `VotingSystemUpgradeable` determines the winning idea from recorded vote totals.
3. Status changes occur:
   - winner: `Voting -> WonVoting`
   - losers: `Voting -> Rejected`
4. Reputation updates are triggered:
   - winning author reputation can increase
   - losing/rejected author reputation can decrease
5. Voter progression is updated:
   - voters who backed the winning idea receive a “winning vote” registration
6. Rejected ideas can have their author stake slashed into `protocolReserve` through the idea registry / funding pool interaction.

### E. Grant Claim
1. The winning author claims the grant through `GrantManagerUpgradeable.claimGrant(roundId)`.
2. The grant manager validates:
   - round ended
   - winner exists
   - winning idea is eligible
   - grant has not already been claimed
   - caller is the winning author
3. Treasury value allocated to the winning idea is read from the funding pool.
4. Author share is calculated from `authorSharePercent`.
5. Initial payout is released.
6. Idea status moves to `Funded`.

### F. Milestone Release
1. The author submits milestone proof for the next stage.
2. Reviewers evaluate the proof.
3. Reviewer approvals can unlock:
   - in-process payout
   - completion payout
4. Rejections set `lastRejectedAt` and enforce cooldown before resubmission.
5. Final status progression ends at `Completed`.

## Core Modules

## `IdeaRegistryUpgradeable`

This contract is the proposal source of truth.

Primary responsibilities:
- store idea metadata
- store author address
- store creation timestamp
- store total vote amount
- store idea status
- store review comments
- store low-quality markers
- enforce author submission stake on creation

Important integrations:
- `FundingPoolUpgradeable` for author stake locking
- `ReputationSystemUpgradeable` for author initialization and reputation-linked behavior
- `VoterProgressionUpgradeable` as a connected ecosystem service
- `RolesRegistryUpgradeable` for curator/reviewer access checks

Important notes:
- idea lifecycle is explicit and status-driven
- rejected ideas can trigger author stake slashing into reserve
- this module is not the treasury and does not hold token balances itself

## `VotingSystemUpgradeable`

This contract is the round orchestrator and vote engine.

Primary responsibilities:
- create rounds
- assign ideas into rounds
- enforce `IDEAS_PER_ROUND`
- enforce `VOTING_DURATION`
- enforce `minStake`
- record votes and round totals
- resolve winning idea per round
- update idea statuses at round end

Important integrations:
- `FundingPoolUpgradeable` for capital commitment
- `IdeaRegistryUpgradeable` for status transitions and idea validation
- `ReputationSystemUpgradeable` for author outcome updates
- `VoterProgressionUpgradeable` for rewarding correct voters

Important notes:
- rounds are batched from the global idea sequence using `lastUsedIdeaId`
- the voting system is the source of truth for round membership and round results
- voting weight equals committed token amount

## `FundingPoolUpgradeable`

This contract is the treasury/accounting engine.

Primary responsibilities:
- accept direct deposits
- track donor balances
- track locked author stakes
- track per-round / per-idea allocated capital
- maintain `totalPoolBalance`
- maintain `protocolReserve`
- distribute funds when instructed by authorized modules

Important state:
- `totalPoolBalance`
- `protocolReserve`
- `donorBalances`
- `authorStakes`
- `poolByRoundAndIdea`

Important flows:
- author stake enters here at idea creation
- vote commitment enters here during voting
- grant payout leaves from here during claim and milestone release
- slashed or leftover value can move into reserve
- reserve can later be allocated back to an idea by admin action if needed

Important notes:
- this is accounting-aware treasury logic, not just a generic ERC-20 vault
- author stake and round vote capital are tracked separately
- reserve is accounted for separately from distributable balances

## `GrantManagerUpgradeable`

This contract is the payout policy engine.

Primary responsibilities:
- validate winning-round claimability
- create payout state per funded round
- split author share vs protocol share
- release staged payouts
- manage milestone proof review state
- prevent duplicate payouts
- enforce cooldown after rejected milestone proofs

Important state:
- `authorSharePercent`
- `grantPayouts`
- `milestoneRequests`

Important notes:
- grant manager does not own round state
- it reads round outcome from the voting system
- it reads and updates idea lifecycle through the idea registry
- it coordinates treasury release through the funding pool

## Supporting Modules

## `RolesRegistryUpgradeable`

Central permission authority for the entire protocol.

System roles:
- `VOTING_ROLE`
- `GRANT_ROLE`
- `DISTRIBUTOR_ROLE`
- `IREGISTRY_ROLE`
- `REPUTATION_MANAGER_ROLE`
- `AUTO_GRANT_ROLE`

User roles:
- `CURATOR_ROLE`
- `REVIEWER_ROLE`

Important architectural role:
- separates permission issuance from business logic
- allows contract replacement / upgrade with role reassignment
- ensures user roles are not manually embedded in voting or treasury modules

## `RolesAwareUpgradeable`

Shared access-control mixin used by protocol modules.

Purpose:
- normalize role checks
- avoid duplicating role-lookup logic
- keep every module wired to the same role authority

## `ReputationSystemUpgradeable`

Social-performance layer for builders and participants.

Responsibilities:
- initialize reputation for new users
- increase or decrease reputation based on protocol outcomes
- cap and expose reputation as separate state

Architectural role:
- reputation is not used as treasury storage
- reputation is not the same thing as voting weight
- it is a parallel trust signal attached to user performance

## `VoterProgressionUpgradeable`

Privilege-escalation layer for voters.

Responsibilities:
- count winning votes per address
- grant `CURATOR_ROLE` at threshold
- grant `REVIEWER_ROLE` at threshold
- expose progression status helpers

Current thresholds:
- `CURATOR_THRESHOLD = 20`
- `REVIEWER_THRESHOLD = 60`

Architectural role:
- successful voting participation turns into moderation/review authority
- user roles are earned through protocol outcomes, not arbitrary assignment alone
- progression is based on winning votes, not just raw activity

## `IdeaStatus` and `Errors`

These are protocol-wide coordination primitives.

`IdeaStatus` defines lifecycle stages:
- `Pending`
- `Voting`
- `WonVoting`
- `Funded`
- `Rejected`
- `Completed`
- `InProcess`

`Errors` defines shared revert conditions so modules fail consistently and predictably across the system.

## Access Control Model

BERT separates authority into three categories:

### 1. Admin Authority
Typically `DEFAULT_ADMIN_ROLE`.

Can:
- configure dependencies
- update parameters
- pause critical modules
- grant/revoke system roles
- perform emergency or maintenance actions

### 2. System Contract Authority
Granted to protocol modules through `RolesRegistryUpgradeable`.

Examples:
- voting system can update idea status and register outcome-linked events
- grant manager can distribute authorized treasury value
- idea registry can slash author stake to reserve
- progression layer can grant user roles through `AUTO_GRANT_ROLE`

### 3. Earned User Authority
Granted to end users through progression thresholds or explicit admin override.

Examples:
- `CURATOR_ROLE`
- `REVIEWER_ROLE`

This means moderation and milestone review are not open to every wallet by default.

## State and Lifecycle Model

### Idea Lifecycle
Normal path:
`Pending -> Voting -> WonVoting -> Funded -> InProcess -> Completed`

Failure path:
`Pending/Voting -> Rejected`

### Round Lifecycle
1. round created
2. ideas assigned
3. round accepts votes
4. round ends
5. winning idea selected
6. outcome propagated to idea registry, reputation, and progression systems

### Grant Lifecycle
1. round winner exists
2. author claims initial payout
3. idea enters funded execution phase
4. milestone proof submitted
5. reviewers approve or reject
6. later tranches released
7. final completion closes the funded lifecycle

## Capital and Treasury Model

### Treasury Asset
The treasury asset is USDC.

### Capital Buckets
BERT distinguishes several economic buckets:
- direct treasury deposits from contributors
- author submission stake
- round-level / idea-level voting capital
- protocol reserve
- released author grant amounts

### Why This Separation Matters
These balances are not interchangeable:
- author stake is anti-spam collateral
- voting capital is round-specific signaling capital
- reserve is protected protocol-held value
- treasury deposits are general funding capacity

### Key Accounting Properties
1. vote weight equals token amount committed
2. idea-level balances are tracked inside a round context
3. reserve is tracked separately from total live distributable capital
4. author stake can be slashed independently of round funding
5. payout flags prevent double release

## Reputation and Progression Model

BERT has two separate social layers:

### Reputation
Used to represent user or builder performance over time.

Triggered by:
- onboarding initialization
- successful or unsuccessful round outcomes
- protocol-defined reputation adjustments

### Voter Progression
Used to turn accurate, outcome-aligned voters into higher-trust actors.

Triggered by:
- backing winning ideas
- crossing winning-vote thresholds

This separation is important:
- reputation tracks quality/performance
- progression tracks earned governance-adjacent privileges

They are related, but not the same subsystem.

## Milestone Release Model

The grant release model is intentionally staged.

### Tranches
- initial claim: `30%`
- in-process milestone: `40%`
- completion milestone: `30%`

### Why This Exists
A winning vote should not immediately unlock 100% of capital. The milestone layer ensures:
- early execution capital is available
- later capital requires proof
- reviewers can reject insufficient proof
- rejected proof cannot be spammed repeatedly because cooldown is enforced

### Review Safeguards
- duplicate review prevention
- active request tracking
- rejection cooldown using `lastRejectedAt`
- payout flags to prevent re-release
- stage eligibility checks

## Cross-Contract Dependency Graph

### `IdeaRegistryUpgradeable` depends on
- `FundingPoolUpgradeable`
- `ReputationSystemUpgradeable`
- `VoterProgressionUpgradeable`
- `RolesRegistryUpgradeable`

### `VotingSystemUpgradeable` depends on
- `FundingPoolUpgradeable`
- `IdeaRegistryUpgradeable`
- `ReputationSystemUpgradeable`
- `VoterProgressionUpgradeable`
- `RolesRegistryUpgradeable`

### `FundingPoolUpgradeable` depends on
- configured USDC token address
- `IdeaRegistryUpgradeable`
- `RolesRegistryUpgradeable`

### `GrantManagerUpgradeable` depends on
- `VotingSystemUpgradeable`
- `FundingPoolUpgradeable`
- `IdeaRegistryUpgradeable`
- `RolesRegistryUpgradeable`

### `VoterProgressionUpgradeable` depends on
- `RolesRegistryUpgradeable`

### `ReputationSystemUpgradeable` depends on
- `RolesRegistryUpgradeable`

## Trust Boundaries

### Admin Trust
Admins can:
- change parameters
- replace dependencies
- grant/revoke roles
- pause modules
- affect reserve allocation behavior

So admin trust is still a real trust boundary.

### Contract Trust
Core modules trust each other by role assignment and configured address wiring.

This means deployment wiring is critical:
- wrong funding pool address breaks idea creation
- wrong role grants break state transitions
- wrong reputation/progression addresses break social side effects

### Reviewer / Curator Trust
Some lifecycle actions are intentionally delegated to earned user roles:
- curators can mark low-quality ideas
- reviewers can review ideas and milestone proofs

This introduces human trust, but within bounded role-controlled surfaces.

## Upgradeability and Storage

BERT uses proxy-based upgradeability for core modules.

### Upgrade Model
- core modules are deployed behind upgradeable proxies
- contract logic can evolve while state remains in proxy storage
- permissions and dependency wiring allow contract replacement over time

### Storage Safety Principles
- append storage, do not reorder
- keep module storage boundaries separate
- prefer interface-based cross-contract reads over shared storage assumptions
- preserve role wiring and dependency invariants across upgrades

### Why This Matters
BERT is intentionally modular. Upgrading grant release policy should not require rewriting the voting engine. Upgrading voting should not require rewriting treasury accounting.

## Arc Fit

BERT is designed for Arc as a USDC-native execution environment.

Why Arc and Circle make sense:
- BERT’s core unit is USDC-denominated capital coordination, not speculative governance weight
- settlement is easier to reason about when the funding asset is stable
- treasury movement, staged grant release, and reserve accounting align naturally with Arc and Circle-backed stablecoin rails

In short:
BERT uses Arc as programmable funding infrastructure for real treasury coordination in USDC.

## ASCII Diagrams

### High-Level Module Diagram
```text
                        +-----------------------------+
                        |   RolesRegistryUpgradeable  |
                        |  system roles + user roles  |
                        +--------------+--------------+
                                       |
                               checked through
                                       |
                        +--------------v--------------+
                        |    RolesAwareUpgradeable    |
                        +--------------+--------------+

+----------------------+      +-----------------------+      +------------------------+
| IdeaRegistryUpg.     |<---->| VotingSystemUpg.      |----->| VoterProgressionUpg.   |
| ideas + reviews      |      | rounds + votes        |      | winning vote thresholds |
| status source        |      | winner resolution     |      | curator/reviewer roles  |
+----------+-----------+      +-----------+-----------+      +------------------------+
           |                                  |
           |                                  |
           v                                  v
+----------+-----------+            +---------+--------------+
| ReputationSystemUpg. |            | FundingPoolUpg.        |
| reputation tracking  |            | treasury + reserve     |
+----------------------+            | author stake + pools   |
                                    +-----------+------------+
                                                |
                                                v
                                    +-----------+------------+
                                    | GrantManagerUpg.       |
                                    | claim + milestones     |
                                    | 30 / 40 / 30 release   |
                                    +-----------+------------+
                                                |
                                                v
                                         Winning builder
```

### Capital Flow Diagram
```text
Builder
  |
  | createIdea + author stake
  v
IdeaRegistryUpgradeable
  |
  | depositAuthorStakeFrom
  v
FundingPoolUpgradeable
  ^
  | depositForIdeaFrom (vote capital)
  |
VotingSystemUpgradeable
  |
  | winner resolution
  v
GrantManagerUpgradeable
  |
  | initial claim: 30%
  | milestone 1:   40%
  | milestone 2:   30%
  v
Winning builder
```

### Outcome and Trust Signal Diagram
```text
Round ends
   |
   +--> winning idea author -> reputation increase
   |
   +--> rejected/losing idea author -> reputation decrease or rejection path
   |
   +--> voters on winning idea -> registerWinningVote()
                                |
                                +--> CURATOR_ROLE at threshold
                                +--> REVIEWER_ROLE at threshold
```

## Summary
BERT should be understood as a layered protocol, not a single grant contract.
Its architecture is made of:
- proposal state in IdeaRegistryUpgradeable
- round logic in VotingSystemUpgradeable
- treasury accounting in FundingPoolUpgradeable
- payout orchestration in GrantManagerUpgradeable
- centralized permissions in RolesRegistryUpgradeable
- social-performance state in ReputationSystemUpgradeable
- earned voter authority in VoterProgressionUpgradeable

That separation is the core architectural idea of BERT.
It is what allows the protocol to be stablecoin-native, role-aware, milestone-based, and upgradeable at the same time.
