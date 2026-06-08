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

const defaultChainKey = (process.env.NEXT_PUBLIC_DEFAULT_CHAIN || "arc").toLowerCase();
const hardhatRpcUrl = process.env.NEXT_PUBLIC_HARDHAT_RPC_URL || "http://127.0.0.1:8545";
const arcRpcUrl = process.env.NEXT_PUBLIC_ARC_RPC_URL || "https://rpc.testnet.arc.network";
const arcExplorerUrl = process.env.NEXT_PUBLIC_ARC_EXPLORER_URL || "https://testnet.arcscan.app";
const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "123456";

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
export const supportedChains = [defaultChain] as const;

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
    projectId: walletConnectProjectId,
  }
);

export const web3Config = getDefaultConfig({
  appName: "BERT",
  appDescription: "Programmable USDC-native funding infrastructure on Arc.",
  appUrl: "https://bertdao.vercel.app",
  appIcon: "/bert-logo.png",
  projectId: walletConnectProjectId,
  chains: [...supportedChains],
  connectors,
  ssr: true,
});
