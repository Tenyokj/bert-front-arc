# BERT V3.1 Security Review Notes

**Status:** internal Arc Testnet release review. This document is not an audit
and does not claim that V3.1 is safe for mainnet use.

## 2026-10-24 follow-up: execution-recipient conflict of interest

**Historical V3.1 finding; fixed for newly created V3.2 Communities, still present in original immutable V3.1 instances.** V3.1 disallows
proposal-author votes and Admin/Validator membership, but does not independently
exclude the immutable execution recipient from joining as a regular Member.
A distinct non-Admin execution wallet can support another author's proposal,
enter its winner snapshot, submit proof and cast a counted approval of its own
execution. It cannot bypass quorum or the minimum approving-wallet count alone.

**Source remediation prepared later the same day:** Manager `1.0.2` rejects the
recipient as a reviewer and separates review weight/count from financial refund
rights. The original characterization case has been replaced by rejection tests
across all four lanes, plus refund/threshold edge cases. See
[V3.1-SELF-REVIEW-FIX.md](V3.1-SELF-REVIEW-FIX.md). The draft was superseded by Manager 2.0.0, deployed in the new V3.2 bundle on
24 October 2026. The finding remains open for original immutable V3.1 Communities.
The V3.2 release also includes the separately agreed execution-tranche Admin quorum.

The original real Hub/Factory/Treasury characterization reproduced this accepted
behavior before the patch. For original V3.1 Communities, use a
non-participating Administration execution wallet
for pilots. Existing immutable Communities are not silently patched by changing
docs, frontend or deploying a new Factory. Assess affected Communities before
claiming an executor self-review prohibition or advancing toward mainnet.

## 2026-10-24 V3.2 deployment: execution-tranche Admin quorum

The separately approved [tranche-quorum change](V3.2-TRANCHE-QUORUM.md) is now
deployed in the new V3.2 infrastructure with Manager 2.0.0. See the
[deployment evidence](V3.2-ARC-TESTNET-RELEASE.md). Initial settlement and passed proof reviews
only open fixed payment authorizations; every transfer requires current Admin
quorum within seven active Community days. Expiry refunds all unpaid plan capital
without touching validator rewards. Existing immutable Communities remain unpatched.

Approvals bind to Membership's per-Admin role nonce. Removal/reappointment cannot
revive an old approval. Execution checks exactly a threshold-sized sorted witness,
not a historical approval count or an unbounded roster scan. This does not replace
supporter proof review or introduce an automatic payment bypass after timeout.

The complete regression suite reached 232 passing, including transfer rollback,
zero-rounded amounts, role changes, expiry boundaries and pause/delayed proof clocks.
An initial fresh Slither analysis completed (94 contracts, 102 detectors, 233
findings; non-zero findings exit status). The Manager's calls-in-loop are static
reads against its fixed Hub, bounded by the quorum size. Explicit initialization
and checks-effects-interactions ordering were tightened after triage. The final
rerun completed successfully on the final source: **229 findings across 94
contracts / 102 detectors**, with a non-zero findings exit status. In the modified
Manager only the Low `calls-loop` finding remains; the initialization and
reentrancy-ordering warnings no longer appear there. The bounded static authority
reads are retained by design, subject to external confirmation and realistic quorum
configuration. Findings elsewhere are not declared fixed by this patch. These
results are not a clean external audit.

## Original release scope

- `contracts/BERT/V3/community/*`
- `contracts/BERT/V3/modules/*`
- `contracts/BERT/V3/libraries/CommunityAdminActions.sol`
- Factory-created Community Treasury/module authority wiring.

## Evidence

- Hardhat: `213 passing` on 2026-10-12, including malicious ERC-20 callback regression tests.
- Solidity coverage: `99.47%` lines and `86.57%` statements across the repository.
- Slither: `/Users/daniilvolkova/.local/bin/slither . --filter-paths 'node_modules|test|legacy'`.

The 2026-10-12 final Slither run completed static analysis and reported 228 findings
across 93 contracts and 102 detectors.
Its non-zero exit status means findings require triage; it is not a compiler or
deployment failure and must never be described as a clean security pass.

## Slither Triage

### High: arbitrary-send-erc20

Slither reports `safeTransferFrom` in V3.1 membership, proposal-bond and vote-escrow deposit functions. The tool cannot infer BERT's capability graph.

**Current disposition: mitigated by access control, requires audit confirmation.**

- `depositMembershipStake` is callable only by the Factory-bound Membership module.
- `depositProposalBond` is callable only by the Factory-bound Proposal module.
- `depositVoteStake`, `depositRoundVoteStake`, and settlement functions are callable only by the Factory-bound Voting module.
- Those module addresses are code-address checked and one-time configured by Factory during validated Hub activation.
- No arbitrary externally owned account can select a `from` address and invoke the Treasury pull functions.

Residual risk: each Community accepts a configured ERC-20 address. Deployment policy must use Circle USDC on production, or an explicit token allowlist must be added before permissionless Community creation.

### Medium: reentrancy-no-eth

Slither reports external calls before all local state writes in `join`, voting, and slate-settlement code.

**Current disposition: partially mitigated, requires malicious-token regression tests and external audit.**

- User-facing `CommunityHub.joinCommunity` is `nonReentrant`.
- `CommunityVotingModule.castBinaryVote`, `castSlateRoundVote`, `settleBinaryProposal`, and `settleSlateRound` are `nonReentrant`.
- The Treasury applies checks-effects-interactions before USDC transfers and marks plan/refund state before payment.
- Module-to-module entry is capability-gated by immutable Hub/module addresses.

Residual risk: a non-standard ERC-20 can execute arbitrary callbacks during `transferFrom` or `transfer`. Regression tests now prove that callbacks cannot duplicate a Treasury vote escrow or overdraw an execution-plan tranche. Membership, Hub-level voting, settlement, and refund callbacks remain required external-audit targets.

### Medium: bounded external calls in loops

Slither reports external reads/calls in the Factory allowlist, Slate handling,
and legacy V2 round loops.

**Current disposition: bounded by protocol configuration, requires audit confirmation.**

- Community Factory authorization is bounded by `MAX_COMMUNITY_FACTORIES = 16`.
- V2 funding rounds are bounded to `5..50` ideas.
- V3 Slate candidates are bounded by the configured Community proposal limits.
- Factory/module calls are capability-gated and configured once during verified
  Community activation.

Residual risk: governance must not raise bounded collection limits casually.
Auditors should examine gas behavior against worst-case valid configuration.

### Informational: timestamps, tuple destructuring, assembly, and test mocks

- Timestamp findings correspond to explicit voting, proof, review, exit, and
  expiry windows. Small block-timestamp variation is acceptable for these
  liveness windows, not for price-sensitive logic.
- `unused-return` findings mostly reflect intentional tuple destructuring.
- The Admin action library uses one documented unstructured-storage slot to
  keep Hub bytecode below the deployment limit.
- Low-level calls and several zero-address findings are isolated to test mocks.

The explicit Hub/Milestone-Treasury interfaces and configuration events were
added during this review and are included in the final 228-result run. Re-run
Slither from the exact release commit and attach the raw output to the testnet
release evidence.

### Medium: unused-return

These findings are primarily intentional tuple destructuring in V2.3 and the ignored return of `rollValidatorRewardEpoch` from the Hub facade.

**Disposition: accepted with review.** The relevant calls either validate their required values elsewhere or intentionally expose no return value at the facade level.

## Required Pre-Deployment Checks

1. Run malicious-token callback regression tests for Membership, binary votes, slate votes, tranche release, and refunds.
2. Manually test every V3.1 lane through the dApp: Admin Binary, Member Binary, Admin Slate, Member Slate.
3. Freeze deploy artifacts and independently verify all constructor/config values.
4. Have an external smart-contract auditor review storage, capability boundaries, token assumptions, and all Slither findings.
5. Treat V3.1 as a new deployment; do not migrate existing V3.0 Communities implicitly.
