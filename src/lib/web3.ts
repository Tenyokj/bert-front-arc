import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import { createConfig } from "wagmi";
import {
  coinbaseWallet,
  metaMaskWallet,
  okxWallet,
  phantomWallet,
  rabbyWallet,
  rainbowWallet,
  trustWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { defineChain, fallback, http } from "viem";

const defaultChainKey = (process.env.NEXT_PUBLIC_DEFAULT_CHAIN || "arc").toLowerCase();
const hardhatRpcUrl = process.env.NEXT_PUBLIC_HARDHAT_RPC_URL || "http://127.0.0.1:8545";
// Public Arc RPCs can rate-limit or intermittently reject browser requests. Keep
// two independent transports so read-only dApp data does not depend on one host.
const arcRpcUrl = process.env.NEXT_PUBLIC_ARC_RPC_URL || "https://arc-testnet.drpc.org";
const arcFallbackRpcUrl = "https://rpc.blockdaemon.testnet.arc.io";
const arcExplorerUrl = process.env.NEXT_PUBLIC_ARC_EXPLORER_URL || "https://testnet.arcscan.app";
const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
const effectiveWalletConnectProjectId =
  walletConnectProjectId || "missing-walletconnect-project-id";

export const hardhatLocalhost = defineChain({
  id: 31337,
  name: "Hardhat Localhost",
  nativeCurrency: {
    name: "ETH",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: { http: [hardhatRpcUrl] },
    public: { http: [hardhatRpcUrl] },
  },
  blockExplorers: {
    default: {
      name: "Localhost",
      url: hardhatRpcUrl,
    },
  },
  testnet: true,
});

export const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: {
    name: "USDC",
    symbol: "USDC",
    decimals: 18,
  },
  rpcUrls: {
    default: { http: [arcRpcUrl] },
    public: { http: [arcRpcUrl] },
  },
  blockExplorers: {
    default: {
      name: "Arcscan",
      url: arcExplorerUrl,
    },
  },
  testnet: true,
});

export const defaultChain = defaultChainKey === "hardhat" ? hardhatLocalhost : arcTestnet;
/** Both deployments stay available; the environment value only selects the initial chain. */
export const supportedChains = defaultChain.id === hardhatLocalhost.id
  ? [hardhatLocalhost, arcTestnet] as const
  : [arcTestnet, hardhatLocalhost] as const;

const connectors = connectorsForWallets(
  [
    {
      groupName: "Recommended",
      wallets: [
        metaMaskWallet,
        rabbyWallet,
        rainbowWallet,
        coinbaseWallet,
        okxWallet,
        phantomWallet,
        trustWallet,
        walletConnectWallet,
      ],
    },
  ],
  {
    appName: "BERT",
    appDescription: "Programmable USDC-native funding infrastructure on Arc.",
    appUrl: "https://bertdao.vercel.app",
    appIcon: "/bert-logo.png",
    projectId: effectiveWalletConnectProjectId,
  }
);

export const web3Config = createConfig({
  chains: [...supportedChains],
  connectors,
  transports: {
    [hardhatLocalhost.id]: http(hardhatRpcUrl),
    [arcTestnet.id]: fallback([
      http(arcRpcUrl, { retryCount: 1, retryDelay: 250 }),
      http(arcFallbackRpcUrl, { retryCount: 1, retryDelay: 250 }),
    ]),
  },
  ssr: true,
});
