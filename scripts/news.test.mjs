import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const source = readFileSync(new URL("../src/lib/news.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const exports = {};
new Function("exports", compiled)(exports);
const { newsItems } = exports;

test("V2.4 remains in the news rail without cropping or excessive enlargement", () => {
  const banner = newsItems.find((item) => item.id === "v2-4-transparent-treasury");
  assert(banner);
  assert.equal(banner.image, "/news-v-2-4.png");
  assert.equal(banner.objectFit, "contain");
  assert.equal(banner.maxWidth, 1600);
  assert.equal(banner.href, "https://bertdao-docs.vercel.app/#v2-4-transparent-treasury");
  const png = readFileSync(new URL(`../public${banner.image}`, import.meta.url));
  assert.equal(png.subarray(1, 4).toString(), "PNG");
  assert.equal(banner.aspectRatio, `${png.readUInt32BE(16)} / ${png.readUInt32BE(20)}`);
});

test("news entries keep unique IDs and existing local banner assets", () => {
  assert.equal(new Set(newsItems.map((item) => item.id)).size, newsItems.length);
  for (const item of newsItems) {
    assert(existsSync(new URL(`../public${item.image}`, import.meta.url)), item.image);
  }
  assert(newsItems.some((item) => item.id === "v3-2-community-governance"));
});
