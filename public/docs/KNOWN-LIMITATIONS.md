# Known Limitations

This document records current protocol limitations and trust assumptions that should be stated explicitly.

## Current Limitations

1. admin authority remains a meaningful trust boundary
2. reviewer quality is a social risk, not only a technical one
3. role-based moderation can be abused if user-role policy is weak
4. dependency miswiring can break live flows even with correct contract logic
5. upgrade safety depends heavily on operator discipline
6. economic tuning still depends on environment-specific judgment

## Why This Document Exists

Transparent protocol documentation should not imply that every risk has already been removed. Some risks are architectural, some are operational, and some are social. Recording them helps:
- operators
- auditors
- judges
- contributors

Understand the current maturity of the system honestly.
