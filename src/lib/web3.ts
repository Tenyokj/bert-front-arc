import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { defineChain } from "viem";

const arcRpcUrl =
  process.env.NEXT_PUBLIC_ARC_RPC_URL || "https://rpc.testnet.arc.network";

export const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: { http: [arcRpcUrl] },
    public: { http: [arcRpcUrl] },
  },
  blockExplorers: {
    default: {
      name: "Arc Explorer",
      url:
        process.env.NEXT_PUBLIC_ARC_EXPLORER_URL ||
        "https://explorer.testnet.arc.network",
    },
  },
  testnet: true,
});

export const defaultChain = arcTestnet;
export const supportedChains = [arcTestnet] as const;

export const web3Config = createConfig({
  chains: [...supportedChains],
  connectors: [
    injected({ target: "metaMask" }),
    injected(),
  ],
  transports: {
    [arcTestnet.id]: http(arcRpcUrl),
  },
});
