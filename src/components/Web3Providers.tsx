"use client";

import "@rainbow-me/rainbowkit/styles.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { darkTheme, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { useEffect, useRef, useState } from "react";
import { WagmiProvider, useAccount, useSwitchChain } from "wagmi";

import { defaultChain, web3Config } from "@/lib/web3";

function AutoSwitchDefaultChain() {
  const { chainId, isConnected } = useAccount();
  const { switchChain } = useSwitchChain();
  const attemptedRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isConnected || !chainId || chainId === defaultChain.id) {
      attemptedRef.current = null;
      return;
    }

    if (attemptedRef.current === chainId) return;
    attemptedRef.current = chainId;

    switchChain({ chainId: defaultChain.id });
  }, [chainId, isConnected, switchChain]);

  return null;
}

export function Web3Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={web3Config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          initialChain={defaultChain}
          modalSize="compact"
          theme={darkTheme({
            accentColor: "#3b82f6",
            accentColorForeground: "#ffffff",
            borderRadius: "medium",
            fontStack: "system",
            overlayBlur: "small",
          })}
        >
          <AutoSwitchDefaultChain />
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
