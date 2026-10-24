# Current Release and Payout Modes

This is the current integration summary for **BERT V2.3**, **Community Layer
V3.2**, and **Console V0.1.0 Beta** on **Arc Testnet, chain ID 5042002**.
Protocol-layer versions are independent of each contract's `@custom:version`.
The [deployment manifest](https://github.com/Tenyokj/bert-core-arc/blob/arc-usdc-migration/deployments/arc-testnet-v3.json) identifies addresses;
the [documentation audit](DOCUMENTATION-AUDIT-2026-10-24.md) records verification.

**Current release: Community Layer V3.2, deployed on Arc Testnet on 24 October 2026. V2 remains V2.3.**
See [receipt-backed release evidence](V3.2-ARC-TESTNET-RELEASE.md).
See [version scopes](V3.2-RELEASE.md).

**New versus existing Communities:** the V3.2 Manager `2.0.0`
adds explicit Admin quorum for every 20/40/40 transfer, seven-active-day payment
expiry and refunds of the whole unpaid execution budget. It retains the self-review
fix. The matching V3.2 infrastructure is deployed; original V3.1 Managers still use automatic transfers.
See [the tranche-quorum specification](V3.2-TRANCHE-QUORUM.md) for exact new rules.
The [rollout runbook](V3.2-QUORUM-ROLLOUT.md) explains the new matching Factory,
factory-qualified URLs, retained historical graph sources and release order.

## Why GrantManager still exposes 30

`GrantManagerUpgradeable` supports two executable V2 round policies:

| Round policy | Selector | Initial / in-process / completion | Review authority |
| --- | --- | --- | --- |
| V2.3 backer-governed | `isBackerMilestoneRound(roundId) == true` | 20 / 40 / 40 | Eligible winning pledgers; author excluded |
| Legacy reviewer-governed | `isBackerMilestoneRound(roundId) == false` | 30 / 40 / 30 | Protocol reviewers through legacy request paths |

`VotingSystem.startFundingRound()` copies `backerMilestonesEnabled` into
`backerMilestonesByRound[newId]`. `GrantManager.claimGrant`, `previewGrant` and
`_milestoneAmount` all use that stored choice. Changing the global setting later
does not change an existing round. The final tranche is computed as the remaining
net grant to avoid rounding dust.

`INITIAL_PAYOUT_PERCENT = 30` and legacy reviewer thresholds are **not dead
constants retained to fill storage**. Constants occupy no ordinary storage slots;
they preserve the ABI getters and executable legacy-round policy. By contrast,
`authorSharePercent` is an actual deprecated storage variable retained for proxy
layout compatibility. It does not determine the current grant split.

Do not change 30 to 20 globally or delete legacy paths as a documentation cleanup.
That would change contract behavior for old rounds. The V2 documentation cleanup
does not change those payout values or deployed V2 contracts.

## V2.3 amounts, fees and review

The 20/40/40 percentages apply to the **net winning grant** after the snapshotted
fee. With a 5% fee and a 100 USDC gross winning pledge, the author receives
19 / 38 / 38 USDC; reserve receives the matching 1 / 2 / 2 USDC, subject to token
unit rounding. Unpaid net grant plus unvested fee remain refundable on terminal
failure. Already paid author tranches and vested fees are not clawed back.

V2.3 reviews require 40% of original winning pledge weight to participate, exact
two-thirds approval of participating weight, and at least three eligible approving
backers. The initial review is 14 days, with one seven-day no-quorum grace window.
One rejected proof can be corrected after 48 hours; terminal failures activate the
defined winning-cohort pull refunds. Three approvers is a fixed V2.3 minimum,
not V3.1's proportional count rule. Curator/reviewer idea signals do not authorize
new V2.3 milestone payouts.

Winning progression is claimed individually with `claimWinningParticipation`.
The old 30-voters-per-idea cap and settlement reward loop are not current V2.3
rules. Round size remains bounded to 5..50 ideas.

## Current V3.2 and retained V3.1 Communities

V3.2 uses Factory `0xf793786BCecfbfE35a22E36180032b32BD5208Ba`, deployed at
block `68888068`. V3.1 and V3.0 Communities retain their historical contracts.
FundingPool approves all three Factories; the V3 graph v3.2.0 indexes both modular
generations. `v3` in the deployment manifest is current; `v3Previous` preserves
V3.1 and `v3Legacy` preserves V3.0.

Original V3.1 Admin/Member Binary/Slate proposals use 20/40/40 execution plans paid to
the immutable Administration execution recipient. Treasury keeps custody of
unreleased capital. Review is restricted to the sealed eligible winning-supporter
snapshot. Authors cannot vote for their own proposal and therefore cannot enter
that proposal's supporter snapshot. **Execution-recipient exclusion is not a
universal enforced invariant**: an execution wallet that is not an Admin/Validator
can join as a Member, support another author's proposal and review its own
execution. This known policy gap is reproduced in the documentation audit.

**Deployed in new V3.2 Communities:** the self-review fix first prepared as
Manager `1.0.2` is retained in the latest quorum-enabled `2.0.0`. It explicitly rejects
execution-recipient reviews and excludes its weight/count from the review quorum
and approver floor. Its financial support remains refundable using a separate
full-weight denominator. See [the patch record](V3.1-SELF-REVIEW-FIX.md). Do not
apply this new guarantee to original deployed Managers or count the full financial
snapshot as the patched review electorate.

V3.1 requires 40% weight participation, **6,667 bps (66.67%)** weighted approval,
and `max(3, ceil(3% of eligible snapshot supporter addresses))` approving wallets.
Do not replace the exact V3.1 percentage with V2.3's exact two-thirds formula.
Review duration is immutable Community configuration, not one universal duration.
For existing V3.1 Communities, use an Administration execution recipient that
does not participate as a Member/supporter. New V3.2 Communities enforce exclusion. This is an
operational mitigation, not a guarantee for every existing or future Community.

## Historical pre-rollout read snapshot: 2026-10-24

Read-only checks at block **68843131**, using `https://arc-testnet.drpc.org`:

| Read | Result |
| --- | --- |
| `VotingSystem.backerMilestonesEnabled()` | `true` |
| `VotingSystem.VOTING_DURATION()` | `1209600` seconds = 14 days |
| `VotingSystem.IDEAS_PER_ROUND()` | `30` |
| `VotingSystem.humanOnlyVoting()` | `true` |
| `VotingSystem.currentRoundId()` | `1` — next ID, so no V2 funding round has started |
| `GrantManager.votingSystem()` | Manifest VotingSystem proxy |
| `GrantManager.paused()` | `false` |
| FundingPool approval of V3.0 and V3.1 Factories | Both `true` |
| EIP-1967 implementation and admin slots | All nine manifest proxies matched |

The first new V2 round will snapshot backer mode if this setting remains enabled.
Query `isBackerMilestoneRound(id)` only for an existing round: the getter reverts
for the next unused ID. This snapshot does not prove a completed grant or E2E.

## Post-rollout verification: 2026-10-24

- Factory receipt succeeded at block **68888068**; allowlist receipt succeeded at
  **68888345**. All six initialized Factory dependencies matched the release output.
- FundingPool approval reads for V3.0, V3.1 and V3.2 all returned `true`.
- Graph `_meta` reported deployment `QmPRRt8FN9ibN4LhSmBBoxEc5WBj55ThE2LjGyRyTNL2oh`,
  `hasIndexingErrors: false`, indexed block **68891161**.
- The operator reports the matching Vercel environment and frontend deployed.
  Documentation-only cleanup still needs its own commit and publication.

## Verification and readiness

Arc Testnet uses Demo verification to exercise the attestation gate. It does not
prove unique personhood or Sybil resistance. Production World ID remains a planned
policy subject to end-to-end verification and release readiness.

Internal tests and Slither are documented in [SECURITY-REVIEW-V3.1.md](SECURITY-REVIEW-V3.1.md);
they are not an independent audit. Mainnet readiness and complete manual E2E are
not asserted by this document.
