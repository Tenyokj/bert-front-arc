import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const coreRoot = process.env.BERT_CORE_PATH || path.resolve(process.cwd(), "../../bert-core");
const contracts = [
  { name: "CommunityFactory", directory: "community" },
  { name: "CommunityHub", directory: "community" },
  { name: "CommunityTreasury", directory: "community" },
  { name: "CommunityMembershipModule", directory: "modules" },
  { name: "CommunityProposalModule", directory: "modules" },
  { name: "CommunityVotingModule", directory: "modules" },
  { name: "CommunityMilestoneManager", directory: "modules" },
  { name: "CommunityWinnerSnapshot", directory: "modules" },
];
const destinationRoot = process.env.V3_SUBGRAPH_ROOT
  ? path.resolve(process.cwd(), process.env.V3_SUBGRAPH_ROOT, "abis")
  : path.resolve(process.cwd(), "subgraph-v3/abis");

await mkdir(destinationRoot, { recursive: true });

for (const contract of contracts) {
  const source = path.join(
    coreRoot,
    `artifacts/contracts/BERT/V3/${contract.directory}/${contract.name}.sol/${contract.name}.json`,
  );
  const artifact = JSON.parse(await readFile(source, "utf8"));
  const destination = path.join(destinationRoot, `${contract.name}.json`);
  await writeFile(destination, `${JSON.stringify({ abi: artifact.abi }, null, 2)}\n`);
  console.log(`Synced ${contract.name} ABI from ${source}`);
}
