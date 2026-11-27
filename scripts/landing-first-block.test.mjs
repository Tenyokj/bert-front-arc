import { readPreRedesign } from "./pre-redesign-baseline.mjs";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("production news implementation and previous banner data are preserved byte-for-byte", () => {
  for (const path of ["src/components/NewsCarousel.tsx", "src/lib/news.ts"]) {
    const committed = readPreRedesign(path);
    const current = read(path);
    const withoutNewBanner = path === "src/lib/news.ts"
      ? current.replace(/  \{\n    id: "frontend-redesign",[\s\S]*?\n  \},\n/, "")
      : current;
    assert.equal(withoutNewBanner, committed);
  }
});

test("redesign banner leads the rail, links to its release and fits without cropping", () => {
  const source = read("src/lib/news.ts");
  const first = source.match(/export const newsItems: NewsItem\[\] = \[\s*\{([\s\S]*?)\n  \},/)[1];
  assert.match(first, /id: "frontend-redesign"/);
  assert.match(first, /image: "\/news-frontend-redesign\.png"/);
  assert.match(first, /releases\/tag\/frontend-redesign-2026-11-27/);
  assert.match(first, /objectFit: "contain"/);
  assert.match(first, /aspectRatio: "16 \/ 6"/);
  assert.match(first, /maxWidth: 1600/);
  assert.match(first, /illustrative, not live protocol metrics/);
  const png = readFileSync(new URL("../public/news-frontend-redesign.png", import.meta.url));
  assert.equal(png.subarray(1, 4).toString(), "PNG");
  assert.equal(png.readUInt32BE(16), 1672);
  assert.equal(png.readUInt32BE(20), 941);
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
