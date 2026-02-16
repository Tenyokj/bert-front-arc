"use client";

import { useMemo, useSyncExternalStore } from "react";
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { hardhat, sepolia } from "wagmi/chains";

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

  const isSupported = chain?.id === hardhat.id || chain?.id === sepolia.id;

  return (
    <div className="flex items-center gap-2">
      {!isSupported && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => switchChain({ chainId: hardhat.id })}
            disabled={isSwitchPending}
            className="rounded-lg border border-amber-300/45 bg-amber-300/10 px-3 py-2 text-xs font-semibold text-amber-100 transition-colors hover:border-amber-300/70 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSwitchPending ? "Switching..." : "Switch to Hardhat"}
          </button>
          <button
            type="button"
            onClick={() => switchChain({ chainId: sepolia.id })}
            disabled={isSwitchPending}
            className="rounded-lg border border-amber-300/45 bg-amber-300/10 px-3 py-2 text-xs font-semibold text-amber-100 transition-colors hover:border-amber-300/70 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSwitchPending ? "Switching..." : "Switch to Sepolia"}
          </button>
        </div>
      )}
      <button
        type="button"
        onClick={() => disconnect()}
        className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-100 transition-colors hover:border-cyan-300/45"
      >
        {address ? shortAddress(address) : "Connected"}
      </button>
    </div>
  );
}
