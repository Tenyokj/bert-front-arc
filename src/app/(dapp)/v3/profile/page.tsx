"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FaArrowRight, FaShieldHalved, FaUsers } from "react-icons/fa6";
import { useAccount, usePublicClient } from "wagmi";

import { communityContracts, communityFactoryAbi, communityHubAbi } from "@/lib/community-contracts";
import { formatCommunityUsdc } from "@/lib/community";
import { fetchIndexedCommunities } from "@/lib/community-v3-subgraph";

type Row = { id: number; name: string; active: boolean; admin: boolean; validator: boolean; stake: bigint; points: bigint; validatorPointsThreshold: bigint; joinedAt: bigint; exitRequestedAt: bigint };

export default function V3ProfilePage() {
  const { address, chainId, isConnected } = useAccount(); const client = usePublicClient({ chainId });
  const [rows, setRows] = useState<Row[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!client || !address || !communityContracts.factory) {
        if (!cancelled) setLoading(false);
        return;
      }
      try {
        const read = (config: Record<string, unknown>) =>
          (client as { readContract: (value: Record<string, unknown>) => Promise<unknown> }).readContract(config);
        const [count, indexed] = await Promise.all([
          read({ address: communityContracts.factory, abi: communityFactoryAbi, functionName: "communityCount" }) as Promise<bigint>,
          fetchIndexedCommunities(100).catch(() => null),
        ]);
        const names = new Map(indexed?.map((community) => [Number(community.communityId), community.name]) ?? []);
        const ids = Array.from({ length: Math.min(Number(count), 100) }, (_, index) => BigInt(Number(count) - index));
        const values = await Promise.all(ids.map(async (id) => {
          const deployment = await read({
            address: communityContracts.factory,
            abi: communityFactoryAbi,
            functionName: "getCommunity",
            args: [id],
          }) as { hub: string };
          if (deployment.hub === "0x0000000000000000000000000000000000000000") return null;
          const [member, admin, validator, threshold] = await Promise.all([
            read({ address: deployment.hub as `0x${string}`, abi: communityHubAbi, functionName: "getMember", args: [address] }),
            read({ address: deployment.hub as `0x${string}`, abi: communityHubAbi, functionName: "isAdminAccount", args: [address] }),
            read({ address: deployment.hub as `0x${string}`, abi: communityHubAbi, functionName: "isValidatorAccount", args: [address] }),
            read({ address: deployment.hub as `0x${string}`, abi: communityHubAbi, functionName: "validatorProposalPointsThreshold" }),
          ]);
          const info = member as { active: boolean; membershipStake: bigint; proposalPoints: bigint; joinedAt: bigint; exitRequestedAt: bigint };
          return info.active || admin || validator ? {
            id: Number(id),
            name: names.get(Number(id)) || `Community #${id.toString()}`,
            active: info.active,
            admin: admin as boolean,
            validator: validator as boolean,
            stake: info.membershipStake,
            points: info.proposalPoints,
            validatorPointsThreshold: threshold as bigint,
            joinedAt: info.joinedAt,
            exitRequestedAt: info.exitRequestedAt,
          } : null;
        }));
        if (!cancelled) setRows(values.filter((row): row is Row => row !== null));
      } catch (reason) {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "Could not load V3 profile.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [address, chainId, client]);
  if (!isConnected) return <p className="rounded-2xl border border-white/10 bg-[#313443] p-5 text-sm text-slate-300">Connect a wallet to view your V3 Community Layer profile.</p>;
  const totalStake = rows.reduce((sum, row) => sum + row.stake, 0n); const validatorCommunities = rows.filter((row) => row.validator).length;
  return <section className="space-y-6"><div className="rounded-[32px] border border-cyan-300/18 bg-[linear-gradient(135deg,#123946,#20232f_60%,#313443)] p-7 sm:p-9"><p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-200">V3 Profile</p><h1 className="mt-4 text-4xl font-semibold text-white sm:text-5xl">Your local community identity.</h1><p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">Membership, local admin/validator roles, locked stake and proposal points are independent in every CommunityHub.</p></div>{loading ? <p className="rounded-2xl border border-white/10 bg-[#313443] p-5 text-sm text-slate-300">Loading your communities...</p> : error ? <p className="rounded-2xl border border-rose-300/30 bg-rose-400/10 p-5 text-sm text-rose-100">{error}</p> : rows.length === 0 ? <div className="rounded-[28px] border border-white/10 bg-[#313443] p-7"><FaUsers className="text-2xl text-cyan-300" /><h2 className="mt-4 text-2xl font-semibold text-white">No V3 communities yet.</h2><Link href="/v3/communities" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-cyan-200">Explore communities <FaArrowRight /></Link></div> : <><div className="grid gap-3 sm:grid-cols-3"><Summary label="Communities" value={rows.length.toString()} /><Summary label="Locked stake" value={`${formatCommunityUsdc(totalStake)} USDC`} /><Summary label="Validator roles" value={validatorCommunities.toString()} /></div><div className="grid gap-4 md:grid-cols-2">{rows.map((row) => { const progress = row.validatorPointsThreshold === 0n ? 0 : Math.min(100, Number((row.points * 100n) / row.validatorPointsThreshold)); return <Link key={row.id} href={`/v3/communities/${row.id}`} className="rounded-[26px] border border-white/10 bg-[#2a2d3b] p-6 transition hover:-translate-y-0.5 hover:border-cyan-300/35"><p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-200">Community #{row.id}</p><h2 className="mt-2 text-2xl font-semibold text-white">{row.name}</h2><div className="mt-4 flex flex-wrap gap-2">{row.active ? <Badge text="Member" /> : null}{row.admin ? <Badge text="Admin" /> : null}{row.validator ? <Badge text="Validator" /> : null}</div><div className="mt-5 grid grid-cols-2 gap-3 text-sm"><p className="rounded-xl bg-slate-950/25 p-3 text-slate-300">Stake <strong className="block mt-1 text-white">{formatCommunityUsdc(row.stake)} USDC</strong></p><p className="rounded-xl bg-slate-950/25 p-3 text-slate-300">Proposal points <strong className="block mt-1 text-white">{row.points.toString()}</strong></p></div><div className="mt-4 rounded-xl border border-white/10 bg-slate-950/20 p-3"><div className="flex justify-between gap-3 text-xs"><span className="text-slate-400">{row.validator ? "Validator role unlocked" : "Progress to Validator eligibility"}</span><strong className="text-cyan-100">{row.points.toString()} / {row.validatorPointsThreshold.toString()}</strong></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-cyan-300" style={{ width: `${progress}%` }} /></div><p className="mt-2 text-xs text-slate-400">Points remain local to this Community. An eligible former Member can be appointed Validator by an Admin.</p></div><p className="mt-4 text-xs text-slate-400">{row.exitRequestedAt ? "Membership exit requested" : `Joined: ${new Date(Number(row.joinedAt) * 1_000).toLocaleDateString()}`}</p></Link>; })}</div></>}</section>;
}
function Badge({ text }: { text: string }) { return <span className="inline-flex items-center gap-1 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-2.5 py-1 text-xs font-semibold text-cyan-100"><FaShieldHalved />{text}</span>; }
function Summary({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-white/10 bg-[#313443] p-4"><p className="text-xs uppercase tracking-[0.14em] text-slate-500">{label}</p><p className="mt-2 text-xl font-semibold text-white">{value}</p></div>; }
