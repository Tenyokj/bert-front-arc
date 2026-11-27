export type TransactionPhase = "signature" | "submitted" | "confirmed" | "reverted" | "rejected" | "unknown";
export type TransactionRecord = {
  id: number; label: string; chainId?: number; account?: string;
  hash?: `0x${string}`; status: string; error?: string;
};
export const transactionLabels: Record<TransactionPhase, string> = {
  signature: "Waiting for wallet", submitted: "Awaiting confirmation", confirmed: "Confirmed onchain",
  reverted: "Reverted onchain", rejected: "Rejected in wallet", unknown: "Outcome unconfirmed",
};
export function errorDescription(error: unknown): { message: string; rejected: boolean } {
  const messages: string[] = []; let rejected = false, current = error;
  const seen = new Set<unknown>();
  for (let depth = 0; current && depth < 8 && !seen.has(current); depth++) {
    seen.add(current);
    if (typeof current !== "object") { messages.push(String(current)); break; }
    const value = current as { code?: unknown; name?: string; shortMessage?: string; message?: string; cause?: unknown };
    if (value.code === 4001 || value.code === "ACTION_REJECTED" || value.name === "UserRejectedRequestError") rejected = true;
    const message = value.shortMessage || value.message;
    if (message && !messages.includes(message)) messages.push(message);
    current = value.cause;
  }
  return { message: messages.join("\n"), rejected };
}
export function receiptMatches(hash: string | undefined, receipt?: { transactionHash: string; status: string } | null) {
  return !!hash && !!receipt && hash.toLowerCase() === receipt.transactionHash.toLowerCase() && ["success", "reverted"].includes(receipt.status);
}
export function transactionPhase(record: Pick<TransactionRecord, "hash" | "status">, receipt?: { transactionHash: string; status: string } | null, readError?: unknown): TransactionPhase {
  if (record.hash && receiptMatches(record.hash, receipt)) return receipt!.status === "success" ? "confirmed" : "reverted";
  if (record.hash) return readError ? "unknown" : "submitted";
  if (record.status === "pending") return "signature";
  if (record.status === "rejected") return "rejected";
  return "unknown";
}
export function captureTransaction(previous: TransactionRecord | undefined, id: number, kind: string, state: { status: string; data?: unknown; error?: unknown; variables?: unknown }, context?: { chainId?: number; address?: string }): TransactionRecord {
  const variables = (state.variables || {}) as { chainId?: number; account?: string | { address?: string }; functionName?: string };
  const error = errorDescription(state.error);
  const account = typeof variables.account === "string" ? variables.account : variables.account?.address;
  const hash = typeof state.data === "string" && /^0x[0-9a-f]{64}$/i.test(state.data) ? state.data as `0x${string}` : undefined;
  return {
    id, label: kind === "deployContract" ? "Deploy contract" : (variables.functionName || "Contract action").replace(/([a-z])([A-Z])/g, "$1 $2"),
    chainId: previous?.chainId ?? variables.chainId ?? context?.chainId,
    account: previous?.account ?? account ?? context?.address,
    hash: hash ?? previous?.hash, status: error.rejected && !hash && !previous?.hash ? "rejected" : state.status,
    error: error.message || undefined,
  };
}
export function transactionExplorer(base: string | undefined, hash: string | undefined): string | null {
  if (!base || !hash || !/^0x[0-9a-f]{64}$/i.test(hash)) return null;
  try { const url = new URL(base); if (url.protocol !== "https:") return null; return `${base.replace(/\/$/, "")}/tx/${hash}`; } catch { return null; }
}
