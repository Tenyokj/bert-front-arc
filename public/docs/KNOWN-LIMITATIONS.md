# Known Limitations

## V3.1 execution-recipient conflict of interest

In original deployed Managers the execution recipient is not independently excluded from membership, winner
support or milestone review. An Admin/Validator cannot be an active Member, but
an arbitrary execution wallet can. The pre-patch end-to-end characterization reproduced
such a wallet supporting and approving its own execution plan; new regression tests
now require rejection on the patched code. Use a non-participating
Administration execution wallet for pilots; do not claim universal executor
exclusion for those original instances. V3.2.1 Manager 2.0.1, deployed through the new Factory, separates review
eligibility from financial refund rights. See [current deployment](V3.2.1-ARC-TESTNET-RELEASE.md).
Handling existing immutable V3.1 Communities remains a separate operational task.

This document records current protocol limitations and trust assumptions that should be stated explicitly.

## Current Limitations

1. admin authority remains a meaningful trust boundary
2. reviewer quality is a social risk, not only a technical one
3. role-based moderation can be abused if user-role policy is weak
4. dependency miswiring can break live flows even with correct contract logic
5. upgrade safety depends heavily on operator discipline
6. economic tuning still depends on environment-specific judgment
7. Arc Testnet Demo verification is not unique personhood or Sybil resistance
8. V2.3 backer reviews and V3.2 supporter reviews (and historical V3.1 reviews) require an active eligible cohort; reaching a quorum is not guaranteed by deployment
9. V3.2 uses 6,667-bps approval and at least max(3, ceil(3% of eligible supporters)) approving addresses; a smaller eligible cohort cannot pass review
10. internal tests and Slither triage are not an independent audit or complete manual dApp E2E

Current version and legacy boundaries: [CURRENT-RELEASE.md](CURRENT-RELEASE.md).

11. V3.2 Admin quorum adds a payment veto/liveness dependency; pause freezes the seven-active-day expiry clock
12. Execution-recipient exclusion applies to that exact address, not every related wallet or multisig owner

## Why This Document Exists

Transparent protocol documentation should not imply that every risk has already been removed. Some risks are architectural, some are operational, and some are social. Recording them helps:
- operators
- auditors
- judges
- contributors

Understand the current maturity of the system honestly.

## Historical correction liveness defect

Original V3.2.0 Managers can leave correction unavailable or stuck in cooldown.
V3.2.1 Manager 2.0.1 assigns a bounded deadline at rejection and permits
permissionless expiry of overdue cooldowns. Existing immutable instances are
not upgraded. See [the finding](V3.2-CORRECTION-DEADLINE-FINDING.md).
