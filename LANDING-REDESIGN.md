# Local Landing Redesign

Status: local visual direction for review, November 25, 2026. Not published.

## Isolation

- Worktree: `~/bert/bert-landing-preview`, branch `design/landing-local`.
- Original frontend checkout and production branch are unchanged.
- Shared installed dependencies are a local `node_modules` symlink; no package changes.
- Separate `.next` output; no production environment file or wallet profile copied.
- No changes to dApp routes, contract configuration, wallet actions or activation UI.
- Do not use this design preview to perform the November 26 policy activation.
  The existing production `/pool` remains the operational interface.

## Preview

```bash
cd ~/bert/bert-landing-preview
npm run dev -- --port 3100 --hostname 0.0.0.0
```

Open `http://localhost:3100`. The current development server is already running.
No push, PR, Vercel deployment or public transaction was performed.

## Direction

The owner rejected the first whole-page concept. Work now proceeds block by block.
The owner then authorized continuing the remaining blocks. The local review now
includes the header, two-part hero, unchanged production news, new main content,
World ID access map, technology rail, Console laptop and expanded cropped footer.
This is an implementation for review, not an approved or published final design.

### Typography and continuity revision

The owner liked the structure and requested removing the hero pause button,
giving the logo more height, replacing the entire landing font pair and making
the page background continuous. Current fonts are Outfit (headings, brand and
footer wordmark) and DM Sans (body/navigation), locally served by next/font.
The logo canvas is 1440x900 in the desktop smoke, up from 1440x729; camera fit
leaves additional margin around both logos. The hero has no motion button.
A small page-wide motion setting lives in the footer, with system reduced-motion
preference honored and shared by the hero and CSS animation layer.

The owner rejected the light field and broad transition bands. The current page
uses one dark nav-colored base (#070a18), transparent section backgrounds and
small, low-opacity radial fog accents. Header, hero and news no longer have
separate background treatments. There are no light main sections or tall
transition spacers; cards retain their blue/violet/red distinctions with
dark-theme text contrast.
News component and banner data remain byte-for-byte unchanged.

Copy was checked against core `docs/CURRENT-RELEASE.md`: installed V2.4 versus
separate revenue activation, Community generation V3.2.1 versus immutable history,
Demo verification, audit limitations and net-grant 20/40/40 after the round fee.
A compact release-facts row links to the rollout record and deployments.
This is a documentation-backed copy review, not fresh public-chain verification.

### Current first block

- Fixed testnet warning retained; the homepage specifies Demo verification, not World ID.
  Other routes retain their existing warning text and dimensions.
- Spacious header: actual logo + BERT at left, centered primary navigation,
  Launch app at right; launch remains visible on mobile with a separate menu.
- Full-width, first-screen particle animation, with responsive camera framing,
  pause/reduced motion/fallback, and rendering suspended when out of view.
- Introduction follows below the animation, with primary/demo/explainer/community
  links and four clearly labelled protocol-fact cards. These are not live totals.
- `NewsCarousel.tsx` and `src/lib/news.ts` reused byte-for-byte from HEAD.
  No rewritten news carousel, modified banners, or altered scroll behavior.

### Remaining blocks implemented locally

- Main information with accessible interactive cards/carousel and substantial clear copy.
- World ID availability map: countries, cities and counts from a verified official
  source, with a date and source link. Do not invent totals or treat missing data as
  zero. Orb availability concerns obtaining verification, not browsing the protocol.
  Arc Testnet currently uses Demo verification. Official locator: https://world.org/find-orb.
- Technology carousel: Arc, USDC/Circle, Solidity/EVM, The Graph, Next.js, Three.js.
  Label World ID as planned production verification, not an active testnet identity check.
  Technology use must not imply partnership or endorsement; no Ethereum-mainnet claim.
- Console feature with a readable real Console screenshot in a responsive laptop
  composition, explanatory copy and a direct link. No stretched screenshot.
- Larger footer navigation and a deliberately bottom-cropped BERTDAO wordmark.

The World map currently contains 114 deduplicated locations in 5 countries from
the official locator page checked 2026-11-25. This is explicitly a limited source
snapshot, not a complete global availability dataset or a count of Orb devices.
Unknown countries stay unknown, not zero. Hover/focus/tap and a country selector
show city counts. Zoom is bounded; the full map is visible on mobile initially.
No runtime API key, remote map tiles or location permission is required.

The Console screen is a real public screenshot captured 2026-11-25, not a live
embed. Its imagery must not be presented as current numeric protocol totals.
Hardware is a responsive code-native laptop frame, without a stretched screen.
The Graph logo is from https://storage.thegraph.com/favicons/256x256.png.
Other stack icons are existing local assets or react-icons/Simple Icons.
Country shapes are generated from Natural Earth public-domain 110m admin0 data.

To refresh the sourced assets intentionally (never silently infer empty data):

```bash
curl -fL https://world.org/find-orb -o /tmp/bert-world-orb.html
curl -fL https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson -o /tmp/bert-countries.geojson
node scripts/prepare-landing-map.mjs /tmp/bert-world-orb.html /tmp/bert-countries.geojson
node scripts/capture-console-for-landing.mjs
```

Review the locator schema, scope, source date in the generator and counts before
committing refreshed data. Schema changes fail closed, not as an empty world.
The source HTML SHA-256 is retained in the snapshot for provenance.

### Previous draft (not approved)

Space Grotesk / Manrope typography, midnight-blue hero, electric blue and violet
accents, restrained red details, light editorial content and a dark footer.
The original Three.js BERT/Arc particle morph is retained with responsive framing,
pause, reduced-motion support and a static-logo fallback when WebGL is unavailable.
No wallet connection is needed for any landing interaction.

The page includes native mobile navigation, V2/V3 tabs, a funding explainer,
read-only Console/source/docs links, all existing news banners, FAQs, contribution
entry points and legal/resource links. Shared informational pages, dApp and docs
site will be redesigned only after the owner reviews this direction.

The calculator is explicitly illustrative: pledge-funded V2 grant, 5% success fee,
20% of eligible earned fees earmarked to Treasury. It does not read live state,
suggest the policy is active, sign anything or promise investment returns.

## Checks

Current pass: 105 regression tests, TypeScript and the complete desktop/mobile
browser smoke after all main/footer/map changes. Verified 1440x1000 and widths
768/390/320, map selection/unknown coverage/zoom, journey keyboard navigation,
technology pause/reduced motion, Console image, footer crop, original news rail,
no uncaught browser errors and no wallet-write requests.

```bash
npm test
npm run typecheck
node scripts/landing-preview-smoke.mjs
```

The browser smoke uses a fresh disposable Chromium, without an extension wallet.
It rejects any attempted JSON-RPC wallet write, checks WebGL, interaction/keyboard
behavior, 320/390/768 px layouts and reduced motion, and saves screenshots under
ignored `.e2e-results/landing-preview/`. It is a landing smoke, not a new financial
E2E or audit. Existing optional wallet-SDK development warnings remain outside
this visual change. A full production build has not been rerun for this preview.
