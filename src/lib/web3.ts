import { createConfig, fallback, http } from "wagmi";
import { hardhat, sepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";

const hardhatRpcUrl =
  process.env.NEXT_PUBLIC_HARDHAT_RPC_URL || "http://127.0.0.1:8545";
const sepoliaRpcUrl =
  process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || "https://rpc.sepolia.org";

export const web3Config = createConfig({
  // Sepolia first: usePublicClient() without explicit chain reads from the first configured chain.
  chains: [sepolia, hardhat],
  connectors: [
    // Force MetaMask first to avoid provider conflicts with other injected wallets.
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
