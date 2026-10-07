import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const coreRoot = process.env.BERT_CORE_PATH || path.resolve(process.cwd(), "../../bert-core");
const contracts = [
  "FundingPoolUpgradeable",
  "GrantManagerUpgradeable",
  "IdeaRegistryUpgradeable",
  "VotingSystemUpgradeable",
];

for (const contract of contracts) {
  const source = path.join(
    coreRoot,
    "artifacts/contracts/BERT/DAO",
    `${contract}.sol`,
    `${contract}.json`
  );
  const destination = path.resolve(
    process.cwd(),
    "src/abi/DAO",
    `${contract}.sol`,
    `${contract}.json`
  );

  const artifact = JSON.parse(await readFile(source, "utf8"));
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(
    destination,
    `${JSON.stringify({ abi: artifact.abi, bytecode: artifact.bytecode }, null, 2)}\n`
  );
  console.log(`Synced ${contract} artifact from ${source}`);
}
