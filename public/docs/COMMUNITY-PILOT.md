# BERT Community Pilot (Arc Testnet)

**Status:** invitation to evaluate a testnet prototype, not a production launch,
audit, grant program, or request for funds. No payment or token reward is
promised for participating.

## Who This Is For

Start with a small community, grants team, or open-source collective that has
actually selected proposals and tracked delivery before. The person we need to
meet is the one who runs that process, not an audience that merely follows
crypto announcements. A good pilot partner can describe a recent decision,
the people involved, where money was held, and how delivery was checked.

The first use case is deliberately narrow: **a community decides which proposal
to support, then reviews whether the agreed work was delivered before later
testnet tranches are released**. BERT V3.1 supports four governance lanes, but
we should demonstrate one lane first, not ask a new user to learn the entire
protocol.

## The Two Invitations

1. **15-minute discovery call, no wallet:** ask how the community made its last
   funding decision. Show a read-only example in
   [BERT Console](https://bertdao-console.vercel.app) only after hearing the
   existing workflow. The call is useful even if BERT is a poor fit.
2. **Guided Arc Testnet pilot, optional:** if the problem is real and the
   organizer wants to try it, use
   [the dApp](https://bertdao.vercel.app) with fresh test wallets and valueless
   test assets. Create a Community, admit a few Members, run one Admin Binary
   proposal, and compare the result with direct reads and the Console. This is
   not a 15-minute end-to-end claim: voting and milestone windows take time.

Do not ask a partner to move real funds, import a valuable wallet, give us
private keys, or rely on Demo PoP as real personhood verification. Provide the
[tester guide](TESTING.md) before any transaction. For a disposable full-flow
test with time travel, use [the local lab](LOCAL-V3.1-E2E.md), not the public
testnet.

### 90-second read-only demo outline

1. State the problem in one sentence: a group needs a visible decision and a
   way to check delivery before later funding is released.
2. Open one existing Community in Console. Point to its proposal and the
   indexed vote record. Say explicitly that Console is a read-only index and
   may lag the chain.
3. Show the execution-plan status if one exists. If none exists, say so; do not
   simulate a completed milestone or invent activity.
4. End with a question about the organizer's last real decision, not a request
   to connect a wallet or sign up.

## Discovery Questions

Ask for a real recent example before showing the product. Do not ask whether
someone *would* use BERT or whether they *like* the idea.

1. What was the last proposal your group accepted or rejected? Who decided?
2. How did you collect votes or approvals, and who was eligible?
3. Where was the budget held, and when did the delivery team receive it?
4. How did members know whether the work was completed?
5. What took the most time or created distrust? What workaround did you use?
6. What would prevent your team from trying the same flow on Arc Testnet?

Record exact quotes or observable facts only with the person's consent. Do not
publish names, private chat logs, wallets tied to identities, or contact
details in a public repository.

## Pilot Script

| Step | Organizer and participant action | Evidence to capture |
| --- | --- | --- |
| 1. Baseline | Describe the previous offchain process | Existing tools, decision delay, failure point |
| 2. Read-only | Find a Community and proposal in Console | Can they explain the status without help? |
| 3. Setup | Create a testnet Community with distinct Admin and Member wallets | Factory/Hub/Treasury addresses and setup friction |
| 4. Decision | Run one Admin Binary proposal and Member vote | Receipt, eligibility, displayed state, time to complete |
| 5. Delivery | Review the execution-plan and supporter-review rules | Which terms are unclear? Which trust concern remains? |
| 6. Follow-up | Return after the voting window, then decide whether to test milestones | Actual return rate and concrete blockers |

Only run step 5's onchain milestone transactions when the appropriate review
window is open. Do not shorten deployed contract timeouts or claim that the
full 20/40/40 lifecycle has passed when it has not.

## Four-Week Learning Loop

| Week | Work | Decision signal |
| --- | --- | --- |
| 1 | Publish the pilot invitation and 4 scoped contributor issues; contact 10 relevant organizers individually | At least 3 replies with a concrete process to discuss |
| 2 | Hold 5 short discovery calls; document the last real decision each team made | At least 2 teams name a problem BERT might solve |
| 3 | Offer 2 guided testnet pilots; observe without silently fixing UI problems for participants | At least 1 team can complete the first decision with evidence |
| 4 | Summarize objections, drop-offs, and reproducible bugs; choose whether to repeat or change segment | A named organizer asks to run another test |

These are learning targets, not user-growth promises. Count qualified
conversations and completed decisions, not impressions, followers, or wallet
connections alone. If fewer than 2 of 5 teams have the problem, change the
target segment or the use case before building another feature.

Keep a private tracker with: organization, public contact channel, date,
permission to follow up, last funding example, blocker, next step. Never
commit personal contact information or interview notes without consent.

## Short Invitation

> Hi, I am building BERT, an open-source testnet tool for community proposal
> decisions and staged delivery. I saw that your team runs [specific program
> or recent proposal]. I am not asking you to migrate funds or promote us. Could
> I ask you for 15 minutes about how your last decision and follow-up worked?
> If there is a fit, I can show a read-only example afterward.

Personalize the bracketed sentence. Send one thoughtful message to a relevant
person, not the same pitch to a large channel. Follow that community's posting
rules and stop if they decline.

To request a guided pilot, write to [bertdaoarc@gmail.com](mailto:bertdaoarc@gmail.com)
with a short description of your community's last proposal decision. The
[Telegram channel](https://t.me/bertdao) carries public updates; it is not the
place to post private interview details.

## Where Findings Go

- Product friction and reproducible bugs: open a focused issue in the affected
  repository, using the evidence format in [TESTING.md](TESTING.md).
- Potentially exploitable vulnerabilities: use the private
  [Core security advisory](https://github.com/Tenyokj/bert-core-arc/security/advisories/new),
  not a public issue.
- Contributor-ready tasks: [STARTER-ISSUES.md](STARTER-ISSUES.md).
