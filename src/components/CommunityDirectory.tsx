"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FaArrowRight, FaLayerGroup, FaShieldHalved } from "react-icons/fa6";
import { usePublicClient } from "wagmi";

import { AddressIdentity } from "@/components/AddressIdentity";
import { communityContracts, communityFactoryAbi, communityHubAbi } from "@/lib/community-contracts";
import { formatDateTimeFromUnix } from "@/lib/dapp-onchain";
import { fetchIndexedCommunities } from "@/lib/community-v3-subgraph";

type CommunityRow = {
  id: number;
  name: string;
  metadataURI: string;
  creator: string;
  hub: string;
  treasury: string;
  createdAt: bigint;
  status?: number;
};

export function CommunityDirectory({ query = "", basePath = "/v3/communities", limit = 24 }: { query?: string; basePath?: string; limit?: number }) {
  const client = usePublicClient();
  const [communities, setCommunities] = useState<CommunityRow[]>([]);
  const [totalCount, setTotalCount] = useState<bigint | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [usesSubgraph, setUsesSubgraph] = useState(false);
  const normalizedQuery = query.trim().toLowerCase();
  const requestedId = normalizedQuery.replace(/^#/, "");
  const isExactIdSearch = /^\d+$/.test(requestedId) && Number(requestedId) > 0;
  const filteredCommunities = useMemo(() => communities.filter((community) => {
    if (!normalizedQuery) return true;
    if (isExactIdSearch) return community.id.toString() === requestedId;
    const queryVariants = normalizedQuery.startsWith("#") ? [normalizedQuery, normalizedQuery.slice(1)] : [normalizedQuery];
    return queryVariants.some((candidate) => [community.id.toString(), community.name, community.metadataURI, community.creator, community.hub, community.treasury].some((value) => value.toLowerCase().includes(candidate)));
  }), [communities, isExactIdSearch, normalizedQuery, requestedId]);

  useEffect(() => {
    let cancelled = false;

    async function loadCommunities() {
      if (!client || !communityContracts.factory) {
        if (!cancelled) {
          setLoading(false);
          setCommunities([]);
        }
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const readContract = (config: Record<string, unknown>) =>
          (client as { readContract: (arg: Record<string, unknown>) => Promise<unknown> }).readContract(config);
        const count = (await readContract({
          address: communityContracts.factory,
          abi: communityFactoryAbi,
          functionName: "communityCount",
        })) as bigint;
        const visibleCount = Math.min(Number(count), limit);
        const latestIds = Array.from({ length: visibleCount }, (_, index) => BigInt(visibleCount - index));
        // An exact ID must be discoverable even after it falls outside the newest-page window.
        const ids = isExactIdSearch && BigInt(requestedId) <= count
          ? [...new Set([...latestIds, BigInt(requestedId)])]
          : latestIds;
        const indexed = await fetchIndexedCommunities(
          Math.max(limit, isExactIdSearch ? 1 : 0),
          isExactIdSearch ? BigInt(requestedId) : undefined
        );
        const indexedRows = indexed?.map((community) => ({
          id: Number(community.communityId),
          name: community.name || `Community #${community.communityId.toString()}`,
          metadataURI: community.metadataURI,
          creator: community.creator,
          hub: community.hub || "0x0000000000000000000000000000000000000000",
          treasury: community.treasury,
          createdAt: community.createdAt,
        } satisfies CommunityRow));
        const shouldUseRpcFallback = !indexedRows || (count > 0n && indexedRows.length === 0);
        let rows: CommunityRow[];
        if (shouldUseRpcFallback) {
          rows = await Promise.all(ids.map(async (id) => {
            const deployment = (await readContract({
              address: communityContracts.factory,
              abi: communityFactoryAbi,
              functionName: "getCommunity",
              args: [id],
            })) as { creator: string; hub: string; treasury: string; createdAt: bigint };
            return {
              id: Number(id),
              name: `Community #${id.toString()}`,
              metadataURI: "",
              creator: deployment.creator,
              hub: deployment.hub,
              treasury: deployment.treasury,
              createdAt: deployment.createdAt,
            } satisfies CommunityRow;
          }));
        } else {
          rows = indexedRows;
        }

        const hydratedRows = await Promise.all(rows.map(async (row) => {
          if (row.hub === "0x0000000000000000000000000000000000000000") return row;
          try {
            const status = await readContract({
              address: row.hub,
              abi: communityHubAbi,
              functionName: "communityStatus",
            }) as bigint;
            return { ...row, status: Number(status) } satisfies CommunityRow;
          } catch {
            // Keep an activated Community discoverable if a transient RPC read fails.
            return row;
          }
        }));

        if (!cancelled) {
          setTotalCount(count);
          setCommunities(hydratedRows);
          setUsesSubgraph(!shouldUseRpcFallback);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Could not load communities from Factory.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadCommunities();
    return () => {
      cancelled = true;
    };
  }, [client, isExactIdSearch, limit, requestedId]);

  if (!communityContracts.factory) {
    return (
      <div className="rounded-[28px] border border-amber-300/20 bg-[linear-gradient(135deg,rgba(120,53,15,0.24),rgba(30,41,59,0.55))] p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-200/80">V3 configuration required</p>
        <h2 className="mt-3 font-[var(--font-display)] text-3xl text-white">Community Layer is ready for deployment.</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
          Set <code>NEXT_PUBLIC_V3_FACTORY_ADDRESS</code> to the deployed CommunityFactory proxy to browse live communities.
        </p>
      </div>
    );
  }

  if (loading) {
    return <p className="rounded-2xl border border-white/10 bg-[#313443] px-4 py-4 text-sm text-slate-300">Loading CommunityFactory...</p>;
  }

  if (error) {
    return <p className="rounded-2xl border border-rose-300/30 bg-rose-400/10 px-4 py-4 text-sm text-rose-100">{error}</p>;
  }

  if (communities.length === 0) {
    return (
      <div className="rounded-[28px] border border-white/10 bg-[#313443] p-6 sm:p-8">
        <FaLayerGroup className="text-2xl text-cyan-300" />
        <h2 className="mt-4 text-2xl font-semibold text-white">No communities have been activated yet.</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
          The Factory is live, but it has not linked a CommunityHub and CommunityTreasury yet. The first community can be created through the V3 creator deployment flow.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <p className="text-sm text-slate-400">{totalCount?.toString()} community deployments indexed on-chain</p>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">{usesSubgraph ? "Indexed by V3 subgraph" : "Direct RPC fallback"}</p>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {filteredCommunities.map((community) => {
          const activated = community.hub !== "0x0000000000000000000000000000000000000000";
          const status = community.status === 2 ? "Archived" : community.status === 1 ? "Paused" : activated ? "Active" : "Pending activation";
          const statusClassName = status === "Archived"
            ? "border-slate-300/25 bg-slate-400/10 text-slate-200"
            : status === "Paused"
              ? "border-amber-300/25 bg-amber-400/10 text-amber-100"
              : status === "Active"
                ? "border-emerald-300/25 bg-emerald-400/10 text-emerald-200"
                : "border-amber-300/25 bg-amber-400/10 text-amber-100";
          return (
            <Link
              key={community.id}
              href={activated ? `${basePath}/${community.id}` : basePath}
              className="group rounded-[26px] border border-white/10 bg-[linear-gradient(145deg,rgba(53,57,72,0.96),rgba(32,35,47,0.98))] p-5 transition hover:-translate-y-0.5 hover:border-cyan-300/40"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Community #{community.id}</p>
                  <h3 className="mt-3 text-2xl font-semibold text-white">{community.name}</h3>
                </div>
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusClassName}`}>
                  {status}
                </span>
              </div>
              <div className="mt-5 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
                <div className="rounded-xl border border-white/8 bg-slate-950/20 p-3"><p className="text-xs text-slate-500">Creator</p><div className="mt-1"><AddressIdentity address={community.creator} /></div></div>
                <div className="rounded-xl border border-white/8 bg-slate-950/20 p-3"><p className="text-xs text-slate-500">Created</p><p className="mt-1 font-medium text-slate-200">{formatDateTimeFromUnix(community.createdAt)}</p></div>
              </div>
              <div className="mt-5 flex items-center justify-between border-t border-white/8 pt-4 text-sm font-semibold text-cyan-200">
                <span className="inline-flex items-center gap-2"><FaShieldHalved /> View governance</span>
                <FaArrowRight className="transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          );
        })}
      </div>
      {communities.length > 0 && filteredCommunities.length === 0 ? <p className="rounded-2xl border border-white/10 bg-[#313443] px-5 py-4 text-sm text-slate-300">No community matches “{query}”. Search by name, ID, creator, Hub, or Treasury address.</p> : null}
      {(totalCount ?? 0n) > BigInt(limit) ? <p className="text-center text-sm text-slate-500">Showing the latest {limit} communities.</p> : null}
    </div>
  );
}
