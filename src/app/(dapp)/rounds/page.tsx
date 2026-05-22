"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { formatUnits } from "viem";
import { FaCheckCircle, FaClock } from "react-icons/fa";
import { useAccount, usePublicClient, useWaitForTransactionReceipt, useWriteContract } from "wagmi";

import { Pagination } from "@/components/Pagination";
import { contracts, ideaRegistryAbi, votingSystemAbi } from "@/lib/contracts";
import { USDC_DECIMALS } from "@/lib/dapp-onchain";
import {
  fetchAllIdeasFromSubgraph,
  fetchRoundsPageFromSubgraph,
  hasSubgraphConfigured,
} from "@/lib/subgraph";

type OnChainRound = {
  id: number;
  startsAt: bigint;
  endsAt: bigint;
  active: boolean;
  ended: boolean;
  totalVotes: bigint;
  ideaIds: number[];
};

function formatDateFromUnix(ts: bigint) {
  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(Number(ts) * 1000));
}

function durationHours(startsAt: bigint, endsAt: bigint) {
  const diffSeconds = Number(endsAt - startsAt);
  return Math.max(Math.round(diffSeconds / 3600), 0);
}

function RoundsPageContent() {
  const client = usePublicClient();
  const { isConnected } = useAccount();
  const searchParams = useSearchParams();
  const [rounds, setRounds] = useState<OnChainRound[]>([]);
  const [ideasPerRound, setIdeasPerRound] = useState<bigint | null>(null);
  const [missingIdeas, setMissingIdeas] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { data: txHash, isPending, error, writeContract } = useWriteContract();
  const sendWrite = writeContract as unknown as (variables: Record<string, unknown>) => void;
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });
  const pageSize = 30;
  const canStartByIdeas = missingIdeas === 0;

  const formatUsdc = (value?: bigint) => {
    if (value === undefined) return "-";
    const asNumber = Number(formatUnits(value, USDC_DECIMALS));
    if (!Number.isFinite(asNumber)) return formatUnits(value, USDC_DECIMALS);
    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: asNumber >= 1000 ? 0 : 4,
    }).format(asNumber);
  };

  useEffect(() => {
    let cancelled = false;

    async function loadRounds() {
      if (!client || !contracts.votingSystem) {
        setRounds([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setLoadError(null);
      try {
        const readContract = (config: Record<string, unknown>) =>
          (client as { readContract: (arg: Record<string, unknown>) => Promise<unknown> }).readContract(config);
        const [currentRoundId, ideaLimit, totalIdeas, lastUsedIdeaId] = (await Promise.all([
          readContract({
            address: contracts.votingSystem,
            abi: votingSystemAbi,
            functionName: "currentRoundId",
          }),
          readContract({
            address: contracts.votingSystem,
            abi: votingSystemAbi,
            functionName: "IDEAS_PER_ROUND",
          }),
          contracts.ideaRegistry
            ? readContract({
                address: contracts.ideaRegistry,
                abi: ideaRegistryAbi,
                functionName: "totalIdeas",
              }).catch(async () => {
                if (!hasSubgraphConfigured()) return 0n;
                const ideas = await fetchAllIdeasFromSubgraph();
                return BigInt(ideas.length);
              })
            : Promise.resolve(0n),
          readContract({
            address: contracts.votingSystem,
            abi: votingSystemAbi,
            functionName: "lastUsedIdeaId",
          }),
        ])) as [bigint, bigint, bigint, bigint];

        const total = Number(currentRoundId);
        if (!cancelled) {
          const availableIdeas = Number(totalIdeas - lastUsedIdeaId);
          const ideaLimitNum = Number(ideaLimit);
          setIdeasPerRound(ideaLimit);
          setMissingIdeas(Math.max(ideaLimitNum - availableIdeas, 0));
        }
        if (!Number.isFinite(total) || total <= 0) {
          if (!cancelled) setRounds([]);
          return;
        }

        if (hasSubgraphConfigured()) {
          try {
            const rows = await fetchRoundsPageFromSubgraph(1000, 0);
            const mapped = rows.map((row) => ({
              id: Number(row.id),
              ideaIds: (row.ideaIds || []).map((value) => Number(value)),
              startsAt: BigInt(row.startTime),
              endsAt: BigInt(row.endTime),
              active: Boolean(row.active),
              ended: Boolean(row.ended),
              totalVotes: BigInt(row.totalVotes),
            })) satisfies OnChainRound[];

            if (!cancelled) {
              setRounds(
                mapped
                  .filter((entry) => Number.isFinite(entry.id) && entry.id > 0)
                  .sort((a, b) => b.id - a.id)
              );
            }
            return;
          } catch {
            // Fallback to direct RPC reads if subgraph is unavailable.
          }
        }

        const ids = Array.from({ length: total }, (_, i) => total - i);
        const entries = await Promise.all(
          ids.map(async (id) => {
            try {
              const row = (await readContract({
                address: contracts.votingSystem!,
                abi: votingSystemAbi,
                functionName: "getRoundInfo",
                args: [BigInt(id)],
              })) as readonly [bigint, bigint[], bigint, bigint, boolean, boolean, bigint, bigint, bigint];

              if (row[0] === 0n) return null;

              return {
                id: Number(row[0]),
                ideaIds: row[1].map((value) => Number(value)),
                startsAt: row[2],
                endsAt: row[3],
                active: row[4],
                ended: row[5],
                totalVotes: row[6],
              } satisfies OnChainRound;
            } catch {
              return null;
            }
          })
        );

        if (!cancelled) setRounds(entries.filter((entry): entry is OnChainRound => entry !== null));
      } catch (error) {
        if (!cancelled) setLoadError(error instanceof Error ? error.message : "Failed to load rounds");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadRounds();
    return () => {
      cancelled = true;
    };
  }, [client, isSuccess]);

  const onStartRound = () => {
    if (!contracts.votingSystem) return;
    if (!canStartByIdeas) return;
    sendWrite({
      address: contracts.votingSystem,
      abi: votingSystemAbi,
      functionName: "startVotingRound",
      gas: 3_000_000n,
    });
  };

  const requestedPage = Number(searchParams.get("page") ?? "1");
  const totalPages = Math.max(1, Math.ceil(rounds.length / pageSize));
  const currentPage = Number.isFinite(requestedPage)
    ? Math.min(Math.max(Math.floor(requestedPage), 1), totalPages)
    : 1;
  const start = (currentPage - 1) * pageSize;
  const visibleRounds = useMemo(
    () => rounds.slice(start, start + pageSize),
    [rounds, start]
  );

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-[#2a2d3b] p-5 sm:p-6 md:p-8">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Stablecoin Voting</p>
        <h1 className="mt-3 font-[var(--font-display)] text-3xl text-white sm:text-4xl md:text-6xl">Voting Rounds</h1>
        <div className="mt-5 flex flex-col items-start gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <button
            type="button"
            onClick={onStartRound}
            disabled={
              !isConnected ||
              !contracts.votingSystem ||
              !canStartByIdeas ||
              isPending ||
              isConfirming ||
              isLoading
            }
            className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Awaiting signature..." : isConfirming ? "Creating round..." : "Start voting round"}
          </button>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
            {missingIdeas > 0 ? `Need ${missingIdeas || ideasPerRound?.toString() || "..."} ideas` : "Ready"}
          </span>
          {!isConnected && <span className="text-xs text-amber-200">Connect wallet to start a round.</span>}
        </div>
        {error?.message && (
          <p className="mt-3 text-xs text-rose-300">
            {error.message.includes("NotEnoughIdeas")
              ? `Need ${missingIdeas || ideasPerRound?.toString() || "..."} ideas to start a round.`
              : error.message.includes("EnforcedPause")
                ? "Voting system is paused."
                : "Failed to start round. Check wallet/network and try again."}
          </p>
        )}
        {txHash && <p className="mt-2 break-all text-xs text-slate-300">Tx: {txHash}</p>}
      </div>

      {!contracts.votingSystem ? (
        <p className="rounded-xl border border-amber-300/35 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          Set <code>NEXT_PUBLIC_VOTING_SYSTEM_ADDRESS</code> in `.env` to load rounds.
        </p>
      ) : isLoading ? (
        <p className="rounded-xl border border-white/10 bg-[#313443] px-4 py-3 text-sm text-slate-300">Loading on-chain rounds...</p>
      ) : loadError ? (
        <p className="rounded-xl border border-rose-300/35 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{loadError}</p>
      ) : visibleRounds.length === 0 ? (
        <p className="rounded-xl border border-white/10 bg-[#313443] px-4 py-3 text-sm text-slate-300">No rounds on-chain yet.</p>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2 2xl:grid-cols-3">
          {visibleRounds.map((round) => {
            const isFinalized = round.ended;
            const isActive = !round.ended && round.active;
            const label = isFinalized ? "Passed" : isActive ? "Live" : "Scheduled";
            const badgeClass = isFinalized
              ? "bg-teal-500/10 text-teal-300 border-teal-400/30"
              : isActive
                ? "bg-emerald-500/10 text-emerald-300 border-emerald-400/30"
                : "bg-sky-500/10 text-sky-300 border-sky-400/30";
            const Icon = isFinalized ? FaCheckCircle : FaClock;

            return (
              <Link
                key={round.id}
                href={`/rounds/${round.id}`}
                className="group rounded-[22px] border border-white/10 bg-[#313443] p-4 shadow-[0_14px_30px_rgba(0,0,0,0.26)] transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/40"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${badgeClass}`}>
                    <Icon className="text-[10px]" />
                    {label}
                  </span>
                  <span className="text-xs text-slate-400">{formatDateFromUnix(round.endsAt)}</span>
                </div>

                <h2 className="mt-4 text-xl font-semibold text-white sm:text-2xl">Round #{round.id}</h2>

                <div className="mt-4 grid gap-2 text-xs text-slate-300 sm:grid-cols-3">
                  <div className="rounded-lg border border-white/10 bg-[#262938] px-2.5 py-2">Votes: {formatUsdc(round.totalVotes)} USDC</div>
                  <div className="rounded-lg border border-white/10 bg-[#262938] px-2.5 py-2">Ideas: {round.ideaIds.length}</div>
                  <div className="rounded-lg border border-white/10 bg-[#262938] px-2.5 py-2">{durationHours(round.startsAt, round.endsAt)}h window</div>
                </div>

                <div className="mt-4 h-1.5 rounded-full bg-[#3a3e4f]">
                  <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400" style={{ width: "100%" }} />
                </div>

                <p className="mt-3 text-sm font-semibold text-cyan-300 transition-colors group-hover:text-cyan-200">Open round details</p>
              </Link>
            );
          })}
        </div>
      )}

      <Pagination basePath="/rounds" currentPage={currentPage} totalItems={rounds.length} pageSize={pageSize} />
    </section>
  );
}

export default function RoundsPage() {
  return (
    <Suspense fallback={<p className="rounded-xl border border-white/10 bg-[#313443] px-4 py-3 text-sm text-slate-300">Loading rounds...</p>}>
      <RoundsPageContent />
    </Suspense>
  );
}
