"use client";

import { useQuery } from "@tanstack/react-query";
import { useConfig } from "wagmi";
import { getPublicClient } from "wagmi/actions";

/** Shared read-only fallback: Wagmi may throw when a mined receipt is reverted. */
export function useObservedReceipt(chainId?: number, hash?: `0x${string}`, enabled = true) {
  const config = useConfig();
  const knownChain = config.chains.some((chain) => chain.id === chainId);
  return useQuery({
    queryKey: ["transaction-center", chainId, hash], enabled: enabled && !!hash && knownChain,
    queryFn: async () => {
      const client = getPublicClient(config, { chainId });
      if (!client || !hash || await client.getChainId() !== chainId) throw new Error("Transaction network could not be verified.");
      try { return await client.getTransactionReceipt({ hash }); }
      catch (error) { if (error instanceof Error && error.name === "TransactionReceiptNotFoundError") return null; throw error; }
    },
    retry: 1, staleTime: 5000,
    refetchInterval: (query) => query.state.data ? false : 5000,
  });
}
