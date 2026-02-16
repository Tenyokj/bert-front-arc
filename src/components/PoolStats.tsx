"use client";

import { useMemo, useSyncExternalStore } from "react";
import { formatUnits } from "viem";
import { useAccount, useReadContract } from "wagmi";

import { contracts, fundingPoolAbi } from "@/lib/contracts";

function formatBtk(value?: bigint) {
  if (value === undefined) return "-";
  const asNumber = Number(formatUnits(value, 18));
  if (!Number.isFinite(asNumber)) return `${formatUnits(value, 18)} BTK`;
  return `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: asNumber >= 1000 ? 0 : 2,
  }).format(asNumber)} BTK`;
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

  const shareOfPool = useMemo(() => {
    if (!donorBalance || !totalPoolBalance || totalPoolBalance === 0n) return "0.00%";
    const donor = Number(formatUnits(donorBalance, 18));
    const total = Number(formatUnits(totalPoolBalance, 18));
    if (!Number.isFinite(donor) || !Number.isFinite(total) || total === 0) return "0.00%";
    const pct = (donor / total) * 100;
    if (!Number.isFinite(pct)) return "0.00%";
    return `${pct.toFixed(2)}%`;
  }, [donorBalance, totalPoolBalance]);

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
      <div className="grid gap-4 lg:grid-cols-3">
        <article className="group rounded-2xl border border-white/10 bg-[#2a2d3b] p-5 transition duration-300 hover:-translate-y-0.5 hover:border-yellow-300/35">
          <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Contract state</p>
          <p className="mt-2 text-3xl font-semibold text-slate-100">
            {isPaused === undefined ? "..." : isPaused ? "Paused" : "Active"}
          </p>
          <p className="mt-2 text-sm text-slate-300">Source: FundingPool.`isPaused()`</p>
          <div className="mt-4 h-2 rounded-full bg-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                isPaused ? "w-[35%] bg-gradient-to-r from-rose-300 to-rose-500" : "w-[92%] bg-gradient-to-r from-yellow-300 to-green-400"
              }`}
            />
          </div>
        </article>

        <article className="group rounded-2xl border border-white/10 bg-[#2a2d3b] p-5 transition duration-300 hover:-translate-y-0.5 hover:border-yellow-300/35">
          <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Distribution count</p>
          <p className="mt-2 text-3xl font-semibold text-slate-100">
            {distributionCount === undefined ? "..." : String(distributionCount)}
          </p>
          <p className="mt-2 text-sm text-slate-300">Source: FundingPool.`getDistributionCount()`</p>
          <div className="mt-4 inline-flex rounded-full border border-yellow-300/40 bg-yellow-300/10 px-3 py-1 text-xs font-semibold text-yellow-200">
            Total historical payouts
          </div>
        </article>

        <article className="group rounded-2xl border border-white/10 bg-[#2a2d3b] p-5 transition duration-300 hover:-translate-y-0.5 hover:border-yellow-300/35">
          <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Protocol reserve</p>
          <p className="mt-2 text-3xl font-semibold text-slate-100">{formatBtk(protocolReserve as bigint | undefined)}</p>
          <p className="mt-2 text-sm text-slate-300">Source: FundingPool.`protocolReserve()`</p>
          <div className="mt-4 inline-flex rounded-full border border-yellow-300/40 bg-yellow-300/10 px-3 py-1 text-xs font-semibold text-yellow-200">
            Reserved liquidity buffer
          </div>
        </article>
      </div>

      <article className="rounded-2xl border border-white/10 bg-[#2a2d3b] p-5">
        <header>
          <p className="text-xs uppercase tracking-[0.12em] text-slate-400">My Deposits</p>
          <h2 className="mt-2 font-[var(--font-display)] text-3xl text-slate-100">Wallet Contribution</h2>
          <p className="mt-1 text-sm text-slate-300">Source: FundingPool.`donorBalances(user)` + FundingPool.`totalPoolBalance()`</p>
        </header>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-black/15 p-4">
            <p className="text-xs uppercase tracking-[0.08em] text-slate-400">Your deposited BTK</p>
            <p className="mt-2 text-2xl font-semibold text-slate-100">{formatBtk(donorBalance as bigint | undefined)}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/15 p-4">
            <p className="text-xs uppercase tracking-[0.08em] text-slate-400">Share of pool</p>
            <p className="mt-2 text-2xl font-semibold text-slate-100">{shareOfPool}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/15 p-4">
            <p className="text-xs uppercase tracking-[0.08em] text-slate-400">Wallet</p>
            <p className="mt-2 break-all text-sm font-semibold text-slate-200">
              {hydrated ? address || "Not connected" : "Not connected"}
            </p>
            <p className="mt-2 text-xs text-slate-400">Pool balance: {formatBtk(totalPoolBalance as bigint | undefined)}</p>
          </div>
        </div>
      </article>
    </>
  );
}
