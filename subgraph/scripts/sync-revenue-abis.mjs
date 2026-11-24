import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const core = process.env.BERT_CORE_PATH ?? path.resolve(root, "../../../bert-core");
for (const name of ["FundingPoolUpgradeable", "ProtocolRevenueTreasury"]) {
  const artifact = JSON.parse(await readFile(path.join(core,
    `artifacts/contracts/BERT/DAO/${name}.sol/${name}.json`), "utf8"));
  if (!Array.isArray(artifact.abi)) throw new Error(`Missing compiled ABI: ${name}`);
  await writeFile(path.join(root, `abis/DAO/${name}.json`), `${JSON.stringify(artifact.abi, null, 2)}\n`);
  console.log(`Synced ABI only: ${name}; no dApp deployment bytecode changed.`);
}
