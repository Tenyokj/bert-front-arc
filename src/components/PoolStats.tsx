"use client";

import { useSyncExternalStore } from "react";
import { formatUnits } from "viem";
import { useAccount, useReadContract } from "wagmi";

import { contracts, fundingPoolAbi } from "@/lib/contracts";
import { USDC_DECIMALS } from "@/lib/dapp-onchain";

function formatUsdc(value?: bigint) {
  if (value === undefined) return "-";
  const asNumber = Number(formatUnits(value, USDC_DECIMALS));
  if (!Number.isFinite(asNumber)) return `${formatUnits(value, USDC_DECIMALS)} USDC`;
  return `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: asNumber >= 1000 ? 0 : 2,
  }).format(asNumber)} USDC`;
}

export function PoolStats() {
  const hydrated = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false
  );
  const { address } = useAccount();
  const fundingPool = contracts.fundingPool;
  const enabled = Boolean(fundingPool);

  const { data: isPaused } = useReadContract({
    abi: fundingPoolAbi,
    address: fundingPool,
    functionName: "isPaused",
    query: { enabled },
  });

  const { data: distributionCount } = useReadContract({
    abi: fundingPoolAbi,
    address: fundingPool,
    functionName: "getDistributionCount",
    query: { enabled },
  });

  const { data: protocolReserve } = useReadContract({
    abi: fundingPoolAbi,
    address: fundingPool,
    functionName: "protocolReserve",
    query: { enabled },
  });

  const { data: totalPoolBalance } = useReadContract({
    abi: fundingPoolAbi,
    address: fundingPool,
    functionName: "totalPoolBalance",
    query: { enabled },
  });

  const { data: donorBalance } = useReadContract({
    abi: fundingPoolAbi,
    address: fundingPool,
    functionName: "donorBalances",
    args: address ? [address] : undefined,
    query: { enabled: enabled && Boolean(address) },
  });
  const isPausedValue = isPaused as boolean | undefined;
  const distributionCountValue = distributionCount as bigint | undefined;
  const protocolReserveValue = protocolReserve as bigint | undefined;
  const totalPoolBalanceValue = totalPoolBalance as bigint | undefined;
  const donorBalanceValue = donorBalance as bigint | undefined;

  if (!fundingPool) {
    return (
      <article className="rounded-2xl border border-amber-300/35 bg-amber-400/10 p-5 text-amber-100">
        <p className="text-xs uppercase tracking-[0.12em]">FundingPool address missing</p>
        <p className="mt-2 text-sm">
          Set <code>NEXT_PUBLIC_FUNDING_POOL_ADDRESS</code> in your environment to load on-chain pool data.
        </p>
      </article>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <article className="group rounded-2xl border border-white/10 bg-[#2a2d3b] p-5 transition duration-300 hover:-translate-y-0.5 hover:border-yellow-300/35">
          <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Treasury status</p>
          <p className="mt-2 text-3xl font-semibold text-slate-100">
            {isPausedValue === undefined ? "Unavailable" : isPausedValue ? "Paused" : "Not paused"}
          </p>
          <p className="mt-2 text-sm text-slate-300">The contract pause flag, not a progress percentage or a guarantee that any specific transaction will pass.</p>
          <p className="mt-4 text-xs text-slate-400">{isPausedValue === undefined ? "No confirmed pause-state read." : isPausedValue ? "Pause-gated actions are stopped." : "Other transaction checks still apply."}</p>
        </article>

        <article className="group rounded-2xl border border-white/10 bg-[#2a2d3b] p-5 transition duration-300 hover:-translate-y-0.5 hover:border-yellow-300/35">
          <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Grant payment records</p>
          <p className="mt-2 text-3xl font-semibold text-slate-100">
            {distributionCountValue === undefined ? "..." : String(distributionCountValue)}
          </p>
          <p className="mt-2 text-sm text-slate-300">Historical payment records, including separate tranches; not a count of unique funded projects.</p>
          <div className="mt-4 inline-flex rounded-full border border-yellow-300/40 bg-yellow-300/10 px-3 py-1 text-xs font-semibold text-yellow-200">
            Total historical payouts
          </div>
        </article>

        <article className="group rounded-2xl border border-white/10 bg-[#2a2d3b] p-5 transition duration-300 hover:-translate-y-0.5 hover:border-yellow-300/35">
          <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Reserve available</p>
          <p className="mt-2 text-3xl font-semibold text-slate-100">{formatUsdc(protocolReserveValue)}</p>
          <p className="mt-2 text-sm text-slate-300">Retained earned fees, slashed bonds and authenticated Community inflows. Direct deposits do not automatically become reserve or team revenue.</p>
          <div className="mt-4 inline-flex rounded-full border border-yellow-300/40 bg-yellow-300/10 px-3 py-1 text-xs font-semibold text-yellow-200">
            Reserved liquidity buffer
          </div>
        </article>
      </div>

      <article className="rounded-2xl border border-white/10 bg-[#2a2d3b] p-5">
        <header>
          <p className="text-xs uppercase tracking-[0.12em] text-slate-400">My Deposits</p>
          <h2 className="mt-2 font-[var(--font-display)] text-3xl text-slate-100">Wallet Contribution</h2>
          <p className="mt-1 text-sm text-slate-300">This legacy donor ledger includes direct deposits and author bonds, less returned bonds. It is not an ownership share or a withdrawable balance.</p>
        </header>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-black/15 p-4">
            <p className="text-xs uppercase tracking-[0.08em] text-slate-400">Recorded donor ledger</p>
            <p className="mt-2 text-2xl font-semibold text-slate-100">{formatUsdc(donorBalanceValue)}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/15 p-4">
            <p className="text-xs uppercase tracking-[0.08em] text-slate-400">Ownership entitlement</p>
            <p className="mt-2 text-sm text-slate-100">No investor shares, interest or general withdrawal right.</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/15 p-4">
            <p className="text-xs uppercase tracking-[0.08em] text-slate-400">Wallet</p>
            <p className="mt-2 break-all text-sm font-semibold text-slate-200">
              {hydrated ? address || "Not connected" : "Not connected"}
            </p>
            <p className="mt-2 text-xs text-slate-400">Pool balance: {formatUsdc(totalPoolBalanceValue)}</p>
          </div>
        </div>
      </article>
    </>
  );
}
