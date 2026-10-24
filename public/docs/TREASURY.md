# Treasury

This document explains how BERT V2 accounts for capital, how the funding pool is structured, and why author bonds, pledges, fee escrow, reserve, and payouts must be understood as separate buckets.

Current V2.3 uses 20/40/40 net grants with progressive fee vesting. Legacy rounds
retain their snapshotted reviewer policy; [CURRENT-RELEASE.md](CURRENT-RELEASE.md)
explains the distinction. V3.1 Community Treasuries remain separate custodians.

## Contents
1. Treasury Philosophy
2. Main Accounting Buckets
3. Capital Entry Points
4. Capital Exit Points
5. Reserve Model
6. Author Stake Model
7. Round and Idea Accounting
8. Distribution and Reconciliation Notes

## Treasury Philosophy

BERT does not treat all token balances as interchangeable.

The protocol separates:
- contributor deposits
- author submission bonds
- round-linked voter pledges
- pending successful-round fee escrow
- protocol reserve
- released grant payouts

This separation is what allows the protocol to:
- make proposal spam costly
- preserve round-local accounting
- refund pledges without redirecting a losing voter's capital
- move finalized fees and rejected bonds into reserve
- release grant capital in stages rather than blindly

## Main Accounting Buckets

### `totalPoolBalance`
Represents:
- live token value accounted for inside the treasury system

It should not be interpreted as:
- "all capital is immediately claimable by a winner"

### `protocolReserve`
Represents:
- protocol-held capital intentionally tracked outside live distributable balances

Sources can include:
- rejected or slashed author bonds
- successful-round fee shares vested with V2.3 author tranches (legacy rounds finalize the whole fee at initial claim)
- explicitly reserved value

### `donorBalances`
Represents:
- how much a contributor has deposited into the pool

### `authorStakes`
Represents:
- idea-linked author collateral locked at proposal creation time

### `poolByRoundAndIdea`
Represents:
- round-specific and idea-specific voting capital tracked for payout eligibility

## Capital Entry Points

### Direct Treasury Deposit
Path:
- contributor calls `deposit(amount)`

Effect:
- donor balance increases
- total pool balance increases

### Author Bond Deposit
Path:
- builder creates an idea
- idea registry triggers `depositAuthorStakeFrom`

Effect:
- author bond is locked
- total pool balance increases
- proposal creation gains anti-spam collateral

### Refundable Pledge Deposit
Path:
- voter votes in a round
- voting system triggers `recordPledgeFrom`

Effect:
- total pool balance increases
- round and idea pledge bucket increases
- the recorded wallet receives a conditional refund claim if its selected idea does not receive a live grant

## Capital Exit Points

### Initial Grant Claim
Path:
- winning author claims grant

Effect:
- the first tranche is distributed from the winning idea's round allocation

### Milestone Release
Path:
- author submits proof
- eligible winning backers approve V2.3 proof; protocol reviewers apply only to legacy rounds
- grant manager releases next tranche

Effect:
- additional capital is distributed in controlled stages

### Pledge Refund
Path:
- a losing pledger, a no-winner pledger, or an eligible winning pledger calls `claimPledgeRefund(roundId)`

Effect:
- the exact losing pledge is returned in full
- a never-claimed winner restores its gross pledge, including fee escrow, for full refund
- a failed V2.3 live grant returns its unspent net capital plus unvested fee pro rata to winning pledgers; legacy expiry returns the remaining net grant because its fee already finalized

## Reserve Model

The reserve exists so the protocol can hold value separately from active per-round distribution logic.

Reserve can grow through:
- fee shares vested with successful V2.3 tranches
- rejected author stake slashing
- explicit reserve-oriented accounting behavior

Reserve can later be used through explicit authorized allocation.

Security importance:
- reserve must not be confused with generic free liquidity
- reserve misuse can distort treasury reporting and payout expectations

## Author Stake Model

Author bond is:
- required for proposal creation
- separate from direct donor deposits
- separate from pledge capital
- slashable if the idea is rejected through the intended lifecycle path

This model exists to:
- reduce proposal spam
- force economic commitment from builders
- create a reserve-funded consequence for failed or rejected intake

## Round and Idea Accounting

Pledge capital is not only tracked globally. It is tracked at:
- round level
- idea level within the round

This matters because:
- winner resolution is round-scoped
- grant claimability is tied to a specific winning idea inside a specific round
- distribution must not accidentally consume value intended for another round or idea
- a winning grant cannot consume a losing idea's pledge capital

## Distribution and Reconciliation Notes

BERT’s treasury model assumes:
- accounting and actual token balance should stay reconcilable
- payout flags prevent duplicate release
- unvested fee escrow remains distinguishable from reserve until its matching tranche releases
- reserve remains distinguishable from refundable pledge liabilities and active grant balances

Operator attention is required after:
- upgrades
- incident response
- unusual distribution or reserve allocation behavior

Relevant references:
- `ARCHITECTURE.md`
- `SECURITY.md`
- `INVARIANTS.md`
