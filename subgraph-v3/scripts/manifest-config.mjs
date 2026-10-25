export const originalFactory = { address: "0xe16Cd61a21feA97393e6eEE3A7F7A26828021dD0", startBlock: "66809847" };

export const previousFactory = { address: "0xf793786BCecfbfE35a22E36180032b32BD5208Ba", startBlock: "68888068" };
const retainedFactories = [originalFactory, previousFactory];

/** Keep both historical modular generations when adding a release Factory. */
export function factorySources(env) {
  const configured = env.V3_FACTORY_SOURCES
    ? JSON.parse(env.V3_FACTORY_SOURCES)
    : [{ address: env.V3_FACTORY_ADDRESS, startBlock: env.V3_FACTORY_START_BLOCK }];
  if (!Array.isArray(configured) || !configured.length || configured.length > 16) {
    throw new Error("V3_FACTORY_SOURCES must be a non-empty JSON array (maximum 16 Factories).");
  }
  const sources = configured.map((item) => {
    if (!item || !/^0x[a-fA-F0-9]{40}$/.test(item.address || "") || /^0x0{40}$/i.test(item.address)) {
      throw new Error("Every source needs a non-zero deployed Factory address.");
    }
    if ((typeof item.startBlock !== "string" && typeof item.startBlock !== "number")
      || (typeof item.startBlock === "number" && !Number.isSafeInteger(item.startBlock))
      || !/^\d+$/.test(String(item.startBlock))) {
      throw new Error("Every source needs its actual Factory deployment startBlock.");
    }
    return { address: item.address, startBlock: String(item.startBlock) };
  });
  const seen = new Set();
  for (const item of sources) {
    const address = item.address.toLowerCase();
    if (seen.has(address)) throw new Error(`Duplicate Factory: ${item.address}`);
    seen.add(address);
    const historical = retainedFactories.find((entry) => entry.address.toLowerCase() === address);
    if (historical && item.startBlock !== historical.startBlock) {
      throw new Error(`Historical Factory ${historical.address} must retain deployment block ${historical.startBlock}.`);
    }
  }
  sources.unshift(...retainedFactories.filter((item) => !seen.has(item.address.toLowerCase())));
  return sources;
}

export function renderManifest(template, sources) {
  const marker = "\ntemplates:";
  const split = template.indexOf(marker);
  const start = template.indexOf("  - kind: ethereum\n");
  if (split < 0 || start < 0 || start > split) throw new Error("Unexpected Factory manifest template.");
  const sourceTemplate = template.slice(start, split);
  const blocks = sources.map((source, index) => sourceTemplate
    .replace("name: CommunityFactory\n", `name: ${index === 0 ? "CommunityFactory" : `CommunityFactory_${index + 1}`}\n`)
    .replaceAll("__V3_FACTORY_ADDRESS__", source.address)
    .replaceAll("__V3_FACTORY_START_BLOCK__", source.startBlock));
  return template.slice(0, start) + blocks.join("\n") + template.slice(split);
}
