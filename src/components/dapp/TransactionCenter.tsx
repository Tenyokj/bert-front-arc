"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useConfig } from "wagmi";
import { getAccount } from "wagmi/actions";
import { useObservedReceipt } from "@/hooks/useObservedReceipt";
import { captureTransaction, errorDescription, transactionExplorer, transactionLabels, transactionPhase, type TransactionRecord } from "@/lib/transaction-status";
import styles from "./transactions.module.css";

export function TransactionCenter() {
  const config = useConfig(), queries = useQueryClient();
  const [records, setRecords] = useState<TransactionRecord[]>([]);
  useEffect(() => {
    const cache = queries.getMutationCache();
    return cache.subscribe((event) => {
      if (event.type !== "updated") return;
      const mutation = event.mutation, kind = mutation.options.mutationKey?.[0];
      if (kind !== "writeContract" && kind !== "deployContract") return;
      // Capture at submission, not from the currently selected wallet after a switch.
      const context = event.action.type === "pending" ? getAccount(config) : undefined;
      setRecords((current) => {
        const previous = current.find((record) => record.id === mutation.mutationId);
        const next = captureTransaction(previous, mutation.mutationId, kind, mutation.state, context);
        return [next, ...current.filter((record) => record.id !== next.id)].slice(0, 8);
      });
    });
  }, [config, queries]);
  if (!records.length) return null;
  return <aside className={styles.center} aria-label="Transaction activity">
    <details><summary>Transaction activity <span>{records.length}</span><small>Current tab / latest 8 actions</small></summary>
      <p className={styles.note}>A wallet signature or returned hash is not confirmation. This is temporary activity, not complete wallet history. Reloading clears this panel; existing workflow recovery stays available.</p>
      <div className={styles.list}>{records.map((record) => <TransactionRow key={record.id} record={record} />)}</div>
    </details>
  </aside>;
}

export function TransactionRow({ record }: { record: TransactionRecord }) {
  const config = useConfig(), queries = useQueryClient();
  const [copied, setCopied] = useState("");
  const chain = config.chains.find((value) => value.id === record.chainId);
  const receipt = useObservedReceipt(record.chainId, record.hash);
  const phase = transactionPhase(record, receipt.data, receipt.error || (record.hash && !chain ? "Unknown original network" : undefined));
  const url = record.chainId === 31337 ? null : transactionExplorer(chain?.blockExplorers?.default.url, record.hash);
  const refresh = () => {
    void receipt.refetch();
    void queries.invalidateQueries({ queryKey: ["waitForTransactionReceipt", { hash: record.hash, chainId: record.chainId }] });
  };
  return <article className={styles.row} data-transaction-phase={phase}>
    <div className={styles.heading}><strong>{record.label}</strong><span>{transactionLabels[phase]}</span></div>
    <p>{chain?.name || "Original network unavailable"}{record.account ? ` / ${record.account}` : ""}</p>
    {record.hash && <code>{record.hash}</code>}
    {(phase === "unknown" || phase === "submitted") && <p>Do not resend. {record.hash ? "Check the receipt on the original network." : "No reliable hash was returned. Check wallet activity and the workflow's recovery controls."}</p>}
    {phase === "rejected" && <p>The wallet rejected this request. No successful onchain action is confirmed here.</p>}
    {phase === "reverted" && <p>The transaction was mined but its contract action reverted. Gas may still have been charged.</p>}
    {receipt.data && <p>Receipt block #{receipt.data.blockNumber.toString()}</p>}
    {(record.error || receipt.error) && <details><summary>Technical details</summary><pre>{record.error || errorDescription(receipt.error).message}</pre></details>}
    {record.hash && <div className={styles.actions}>
      <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(record.hash!); setCopied("Hash copied."); } catch { setCopied("Copy unavailable. Select the hash above to copy manually."); } }}>Copy hash</button>
      {url && <a href={url} target="_blank" rel="noopener noreferrer">View in explorer</a>}
      {chain && <button type="button" disabled={receipt.isFetching} onClick={refresh}>Refresh status (read-only)</button>}
      <span role="status">{copied}</span>
    </div>}
  </article>;
}
