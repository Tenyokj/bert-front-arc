# Changelog

## 2026-10-24 / Community Layer V3.2 - Arc Testnet

Implemented the approved seven-active-day authorization window for 20/40/40.
Current-role nonce checks reject removed/reappointed Admin approvals; payments
are permissionlessly relayable only to the immutable recipient at the fixed amount.
Expiry refunds the entire unpaid execution budget, preserving validator rewards.
Added AwaitingTranche status, explicit payment events, UI and subgraph support.
Manager 2.0.0; Hub 2.1.0; Membership/related deployers 1.1.0. Deployed as new
infrastructure, with existing Communities unchanged. [Receipts and addresses](V3.2-ARC-TESTNET-RELEASE.md).
See V3.2-TRANCHE-QUORUM.md; the earlier self-review-only patch below is historical.

## Historical source-only draft - execution-recipient self-review patch

Manager 1.0.2 explicitly rejects the execution recipient as a milestone reviewer.
Its financial support remains refundable; review quorum and proportional approver
count exclude it. Added four-lane and refund/rounding/correction/grace regression
tests. Milestone module deployer 1.0.1 embeds the patched Manager. No onchain
deployment, payout-schedule change, validator reward change or added execution-
tranche Admin quorum is included. See V3.1-SELF-REVIEW-FIX.md.

This changelog tracks protocol-level evolution, not just developer notes. Each entry should describe what changed, why it changed, and what operators or integrators should care about.

## 2026-10-24 / Documentation consistency review

Clarified V2.3 20/40/40 versus executable legacy 30/40/30, progressive fee vesting,
lazy progression and V3.1's exact 6,667-bps approval threshold. Historical release
entries below keep their original economics. No payout values or contract
permissions changed. See [CURRENT-RELEASE.md](CURRENT-RELEASE.md).

## 2026-10-12 / Community Layer V3.1

Released a separate Factory and per-Community modules, supporter-reviewed
20/40/40 execution plans, and additive FundingPool Factory authorization retaining
V3.0 compatibility. The V3.1 subgraph and frontend integrate the new deployment.
Contract versions remain independent. [Release record](V3.1-ARC-TESTNET-RELEASE.md).

## 2026-10-07 / BERT V2.3

Added immutable milestone-plan commitments, a per-round backer-governance snapshot,
20/40/40 grants, winning-cohort weighted reviews, progressive fee vesting,
correction/grace/refund paths and lazy winning-participation credit. Legacy round
economics remain supported rather than retroactively changed. See the
[V2.3 specification](V2.3-BACKER-MILESTONES-SPEC.md).

## v1.2.0 / BERT V2.2

### Summary
Released BERT V2.2, replacing V2's pooled winner funding semantics with conditional, stake-backed grant selection. A voter's USDC pledge now remains economically attributable to the selected idea and is refundable when that idea does not receive a live grant. The Solidity implementation version is `1.2.0`; the public protocol release is BERT V2.2.

### Modules Touched
- `IdeaRegistryUpgradeable`
- `VotingSystemUpgradeable`
- `FundingPoolUpgradeable`
- `GrantManagerUpgradeable`
- V2 interfaces, errors, lifecycle types, tests, deployment and operator documentation

### Key Changes
1. A funding proposal now declares both an author bond and `minimumNetFunding`.
2. A voter can record one refundable pledge per funding round. The pledge identifies the selected idea and cannot be silently redirected to another idea.
3. The selected proposal is the highest-vote proposal whose gross pledge, after the round's fixed fee, meets its own minimum net funding target.
4. If no proposal is viable, the round has no winner and every pledge is refundable.
5. If a viable winner exists, pledges for all losing ideas are refundable by their original voters.
6. The successful-round fee defaults to `500` basis points, is capped at `1,000` basis points, and is snapshotted when a round opens.
7. The fee remains escrowed until the winner claims the grant. A winner that never claims restores the full gross winning pledge for refund instead of funding protocol reserve.
8. Grant payout remains `30 / 40 / 30`, but it is now based on the winner's net pledge after the fixed fee rather than a configurable author/protocol split.
9. An incomplete live grant opens pro-rata refunds of its unspent net pledge to the winning pledge cohort.
10. Grant and review deadlines are explicit: 14 days to claim, 45 days to submit stage one, 60 days after stage one payout to submit stage two, 14 days for review, and 48 hours after rejection before resubmission.
11. `IDEAS_PER_ROUND` is constrained to `5..50`; the default remains `30`.

### Behavioral Impact
- Losing voters no longer finance a winning proposal they did not select.
- A high-vote proposal can be skipped when it fails its disclosed minimum net funding target; the next highest viable proposal may win.
- A successful author receives only capital pledged to the winning idea, less the already-disclosed successful-round fee.
- The legacy `authorSharePercent` storage slot is retained only for proxy-layout compatibility and is no longer part of payout economics.

### Operator Impact
- Set and publish a proposal's minimum net funding before it enters a round.
- Treat `pledgeFeeBps` as a governance policy: changes affect future rounds only because each round snapshots its fee.
- Monitor claim, milestone, and refund deadlines. Anyone can expire a stalled claim, review, or live grant once its deadline passes.
- Verify V2 human gates after deployment: `humanVerifier`, `humanOnlyVoting`, and `humanOnlyIdeaCreation` must match the intended environment.

### Storage / Upgrade Impact
- Existing storage was preserved. New V2 state was appended and existing `authorSharePercent` was not removed or repurposed.
- Any proxy upgrade must validate storage layout, role wiring, and the full create -> round -> pledge -> settle -> claim/refund path before unpausing.

## v1.1.1 / BERT V2.1

### Summary
Introduced verified-human-gated voting with a per-wallet vote cap and shipped a corrective voting upgrade to preserve storage safety.

### Modules Touched
- `VotingSystemUpgradeable`
- `PoPVerifierUpgradeable`
- deployment and verification scripts

### Key Changes
1. `VotingSystemUpgradeable` can now enforce verified-human-only voting.
2. Voting can now cap the amount a single wallet commits to one idea vote.
3. `PoPVerifierUpgradeable` stores trusted offchain humanity attestations onchain.
4. Deployment tooling now supports verifier deployment, voting policy wiring, and post-deploy verification.
5. Upgrade documentation now explicitly calls out storage-layout constraints for new voting fields.

### Behavioral Impact
- voting remains USDC-weighted rather than one-person-one-vote
- sybil resistance can now be raised through verified-human gating
- whale influence can now be bounded per idea vote through `maxVoteAmount`
- voting policy depends on correct verifier and backend signer configuration

### Operator Impact
- operators must maintain a trusted signer for PoP attestations
- operators must verify `humanVerifier`, `humanOnlyVoting`, and `maxVoteAmount` after deployment or upgrade
- smoke tests should include both verified and unverified voting attempts

### Storage / Upgrade Impact
- new voting fields must be appended after legacy voting storage
- an unsafe intermediate voting upgrade required a corrective implementation upgrade and config restoration on August 18, 2026

### Documentation Impact
- deployment, config, and upgrade runbooks now include verified-human voting policy guidance

## v1.1.0

### Summary
Introduced stake-backed proposal intake and staged milestone-based grant release.

### Modules Touched
- `IdeaRegistryUpgradeable`
- `FundingPoolUpgradeable`
- `GrantManagerUpgradeable`
- `IdeaStatus`

### Key Changes
1. Authors must lock a minimum stake to create an idea.
2. Losing or rejected ideas can have their locked author stake moved into protocol reserve.
3. Winning ideas no longer receive a blind one-step payout.
4. Grant release now follows:
   - `30%` initial claim
   - `40%` in-process milestone
   - `30%` completion milestone
5. Milestone proof submissions are reviewed by addresses with `REVIEWER_ROLE`.
6. Rejected milestone requests enforce cooldown-based resubmission.

### Behavioral Impact
- proposal creation became economically gated
- treasury accounting now tracks author stake as a distinct bucket
- milestone review became a required part of the full grant release path
- idea lifecycle expanded to include `Funded` and `InProcess` execution states

### Operator Impact
- role wiring for reviewers became more important
- deployment and upgrade validation now need to include milestone request reads
- reserve accounting matters more because rejected stake can accumulate there

### Documentation Impact
- architecture, treasury, security, and upgrades documentation all need to reflect staged release semantics

## v1.0.0

### Summary
Initial upgradeable core release of the BERT protocol.

### Modules Included
- `IdeaRegistryUpgradeable`
- `VotingSystemUpgradeable`
- `FundingPoolUpgradeable`
- `GrantManagerUpgradeable`
- `RolesRegistryUpgradeable`
- `ReputationSystemUpgradeable`
- `VoterProgressionUpgradeable`

### Key Features
1. idea creation and registry state
2. round-based voting
3. treasury accounting for vote capital
4. winner selection
5. one-step grant claim path
6. reputation and voter progression hooks
7. upgradeable contract deployment model

### Behavioral Impact
- established the baseline lifecycle:
  `Pending -> Voting -> WonVoting -> Rejected / Funded`
- established the role and dependency model used by later versions

## Changelog Discipline

Future entries should include:
- summary
- modules touched
- key changes
- behavioral impact
- operator impact
- storage or upgrade impact

This file should be updated whenever protocol behavior, trust assumptions, state layout, or operator obligations change.


## 2026-07-20 Security Hardening Notes

This upgrade batch is intended to preserve storage layout while reducing
cross-contract reentrancy exposure in existing flows.

Modules touched:
- `IdeaRegistryUpgradeable`
- `VotingSystemUpgradeable`
- `GrantManagerUpgradeable`
- `VoterProgressionUpgradeable`

Behavioral changes:
- `GrantManagerUpgradeable.claimGrant` now records payout state before external
  funding pool and registry calls.
- `VotingSystemUpgradeable.vote` now records the local vote before calling into
  the funding pool and registry.
- `IdeaRegistryUpgradeable._createIdea` now reserves the new idea id and stores
  the draft idea before external reputation and funding calls.
- `IdeaRegistryUpgradeable.updateStatus` now writes the new lifecycle status
  before invoking rejected-stake slashing.
- `VoterProgressionUpgradeable` now flips local grant tracking flags before role
  registry grant/revoke calls.

Storage impact:
- none
- no state variables added
- no storage gaps changed
- no inheritance order changed

Operational guidance:
- upgrade implementations behind the existing proxies
- re-run the full create/vote/end/claim/milestone smoke flow after upgrade
- verify role wiring and dependency addresses remain unchanged
