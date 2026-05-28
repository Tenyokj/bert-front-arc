import { connectorsForWallets, getDefaultConfig } from "@rainbow-me/rainbowkit";
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
import { defineChain } from "viem";

const arcRpcUrl =
  process.env.NEXT_PUBLIC_ARC_RPC_URL || "https://rpc.testnet.arc.network";
const arcExplorerUrl =
  process.env.NEXT_PUBLIC_ARC_EXPLORER_URL ||
  "https://testnet.arcscan.app";
const walletConnectProjectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "123456";

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

export const defaultChain = arcTestnet;
export const supportedChains = [arcTestnet] as const;

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
    appDescription:
      "Programmable USDC-native funding infrastructure on Arc.",
    appUrl: "https://bertdao.vercel.app",
    appIcon: "/bert-logo.png",
    projectId: walletConnectProjectId,
  }
);

export const web3Config = getDefaultConfig({
  appName: "BERT",
  appDescription:
    "Programmable USDC-native funding infrastructure on Arc.",
  appUrl: "https://bertdao.vercel.app",
  appIcon: "/bert-logo.png",
  projectId: walletConnectProjectId,
  chains: [...supportedChains],
  connectors,
  ssr: true,
});
