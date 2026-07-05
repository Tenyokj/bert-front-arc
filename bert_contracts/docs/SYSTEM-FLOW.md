# System Flow

This document describes the operational flow of BERT in a narrative sequence from proposal creation to final milestone completion.

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
3. builder calls `createIdea`
4. registry validates metadata and minimum author stake
5. author stake is locked in the funding pool
6. reputation is initialized if needed
7. idea is stored with `Pending` status

## Round Formation Flow

1. operator starts a new round
2. voting system checks enough unused ideas exist
3. a contiguous batch of ideas is assigned
4. those ideas move into `Voting`
5. round timing and membership become active

## Voting Flow

1. voter selects idea and amount
2. voting system validates round, membership, and minimum stake
3. funding pool records round and idea capital
4. vote totals are updated in round state

## Round Resolution Flow

1. voting window ends
2. operator ends the round
3. winner is selected by vote totals
4. winning idea becomes `WonVoting`
5. losing ideas become `Rejected`
6. reputation updates are triggered
7. winning voters receive progression updates
8. rejected idea stake can move into reserve

## Grant Claim Flow

1. winning author calls `claimGrant`
2. grant manager validates claimability
3. author share is calculated
4. initial tranche is released
5. idea moves to `Funded`

## Milestone Review Flow

1. author submits milestone proof
2. reviewers approve or reject
3. if approved, stage payout is released
4. if rejected, cooldown starts
5. after valid later proof, the next tranche can be released
6. the final state becomes `Completed`
