import { readFile, writeFile } from "node:fs/promises";
import { factorySources, renderManifest } from "./manifest-config.mjs";

const template = await readFile(new URL("../subgraph.template.yaml", import.meta.url), "utf8");
const sources = factorySources(process.env);
const manifest = renderManifest(template, sources);

await writeFile(new URL("../subgraph.yaml", import.meta.url), manifest);
for (const source of sources) console.log(`Configured Factory ${source.address} from block ${source.startBlock}.`);
