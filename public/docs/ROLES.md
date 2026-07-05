# Roles

This document describes the BERT permission model, including system roles, user roles, who grants them, and what trust they introduce.

## Contents
1. Role Philosophy
2. System Roles
3. User Roles
4. Grant and Revoke Paths
5. Role Dependency Map
6. Trust and Abuse Considerations

## Role Philosophy

BERT separates permissions into:
- admin authority
- protocol contract authority
- earned user authority

This matters because treasury, lifecycle, and review operations should not all be open to arbitrary wallets.

## System Roles

### `DEFAULT_ADMIN_ROLE`
Purpose:
- top-level administrative authority

Typical powers:
- grant and revoke system roles
- revoke user roles
- change critical parameters through module-specific admin functions
- pause or unpause affected modules where supported

Trust implication:
- strongest single governance and security boundary in the protocol

### `VOTING_ROLE`
Purpose:
- identifies the voting system as an authorized protocol actor

Used for:
- vote-linked state updates
- progression-related winning vote registration

### `GRANT_ROLE`
Purpose:
- identifies the grant manager as an authorized payout and status-advancing actor

### `DISTRIBUTOR_ROLE`
Purpose:
- authorizes treasury distribution actions from the funding pool

### `IREGISTRY_ROLE`
Purpose:
- authorizes idea-registry-specific cross-contract paths

### `REPUTATION_MANAGER_ROLE`
Purpose:
- authorizes reputation mutations

Typical holders:
- voting system
- idea registry

### `AUTO_GRANT_ROLE`
Purpose:
- allows protocol-managed systems to grant earned user roles

Typical holder:
- `VoterProgressionUpgradeable`

## User Roles

### `CURATOR_ROLE`
Purpose:
- allows marking ideas as low quality

Expected acquisition path:
- earned through winning-vote progression
- or granted by explicit admin override

### `REVIEWER_ROLE`
Purpose:
- allows reviewing ideas and milestone proof requests

Expected acquisition path:
- earned through winning-vote progression
- or granted by explicit admin override

## Grant and Revoke Paths

### System Roles
Granted by:
- `DEFAULT_ADMIN_ROLE`

Revoked by:
- `DEFAULT_ADMIN_ROLE`

Expected target:
- protocol contracts, not EOAs

### User Roles
Granted by:
- `AUTO_GRANT_ROLE` through progression logic
- or by admin override when supported procedurally

Revoked by:
- `DEFAULT_ADMIN_ROLE`

Expected target:
- end-user wallets with earned or intentionally assigned trust

## Role Dependency Map

`VotingSystemUpgradeable` depends on:
- `VOTING_ROLE`
- `REPUTATION_MANAGER_ROLE` interactions downstream

`GrantManagerUpgradeable` depends on:
- `GRANT_ROLE`
- `DISTRIBUTOR_ROLE`

`IdeaRegistryUpgradeable` depends on:
- curator and reviewer user roles
- system role-gated status update paths

`ReputationSystemUpgradeable` depends on:
- `REPUTATION_MANAGER_ROLE`

`VoterProgressionUpgradeable` depends on:
- `AUTO_GRANT_ROLE`

## Trust and Abuse Considerations

1. misgranted system roles can break protocol integrity immediately
2. misgranted reviewer roles can distort milestone release quality
3. misgranted curator roles can grief legitimate proposals
4. `AUTO_GRANT_ROLE` is sensitive because it affects earned authority pathways
5. admin override remains necessary operationally, but increases trust assumptions

Recommended practice:
- grant system roles only to protocol contracts
- document all role holders
- monitor role changes onchain
- treat user role issuance as governance-sensitive, not cosmetic
