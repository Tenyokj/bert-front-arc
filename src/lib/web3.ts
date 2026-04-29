import { createConfig, fallback, http } from "wagmi";
import { hardhat, sepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";

const hardhatRpcUrl =
  process.env.NEXT_PUBLIC_HARDHAT_RPC_URL || "http://127.0.0.1:8545";
const sepoliaRpcUrl =
  process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || "https://rpc.sepolia.org";
const preferredNetwork = process.env.NEXT_PUBLIC_DEFAULT_CHAIN?.toLowerCase();
const subgraphUrl = process.env.NEXT_PUBLIC_SUBGRAPH_URL?.toLowerCase() ?? "";

function resolveDefaultChainName() {
  if (preferredNetwork === "sepolia" || preferredNetwork === "hardhat") {
    return preferredNetwork;
  }

  // When `.env` contains Sepolia deployments but `NEXT_PUBLIC_DEFAULT_CHAIN`
  // is omitted, defaulting to Hardhat makes every contract read hit localhost
  // and return `0x`. Use the subgraph target as a safe deployment hint.
  if (subgraphUrl.includes("sepolia")) {
    return "sepolia";
  }

  return "hardhat";
}

const resolvedDefaultChain = resolveDefaultChainName();

export const defaultChain =
  resolvedDefaultChain === "sepolia" ? sepolia : hardhat;
export const secondaryChain = defaultChain.id === hardhat.id ? sepolia : hardhat;
export const supportedChains = [defaultChain, secondaryChain] as const;

export const web3Config = createConfig({
  // Reads without explicit `chainId` use the first configured chain.
  // We resolve that default from env hints so Sepolia deployments do not
  // accidentally get queried through a local Hardhat RPC.
  chains: [...supportedChains],
  connectors: [
    injected({ target: "metaMask" }),
    injected(),
  ],
  transports: {
    [hardhat.id]: fallback([
      http(hardhatRpcUrl),
      http("http://127.0.0.1:8545"),
    ]),
    [sepolia.id]: http(sepoliaRpcUrl),
  },
});
