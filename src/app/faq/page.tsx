import { SiteFrame } from "@/components/site/SiteFrame";
import { FaqExplorer } from "@/components/site/FaqExplorer";

type FaqItem = {
  question: string;
  answer: string;
};

type FaqSection = {
  id: string;
  title: string;
  items: FaqItem[];
};

const sections: FaqSection[] = [
  {
    id: "introduction",
    title: "Introduction",
    items: [
      {
        question: "What is BERT now?",
        answer:
          "BERT is programmable USDC-native funding infrastructure for Arc. It coordinates proposal intake, round voting, treasury accounting, and milestone-based grant release through upgradeable smart contracts.",
      },
      {
        question: "What economic model does BERT use?",
        answer:
          "BERT is designed around USDC-native funding flows. Author bonds, round pledges, protocol reserve, refunds, and grant payouts all run through USDC.",
      },
      {
        question: "What problem does BERT solve?",
        answer:
          "BERT turns grant allocation into an auditable onchain workflow. Instead of manual treasury coordination and opaque committee payouts, the funding path becomes programmable, reviewable, and measurable on Arc.",
      },
      {
        question: "Why Arc?",
        answer:
          "Arc is treated here as a stablecoin settlement environment. That makes it a strong fit for transparent treasury coordination, low-friction USDC movement, and milestone-based builder funding.",
      },
      {
        question: "How does BERT work at a high level?",
        answer:
          "A builder submits a proposal with an author bond and a minimum net funding target. Participants pledge USDC to one proposal in a round; losing pledges are refundable, and a viable winner moves into GrantManager where milestone approvals unlock staged capital release.",
      },
      {
        question: "Is BERT non-custodial?",
        answer:
          "The intended design is contract-driven and non-custodial at the protocol layer. Operational trust still exists around admin keys, role wiring, and upgrade authority, so deployment discipline remains critical.",
      },
    ],
  },
  {
    id: "funding",
    title: "Funding & Voting",
    items: [
      {
        question: "What asset do I need to use the app?",
        answer:
          "USDC. On Arc deployments the protocol expects an ERC-20 compatible USDC address. On localhost, the deploy script provisions MockUSDC with 6 decimals for testing.",
      },
      {
        question: "What is the minimum deposit to create an idea?",
        answer:
          "The current default author deposit is 50 USDC. The frontend reads the live value from IdeaRegistry, so operators can adjust it onchain without redeploying the UI.",
      },
      {
        question: "What is the minimum vote amount?",
        answer:
          "The current default vote commitment is 10 USDC. Vote weight is based directly on committed USDC.",
      },
      {
        question: "Do I need verification before I can vote?",
        answer:
          "Yes. On Arc Testnet, complete Demo verification and finalize its payload onchain before voting. It opens protected test flows but does not prove humanity. Mainnet will require production World ID verification instead.",
      },
      {
        question: "What is the maximum vote amount per idea?",
        answer:
          "The current live cap is 10,000 USDC per wallet for one idea. This keeps voting capital-backed while reducing single-wallet dominance over one target idea.",
      },
      {
        question: "Where does committed USDC go?",
        answer:
          "Committed USDC is held by FundingPool as escrow for the idea you selected. It is not redirected to another idea: losing pledges are pull-refundable after settlement, while only a viable winning idea can use its own pledges for a grant.",
      },
      {
        question: "Why do I need to approve USDC first?",
        answer:
          "Because the protocol uses standard ERC-20 allowance flow. FundingPool must be approved before it can pull your USDC for an idea deposit or vote commitment.",
      },
      {
        question: "Can voting still be abused?",
        answer:
          "Yes, especially on testnet: Demo verification is intentionally not Sybil-resistant. The testnet is for validating contract behavior, economics and UX. Mainnet policy will add World ID proof-of-personhood alongside self-vote restrictions, minimum commitments, vote caps and role-gated settlement paths.",
      },
    ],
  },
  {
    id: "verification",
    title: "Verification",
    items: [
      {
        question: "What kind of verification does BERT use?",
        answer:
          "The current Arc Testnet deployment uses clearly labelled Demo verification so any test wallet can exercise protected flows. It is not proof of personhood. At mainnet launch, Demo verification will be disabled and BERT will use production World ID proof-of-personhood for voting eligibility.",
      },
      {
        question: "Is this the same as KYC?",
        answer:
          "No. Arc Testnet Demo verification is not identity verification at all. The planned mainnet World ID flow is proof-of-personhood, not a traditional BERT KYC onboarding process.",
      },
      {
        question: "How does the verification flow work?",
        answer:
          "On Arc Testnet, select Use demo verification and confirm the signed payload in your wallet; the real PoPVerifierUpgradeable contract records the test-only result. On mainnet, the frontend will open World ID, the backend will validate the proof and bind its nullifier to the wallet, then the wallet will finalize the payload onchain.",
      },
      {
        question: "How long does verification stay active?",
        answer:
          "The current verification window is 14 days. After that, the wallet needs to refresh verification before voting again.",
      },
      {
        question: "Why does BERT need both verification and a vote cap?",
        answer:
          "They solve different problems in production. World ID reduces Sybil pressure from many fresh wallets, while the 10,000 USDC cap reduces the ability of one verified wallet to dominate one idea with an outsized vote. Arc Testnet Demo verification does not provide the first protection.",
      },
      {
        question: "What if I pass verification but still cannot vote?",
        answer:
          "Most often the wallet has not finalized the signed payload onchain yet, the verification has expired, the connected wallet is different from the verified wallet, or the vote amount exceeds the live per-idea cap.",
      },
    ],
  },
  {
    id: "milestones",
    title: "Milestones & Treasury",
    items: [
      {
        question: "Is V2.4 protocol revenue already active?",
        answer:
          "Yes, on Arc Testnet. V2.4 FundingPool and immutable Treasury are deployed; the clients and V2 Graph v0.4.0 are published. The 20% share of eligible earned success fees was activated November 27, 2026, 10:03:38 UTC, at block 74359134. RPC and Graph/client proxies confirm it. This is not 20% of pool funds. Existing rounds keep their original policy; a public revenue pilot remains pending.",
      },
      {
        question: "Does a pool deposit give me ownership or interest?",
        answer:
          "No. Deposit accounting is not investor equity, a withdrawable share of custody or an APY product. V2.4 does not turn deposits, bonds, grant principal, refunds, direct transfers or V3 reserve inflows into team revenue. Only an opted-in round's eligible earned fee creates a Treasury credit.",
      },
      {
        question: "Can the team redirect a RevenueTreasury payment?",
        answer:
          "The deployed immutable RevenueTreasury fixes its pool, token and beneficiaries at deployment. Anyone can relay a payment, but it goes only to the fixed payee. There is no owner rescue or recipient rotation; lost keys or issuer restrictions can strand funds. FundingPool itself remains upgradeable, so this is not a claim of fully trustless administration.",
      },
      {
        question: "How are grants released?",
        answer:
          "New V2.3 winning ideas move through a 20% initial claim, 40% in-process release, and 40% completion release. The 5% fee is reserved proportionally as each author tranche is claimed, so the author receives 19% / 38% / 38% of gross winning pledges.",
      },
      {
        question: "Who approves milestone proofs?",
        answer:
          "Legacy V2.2 rounds use protocol reviewers. New V2.3 rounds are reviewed only by wallets that pledged to the winning idea: their USDC pledge determines vote weight, while the author cannot vote. V2.3 needs 40% of winning pledge weight to participate and 2/3 approval among participating weight, plus three approving backers.",
      },
      {
        question: "Can the full grant be released immediately?",
        answer:
          "Not in the intended flow. BERT is designed for staged capital release with explicit state transitions, replay protection, and approval checkpoints.",
      },
      {
        question: "What does the treasury actually track?",
        answer:
          "At minimum: proposal-linked author stake, committed round capital, reserve balances, distribution history, and the release status of grant tranches.",
      },
      {
        question: "What happens if a milestone is rejected?",
        answer:
          "No capital advances automatically. In V2.3, a rejected proof after quorum gives the author one 48-hour correction and resubmission. A second rejected proof cancels the unreleased grant. If the 14-day review misses quorum, a one-time 7-day grace period opens; continued silence also cancels. In both cases, unreleased escrow becomes pull-refundable to winning pledgers.",
      },
    ],
  },
  {
    id: "community-layer",
    title: "BERT V3.2 Community Layer",
    items: [
      {
        question: "What is BERT V3.2 Community Layer?",
        answer:
          "BERT V3.2 is a Community Layer built on top of the main BERT protocol. Each Community has its own modular CommunityHub, Treasury, proposal and voting modules, plus a dedicated milestone manager. It is for stake-backed Community decisions and reviewable execution; it does not replace V2.3 grant rounds.",
      },
      {
        question: "What is created when a Community is launched?",
        answer:
          "The creation flow reserves a CommunityTreasury, deploys the matching CommunityHub and its factory-bound modules with the selected immutable configuration, and activates the pair in CommunityFactory. The Factory records the creator, Hub, Treasury, metadata URI, and Community ID so every deployment can be discovered onchain.",
      },
      {
        question: "Which settings are chosen per Community?",
        answer:
          "A creator chooses the entry stake, member-proposal bond, minimum vote, exit cooldown, validator approval threshold, points required for validator eligibility, admin quorum, NO-side fee, validator reward share, validation window, binary and slate voting durations, validator reward epoch duration, an Administration execution wallet, milestone review duration, proof deadline, and validator activity threshold. The execution wallet is not a second Treasury: the Community Treasury holds all funds and releases only approved winner budgets to it. These are Community-specific, not global frontend defaults.",
      },
      {
        question: "Can a Community change those rules after launch?",
        answer:
          "No. The core economic, execution-recipient, and timing configuration is fixed when the Hub is deployed. This prevents an administrator from changing stake, quorum, voting, milestone review, or reward rules after participants have entered under a different set of expectations.",
      },
      {
        question: "What is the difference between CommunityHub and CommunityTreasury?",
        answer:
          "CommunityHub coordinates membership, roles, proposal state, validation, voting, the Community clock, and governance actions. The modular V3 architecture places the underlying responsibilities in dedicated modules, including a milestone manager for execution plans. CommunityTreasury escrows membership stakes and votes, records execution and validator-reward balances, tracks refundable claims, and enforces multi-admin withdrawal approval before USDC leaves execution.",
      },
      {
        question: "Does a Community have its own ID and addresses?",
        answer:
          "Yes. CommunityFactory assigns an onchain numeric Community ID and links one Hub and one Treasury address. The V3 workspace exposes both addresses with copy controls so participants can independently inspect the deployed contracts.",
      },
    ],
  },
  {
    id: "community-milestones",
    title: "V3.2 Execution Plans & Legacy Compatibility",
    items: [
      {
        question: "What happens after a V3.2 proposal wins?",
        answer:
          "A settled winner reserves its execution budget in CommunityTreasury. In new V3.2.1 Communities (Manager 2.0.1), all three 20/40/40 transfers require separate current Admin approvals; the two 40% stages first need winning-supporter proof approval. Each transfer has a seven-day active-time deadline. If it is not paid, the unpaid execution budget becomes refundable after permissionless expiry. Original live V3.1 Managers retain automatic transfers; a source update does not change an existing Community.",
      },
      {
        question: "Who can review a V3.2 milestone?",
        answer:
          "Only winning supporters can review: YES supporters for a Binary winner, or voters for the winning Slate proposal. Authors cannot vote for their own proposal. The V3.2 Manager 2.0.1 also rejects the execution recipient and excludes its weight/count from review thresholds while retaining its financial refund rights. The patch is not automatically applied to existing immutable Communities: original V3.1 managers retain the self-review gap. Check the plan's Manager and deployment status; use a non-participating Administration execution wallet for legacy pilots.",
      },
      {
        question: "What makes a milestone pass?",
        answer:
          "At least 40% of the eligible winning supporter weight must participate. Among participating weight, at least 66.67% (6,667 basis points) must approve. The approval also needs at least the greater of three wallets or 3% of eligible snapshot supporters rounded up. Weight and supporter count are snapshotted at settlement, so later membership changes cannot change the threshold. V2.3 uses an exact two-thirds weight comparison instead; the formulas are not identical.",
      },
      {
        question: "What if supporters do not review the proof?",
        answer:
          "The initial review window can open one additional grace review if it misses quorum. If the grace review also misses quorum, the plan fails. Unreleased execution budget is then pull-refundable pro rata to the winning supporters; it never silently goes to the executor.",
      },
      {
        question: "What if supporters reject a proof?",
        answer:
          "In V3.2.1 (Manager 2.0.1), first rejection fixes a correction deadline at rejection Community time + 48-hour cooldown + configured proof duration. Reopening cannot extend it; abandoned cooldowns can expire permissionlessly. Historical V3.2.0 Managers retain the earlier correction-deadline defect. The corrected proof is reviewed as a new attempt. A second rejection, or a missed proof deadline, fails the plan and converts the unreleased budget into winning-supporter refunds.",
      },
    ],
  },
  {
    id: "community-roles",
    title: "Community Roles & Membership",
    items: [
      {
        question: "Which roles exist inside a Community?",
        answer:
          "The local V3 roles are Admin, Validator, Member, and public non-member. They are Community-local: holding a role in one Community does not grant it in another Community or in BERT V2.",
      },
      {
        question: "Can one wallet hold multiple roles in the same Community?",
        answer:
          "No. V3 keeps active governance roles mutually exclusive. A wallet cannot simultaneously act as a Member and Validator or as an Admin and Validator. This prevents a proposal author from validating their own member proposal and makes authority boundaries explicit.",
      },
      {
        question: "How do I become a Member?",
        answer:
          "Approve the CommunityTreasury to transfer the configured entry stake and then join through the Community workspace. The entry stake remains locked while the membership is active; it is not a vote and it is not spendable by an admin.",
      },
      {
        question: "How do I become a Validator?",
        answer:
          "Members earn local proposal points from the configured successful participation paths. When the onchain points threshold is reached, the wallet becomes eligible for nomination. An Admin then nominates that wallet through the Community’s quorum-protected governance action. Eligibility is not an automatic role assignment.",
      },
      {
        question: "Can an Admin add or remove another Admin alone?",
        answer:
          "No. Adding or removing Admins is a quorum-protected Community action. The request collects the configured number of Admin approvals before it can execute. A safe handover is therefore two steps: approve the replacement Admin first, then separately approve removal of the previous Admin.",
      },
      {
        question: "How does leaving a Community work?",
        answer:
          "A Member requests exit, waits through the configured cooldown measured in active Community time, clears any settled vote locks, and must have no active member proposal. Only then can the Member finalize exit and recover the locked entry stake. This prevents a wallet from voting or proposing and immediately escaping the relevant obligations.",
      },
      {
        question: "Do proposal points disappear after leaving?",
        answer:
          "Points are local participation history. They can remain recorded after exit so the protocol can preserve an auditable history and an Admin can still evaluate a previously eligible participant. An active role, membership stake, and the ability to act are separate onchain states.",
      },
    ],
  },
  {
    id: "community-proposals",
    title: "V3 Proposals & Voting",
    items: [
      {
        question: "What proposal modes does V3 support?",
        answer:
          "V3 supports Admin Binary Proposals, Member Binary Proposals, Admin Slate Proposals, and Member Slate Proposals. Binary proposals receive a YES or NO vote. Slate rounds place multiple eligible proposals into one support-only round and select one winner.",
      },
      {
        question: "What is an Admin Binary Proposal?",
        answer:
          "A Community Admin creates a direct YES or NO governance proposal. Active Members can stake one vote on either side during the binary voting window. Admin proposals do not pass through validator review because they originate from an accountable Community administrator.",
      },
      {
        question: "What is a Member Binary Proposal?",
        answer:
          "A Member submits an idea with the configured proposal bond. Validators review it during the validation window. If the approval threshold is reached, the proposal opens for binary Member voting. If it is rejected or expires without sufficient approval, its bond follows the onchain slash rule instead of entering the voting flow.",
      },
      {
        question: "What is a Slate Round?",
        answer:
          "A Slate Round is a support-only competition between several eligible proposals of the same origin type. Each Member casts one stake-backed vote for one proposal in the round. When the round settles, the winner is chosen from the onchain vote totals and all round voting capital follows the round settlement rule into local Community execution.",
      },
      {
        question: "How are ties resolved in a Slate Round?",
        answer:
          "The Hub uses deterministic proposal order as its onchain tie-breaker. The interface shows proposals in the same order used by the contract so the result is predictable and does not rely on a hidden offchain decision.",
      },
      {
        question: "Can I vote twice or vote for my own proposal?",
        answer:
          "No. A wallet may cast only one vote in the relevant binary proposal or Slate Round, and the contracts reject prohibited self-voting paths. The UI prevents obvious invalid actions, but contract checks remain the source of truth.",
      },
      {
        question: "Why is there a 10,000 USDC vote cap?",
        answer:
          "Every V3 binary vote and Slate Round vote is capped at 10,000 USDC per wallet. This is a protocol-wide guard against a single wallet overwhelming a Community decision with an outsized stake.",
      },
      {
        question: "What happens when a binary proposal settles YES?",
        answer:
          "For an Admin proposal, the settled voting stake enters the Community execution treasury and the winner starts a Community execution plan. For an approved Member proposal, settlement follows the configured local distribution, including the Community execution balance, validator-reward accounting, and the BERT protocol reserve path. The exact split is visible in the deployed Community settings.",
      },
      {
        question: "What happens when NO wins a binary proposal?",
        answer:
          "NO-side voters can claim their own stake after onchain settlement, minus the configured NO-side fee. The claim is per wallet and can only be completed once. YES-side stake follows the rejection settlement path rather than becoming a refundable NO claim.",
      },
      {
        question: "Can a Member recover the proposal bond?",
        answer:
          "Yes, when the proposal reaches the contract state that returns its bond. A validated and properly settled Member proposal can make the bond refundable to its author; a rejected or expired proposal can instead be slashed under the Community’s bond rules. The proposal details page displays the live bond state and only enables a claim when the contract allows it.",
      },
    ],
  },
  {
    id: "community-treasury",
    title: "V3 Treasury, Validators & Safety",
    items: [
      {
        question: "Why are Community treasury balances shown separately?",
        answer:
          "V3 deliberately separates locked membership funds, execution treasury, validator rewards, and refundable user claims. Showing them as one number would be misleading because each balance has a different owner, withdrawal rule, and settlement path.",
      },
      {
        question: "How do Validators earn rewards?",
        answer:
          "Only validated Member proposal flows allocate validator rewards. Rewards accrue inside the configured reward epoch. After the epoch has ended in active Community time, anyone can finalize it; an eligible Validator then claims their own calculated share. Admin-originated proposals do not allocate validator rewards because no validation work occurred.",
      },
      {
        question: "What makes a Validator eligible for an epoch reward?",
        answer:
          "The Validator must meet the Community’s validator activity threshold, expressed as participation in the epoch’s available validation cases. The reward page shows the wallet’s completed cases, available cases, epoch pool, finalization state, and whether a claim is currently permitted.",
      },
      {
        question: "Do unclaimed Validator rewards disappear after the next epoch?",
        answer:
          "No. Finalized epoch claims remain independently claimable. A Validator can claim a prior eligible epoch later, and each epoch can be claimed only once by that Validator. The interface retains a recent epoch window for clarity while the onchain accounting remains the authority.",
      },
      {
        question: "How are execution withdrawals protected?",
        answer:
          "An Admin first creates a withdrawal request with recipient, amount, reason, and metadata URI. The amount is reserved, not transferred. The request needs the configured number of Admin approvals, and only a request that has reached quorum can execute the USDC transfer. With quorum 2, one Admin cannot withdraw alone.",
      },
      {
        question: "Can an Admin cancel a withdrawal request?",
        answer:
          "A cancellation is itself a quorum-protected governance action. This prevents one Admin from unilaterally cancelling another Admin’s legitimate request, while still allowing the Community to release reserved funds once the required approvals agree. The request card and Admin action queue show the same cancellation lifecycle.",
      },
      {
        question: "What does pausing a Community do?",
        answer:
          "Pause freezes the Community clock and blocks governance-sensitive operations such as proposal creation, voting, validation progression, treasury withdrawal creation, and settlement paths that require active Community time. When resumed, only the remaining active time continues to run. Already-earned user claims remain available when the contract permits them.",
      },
      {
        question: "Why are some Admin actions shown as requests?",
        answer:
          "Roster changes, pause or resume, archive, and withdrawal cancellation are protected by the same Admin quorum mechanism as treasury safety. The first requester provides one approval, other active Admins approve, and the action executes only after quorum. Unapproved requests expire after the configured active-time lifetime.",
      },
      {
        question: "Can a Community be archived at any time?",
        answer:
          "No. Archive is a quorum-protected action and the Hub checks that the Community is clean enough to close without trapping active governance obligations. Participants should settle relevant proposals, rounds, claims, and membership paths before an archive is attempted.",
      },
    ],
  },
  {
    id: "community-timing",
    title: "V3 Timing & Demo Environments",
    items: [
      {
        question: "Why does a V3 timer use active Community time?",
        answer:
          "V3 has a Community clock that stops while the Community is paused. A binary vote, validation window, Slate Round, exit cooldown, request expiry, or reward epoch therefore does not silently expire during an incident pause. After resume, the remaining active time continues.",
      },
      {
        question: "Why do localhost Communities use minutes?",
        answer:
          "Local test Communities intentionally use minute-scale configuration for exit, validation, voting, and reward paths. The Community milestone review has a deliberate one-day onchain minimum, so local E2E uses Hardhat time advancement rather than weakening that protection. The same contracts enforce every setting.",
      },
      {
        question: "How should a hackathon judge test a multi-day flow?",
        answer:
          "Use a clearly labelled demo Community configured with accelerated minute-scale windows, then advance local Hardhat time for the one-day milestone-review minimum. The same onchain logic, roles, treasury rules, support snapshots, and settlement checks run; only the local chain clock is advanced.",
      },
      {
        question: "Can the frontend change a live Community deadline?",
        answer:
          "No. The frontend only reads and displays the configured onchain timing. It cannot shorten voting, force settlement, or bypass a Community pause. This is intentional: the contract clock is the source of truth.",
      },
    ],
  },
  {
    id: "arc",
    title: "Arc & Local Testing",
    items: [
      {
        question: "What do I pay gas with on Arc testnet?",
        answer:
          "Gas is paid in the network’s native gas asset, while protocol value transfer uses USDC. Stablecoin settlement and gas payment are separate concerns.",
      },
      {
        question: "Can I test locally before using Arc testnet?",
        answer:
          "Yes, and that is the recommended path. Start with localhost, where the deploy script provisions MockUSDC and wires the full proxy stack, then repeat the same smoke flow on Arc testnet.",
      },
      {
        question: "How do I get test USDC for local testing?",
        answer:
          "On localhost, mint MockUSDC to your testing wallet through the local deployment. On Arc testnet, use the testnet USDC flow available in your environment and verify wallet balances before sending protocol transactions.",
      },
      {
        question: "Where is the user guide for network setup?",
        answer:
          "Use the developer guide and policy docs for environment setup, wallet preparation, approvals, and the live proposal and voting flow.",
      },
    ],
  },
  {
    id: "operations",
    title: "Operations",
    items: [
      {
        question: "Why can idea creation fail even if MetaMask opens?",
        answer:
          "A signature prompt only confirms the wallet can sign. The call can still revert if USDC balance is too low, allowance is missing, FundingPool wiring is wrong, or required roles were not granted during deployment.",
      },
      {
        question: "Why does the UI warn about incomplete wiring?",
        answer:
          "The frontend checks that IdeaRegistry.fundingPool() matches the FundingPool address configured in env. If the frontend is running with stale addresses or the deployment was only partially wired, submission is blocked before the transaction is sent.",
      },
      {
        question: "How should upgrades be handled?",
        answer:
          "Treat them as controlled protocol events: review the implementation diff, rehearse on localhost and Arc testnet, verify storage layout safety, execute the upgrade, and confirm post-upgrade wiring before reopening treasury flows.",
      },
      {
        question: "What should operators verify before public testing?",
        answer:
          "Check network alignment, contract addresses, role wiring, pause state, minimum stake values, human verifier configuration, max vote amount, backend signer alignment, and one complete non-admin smoke flow from verification through voting.",
      },
    ],
  },
  {
    id: "security",
    title: "Security",
    items: [
      {
        question: "What are the biggest live risks?",
        answer:
          "The main risk areas are upgrade authority, role misconfiguration, treasury release mistakes, stale env data in the frontend, backend signer misconfiguration, and incorrect handling of USDC’s 6-decimal unit model.",
      },
      {
        question: "Why are pause controls important?",
        answer:
          "Pause controls let operators stop sensitive flows during incidents, partial misconfiguration, or staged rollout. They should be documented and used with clear governance policy.",
      },
      {
        question: "How should admin keys be secured?",
        answer:
          "Use hardware-backed keys or multisig where possible. Separate deployer, operator, upgrade, and trusted-signer responsibilities by environment and keep verification records for privileged transactions.",
      },
      {
        question: "Is fork simulation enough for safety?",
        answer:
          "No. Fork simulation is useful, but it should be combined with tests, review, role audits, storage-layout checks, and staged rollout controls.",
      },
    ],
  },
];

export default function FaqPage() {
  return <SiteFrame route="/faq"><div><FaqExplorer sections={sections} /></div></SiteFrame>;
}
