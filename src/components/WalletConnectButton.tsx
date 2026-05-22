"use client";

import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";

import { defaultChain, supportedChains } from "@/lib/web3";

function shortAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function WalletConnectButton() {
  const hydrated = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false
  );
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitchPending } = useSwitchChain();
  const autoSwitchAttemptedRef = useRef<number | null>(null);

  const preferredConnector = useMemo(
    () => {
      return (
        connectors.find((connector) => connector.id === "metamask") ??
        connectors.find((connector) =>
          connector.name.toLowerCase().includes("metamask")
        ) ??
        connectors.find((connector) =>
          connector.name.toLowerCase().includes("injected")
        ) ??
        connectors[0]
      );
    },
    [connectors]
  );

  const isSupported = chain
    ? supportedChains.some((supportedChain) => supportedChain.id === chain.id)
    : false;
  const isOnDefaultChain = chain?.id === defaultChain.id;

  useEffect(() => {
    if (!hydrated || !isConnected || !chain || !switchChain) return;
    if (chain.id === defaultChain.id) {
      autoSwitchAttemptedRef.current = null;
      return;
    }
    if (autoSwitchAttemptedRef.current === chain.id) return;
    autoSwitchAttemptedRef.current = chain.id;
    switchChain({ chainId: defaultChain.id });
  }, [chain, hydrated, isConnected, switchChain]);

  if (!hydrated || !isConnected) {
    return (
      <button
        type="button"
        onClick={() => preferredConnector && connect({ connector: preferredConnector })}
        disabled={!preferredConnector || isPending}
        className="rounded-lg bg-[#3b82f6] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#2f74e6] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Connecting..." : "Connect wallet"}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => disconnect()}
        className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
          !isSupported || !isOnDefaultChain
            ? "border-amber-300/45 bg-amber-300/10 text-amber-100"
            : "border-white/15 bg-white/5 text-slate-100 hover:border-cyan-300/45"
        }`}
        title={chain ? `${chain.name} (${chain.id})` : undefined}
      >
        {!isSupported || !isOnDefaultChain
          ? isSwitchPending
            ? "Switching to Arc..."
            : "Arc required"
          : address
            ? shortAddress(address)
            : "Connected"}
      </button>
    </div>
  );
}
