# System Flow

This document describes the operational flow of BERT in a narrative sequence from proposal creation to final milestone completion.

Scope: V2.3 backer-governed rounds. Legacy reviewer rounds retain their stored
30/40/30 rules; see [CURRENT-RELEASE.md](CURRENT-RELEASE.md). V3.2 has a separate
[Community execution lifecycle](https://github.com/Tenyokj/bert-core-arc/blob/arc-usdc-migration/contracts/BERT/V3/README.md).

## Contents
1. Idea Creation Flow
2. Round Formation Flow
3. Voting Flow
4. Round Resolution Flow
5. Grant Claim Flow
6. Milestone Review Flow

## Idea Creation Flow

1. builder prepares proposal metadata
2. builder approves USDC allowance
3. builder calls `createFundingProposal`
4. registry validates metadata, minimum author bond, and non-zero `minimumNetFunding`
5. author bond is locked in the funding pool
6. reputation is initialized if needed
7. idea is stored with `Pending` status
8. author commits an immutable milestone plan URI and content hash before V2.3 round admission

## Round Formation Flow

1. anyone may start a new round when its onchain prerequisites are met
2. voting system checks enough unused ideas exist
3. a contiguous batch of ideas is assigned
4. those ideas move into `Voting`
5. round timing, fee, milestone mode and backer-verifier policy are snapshotted; V2.3 admission requires each selected idea's committed plan

## Voting Flow

1. voter selects idea and amount
2. voting system validates round, membership, and minimum stake
3. funding pool records one refundable pledge for that voter, round, and idea
4. vote totals are updated in round state; a second pledge in the same round is rejected

## Round Resolution Flow

1. voting window ends
2. anyone may settle the round after its deadline
3. each proposal is tested against its `minimumNetFunding` after the fee snapshotted at round opening
4. the highest-vote idea meeting its net target and V2.3 three-backer minimum becomes `WonVoting`; if none is viable, the round has no winner
5. all non-winners become `Rejected`
6. reputation updates are triggered
7. winning voters may individually call `claimWinningParticipation` for progression; settlement does not loop through the cohort
8. losing pledges become refundable to their original voters; a no-winner round refunds every pledge
9. rejected author bonds can move into reserve

## Grant Claim Flow

1. winning author calls `claimGrant`
2. grant manager validates claimability
3. progressive fee vesting starts; only the initial tranche's fee share moves into reserve
4. the initial 20% net-grant tranche is released
5. idea moves to `Funded`
6. if no claim occurs within 14 days, anyone can restore the full gross winning pledge for refund

## Milestone Review Flow

1. author submits milestone proof
2. eligible winning backers vote by pledge weight; the author cannot vote
3. after the full 14-day window, permissionless finalization checks 40% winning-weight quorum, exact two-thirds participating-weight approval, and three approving backers
4. approval releases the next 40% net tranche and its matching fee share; the final tranche uses the remaining net grant to absorb rounding
5. one rejected proof can be corrected after 48 hours; no-quorum receives one seven-day grace window
6. the final state becomes `Completed`
7. a second rejection, missed submission deadline or no-quorum after grace activates winning-cohort refunds of unpaid net capital plus unvested fee; already paid amounts are not clawed back
