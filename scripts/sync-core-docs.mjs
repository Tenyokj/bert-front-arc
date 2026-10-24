import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const frontendRoot = fileURLToPath(new URL("../", import.meta.url));
const coreRoot = path.resolve(process.env.BERT_CORE_PATH || path.join(frontendRoot, "../../bert-core"));
const sourceRoot = path.join(coreRoot, "docs");
const destinationRoot = path.join(frontendRoot, "public/docs");
const check = process.argv.includes("--check");
const repository = "https://github.com/Tenyokj/bert-core-arc/blob/arc-usdc-migration/";
let drift = 0;

for (const name of (await readdir(sourceRoot)).filter((entry) => entry.endsWith(".md")).sort()) {
  const source = await readFile(path.join(sourceRoot, name), "utf8");
  // Static downloads cannot resolve ../contracts or ../deployments on the website.
  const content = source.replace(/\]\((\.\.\/[^)\s]+)\)/g, (_, target) => {
    const resolved = path.posix.normalize(path.posix.join("docs", target));
    return `](${repository}${resolved})`;
  });
  const destination = path.join(destinationRoot, name);
  let existing;
  try {
    existing = await readFile(destination, "utf8");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  if (existing === content) continue;
  drift += 1;
  if (check) {
    console.error(`Out of date: public/docs/${name}`);
  } else {
    await mkdir(destinationRoot, { recursive: true });
    await writeFile(destination, content);
    console.log(`Synced public/docs/${name}`);
  }
}

if (check && drift) process.exitCode = 1;
else console.log(check ? "Core documentation mirror is current." : `Updated ${drift} document(s).`);
