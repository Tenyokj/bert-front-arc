import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";

// Public source at the pre-redesign news-banner commit; works in shallow CI clones.
const snapshot = JSON.parse(gunzipSync(readFileSync(new URL("./fixtures/pre-redesign.json.gz", import.meta.url))));
export const preRedesignFiles = Object.keys(snapshot.sources);
export function readPreRedesign(path) {
  assert(Object.hasOwn(snapshot.sources, path), `Missing pre-redesign fixture: ${path}`);
  return snapshot.sources[path];
}
