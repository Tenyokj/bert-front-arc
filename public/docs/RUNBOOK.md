# Runbook

This document is for operators maintaining a live or staging BERT deployment.

## Contents
1. Normal Operations
2. When to Pause
3. Upgrade Operations
4. Misconfiguration Response
5. Post-Incident Review

## Normal Operations

Regular checks:
- verify pause status of critical modules
- verify expected role assignments
- verify expected dependency addresses
- monitor treasury inflows and outflows
- watch for unusual milestone review activity

## When to Pause

Pause should be considered when:
- treasury accounting appears inconsistent
- unauthorized access is suspected
- upgrade behavior is uncertain
- a live payout bug is suspected

If pausing:
1. identify affected modules
2. pause the minimal set necessary
3. capture current state and tx references
4. begin root-cause investigation

## Upgrade Operations

Before upgrade:
- use the checklist in `UPGRADES.md`

After upgrade:
- run post-upgrade validation immediately
- verify role and dependency wiring
- test critical read and write paths

## Misconfiguration Response

If a dependency address or role assignment is wrong:
1. stop new live interactions if possible
2. identify the incorrect address or missing role
3. correct the wiring or role assignment
4. re-run the expected flow that was failing
5. document the incident

## Post-Incident Review

After any incident:
- document root cause
- list affected modules
- note whether pause was used
- note whether upgrade was required
- add new checks if the incident exposed an operational blind spot
