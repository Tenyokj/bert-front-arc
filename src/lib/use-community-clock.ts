"use client";

import { useEffect, useRef, useState } from "react";
import { useReadContract } from "wagmi";

import { communityHubAbi } from "@/lib/community-contracts";

type ClockAnchor = {
  communityTime: bigint;
  observedAt: number;
  paused: boolean;
};

/**
 * Reads the pause-aware Community clock and advances its display between blocks.
 *
 * Public networks continuously create blocks. A local Hardhat node, however, keeps
 * the latest block timestamp frozen until the next transaction or explicit mine.
 * The interpolation keeps a local countdown usable in both environments; every
 * state-changing contract call still validates the authoritative on-chain clock.
 */
export function useCommunityClock(hub: `0x${string}`, chainId?: number) {
  const timeRead = useReadContract({
    address: hub,
    abi: communityHubAbi,
    functionName: "communityTime",
    chainId,
    query: { refetchInterval: 2_000 },
  });
  const statusRead = useReadContract({
    address: hub,
    abi: communityHubAbi,
    functionName: "communityStatus",
    chainId,
    query: { refetchInterval: 2_000 },
  });
  const [now, setNow] = useState(() => Date.now());
  const anchorRef = useRef<ClockAnchor>();
  const onChainTime = timeRead.data as bigint | undefined;
  const paused = Number(statusRead.data ?? 0) === 1;

  useEffect(() => {
    if (onChainTime === undefined) return;

    const anchor = anchorRef.current;
    if (!anchor || onChainTime > anchor.communityTime || paused !== anchor.paused) {
      anchorRef.current = { communityTime: onChainTime, observedAt: Date.now(), paused };
    }
  }, [onChainTime, paused]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(interval);
  }, []);

  const anchor = anchorRef.current;
  const communityTime = onChainTime === undefined
    ? undefined
    : paused || !anchor
      ? onChainTime
      : anchor.communityTime + BigInt(Math.floor(Math.max(0, now - anchor.observedAt) / 1_000));

  return {
    communityTime,
    paused,
    isLoading: timeRead.isLoading || statusRead.isLoading,
    refetch: async () => {
      await Promise.all([timeRead.refetch(), statusRead.refetch()]);
    },
  };
}
