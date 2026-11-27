"use client";

import { useState } from "react";
import { useChainId, useWaitForTransactionReceipt, type UseWaitForTransactionReceiptParameters } from "wagmi";
import { defaultChain } from "@/lib/web3";
import { receiptMatches } from "@/lib/transaction-status";
import { useObservedReceipt } from "./useObservedReceipt";

/** A successful query/broadcast is not a successful transaction. Never resends. */
export function useProtocolReceipt(parameters: UseWaitForTransactionReceiptParameters = {}) {
  const walletChain = useChainId();
  const [captured, setCaptured] = useState({ hash: parameters.hash, chainId: parameters.chainId ?? walletChain ?? defaultChain.id });
  const binding = captured.hash === parameters.hash ? captured : { hash: parameters.hash, chainId: parameters.chainId ?? walletChain ?? defaultChain.id };
  if (binding !== captured) setCaptured(binding);
  const result = useWaitForTransactionReceipt({ ...parameters, chainId: binding.chainId });
  const observed = useObservedReceipt(binding.chainId, parameters.hash, !!result.error);
  const data = result.data ?? (observed.data ? { ...observed.data, chainId: binding.chainId } : undefined);
  const settled = receiptMatches(parameters.hash, data);
  const success = settled && data?.status === "success";
  return { ...result, data, error: success ? null : result.error ?? observed.error, isSuccess: success, isError: settled ? !success : result.isError, status: settled ? success ? "success" as const : "error" as const : result.status, isLoading: !!parameters.hash && !settled };
}
