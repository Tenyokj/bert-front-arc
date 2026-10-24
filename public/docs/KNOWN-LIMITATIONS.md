# Known Limitations

## V3.1 execution-recipient conflict of interest

In original deployed Managers the execution recipient is not independently excluded from membership, winner
support or milestone review. An Admin/Validator cannot be an active Member, but
an arbitrary execution wallet can. The pre-patch end-to-end characterization reproduced
such a wallet supporting and approving its own execution plan; new regression tests
now require rejection on the patched code. Use a non-participating
Administration execution wallet for pilots; do not claim universal executor
exclusion for those original instances. A local source patch now separates review
eligibility from financial refund rights; see [the patch record](V3.1-SELF-REVIEW-FIX.md).
Deployment and handling of existing immutable Communities remain outstanding.

This document records current protocol limitations and trust assumptions that should be stated explicitly.

## Current Limitations

1. admin authority remains a meaningful trust boundary
2. reviewer quality is a social risk, not only a technical one
3. role-based moderation can be abused if user-role policy is weak
4. dependency miswiring can break live flows even with correct contract logic
5. upgrade safety depends heavily on operator discipline
6. economic tuning still depends on environment-specific judgment
7. Arc Testnet Demo verification is not unique personhood or Sybil resistance
8. V2.3 backer reviews and V3.1 supporter reviews require an active eligible cohort; reaching a quorum is not guaranteed by deployment
9. V3.1 uses 6,667-bps approval and at least max(3, ceil(3% of eligible supporters)) approving addresses; a smaller eligible cohort cannot pass review
10. internal tests and Slither triage are not an independent audit or complete manual dApp E2E

Current version and legacy boundaries: [CURRENT-RELEASE.md](CURRENT-RELEASE.md).

## Why This Document Exists

Transparent protocol documentation should not imply that every risk has already been removed. Some risks are architectural, some are operational, and some are social. Recording them helps:
- operators
- auditors
- judges
- contributors

Understand the current maturity of the system honestly.
