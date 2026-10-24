# Documentation and Live Configuration Review - 24 October 2026

**Follow-up after this audit:** a local executable self-review fix was subsequently
authorized and implemented. See [V3.1-SELF-REVIEW-FIX.md](V3.1-SELF-REVIEW-FIX.md).
The original findings and 40-test audit snapshot below describe the earlier
documentation-only phase. The fix and tranche quorum were subsequently deployed
as V3.2 on 24 October; see [current evidence](V3.2-ARC-TESTNET-RELEASE.md).
Original V3.1 Communities retain the documented finding.

## Scope and authority

Reviewed the local current Core, frontend/dApp, docs website/whitepaper, backend,
Console and role-bootstrap repositories, plus historical BERT directories.
Current rules were checked against executable Solidity, existing tests and a
read-only Arc Testnet snapshot. This is not a full security audit or manual E2E.
The [current integration summary](CURRENT-RELEASE.md) explains the payout modes.

## Corrections

- Replaced unqualified current 30/40/30 diagrams and demo copy with V2.3 20/40/40;
  explicitly retained the executable legacy round policy and historical changelog.
- Distinguished Solidity constants (no ordinary storage slots) from deprecated
  storage fields retained for proxy layout compatibility.
- Corrected net-grant percentages, progressive fee vesting and cancellation of
  unpaid net grant plus unvested fees. Paid tranches are not automatically recovered.
- Removed current claims of a 30-voter cap, settlement-wide progression loops,
  reviewer authority over new V2.3 milestones and immediate full fee vesting.
- Documented exact V3.1 6,667 bps approval versus V2.3's exact two-thirds, rounded
  proportional approver counts and protected Treasury milestone reserves.
- Updated stale API examples and fresh-deployment guidance; added a frontend
  documentation mirror sync/check command to reduce future drift.
- Marked old working copies and blueprints as historical rather than rewriting
  their old contract semantics. No existing V3.0 Community was migrated.
- Updated whitepaper revision 1.2.1 and the linked personal Obsidian notes.

## Open finding: execution recipient can be a supporter/reviewer

**Actual behavior differs from the intended universal executor-exclusion claim.**
Author voting is rejected, and Admins/Validators cannot be active Members.
However, Community configuration accepts a distinct execution recipient without
requiring that address to be an Admin or excluding it from membership/voting.
Such a recipient can support another author's proposal, enter the winner snapshot,
submit proof and cast a counted review of its own execution.

Reproduction: `CommunityV31EndToEnd.fully.ts`, test
`documents that a non-Admin execution recipient can join, support and review its own execution plan`.
It uses real Factory, Hub, Treasury and modules; three supporters each contribute
100 minor token units. The execution recipient is one of those supporters and its
approval is accepted; after first review 180 of the 300-unit budget is released.

The recipient cannot bypass the weighted quorum or three-approver floor alone.
Nevertheless, describing self-review as independently prohibited is incorrect.
For pilots use a non-participating Administration execution wallet. This is an
operational mitigation, not an enforced universal rule. A separately reviewed
contract/deployment policy decision is needed, including treatment of existing
immutable Communities. **No executable contract fix or deployment was made.**

## Read-only chain evidence

At Arc Testnet block **68843131** (chain ID **5042002**) via
`https://arc-testnet.drpc.org`:

- All nine manifest EIP-1967 implementation and ProxyAdmin slot pairs matched.
- `backerMilestonesEnabled == true`; `VOTING_DURATION == 1209600` seconds;
  `IDEAS_PER_ROUND == 30`; `humanOnlyVoting == true`.
- `currentRoundId == 1` is the next unused ID: no V2 funding round had started.
  Querying that nonexistent round with `isBackerMilestoneRound(1)` reverts as designed.
- GrantManager points to the manifest VotingSystem and is unpaused.
- FundingPool permits reserve routes from both V3.0 and V3.1 Factories.

This confirms selected addresses/settings, not source-bytecode equivalence of
every immutable Community, explorer source verification or a completed grant.
The snapshot is dated evidence, not a promise that mutable settings never change.

## Verification

Targeted Hardhat runs:

```bash
npx hardhat test test/GrantManagerUpgradeable.fully.ts test/V3/CommunityMilestoneManager.fully.ts
npx hardhat test test/V3/CommunityV31EndToEnd.fully.ts
```

Results: **34 passing + 6 passing**, including legacy 30/40/30, V2.3 20/40/40,
progressive fees, failure refunds, four V3 lanes and the policy-gap characterization.
These tests do not represent a new coverage measurement or independent audit.
Frontend ESLint and production build passed. A separate TypeScript check does
not pass: 881 diagnostics also reproduce against the pre-edit source, including
10 diagnostics in app source and many AssemblyScript/subgraph types picked up by
the frontend config. The build currently skips type validation. No new diagnostic
kinds were introduced by these copy/documentation changes; do not treat the build
as evidence of a clean typecheck. This existing technical debt was not silently
suppressed or fixed during the documentation pass.

The docs site loaded 44 unique document slugs with no broken internal doc links.
Active Obsidian notes were checked separately from the untouched archive and
literal syntax examples. Frontend static Core docs are checked with
`npm run sync:core-docs -- --check`.

Slither was not rerun for this documentation review; previous results remain
dated in [SECURITY-REVIEW-V3.1.md](SECURITY-REVIEW-V3.1.md).

## Publication boundary

Changes are local until maintainers review, merge and redeploy the affected
frontend/docs sites. No chain transactions, upgrade, push or release were sent.
Solidity edits in this pass are NatSpec/comments only; retaining the old build
artifacts/commit remains important for explorer verification because comments can
change compiler metadata even without changing executable logic.
