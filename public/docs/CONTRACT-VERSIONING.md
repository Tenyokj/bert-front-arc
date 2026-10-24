# Contract Versioning

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

The next Community Layer release is **V3.2**, independently of the unchanged
Global Funding Layer **V2.3**. Comment/documentation-only V2 changes do not create
V2.4 or V2.3.1 and do not require an implementation upgrade.

V3.2 uses Manager `2.0.0`, Hub `2.1.0`, Membership `1.1.0`, CommunityTypes
`2.1.0`, and Membership/Milestone deployers `1.1.0`. Do not synchronize every
contract tag to `3.2.0` or reset a new deployment of an existing implementation
to `1.0.0`. See [the V3.2 release scope](V3.2-RELEASE.md).
