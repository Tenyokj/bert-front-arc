import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const data = JSON.parse(read("src/components/landing/data/orb-snapshot.json"));
const geo = JSON.parse(read("src/components/landing/data/world-paths.json"));

test("Orb snapshot is dated, attributed, deduplicated and internally consistent", () => {
  assert.equal(data.source, "https://world.org/find-orb");
  assert.match(data.checkedAt, /^\d{4}-\d{2}-\d{2}$/);
  assert.match(data.htmlSha256, /^[a-f0-9]{64}$/);
  assert.match(data.scope, /not guaranteed complete/);
  assert.equal(new Set(data.countries.map((country) => country.code)).size, data.countries.length);
  assert.equal(data.countries.reduce((sum, country) => sum + country.locations, 0), data.locationCount);
  for (const country of data.countries) {
    assert.equal(country.cities.reduce((sum, city) => sum + city.locations, 0), country.locations);
    assert(country.locations > 0);
    assert(country.cities.every((city) => city.name && city.locations > 0));
  }
});

test("all highlighted countries have geometry or the explicit Singapore point", () => {
  for (const country of data.countries) assert(country.code === "SG" || geo.countries.some((shape) => shape.code === country.code));
  assert.equal(new Set(geo.countries.map((shape) => shape.code)).size, geo.countries.length);
  for (const shape of geo.countries) {
    assert(shape.path.startsWith("M"));
    assert.doesNotMatch(shape.path, /NaN|Infinity|undefined/);
  }
});

test("map distinguishes locations from devices and missing coverage from zero", () => {
  const source = read("src/components/landing/WorldAvailability.tsx");
  assert.match(source, /Locations are not a count of Orb devices/);
  assert.match(source, /not a complete global coverage dataset/);
  assert.match(source, /That does not mean zero Orbs/);
  assert.match(source, /Demo verification, not World ID/);
  assert.match(source, /onKeyDown/);
  assert.match(source, /Select a country/);
});

test("Console uses a real screenshot, clearly not a live embed", () => {
  const source = read("src/components/landing/LandingMore.tsx");
  assert.match(source, /console-snapshot\.png/);
  assert.match(source, /not a live embed/);
  const png = readFileSync(new URL("../public/landing/console-snapshot.png", import.meta.url));
  assert.equal(png.readUInt32BE(16), 1440);
  assert.equal(png.readUInt32BE(20), 1000);
});

test("stack and UI explainers do not claim partnerships, active World ID or wallet writes", () => {
  const more = read("src/components/landing/LandingMore.tsx");
  assert.match(more, /Technology use is not a partnership or endorsement/);
  assert.match(more, /planned production-verification route/);
  assert.match(more, /V3.2.1 FLOW EXPLAINER \/ NOT LIVE STATE/);
  assert.doesNotMatch(more, /writeContract|sendTransaction|useWalletClient/);
});

test("landing uses new typography and keeps hero free of motion controls", () => {
  const page = read("src/components/landing/LandingPage.tsx");
  assert.match(page, /DM_Sans, Outfit/);
  assert.doesNotMatch(page, /Space_Grotesk|Manrope/);
  const hero = read("src/components/landing/LandingExperience.tsx").split("export function LandingHeroArt()")[1].split("const layers")[0];
  assert.doesNotMatch(hero, /<button|Pause motion/);
  assert.match(hero, /useLandingMotion/);
  const motion = read("src/components/landing/LandingMotion.tsx");
  assert.match(motion, /prefers-reduced-motion/);
  assert.match(motion, /FooterMotionControl/);
});

test("release facts distinguish installed V2.4, immutable generations and net-grant tranches", () => {
  const source = read("src/components/landing/LandingMain.tsx");
  assert.match(source, /Revenue policy activation is separate/);
  assert.match(source, /Existing Communities retain their original deployed contract generation/);
  assert.match(source, /net grant in 20 \/ 40 \/ 40 tranches/);
  assert.match(source, /No completed independent audit or mainnet-readiness claim/);
});
