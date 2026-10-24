/** A lost broadcast response is not proof that a transaction reverted. */
export function isUncertainWalletError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return /already known|transaction already imported|nonce too low|nonce provided[^\n]*lower|timed? ?out|timeout|failed to fetch|http request failed/i.test(message);
}

export const uncertainWalletMessage = "The wallet/RPC did not return a reliable result. The transaction may already be confirmed. Refresh on-chain status before sending again. Do not manually increase the nonce.";

/** Never resends a write. After an ambiguous response, only reads its intended postcondition. */
export async function confirmWalletAction({ send, wait, isApplied, pause = () => new Promise<void>((resolve) => setTimeout(resolve, 1_000)) }: {
  send: () => Promise<`0x${string}`>;
  wait: (hash: `0x${string}`) => Promise<{ status: "success" | "reverted" }>;
  isApplied: () => Promise<boolean>;
  pause?: () => Promise<void>;
}): Promise<void> {
  if (await isApplied()) return;
  try {
    const hash = await send();
    const receipt = await wait(hash);
    if (receipt.status !== "success") throw new Error("Transaction reverted on-chain. No successful action was confirmed.");
  } catch (error) {
    if (!isUncertainWalletError(error)) throw error;
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt) await pause();
      try {
        if (await isApplied()) return;
      } catch {
        // An unavailable read must never be treated as success or permission to resend.
      }
    }
    throw new Error(uncertainWalletMessage);
  }
}
