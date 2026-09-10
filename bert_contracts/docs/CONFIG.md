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

### `authorSharePercent`
Owned by:
- `GrantManagerUpgradeable`

Meaning:
- percentage of allocable round capital released to the winning author

Protocol share:
- `100 - authorSharePercent`

Higher values:
- increase builder incentives
- reduce protocol-retained share

Lower values:
- increase protocol-retained share
- may weaken builder-side economic attractiveness

Important note:
- payout release still follows milestone staging even when author share is high

### Milestone Thresholds and Cooldowns
Some milestone review logic is embedded as protocol behavior rather than a general open parameter surface.

Operators should still understand:
- approval thresholds
- reviewer participation caps
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
- leftover or reserved capital can accumulate separately from live round balances
- reserve can be explicitly allocated back into idea accounting by authorized action

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

For local or Sepolia-style testing, existing protocol defaults have included:
- `IDEAS_PER_ROUND = 30`
- `VOTING_DURATION = 1 day`
- `minStake = 3000 * tokenUnit`
- `authorMinStake = 5000 * tokenUnit`
- `authorSharePercent = 95`

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
