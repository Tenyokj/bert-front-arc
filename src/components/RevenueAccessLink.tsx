"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAccount, usePublicClient } from "wagmi";
import { formatUnits } from "viem";
import { contracts } from "@/lib/contracts";
import { defaultChain } from "@/lib/web3";
import { readTreasurySnapshot } from "@/lib/treasury-revenue";

export function RevenueAccessLink() {
  const { address } = useAccount();
  const client = usePublicClient({ chainId: defaultChain.id });
  const pool = contracts.fundingPool;
  const query = useQuery({
    queryKey: ["treasury-accounting", defaultChain.id, pool, undefined],
    enabled: !!address && !!client && !!pool,
    queryFn: () => readTreasurySnapshot(client!, pool!, defaultChain.id),
    staleTime: 15000, retry: 1,
  });
  const entries = query.error ? [] : query.data?.receivers.flatMap((treasury) => treasury.payees.filter((payee) => payee.address.toLowerCase() === address?.toLowerCase()).map((payee) => ({ ...payee, treasury: treasury.address }))) || [];
  if (!entries.length) return null;
  return <section className="rounded-2xl border border-violet-300/30 bg-violet-500/10 p-5">
    <h2 className="text-xl font-semibold text-white">Your protocol revenue</h2>
    <p className="mt-2 text-sm text-slate-300">Your connected wallet is an immutable beneficiary in the discovered Treasury. Payout relays do not require an Admin role and cannot change the recipient.</p>
    {entries.map((entry) => <p key={entry.treasury} className="mt-3 break-all text-sm text-violet-200">{formatUnits(BigInt(entry.releasable), 6)} USDC currently releasable · Treasury {entry.treasury}</p>)}
    <p className="mt-2 text-xs text-slate-400">Pinned block {query.data?.block}. This is not a search of every historical Treasury.</p>
    <Link className="mt-4 inline-block font-semibold text-cyan-200" href="/admin?tab=treasury">Open fixed-beneficiary payout controls →</Link>
  </section>;
}
