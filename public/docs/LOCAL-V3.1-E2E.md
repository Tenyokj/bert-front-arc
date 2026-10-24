# Local Community Layer E2E: V3.2 Sources

**Unreleased source change:** Manager 2.0.0 requires explicit Admin approvals and
fixed-tranche execution after settlement and each passed milestone review. Use
[the tranche-quorum guide](V3.2-TRANCHE-QUORUM.md) alongside this runbook; older
automatic-transfer steps describe the original live Manager. Exercise expiry at
all three stages and 100/80/40 unpaid-budget refunds. The next proof clock begins
only after actual payment. No existing deployment was changed by these edits.

This runbook exercises the deployed V3.1 contracts through the real frontend on a disposable Hardhat node. It is intentionally separate from Arc Testnet and never uses a real private key, real USDC, or a production proof-of-personhood attestation.

## Safety Boundary

- Use only the public development accounts printed by `npx hardhat node`.
- Never fund those accounts outside a local node.
- Every helper below refuses a chain other than `31337`.
- Do not change the V3.1 one-day minimum milestone review in Solidity. Advance the local chain clock instead.

## Wallet Roles

Use the first eight accounts from the Hardhat node output:

| Account | E2E role |
| --- | --- |
| `#0` | Community creator, initial Admin, Administration execution wallet |
| `#1` | Second Admin for quorum and control-plane checks |
| `#2` | Initial Validator |
| `#3` | Member author for a Binary proposal |
| `#4` | Member author for Slate proposals |
| `#5` | Winning supporter and milestone reviewer 1 |
| `#6` | Winning supporter and milestone reviewer 2 |
| `#7` | Winning supporter and milestone reviewer 3 |

Three independent winning supporters are deliberate: V3.1 requires at least the greater of three approving wallets or 3% of the winner snapshot.

## 1. Start and Deploy Locally

Terminal 1, from `bert-core`:

```bash
npx hardhat node
```

Keep it running. In a second terminal, explicitly override any Arc values inherited from `.env`:

```bash
cd ~/bert/bert-core

LOCAL_RPC_URL=http://127.0.0.1:8545 \
USDC_ADDRESS= \
PROXY_ADMIN_OWNER=0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266 \
TRUSTED_SIGNER_ADDRESS=0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266 \
HUMAN_ONLY_VOTING=true \
HUMAN_ONLY_IDEA_CREATION=true \
npx hardhat run scripts/deploy/deploy-proxies.ts --network localhost
```

Record the printed addresses for `USDC asset`, `FundingPoolUpgradeable`, `VotingSystemUpgradeable`, `IdeaRegistryUpgradeable`, `ReputationSystemUpgradeable`, `VoterProgressionUpgradeable`, `RolesRegistryUpgradeable`, `PoPVerifierUpgradeable`, and `GrantManagerUpgradeable`.

Deploy the isolated V3.1 infrastructure with the local PoP proxy address:

```bash
LOCAL_RPC_URL=http://127.0.0.1:8545 \
POP_VERIFIER_ADDRESS=<PoPVerifierUpgradeable proxy> \
V3_PROXY_ADMIN_OWNER=0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266 \
npx hardhat run scripts/deploy/deploy-v3-2.ts --network localhost
```

Record `V3_2_FACTORY_ADDRESS` and `V3_2_ADMIN_ACTIONS_LIBRARY_ADDRESS`.

Authorize that Factory in the V2 FundingPool. This is required before any
Community Treasury can route its protocol reserve to BERT:

```bash
LOCAL_RPC_URL=http://127.0.0.1:8545 \
FUNDING_POOL_ADDRESS=<FundingPoolUpgradeable proxy> \
V3_2_FACTORY_ADDRESS=<V3_2_FACTORY_ADDRESS> \
npx hardhat run scripts/deploy/configure-v3-2-funding-pool.ts --network localhost
```

## 2. Fund and Verify Test Wallets

```bash
LOCAL_RPC_URL=http://127.0.0.1:8545 \
MOCK_USDC_ADDRESS=<USDC asset> \
LOCAL_TEST_WALLET_COUNT=8 \
MOCK_USDC_AMOUNT=100000 \
npx hardhat run scripts/local/mint-v3-test-usdc.ts --network localhost

LOCAL_RPC_URL=http://127.0.0.1:8545 \
POP_VERIFIER_ADDRESS=<PoPVerifierUpgradeable proxy> \
LOCAL_TEST_WALLET_COUNT=8 \
npx hardhat run scripts/local/verify-v3-test-wallets.ts --network localhost
```

The second script uses account `#0` only as the local trusted attester and writes a normal `VerificationRecorded` record for each wallet. No backend is required for this local-only path.

## 3. Point the Frontend at Localhost

Create or temporarily replace `bert-frontend/.env.local` with the local values printed above. Do not commit this file.

```dotenv
NEXT_PUBLIC_DEFAULT_CHAIN=hardhat
NEXT_PUBLIC_HARDHAT_RPC_URL=http://127.0.0.1:8545

NEXT_PUBLIC_USDC_ADDRESS=<USDC asset>
NEXT_PUBLIC_FUNDING_POOL_ADDRESS=<FundingPoolUpgradeable proxy>
NEXT_PUBLIC_VOTING_SYSTEM_ADDRESS=<VotingSystemUpgradeable proxy>
NEXT_PUBLIC_IDEA_REGISTRY_ADDRESS=<IdeaRegistryUpgradeable proxy>
NEXT_PUBLIC_REPUTATION_SYSTEM_ADDRESS=<ReputationSystemUpgradeable proxy>
NEXT_PUBLIC_VOTER_PROGRESSION_ADDRESS=<VoterProgressionUpgradeable proxy>
NEXT_PUBLIC_ROLES_REGISTRY_ADDRESS=<RolesRegistryUpgradeable proxy>
NEXT_PUBLIC_POP_VERIFIER_ADDRESS=<PoPVerifierUpgradeable proxy>
NEXT_PUBLIC_GRANT_MANAGER_ADDRESS=<GrantManagerUpgradeable proxy>

NEXT_PUBLIC_V3_FACTORY_ADDRESS=<V3_2_FACTORY_ADDRESS>
NEXT_PUBLIC_V3_ADMIN_ACTIONS_LIBRARY_ADDRESS=<V3_2_ADMIN_ACTIONS_LIBRARY_ADDRESS>
NEXT_PUBLIC_V3_EVENT_FROM_BLOCK=0
```

Leave `NEXT_PUBLIC_SUBGRAPH_URL` and `NEXT_PUBLIC_V3_SUBGRAPH_URL` unset locally. The V3.1 directory falls back to direct RPC reads, so a local Graph node is not required.

Start the frontend:

```bash
cd ~/bert/bert_orig/bert-frontend
npm run dev
```

In MetaMask, add the local network at `http://127.0.0.1:8545`, chain ID `31337`, currency `ETH`, then import only accounts `#0` through `#7` from the `hardhat node` terminal.

## 4. Create the E2E Community

Open `http://localhost:3000/v3/create` as account `#0` and create one Community with:

| Setting | E2E value |
| --- | --- |
| Additional Admin | account `#1` |
| Validator | account `#2` |
| Administration execution wallet | account `#0` |
| Entry stake | `10` USDC |
| Member proposal bond | `50` USDC |
| Minimum vote | `10` USDC |
| Admin quorum | `2` |
| Validator approvals | `1` |
| NO fee | `300` bps |
| Validator reward | `1500` bps |
| Exit / validation / binary / slate / epoch | `5` minutes |
| Milestone review | `1` day |
| Milestone proof deadline | `5` minutes |

Use the three creator steps: reserve Treasury, deploy Hub, activate Community. Then switch accounts `#3` through `#7` one at a time, approve the entry stake, and join the Community.

## 5. Time Travel Command

Use this after a five-minute voting, validation, proof, or cooldown deadline:

```bash
cd ~/bert/bert-core
LOCAL_RPC_URL=http://127.0.0.1:8545 \
LOCAL_ADVANCE_SECONDS=301 \
npx hardhat run scripts/local/advance-time.ts --network localhost
```

For a V3.1 milestone review window:

```bash
LOCAL_RPC_URL=http://127.0.0.1:8545 \
LOCAL_ADVANCE_SECONDS=86401 \
npx hardhat run scripts/local/advance-time.ts --network localhost
```

Refresh the relevant dApp page after advancing time. Community deadlines use pause-adjusted Community time, so also verify that pausing freezes countdowns.

## 6. Required E2E Matrix

### A. Member Binary: successful reviewed delivery

1. Account `#3` creates a **Member Binary** proposal and approves the 50 USDC bond.
2. Account `#2` approves it in Validator Queue.
3. Account `#0` opens binary voting.
4. Accounts `#5`, `#6`, `#7` each vote `YES` with 10 USDC.
5. Advance 301 seconds; settle the proposal from its detail page.
6. Confirm an execution plan exists: the Treasury retained custody until releasing 20% to the Administration execution wallet (`#0`); the other 80% is reserved.
7. Account `#0` submits a nonzero 32-byte evidence hash for milestone one.
8. Accounts `#5`, `#6`, `#7` approve the proof in **Execution Plans**.
9. Advance 86401 seconds; finalize review. Confirm the first 40% releases.
10. Repeat steps 7-9 for milestone two. Confirm status `Completed`, the final 40% release, and that supporters can clear their settled vote locks.

### B. Admin Binary: expired proof and pull refunds

1. Account `#0` creates an **Admin Binary** proposal and opens voting.
2. Accounts `#5`, `#6`, `#7` vote `YES`; advance 301 seconds and settle.
3. Do not submit a proof. Advance 301 seconds past the proof deadline.
4. Any account calls **Fail expired plan** in Execution Plans.
5. Each of `#5`, `#6`, `#7` claims their own failed-plan refund.
6. Confirm only the unreleased 80% is refunded pro rata; the initial 20% remains with the immutable Administration execution wallet. Each supporter can then clear their vote lock.

### C. Admin Slate: direct Community choice

1. Account `#0` creates two **Admin Slate** proposals.
2. Account `#0` creates an Admin Slate Round containing both proposals.
3. Accounts `#5`, `#6`, `#7` select the same candidate with 10 USDC each.
4. Advance 301 seconds and settle the round.
5. Confirm the selected candidate is the deterministic winner and has an execution plan with a sealed supporter snapshot.

### D. Member Slate: validator-gated Community choice

1. Accounts `#3` and `#4` each create a **Member Slate** proposal and lock their own bonds.
2. Account `#2` approves both in Validator Queue.
3. Account `#0` creates a Member Slate Round containing both validated proposals.
4. Accounts `#5`, `#6`, `#7` select one candidate; advance 301 seconds and settle.
5. Confirm the winner begins the same V3.1 execution-plan lifecycle as a binary winner.

### E. Negative and control checks

1. Try to review from a wallet that did not support the winner: transaction must revert.
2. Confirm author voting is rejected. With patched Manager 1.0.2, a distinct Member execution wallet may fund the winner but both approve/reject review calls must revert. Exclude its weight/count only from review thresholds; preserve its financial refunds and exit-lock settlement. Original deployed Managers retain the gap; use a non-participating execution wallet for those pilots. See V3.1-SELF-REVIEW-FIX.md for the source/deployment boundary.
3. Submit one rejected proof, advance a day, finalize, wait 48 hours, reopen correction, and submit a corrected proof. Confirm a second rejection fails the plan.
4. Pause through the two-Admin action queue, advance local wall time, and verify Community-clock deadlines remain unchanged. Resume through the same quorum path.
5. Attempt member exit while a vote or plan lock exists. It must remain blocked until the vote is settled and the plan completes or the wallet claims its failed-plan refund.

## E2E Exit Criteria

The local rehearsal passes only if all four lanes settle, the completed plan releases exactly `20 / 40 / 40`, a failed plan refunds only winning supporters, an ineligible reviewer cannot vote, and Community pause preserves active-time deadlines.

This historical filename is retained for existing links. Current commands deploy V3.2 sources, not a reproduction of original V3.1.
