# Information Pages: Local Design Review

Scope: the same isolated `design/landing-local` worktree as the landing preview.
Nothing in this document implies publication, deployment or financial acceptance.

## Routes

- `/how-it-works`
- `/protocol-stats`
- `/faq`
- `/developer-guide`
- `/governance-stack`
- `/on-chain-votes`
- `/treasury-policies`
- `/policy-docs`
- `/testnet-information`
- `/security-roadmap`
- `/bug-bounty`
- `/privacy-notice`
- `/terms-of-use`

All 13 use `SiteFrame`: the landing's actual header, footer, Outfit/DM Sans,
dark atmosphere, reduced-motion context, a guide directory and copy-page-link.
Hash links in shared navigation resolve back to the homepage from other routes.
Long guides keep their existing content and anchors, with responsive document
navigation, readable code blocks and dark cards. Legal pages retain their exact
main markup, text and dates; only the surrounding shell and scoped styling change.
They do not receive related-reading marketing cards.

FAQ keeps the existing answer collection in a new searchable/category browser,
with labelled controls, expandable answers, counts and an explicit empty state.
How It Works adds the interactive V2/V3 layer explainer. Metrics retain the
original contract reads and indexed fallback, with a manual refresh, source/scope
labels and no fake zero when round data is unavailable. Reads are independent,
not an atomic block snapshot. Community count is active-Factory scoped.

Obsolete V2.4 candidate language in How It Works/FAQ and incomplete fee wording
were corrected against core `docs/CURRENT-RELEASE.md`; no new chain verification
is implied. Revenue activation remains separate from deployment.

## Boundaries

At the informational-pages-only stage (25 November), there were no changes to
`(dapp)`, `/demo`, wallet/contract configuration, shared legacy
`SiteFooter`, contract source, Graph configuration or production environment.
The isolated preview has no copied production `.env`. Metrics/policy values
therefore correctly report missing configuration or unavailable reads. Deployed
environments continue using their configured real reads, not local mock numbers.
The external documentation website is a separate repository and is not changed.

On 26 November the owner separately authorized the dApp redesign. Its shared
shell now also styles Demo screens, without changing their fixtures or actions.
See `DAPP-REDESIGN.md` for that stage and its separate verification boundaries.

## Verification

`npm test` includes `site-pages.test.mjs`, guarding route coverage, exact legal
content, unchanged wallet/config/demo fixtures and unknown metric handling.

`node scripts/site-pages-smoke.mjs` checks all 13 routes at 1440/768/390/320px,
shared chrome, fonts, local anchors, FAQ search/empty state/answers, directory,
clipboard, metrics refresh and the layer tabs. It blocks RPC for deterministic
unavailable-data checks and records any wallet-write attempts. This is UI QA,
not public-chain verification or a full financial E2E run.

Screenshots: `.e2e-results/site-pages/`. Preview: `http://localhost:3100`.

Latest verified pass (25 November 2026): all 111 regression tests, TypeScript,
diff checks and the final 13-route browser run passed. Representative desktop
and mobile screenshots were visually inspected. This remains uncommitted,
unpublished local work.

The separate final landing regression also passed. One earlier concurrent dev
run flagged a RainbowKit-provider hydration mismatch; three fresh standalone
loads and the full isolated rerun did not reproduce it. The wallet provider was
not modified. Keep this as an intermittent dev observation, not a proven fix or
an assertion about production. A production build was not run in this UI pass.
