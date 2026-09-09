import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const coreRoot = process.env.BERT_CORE_PATH || path.resolve(process.cwd(), "../../bert-core");
const contracts = ["CommunityFactory", "CommunityHub", "CommunityTreasury"];
const destinationRoot = process.env.V3_SUBGRAPH_ROOT
  ? path.resolve(process.cwd(), process.env.V3_SUBGRAPH_ROOT, "abis")
  : path.resolve(process.cwd(), "subgraph-v3/abis");

await mkdir(destinationRoot, { recursive: true });

for (const contract of contracts) {
  const source = path.join(
    coreRoot,
    `artifacts/contracts/BERT/V3/community/${contract}.sol/${contract}.json`,
  );
  const artifact = JSON.parse(await readFile(source, "utf8"));
  const destination = path.join(destinationRoot, `${contract}.json`);
  await writeFile(destination, `${JSON.stringify({ abi: artifact.abi }, null, 2)}\n`);
  console.log(`Synced ${contract} ABI from ${source}`);
}
