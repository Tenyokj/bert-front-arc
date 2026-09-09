import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const coreRoot = process.env.BERT_CORE_PATH || path.resolve(process.cwd(), "../../bert-core");
const source = path.join(coreRoot, "artifacts/contracts/BERT/V3/community/CommunityHub.sol/CommunityHub.json");
const destination = path.resolve(process.cwd(), "src/abi/v3/CommunityHub.json");

const artifact = JSON.parse(await readFile(source, "utf8"));
await mkdir(path.dirname(destination), { recursive: true });
await writeFile(destination, `${JSON.stringify({ abi: artifact.abi, bytecode: artifact.bytecode }, null, 2)}\n`);

console.log(`Synced CommunityHub artifact from ${source}`);
