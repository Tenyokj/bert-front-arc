import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";

const [worldFile, geographyFile] = process.argv.slice(2);
if (!worldFile || !geographyFile) throw new Error("Pass downloaded World locator HTML and Natural Earth GeoJSON paths");
const html = readFileSync(worldFile, "utf8");
const flight = [...html.matchAll(/self\.__next_f\.push\((.*?)\)<\/script>/gs)]
  .map((match) => { try { return JSON.parse(match[1])[1] || ""; } catch { return ""; } }).join("");
const record = flight.split("\n").find((line) => /^[\da-f]+:\[/.test(line) && line.includes('"locations":[{"countryInfo"'));
if (!record) throw new Error("Official locator schema changed; do not publish an empty dataset");
const locations = JSON.parse(record.slice(record.indexOf(":") + 1))[3].locations;
const unique = [...new Map(locations.map((location) => [location.id, location])).values()];
const grouped = new Map();
for (const location of unique) {
  const code = location.countryInfo?.code;
  if (!/^[A-Z]{2}$/.test(code) || !location.city) throw new Error("Location is missing country or city");
  const country = grouped.get(code) ?? { code, name: code === "KR" ? "South Korea" : location.countryInfo.name, locations: 0, cities: {} };
  country.locations++;
  country.cities[location.city] = (country.cities[location.city] ?? 0) + 1;
  grouped.set(code, country);
}
const coverage = {
  source: "https://world.org/find-orb", checkedAt: "2026-11-25", scope: "Locations embedded in the public locator page, not guaranteed complete global coverage",
  htmlSha256: createHash("sha256").update(html).digest("hex"), locationCount: unique.length,
  countries: [...grouped.values()].sort((a, b) => a.name.localeCompare(b.name)).map((country) => ({ ...country, cities: Object.entries(country.cities).sort(([a], [b]) => a.localeCompare(b)).map(([name, locations]) => ({ name, locations })) })),
};
const geo = JSON.parse(readFileSync(geographyFile, "utf8"));
const countries = geo.features.filter((feature) => feature.properties.ISO_A2 !== "AQ").map((feature) => {
  const polygons = feature.geometry.type === "Polygon" ? [feature.geometry.coordinates] : feature.geometry.coordinates;
  const path = polygons.flatMap((polygon) => polygon.map((ring) => ring.map(([lon, lat], index) => `${index ? "L" : "M"}${((lon + 180) * 1000 / 360).toFixed(1)},${((85 - lat) * 1000 / 360).toFixed(1)}`).join("") + "Z")).join("");
  const code = feature.properties.ISO_A2_EH;
  return { code: code === "-99" ? feature.properties.ADM0_A3 : code, name: feature.properties.NAME_EN, path };
});
const root = new URL("../src/components/landing/data/", import.meta.url);
mkdirSync(root, { recursive: true });
writeFileSync(new URL("orb-snapshot.json", root), JSON.stringify(coverage, null, 2) + "\n");
writeFileSync(new URL("world-paths.json", root), JSON.stringify({ source: "https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_admin_0_countries.geojson", license: "Natural Earth public domain", countries }) + "\n");
console.log(JSON.stringify({ countries: coverage.countries.length, locations: unique.length, shapes: countries.length }));
