import type { ReactNode } from "react";
import type { StatusTone } from "@/lib/protocol-status";
import styles from "./status.module.css";

export function StatusBadge({ tone = "neutral", children }: { tone?: StatusTone; children: ReactNode }) {
  return <span className={styles.badge} data-status-tone={tone}>{children}</span>;
}
