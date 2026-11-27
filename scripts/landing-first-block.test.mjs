import { readPreRedesign } from "./pre-redesign-baseline.mjs";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("production news implementation and banner data are preserved byte-for-byte", () => {
  for (const path of ["src/components/NewsCarousel.tsx", "src/lib/news.ts"]) {
    const committed = readPreRedesign(path);
    assert.equal(read(path), committed);
  }
});

test("landing uses the production news rail immediately after the hero shell", () => {
  const page = read("src/components/landing/LandingPage.tsx");
  assert.match(page, /import \{ NewsCarousel \} from "@\/components\/NewsCarousel"/);
  assert.match(page, /<main>\s*<div id="updates"[^>]*><NewsCarousel \/><\/div>/);
  assert.doesNotMatch(page, /<LandingUpdates/);
  assert.match(page, /Protocol facts, not live activity totals/);
});

test("testnet warning is still fixed and does not claim World ID verification is active", () => {
  const warning = read("src/components/TestnetBanner.tsx");
  assert.match(warning, /fixed inset-x-0 top-0/);
  assert.match(warning, /Demo verification only, not World ID/);
  assert.match(warning, /usePathname\(\) === "\/"/);
  assert.match(warning, /href="\/testnet-information"/);
});

test("landing has one dark surface, not light section fills or tall transition bands", () => {
  const opening = read("src/components/landing/landing.module.css");
  const main = read("src/components/landing/landing-main.module.css");
  assert.match(opening, /--landing-surface: #070a18/);
  assert.match(opening, /\.landing \.heroShell \{ background: transparent; \}/);
  assert.match(opening, /\.productionNews \{[^}]*background: transparent/);
  assert.match(main, /\.flow \{[^}]*background: transparent/);
  assert.doesNotMatch(main, /\.flow::before|padding-top: (260|390|340)px/);
  assert.match(main, /\.flow \.joinSection \{ background: transparent; color: inherit; \}/);
});
