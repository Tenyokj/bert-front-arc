# Configuration

This document describes the major protocol parameters, where they live, what they affect, and why careless changes can degrade economics, security, or operator usability.

## Contents
1. Configuration Philosophy
2. Voting Parameters
3. Proposal Intake Parameters
4. Grant Release Parameters
5. Treasury and Token Configuration
6. Role and Dependency Wiring
7. Recommended Defaults
8. Change Management Guidance

## Configuration Philosophy

BERT configuration is not cosmetic. Parameter changes affect:
- spam resistance
- round cadence
- voter friction
- author participation cost
- treasury distribution behavior
- reviewer workload
- reserve accumulation

Configuration should therefore be treated as part of protocol policy, not only as deployment setup.

## Voting Parameters

### `IDEAS_PER_ROUND`
Owned by:
- `VotingSystemUpgradeable`

Meaning:
- how many ideas are batched into a single round

Higher values:
- increase round density
- increase comparison complexity for voters
- increase gas and state-processing load during round creation and resolution

Lower values:
- create narrower rounds
- reduce cognitive load
- may slow broad protocol throughput if too many rounds are required

Operational note:
- if set too high relative to proposal supply, rounds can become harder to reason about
- if set too low, the system may fragment capital signaling across too many small rounds
- the contract enforces `5 <= IDEAS_PER_ROUND <= 50`; default policy is `30`

### `VOTING_DURATION`
Owned by:
- `VotingSystemUpgradeable`

Meaning:
- how long a round stays open for voting

Higher values:
- give more time for coordination and discovery
- slow funding cadence
- keep capital in unresolved state longer

Lower values:
- speed treasury decisions
- increase the risk of low-participation or rushed rounds

### `minStake`
Owned by:
- `VotingSystemUpgradeable`

Meaning:
- minimum token amount required to cast a vote

Higher values:
- reduce low-signal or spam voting
- increase voter friction
- may shrink total voter participation

Lower values:
- improve accessibility
- increase noise and potential low-conviction participation

### `humanOnlyVoting`
Owned by:
- `VotingSystemUpgradeable`

Meaning:
- whether voting is restricted to wallets that pass the configured verified-human policy

When enabled:
- enforces the configured attestation gate; Sybil resistance depends on the provider
- adds integration dependency on an external verifier
- increases participation quality at the cost of some UX friction

Operational note:
- do not enable this without configuring `humanVerifier`

### `humanVerifier`
Owned by:
- `VotingSystemUpgradeable`

Meaning:
- external verifier contract that decides whether a wallet is allowed to vote as a verified human

Operational note:
- this should remain provider-agnostic at the protocol layer
- the verifier can be backed by proof-of-personhood, privacy-preserving identity checks, or stronger compliance flows
- the verifier stores attestations signed by a trusted backend signer; Arc Testnet currently uses explicitly labelled Demo credentials, not real personhood verification
- production World ID is a planned policy subject to complete proof verification and deployment readiness
- operators must keep the trusted signer and backend environment aligned

### `maxVoteAmount`
Owned by:
- `VotingSystemUpgradeable`

Meaning:
- maximum amount a single wallet can commit in one vote

Higher values:
- preserve capital expression for large voters
- weaken anti-whale protection

Lower values:
- reduce single-wallet influence
- can push large participants to split capital if identity gating is weak

Operational note:
- this works best together with verified-human gating, not by itself
- current live policy target:
  `humanOnlyVoting = true`
  `maxVoteAmount = 10_000 * 10^6`

## Proposal Intake Parameters

### `authorMinStake`
Owned by:
- `IdeaRegistryUpgradeable`

Meaning:
- minimum author stake required to create an idea

Higher values:
- increase anti-spam protection
- create stronger economic commitment from builders
- can exclude smaller or newer builders

Lower values:
- improve accessibility for idea creation
- weaken spam resistance
- reduce the economic significance of rejected-stake slashing

Operational note:
- this parameter directly shapes the quality-vs-accessibility tradeoff of the intake layer

## Grant Release Parameters

### `minimumNetFundingByIdea`
Owned by:
- `IdeaRegistryUpgradeable`

Meaning:
- the minimum USDC amount a proposal must receive after the round's snapshotted pledge fee for it to be eligible to win

Why it matters:
- prevents a proposal from becoming a live grant with insufficient capital for its disclosed scope
- lets a higher-vote but underfunded proposal be skipped in favor of the highest viable alternative
- makes the funding threshold visible before a participant pledges

Operational note:
- this is provided by the author at proposal creation and is not an admin override after votes arrive
- the check uses net funding after the fee snapshotted for that round

### `pledgeFeeBps`
Owned by:
- `FundingPoolUpgradeable`

Meaning:
- successful-round protocol fee in basis points, charged only to a winning pledge that becomes a live grant

Bounds and behavior:
- default: `500` basis points, or `5%`
- maximum: `1,000` basis points, or `10%`
- each round snapshots the value when opened, so later changes cannot alter an in-progress round
- losing pledges and a winner that never claims are refunded in full
- V2.3 vests the fee progressively with paid 20/40/40 tranches; legacy rounds finalize it at `claimGrant`

### `backerMilestonesEnabled`
Owned by `VotingSystemUpgradeable`. Selects the mode for subsequently started
rounds. A round snapshots this setting and its verifier when opened. Existing
rounds cannot switch between legacy 30/40/30 and V2.3 20/40/40 when this flag changes.
See [CURRENT-RELEASE.md](CURRENT-RELEASE.md) for the read-only deployment snapshot.

### Grant and Review Deadlines
Owned by:
- `GrantManagerUpgradeable` constants

Current policy:
- claim a settled winning grant within `14 days`
- submit stage-one proof within `45 days` after the initial payout
- submit stage-two proof within `60 days` after the stage-one payout
- winning backers have `14 days` for a V2.3 proof review; legacy reviewers use the same initial window
- V2.3 no-quorum has one additional `7 day` grace window
- a rejected proof has a `48 hour` resubmission cooldown

If a deadline is missed, the permissionless expiry path protects pledge capital according to the round state: a never-claimed winner restores its full gross pledge; a failed V2.3 live grant restores unpaid net capital plus unvested fee, while legacy expiry exposes only remaining net capital.

### Milestone Thresholds and Cooldowns
Some milestone review logic is embedded as protocol behavior rather than a general open parameter surface.

Operators should still understand:
- approval thresholds
- legacy reviewer participation caps; these are not V2.3 backer limits
- V2.3 40% winning-weight quorum, exact two-thirds participating-weight approval, and three eligible approving backers
- rejection cooldown behavior

These values affect:
- reviewer throughput
- payout latency
- proof spam resistance

## Treasury and Token Configuration

### Funding Token Address
Owned by:
- treasury and deployment wiring

Meaning:
- the ERC-20 asset used for voting capital, author stake, and payout accounting

Risk if wrong:
- idea creation fails
- vote commitment fails
- treasury reads become meaningless
- payout behavior becomes invalid

### Reserve Behavior
The protocol reserve is not just a number; it is a policy-backed capital bucket.

Operators should understand:
- rejected author stakes can move into reserve
- a successful-round fee moves into reserve only after the winning author claims
- refundable pledges remain outside protocol reserve until their owner claims them
- reserve allocation is a separate admin action and must never be used to replace a proposal's pledged funding target

## Role and Dependency Wiring

Correct dependency wiring is just as important as numeric parameters.

Critical addresses include:
- funding pool
- idea registry
- voting system
- grant manager
- reputation system
- voter progression
- roles registry

Critical role assignments include:
- `VOTING_ROLE`
- `GRANT_ROLE`
- `DISTRIBUTOR_ROLE`
- `IREGISTRY_ROLE`
- `REPUTATION_MANAGER_ROLE`
- `AUTO_GRANT_ROLE`

If addresses or roles are wrong, valid code may still fail at runtime.

## Recommended Defaults

For local or staging-style testing, existing protocol defaults have included:
- `IDEAS_PER_ROUND = 30`
- `VOTING_DURATION = 1 day`
- `minStake = 10 * 10^6`
- `authorMinStake = 50 * 10^6`
- `pledgeFeeBps = 500`
- `minimumNetFunding` is proposal-specific and must be set by the author

Current Arc testnet governance policy as of August 18, 2026:
- `humanOnlyVoting = true`
- `maxVoteAmount = 10_000 * 10^6`
- `trustedSigner` must match the PoP backend signer address exactly

These should be treated as environment defaults, not universal policy truths.

## Change Management Guidance

Before changing any major parameter:
1. identify the economic goal of the change
2. identify the UX effect
3. identify the security or trust effect
4. rehearse the new configuration in a test environment
5. record the old and new values
6. validate dependent flows after the change

Recommended practice:
- test locally first
- test on Sepolia or equivalent staging next
- document parameter intent in `CHANGELOG.md`
- re-run post-change checks for voting, idea creation, and grant release
