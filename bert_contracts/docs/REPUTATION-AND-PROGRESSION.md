# Reputation and Progression

BERT contains two distinct social layers: reputation and voter progression. They are connected to protocol outcomes, but they serve different purposes and should not be conflated.

## Contents
1. Why These Layers Exist
2. Reputation System
3. Voter Progression System
4. Thresholds and Privilege Escalation
5. Trust Implications

## Why These Layers Exist

The protocol needs more than treasury accounting. It also needs:
- a way to track long-term user performance
- a way to convert successful participation into higher-trust permissions

Reputation handles the first goal.
Progression handles the second.

## Reputation System

Handled by:
- `ReputationSystemUpgradeable`

Purpose:
- track reputation scores for users, especially builders and outcome-linked actors

Typical triggers:
- initialization for new users
- reputation increase after successful outcomes
- reputation decrease after unsuccessful or rejected outcomes, depending on protocol path

Important note:
- reputation is not treasury value
- reputation is not the same as vote weight
- reputation is a separate trust and performance signal

## Voter Progression System

Handled by:
- `VoterProgressionUpgradeable`

Purpose:
- reward voters who repeatedly back winning ideas

Key mechanism:
- winning votes are counted
- role thresholds are checked
- user privileges are elevated when thresholds are crossed

This means progression is based on:
- correct or outcome-aligned participation

Not merely:
- raw activity
- wallet age
- arbitrary manual trust alone

## Thresholds and Privilege Escalation

Current thresholds:
- `CURATOR_THRESHOLD = 20`
- `REVIEWER_THRESHOLD = 60`

When a threshold is crossed:
- the progression layer grants the corresponding user role through `AUTO_GRANT_ROLE`

This creates a layered trust path:
1. vote effectively
2. accumulate winning votes
3. earn higher-trust moderation or review permissions

## Trust Implications

This design improves protocol structure because:
- review authority is not entirely arbitrary
- user moderation surfaces are tied to demonstrated protocol performance

It still carries social trust risks:
- coordinated groups can try to farm progression
- progression thresholds may need policy tuning over time
- admin override remains a trust boundary

Relevant references:
- `ROLES.md`
- `ARCHITECTURE.md`
- `SECURITY.md`
