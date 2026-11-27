"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PoolAttractor } from "./dapp/PoolAttractor";
import styles from "./dapp/pool-hero.module.css";
import { formatUnits, parseUnits } from "viem";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { useProtocolReceipt as useWaitForTransactionReceipt } from "@/hooks/useProtocolReceipt";

import { contracts, fundingPoolAbi, usdcAbi } from "@/lib/contracts";
import { USDC_DECIMALS } from "@/lib/dapp-onchain";

function prettyTxError(message?: string) {
  if (!message) return "";
  if (message.includes("User rejected") || message.includes("rejected the request")) {
    return "Transaction was cancelled in wallet.";
  }
  if (message.includes("EnforcedPause")) {
    return "FundingPool is paused. Deposits are temporarily disabled.";
  }
  if (message.includes("rate limited") || message.includes("request limit reached")) {
    return "Arc RPC is rate limiting requests right now. Wait a few seconds and retry the action.";
  }
  if (message.includes("NetworkError when attempting to fetch resource")) {
    return "RPC connection failed. Check active network and RPC URL.";
  }
  if (message.includes("Internal error")) {
    return "Transaction reverted by contract rules (check pool pause status and permissions).";
  }
  return message.split("Contract Call:")[0].trim() || "Transaction failed.";
}

export function FundingPoolHero() {
  const { address, isConnected } = useAccount();
  const [amount, setAmount] = useState("");
  const [allowanceOwner, setAllowanceOwner] = useState<string | null>(null);
  const [balanceOwner, setBalanceOwner] = useState<string | null>(null);

  const fundingPool = contracts.fundingPool;
  const token = contracts.usdc;
  const hasContracts = Boolean(fundingPool && token);

  const { data: totalPoolBalance, refetch: refetchTotalPoolBalance } = useReadContract({
    address: fundingPool,
    abi: fundingPoolAbi,
    functionName: "totalPoolBalance",
    query: { enabled: Boolean(fundingPool) },
  });

  const { data: distributionCount } = useReadContract({
    address: fundingPool,
    abi: fundingPoolAbi,
    functionName: "getDistributionCount",
    query: { enabled: Boolean(fundingPool) },
  });

  const { data: donorBalance, refetch: refetchDonorBalance } = useReadContract({
    address: fundingPool,
    abi: fundingPoolAbi,
    functionName: "donorBalances",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(fundingPool && address) },
  });
  const { data: poolPaused } = useReadContract({
    address: fundingPool,
    abi: fundingPoolAbi,
    functionName: "isPaused",
    query: { enabled: Boolean(fundingPool) },
  });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: token,
    abi: usdcAbi,
    functionName: "allowance",
    args: address && fundingPool ? [address, fundingPool] : undefined,
    query: { enabled: Boolean(token && fundingPool && address) },
  });

  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: token,
    abi: usdcAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(token && address) },
  });
  const allowanceValue = allowance as bigint | undefined;
  const balanceValue = balance as bigint | undefined;
  const poolPausedValue = poolPaused as boolean | undefined;
  const normalizedAddress = address?.toLowerCase() ?? null;

  const { writeContract: writeApprove, data: approveHash, isPending: isApprovePending, error: approveError } =
    useWriteContract();
  const sendApprove = writeApprove as unknown as (variables: Record<string, unknown>) => void;
  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({
    hash: approveHash,
  });
  const { writeContract: writeDeposit, data: depositHash, isPending: isDepositPending, error: depositError } =
    useWriteContract();
  const sendDeposit = writeDeposit as unknown as (variables: Record<string, unknown>) => void;
  const { isLoading: isDepositConfirming, isSuccess: isDepositSuccess } = useWaitForTransactionReceipt({
    hash: depositHash,
  });

  useEffect(() => {
    if (!isApproveSuccess) return;
    void refetchAllowance();
  }, [isApproveSuccess, refetchAllowance]);

  useEffect(() => {
    if (!isDepositSuccess) return;
    void Promise.all([
      refetchAllowance(),
      refetchBalance(),
      refetchDonorBalance(),
      refetchTotalPoolBalance(),
    ]);
  }, [isDepositSuccess, refetchAllowance, refetchBalance, refetchDonorBalance, refetchTotalPoolBalance]);

  useEffect(() => {
    setAllowanceOwner(null);
    setBalanceOwner(null);
    if (!normalizedAddress) {
      setAmount("");
      return;
    }

    void Promise.all([refetchAllowance(), refetchBalance(), refetchDonorBalance()]);
  }, [normalizedAddress, refetchAllowance, refetchBalance, refetchDonorBalance]);

  useEffect(() => {
    if (!normalizedAddress || allowanceValue === undefined) return;
    setAllowanceOwner(normalizedAddress);
  }, [normalizedAddress, allowanceValue]);

  useEffect(() => {
    if (!normalizedAddress || balanceValue === undefined) return;
    setBalanceOwner(normalizedAddress);
  }, [normalizedAddress, balanceValue]);

  const parsedAmount = useMemo(() => {
    try {
      return amount.trim() ? parseUnits(amount.trim(), USDC_DECIMALS) : 0n;
    } catch {
      return -1n;
    }
  }, [amount]);

  const allowanceReady = !normalizedAddress || allowanceOwner === normalizedAddress;
  const balanceReady = !normalizedAddress || balanceOwner === normalizedAddress;
  const effectiveAllowance = allowanceReady ? allowanceValue : undefined;
  const effectiveBalance = balanceReady ? balanceValue : undefined;
  const needApprove = (effectiveAllowance ?? 0n) < (parsedAmount > 0n ? parsedAmount : 0n);
  const invalidAmount = parsedAmount <= 0n;
  const insufficientBalance = effectiveBalance !== undefined && parsedAmount > effectiveBalance;
  const accountDataReady = !isConnected || (!normalizedAddress ? true : allowanceReady && balanceReady);
  const actionDisabled =
    !hasContracts ||
    !isConnected ||
    !accountDataReady ||
    invalidAmount ||
    insufficientBalance ||
    isApprovePending ||
    isApproveConfirming ||
    isDepositPending ||
    isDepositConfirming ||
    Boolean(poolPausedValue);

  const formatUsdc = (value?: bigint) => {
    if (value === undefined) return "Unavailable";
    const asNumber = Number(formatUnits(value, USDC_DECIMALS));
    if (!Number.isFinite(asNumber)) return formatUnits(value, USDC_DECIMALS);
    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: asNumber >= 1000 ? 0 : 4,
    }).format(asNumber);
  };


  return (
    <section className={styles.poolHero}>
      <div className={styles.visual}><PoolAttractor /></div>

      <div className={styles.content}>
        <p className="text-xs uppercase tracking-[0.28em] text-slate-100">Funding Pool</p>
        <h1 className="mt-4 break-words font-[var(--font-display)] text-4xl leading-none text-white drop-shadow-[0_0_24px_rgba(56,189,248,0.42)] sm:text-5xl md:text-7xl lg:text-8xl">
          {totalPoolBalance === undefined ? "Balance unavailable" : `${formatUsdc(totalPoolBalance as bigint)} USDC`}
        </h1>
        <p className="mt-4 max-w-2xl text-sm text-slate-100/90 sm:text-base md:text-lg">
          Recorded custody, not a free-spending balance. The Pool holds pledges, bonds, grant obligations and protocol reserve. V2.4 revenue accounting is shown separately below.
        </p>
        <p className="mt-2 text-xs text-slate-200/90 sm:text-sm">
          Distribution records: {distributionCount === undefined ? "Unavailable" : String(distributionCount)} | My donor ledger:{" "}
          {formatUsdc(donorBalance as bigint | undefined)} USDC
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2 text-xs text-slate-200">
          <span className="rounded-full border border-white/15 bg-black/20 px-3 py-1">For contributors: add protocol reserve capital</span>
          <span className="rounded-full border border-white/15 bg-black/20 px-3 py-1">For builders: grants come from winning pledges</span>
        </div>
        <p id="pool-contribution-note" className="mt-5 text-xs leading-relaxed text-slate-300">Voluntary contributions create no investor shares or APY. Approval grants a token allowance; contribution is a separate transaction.</p>
        <label htmlFor="pool-contribution-amount" className="mt-5 text-xs font-semibold text-slate-200">Contribution amount (USDC)</label>
        <div className="mt-2 flex w-full max-w-lg flex-col items-stretch gap-2 sm:flex-row sm:items-center">
          <input
            id="pool-contribution-amount"
            aria-describedby="pool-contribution-note"
            inputMode="decimal"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="How much USDC do you want to contribute?"
            className="min-w-0 flex-1 rounded-lg border border-white/20 bg-black/30 px-3 py-3 text-sm text-white outline-none focus:border-cyan-300"
          />
          {needApprove ? (
            <button
              type="button"
              disabled={actionDisabled}
              onClick={() => {
                if (!token || !fundingPool || parsedAmount <= 0n) return;
                sendApprove({
                  address: token,
                  abi: usdcAbi,
                  functionName: "approve",
                  args: [fundingPool, parsedAmount],
                  gas: 200_000n,
                });
              }}
              className="rounded-lg bg-cyan-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isApprovePending ? "Sign..." : isApproveConfirming ? "Approving..." : "Approve USDC"}
            </button>
          ) : (
            <button
              type="button"
              disabled={actionDisabled}
              onClick={() => {
                if (!fundingPool || parsedAmount <= 0n) return;
                sendDeposit({
                  address: fundingPool,
                  abi: fundingPoolAbi,
                  functionName: "deposit",
                  args: [parsedAmount],
                  gas: 300_000n,
                });
              }}
              className="rounded-lg bg-cyan-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isDepositPending ? "Sign..." : isDepositConfirming ? "Depositing..." : "Contribute to treasury"}
            </button>
          )}
        </div>
        {insufficientBalance && <p className="mt-2 text-xs text-rose-300">Insufficient USDC balance.</p>}
        {poolPausedValue && <p className="mt-2 text-xs text-amber-200">FundingPool is paused by admin.</p>}
        {!hasContracts && (
          <p className="mt-2 text-xs text-amber-200">Treasury contracts are not configured in this environment yet.</p>
        )}
        {approveError?.message && <p className="mt-2 text-xs text-rose-300">{prettyTxError(approveError.message)}</p>}
        {depositError?.message && <p className="mt-2 text-xs text-rose-300">{prettyTxError(depositError.message)}</p>}
        <div className="mt-6 flex w-full max-w-lg flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={() => {
              const section = document.getElementById("pool-stats");
              section?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className="rounded-lg bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-50"
          >
            Understand treasury status
          </button>
          <Link
            href="/rounds"
            className="rounded-lg border border-white/35 bg-black/15 px-5 py-3 text-sm font-semibold text-white transition-colors hover:border-cyan-300/70"
          >
            Explore funding rounds
          </Link>
        </div>
      </div>
    </section>
  );
}
