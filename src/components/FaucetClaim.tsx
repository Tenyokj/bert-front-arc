"use client";

import { useMemo } from "react";
import { formatUnits } from "viem";
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";

import { brtfaucetAbi, contracts } from "@/lib/contracts";

function formatDate(value: bigint | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(Number(value) * 1000));
}

export function FaucetClaim() {
  const { address, isConnected } = useAccount();
  const faucetAddress = contracts.faucet;

  const enabled = Boolean(faucetAddress);

  const { data: claimAmount } = useReadContract({
    abi: brtfaucetAbi,
    address: faucetAddress,
    functionName: "claimAmount",
    query: { enabled },
  });

  const { data: cooldownSec } = useReadContract({
    abi: brtfaucetAbi,
    address: faucetAddress,
    functionName: "cooldown",
    query: { enabled },
  });

  const { data: canClaimData, refetch: refetchCanClaim } = useReadContract({
    abi: brtfaucetAbi,
    address: faucetAddress,
    functionName: "canClaim",
    args: address ? [address] : undefined,
    query: { enabled: enabled && Boolean(address) },
  });

  const { data: isPaused } = useReadContract({
    abi: brtfaucetAbi,
    address: faucetAddress,
    functionName: "isPaused",
    query: { enabled },
  });

  const {
    data: txHash,
    error,
    isPending: isClaiming,
    writeContract,
  } = useWriteContract();
  const sendWrite = writeContract as unknown as (variables: Record<string, unknown>) => void;

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const onClaim = () => {
    if (!faucetAddress) return;
    sendWrite({
      abi: brtfaucetAbi,
      address: faucetAddress,
      functionName: "claim",
    });
  };

  const canClaim = (canClaimData?.[0] as boolean | undefined) ?? false;
  const nextClaimAt = (canClaimData?.[1] as bigint | undefined) ?? null;

  const amountLabel = useMemo(() => {
    const value = (claimAmount as bigint | undefined) ?? 0n;
    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 2,
    }).format(Number(formatUnits(value, 18)));
  }, [claimAmount]);

  const cooldownHours = useMemo(() => {
    const seconds = Number((cooldownSec as bigint | undefined) ?? 86400n);
    return Math.max(Math.round(seconds / 3600), 1);
  }, [cooldownSec]);

  return (
    <article className="rounded-2xl border border-white/10 bg-[#2a2d3b] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Faucet</p>
          <h3 className="mt-1 font-[var(--font-display)] text-2xl text-white">Claim BTK</h3>
          <p className="mt-1 text-sm text-slate-300">
            One claim every {cooldownHours}h. Current amount: {amountLabel} BTK.
          </p>
        </div>
        <button
          type="button"
          onClick={onClaim}
          disabled={
            !isConnected ||
            !faucetAddress ||
            !canClaim ||
            Boolean(isPaused) ||
            isClaiming ||
            isConfirming
          }
          className="rounded-lg bg-[#3b82f6] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isClaiming ? "Awaiting signature..." : isConfirming ? "Confirming..." : "Claim BTK"}
        </button>
      </div>

      {!faucetAddress && (
        <p className="mt-3 text-sm text-amber-100">
          Set <code>NEXT_PUBLIC_FAUCET_ADDRESS</code> in `.env`.
        </p>
      )}
      {!isConnected && (
        <p className="mt-3 text-sm text-amber-100">Connect wallet to use faucet.</p>
      )}
      {isConnected && faucetAddress && !canClaim && !isPaused && (
        <p className="mt-3 text-sm text-slate-300">
          Next claim available: {formatDate(nextClaimAt)}
        </p>
      )}
      {isPaused && (
        <p className="mt-3 text-sm text-amber-100">Faucet is paused by admin.</p>
      )}
      {txHash && (
        <p className="mt-3 break-all text-xs text-emerald-300">Faucet tx: {txHash}</p>
      )}
      {isSuccess && (
        <button
          type="button"
          onClick={() => {
            void refetchCanClaim();
          }}
          className="mt-3 text-sm font-semibold text-cyan-300 hover:text-cyan-200"
        >
          Refresh faucet status
        </button>
      )}
      {error && <p className="mt-3 text-sm text-rose-300">{error.message}</p>}
    </article>
  );
}
