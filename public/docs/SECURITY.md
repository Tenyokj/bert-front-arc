# Security

BERT is an upgradeable, multi-contract protocol with explicit treasury accounting, role-gated state transitions, and milestone-based payout release. Its security model must therefore cover not only typical smart contract bugs, but also role misuse, dependency miswiring, treasury accounting failures, and operational errors during upgrades and live maintenance.

## Contents
1. Security Goals
2. Threat Model
3. Trust Assumptions
4. Primary Attack Surfaces
5. Access Control Risks
6. Treasury and Capital Risks
7. Voting and Round Risks
8. Proposal Registry Risks
9. Milestone Review Risks
10. Upgradeability Risks
11. Configuration Risks
12. Operational Security Controls
13. Incident Response Checklist
14. Residual Risks

## Security Goals

BERT aims to preserve the following properties:
- proposal metadata cannot be arbitrarily rewritten by unauthorized actors
- round outcomes cannot be altered after valid resolution
- capital cannot be released twice
- author stake cannot bypass configured intake rules
- reserve accounting remains separate from live distributable balances
- elevated user roles cannot be self-assigned by arbitrary wallets
- upgrades cannot silently corrupt storage or break dependency wiring

## Threat Model

The protocol must defend against:
- unauthorized writes to idea, round, treasury, or payout state
- duplicate grant release
- incorrect role assignments
- dependency misconfiguration between upgradeable modules
- malicious or careless admin actions
- griefing and spam through cheap proposal or voting flows
- reviewer abuse during milestone approval
- accounting drift between token balances and internal pool state
- broken upgrades that preserve admin control but corrupt storage layout

The protocol does not assume a fully trustless governance environment today. Admin authority, role assignment, and reviewer behavior remain meaningful trust boundaries.

## Trust Assumptions

### Admin Trust
Admins are trusted to:
- assign correct system roles
- configure correct dependency addresses
- manage pause and unpause responsibly
- perform upgrades with storage-safe implementations
- avoid malicious reserve allocation or dependency replacement

Admin compromise is one of the highest-severity scenarios in the system.

### System Contract Trust
Core modules trust each other through configured addresses and role assignments. Incorrect wiring can break valid flows even when the contract code itself is correct.

### Reviewer and Curator Trust
Curators and reviewers are not arbitrary users; they are earned-role or admin-granted actors. Even so, they remain a trust boundary because:
- curators can mark ideas as low quality
- reviewers can influence milestone release timing and success

## Primary Attack Surfaces

1. role registry and cross-contract authorization
2. upgrade and dependency rewiring operations
3. author stake intake and slashing logic
4. per-round and per-idea treasury accounting
5. milestone proof approval and rejection flow
6. reserve allocation and distribution logic
7. admin-owned configuration parameters

## Access Control Risks

### System Roles
Critical system roles include:
- `VOTING_ROLE`
- `GRANT_ROLE`
- `DISTRIBUTOR_ROLE`
- `IREGISTRY_ROLE`
- `REPUTATION_MANAGER_ROLE`
- `AUTO_GRANT_ROLE`

If misassigned, these can allow:
- unauthorized status changes
- unauthorized distributions
- unauthorized reputation mutations
- unauthorized user role grants

### User Roles
Critical user roles include:
- `CURATOR_ROLE`
- `REVIEWER_ROLE`

If granted too broadly or without monitoring, these can allow:
- griefing through low-quality marking
- biased or low-quality milestone reviews
- social capture of protocol moderation surfaces

### Recommended Controls
- only grant system roles to protocol contracts
- keep admin authority in a multisig for any serious environment
- verify role wiring after every deployment and upgrade
- maintain a human-readable role assignment ledger

## Treasury and Capital Risks

### Capital Separation Risk
BERT distinguishes:
- direct treasury deposits
- author submission stake
- round and idea vote capital
- protocol reserve
- released grant payouts

Any bug or misconfiguration that merges these buckets incorrectly can distort:
- payout eligibility
- reserve accounting
- slashing behavior
- donor pool visibility

### Double Distribution Risk
Grant manager payout flags and funding pool distribution state must prevent:
- repeated initial grant claim
- repeated milestone payout
- repeated reserve allocation for the same intended effect

### Reserve Misuse Risk
`protocolReserve` is intentionally separate from live round balances. Admin or code errors that treat reserve like ordinary distributable liquidity can violate treasury expectations.

### Accounting Drift Risk
Internal accounting and actual token balances can drift if:
- external calls fail in unexpected ways
- deployment wiring points to the wrong token
- upgrades mutate accounting paths incorrectly

Mitigation:
- post-upgrade and post-incident reconciliation
- explicit pool balance validation
- controlled use of reserve allocation and pool reconciliation functions

## Voting and Round Risks

### Round Composition Risk
Rounds are built from the global idea sequence using `lastUsedIdeaId`. Bugs here can:
- reuse ideas
- skip ideas
- create malformed rounds

### Vote Commitment Risk
Voting is capital-backed. Risks include:
- wrong minimum stake configuration
- wrong USDC token address
- faulty accounting for `depositForIdeaFrom`
- duplicate or misattributed idea membership

### Outcome Propagation Risk
When a round ends, the protocol updates:
- winning and losing idea status
- reputation changes
- winning vote registration

This is a multi-side-effect step. Partial failure handling and dependency correctness matter because a broken outcome propagation can create inconsistent social or lifecycle state even if the round result itself is known.

## Proposal Registry Risks

### Intake Spam Risk
The author stake requirement exists to raise the cost of low-signal proposals. If `authorMinStake` is misconfigured too low, spam pressure rises. If set too high, legitimate participation becomes too expensive.

### Low-Quality Marking Risk
Curators can mark ideas as low quality. This introduces:
- abuse risk by biased actors
- coordination risk if user role thresholds are too easy to satisfy

### Slashing Risk
Rejected ideas can have their author stake moved into reserve. Incorrect status checks or wrong registry-to-pool wiring can cause:
- unslashed rejected stake
- slash attempts on non-rejected ideas
- reserve inflation or accounting mismatch

## Milestone Review Risks

### Reviewer Collusion Risk
Milestone release depends on reviewer approvals. A captured reviewer set could:
- approve weak proof too early
- delay legitimate execution through coordinated rejection

### Duplicate Review Risk
The protocol must ensure a single reviewer cannot count multiple times in the same active milestone request.

### Cooldown Bypass Risk
Rejected milestone requests record `lastRejectedAt`. If cooldown logic is bypassed or broken:
- authors can spam reviewer bandwidth
- repeated low-quality proof can flood the review surface

### Stage Eligibility Risk
The protocol must prevent:
- completion payout before in-process payout
- milestone release before initial grant claim
- payout after already-settled stage state

## Upgradeability Risks

### Storage Corruption Risk
All upgradeable modules must preserve storage layout compatibility. The main hazards are:
- reordering existing variables
- removing variables in inherited storage chains
- inserting new variables in the middle of storage
- changing inheritance order

### Dependency Drift Risk
An upgrade that changes storage safely can still break the protocol if it changes or forgets:
- funding pool address
- idea registry address
- role registry address
- reputation system address
- voter progression address

### Proxy Administration Risk
Wrong proxy or wrong admin usage can:
- block upgrades
- apply upgrades to the wrong target
- create operator confusion about which implementation is live

## Configuration Risks

Critical parameters include:
- `IDEAS_PER_ROUND`
- `VOTING_DURATION`
- `minStake`
- `authorMinStake`
- `authorSharePercent`

Configuration mistakes can cause:
- impossible round creation
- spammy or economically weak voting
- excessive author friction
- unfair or unintended payout split

Security posture is not only contract correctness. It also depends on operator discipline around parameter changes.

## Operational Security Controls

Recommended controls:
- use a dedicated admin signer or multisig
- keep deployment logs with proxy, implementation, and role assignment data
- verify role wiring after deploy and after each upgrade
- record parameter baselines and changes
- monitor pause status for `FundingPoolUpgradeable`, `VotingSystemUpgradeable`, and `GrantManagerUpgradeable`
- monitor role change events in `RolesRegistryUpgradeable`
- monitor large treasury inflows and outflows
- rehearse every upgrade on localhost and Sepolia before live execution

## Incident Response Checklist

1. determine whether the issue is:
   - access control
   - treasury accounting
   - round resolution
   - milestone release
   - upgrade misconfiguration
2. pause affected modules if live loss or state corruption is plausible
3. preserve addresses, tx hashes, and current configuration state
4. verify dependency wiring and role assignments
5. verify storage-safe remediation path
6. patch or upgrade the affected module
7. validate state consistency before unpausing
8. document the root cause and corrective controls

## Residual Risks

BERT still has residual risks that should be treated honestly:
- admin centralization remains a major trust boundary
- reviewer quality is a social and governance risk, not only a code risk
- role-based moderation can be captured if progression policy is weak
- wrong deployment wiring can break flows even with correct code
- upgrade safety depends on disciplined operator behavior

Security therefore depends on both:
- contract-level correctness
- operational maturity
