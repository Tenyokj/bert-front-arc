"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { FaChevronDown, FaLink, FaShuffle } from "react-icons/fa6";

export function WalletConnectButton() {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        authenticationStatus,
        mounted,
        openAccountModal,
        openChainModal,
        openConnectModal,
      }) => {
        const ready = mounted && authenticationStatus !== "loading";
        const connected =
          ready &&
          Boolean(account) &&
          Boolean(chain) &&
          (!authenticationStatus || authenticationStatus === "authenticated");

        return (
          <div
            aria-hidden={!ready}
            className={!ready ? "pointer-events-none opacity-0" : "opacity-100"}
          >
            {!connected ? (
              <button
                type="button"
                onClick={openConnectModal}
                className="inline-flex min-h-11 items-center rounded-full border border-cyan-300/24 bg-[linear-gradient(135deg,rgba(37,99,235,0.92),rgba(56,189,248,0.82))] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_16px_34px_rgba(37,99,235,0.22)] transition-all hover:-translate-y-[1px] hover:border-cyan-200/34 hover:shadow-[0_18px_38px_rgba(37,99,235,0.28)] sm:px-6 sm:py-3"
              >
                Connect Wallet
              </button>
            ) : chain?.unsupported ? (
              <button
                type="button"
                onClick={openChainModal}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-amber-300/24 bg-amber-400/10 px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-[0.12em] text-amber-50 transition-colors hover:border-amber-300/36 hover:bg-amber-400/14 sm:gap-3 sm:px-4 sm:py-3 sm:text-sm sm:tracking-[0.14em]"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-amber-200/16 bg-slate-950/30 sm:h-9 sm:w-9">
                  <FaShuffle className="text-sm text-amber-200" />
                </span>
                <span className="flex flex-col leading-none">
                  <span className="text-[11px] text-amber-100/75">Wrong network</span>
                  <span className="mt-1">Switch to Arc</span>
                </span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={openChainModal}
                  className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-left transition-colors hover:border-cyan-300/30 hover:bg-white/[0.06] lg:inline-flex"
                >
                  {chain?.hasIcon ? (
                    <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-slate-950/30">
                      {chain.iconUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img alt={chain.name ?? "Chain icon"} src={chain.iconUrl} className="h-5 w-5 rounded-full" />
                      ) : chain.iconBackground ? (
                        <span className="h-3.5 w-3.5 rounded-full" style={{ background: chain.iconBackground }} />
                      ) : (
                        <span className="h-3.5 w-3.5 rounded-full bg-cyan-300" />
                      )}
                    </span>
                  ) : null}
                  <span className="flex flex-col leading-none">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-100/70">Network</span>
                  <span className="mt-1 text-sm font-semibold text-white">{chain?.name ?? "Network"}</span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={openAccountModal}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-left transition-colors hover:border-cyan-300/30 hover:bg-white/[0.06] sm:gap-3"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/12 bg-slate-950/30 text-cyan-100 shadow-[0_0_20px_rgba(34,211,238,0.12)] sm:h-9 sm:w-9">
                    <FaLink className="text-sm" />
                  </span>
                  <span className="hidden min-w-0 flex-col leading-none sm:flex">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-100/70">Connected</span>
                    <span className="mt-1 truncate text-sm font-semibold text-white">{account?.displayName}</span>
                  </span>
                  <FaChevronDown className="text-xs text-slate-400" />
                </button>
              </div>
            )}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
