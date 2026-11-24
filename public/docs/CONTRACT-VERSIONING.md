# Contract Versioning

## V2.4 Arc Testnet Release

FundingPool `1.4.0` -> `2.0.0`: new future-round fee ownership and bounded
withdrawal authority materially change its financial trust boundary. This is
not a patch/minor bump merely because old storage and round rules are preserved.
New immutable ProtocolRevenueTreasury starts at `1.0.0`. Both were installed on
Arc Testnet November 24, 2026. Product release V2.4 retains V2.3 grant/milestone
rules and does not change Community Layer V3.2.1. Revenue policy is scheduled,
not active. See [actual addresses and status](V2.4-ARC-TESTNET-RELEASE.md).

Every deployable BERT contract carries a NatSpec `@custom:version` tag in
`MAJOR.MINOR.PATCH` format. The version belongs to that contract alone; it is
not the protocol, product, deployment, or release version.

## Rules

- New contract: start at `1.0.0`.
- `MAJOR`: increment for a breaking or material change to critical business
  logic, storage layout, trust boundaries, or a contract's core architecture.
- `MINOR`: increment for an additive, backwards-compatible feature that does
  not materially replace the contract's core logic.
- `PATCH`: increment only for a bug fix, validation correction, or narrowly
  scoped safe patch.

Each contract evolves independently. For example, one contract may be
`1.8.9` while another is `5.6.1`; do not synchronize numbers merely because
they are deployed or released together.

## V3.1 Baseline

The V3.1 module split is a major architectural change for the pre-existing
`CommunityHub`, `CommunityFactory`, `CommunityTreasury`,
`CommunityTreasuryDeployer`, and `CommunityTypes`, so their current baseline
is `2.0.0`. The new module and module-deployer contracts begin at `1.0.0`.
`CommunityErrors` receives additive error definitions only and remains at
`1.1.0`.

## V3.2 Release

The October Community Layer release **V3.2** was independent of the then-unchanged
Global Funding Layer **V2.3**. Those comment/documentation-only V2 changes did not
create V2.4 or require an implementation upgrade. The November V2.4 release above
is a separate financial-logic upgrade, not a renaming of that October work.

V3.2 uses Manager `2.0.0`, Hub `2.1.0`, Membership `1.1.0`, CommunityTypes
`2.1.0`, and Membership/Milestone deployers `1.1.0`. Do not synchronize every
contract tag to `3.2.0` or reset a new deployment of an existing implementation
to `1.0.0`. See [the V3.2 release scope](V3.2-RELEASE.md).
