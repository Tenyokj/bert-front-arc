# Temporary Winter Theme

Local preview for the 2026 holiday season. This is decorative UI, not a new
protocol feature, promotion, reward campaign or change in verification rules.

- Active from November 27, 2026 until January 11, 2027, 00:00 UTC (exclusive).
  The root component checks expiry on hydration and once per minute in open tabs.
- The same root layer covers landing, informational, demo and dApp routes.
  It does not modify the separately hosted documentation site or Console.
- Snow stays inside 22-60px side strips on desktop and 18px strips on mobile.
  Small evergreen/red-ribbon corner accents and narrow frost stay at the edges.
  The middle of the page is never covered with snowfall.
- Decoration is `aria-hidden` and ignores pointer events. Only the small
  snowflake toggle in the lower-left corner is interactive. It has an accessible
  label, keyboard focus and pressed state. It does not intercept the island
  header; the testnet banner and wallet modal stay above the layer. Transaction
  activity stays on the right.
- Turn effects off/on with that button. The preference uses localStorage key
  `bert:winter-effects:2026`; when storage is blocked, opt-out works in the current
  tab. No cookies, analytics, wallet requests or external assets are involved.
- CSS animates 24 deterministic flakes, reduced to 12 on mobile. Reduced-motion
  preferences hide snowfall entirely. A hidden browser tab pauses snowfall.
  There is no canvas, WebGL, animation-frame loop or new dependency.

## Disable Or Remove

Set `WINTER_THEME.enabled` to `false` in `src/lib/seasonal-theme.ts` to disable
it globally at the next build. Do not extend the dates automatically next year.
For complete removal, remove the `WinterTheme` import/render in
`src/app/layout.tsx`, its component/CSS, the seasonal helper and seasonal tests.
No contract, funding, identity or wallet code needs a change.

## Verification

See the seasonal test and browser smoke scripts for date-boundary, preference,
reduced-motion, edge bounds, route persistence and interaction checks. Test
results and publication status are recorded in `DAPP-REDESIGN.md`; this document
does not claim deployment or signed-wallet acceptance.
