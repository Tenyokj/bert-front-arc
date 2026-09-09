import { readFile, writeFile } from "node:fs/promises";

const factory = process.env.V3_FACTORY_ADDRESS;
const startBlock = process.env.V3_FACTORY_START_BLOCK;

if (!/^0x[a-fA-F0-9]{40}$/.test(factory || "")) {
  throw new Error("Set V3_FACTORY_ADDRESS to the deployed Arc CommunityFactory proxy.");
}

if (!/^\d+$/.test(startBlock || "")) {
  throw new Error("Set V3_FACTORY_START_BLOCK to the Factory deployment block.");
}

const template = await readFile(new URL("../subgraph.template.yaml", import.meta.url), "utf8");
const manifest = template
  .replaceAll("__V3_FACTORY_ADDRESS__", factory)
  .replaceAll("__V3_FACTORY_START_BLOCK__", startBlock);

await writeFile(new URL("../subgraph.yaml", import.meta.url), manifest);
console.log(`Configured V3 manifest for Factory ${factory} from block ${startBlock}.`);
