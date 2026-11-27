import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./cards.module.css";
import { StatusBadge } from "./StatusBadge";
import { ideaStatusTone } from "@/lib/protocol-status";

const ideaStates: Record<string, [string, string]> = {
  Pending: ["Awaiting review", "The idea has not yet entered a voting round."],
  Voting: ["Voting", "Open the idea to check its round and voting eligibility."],
  WonVoting: ["Selected", "Selected by voting. This does not mean the grant is paid."],
  Funded: ["Grant started", "The grant has started; later payouts depend on its milestones."],
  InProcess: ["In progress", "Delivery is in progress. Open the grant for proof and review status."],
  Completed: ["Completed", "The registry records this idea as completed."],
  Rejected: ["Rejected", "This idea was not approved."],
  Cancelled: ["Grant cancelled", "The grant ended before all tranches were paid. Inspect its round for remaining-pledge refund availability."],
};

export function utcDate(value: string | bigint) {
  const date = new Date(typeof value === "bigint" ? Number(value) * 1000 : value);
  return Number.isFinite(date.getTime()) ? `${date.toISOString().slice(0, 16).replace("T", " ")} UTC` : "Date unavailable";
}

export function IdeaSummaryCard({ id, href, title, description, status, votes, reviewed, details, demo = false }: {
  id: number; href: string; title: string; description: string; status: string; votes: string;
  reviewed?: boolean; details?: ReactNode; demo?: boolean;
}) {
  const [label, explanation] = ideaStates[status] || [status, "Open the idea for its current lifecycle and available actions."];
  return <article className={styles.card} data-protocol-card="idea">
    <div className={styles.top}><span>IDEA / {String(id).padStart(3, "0")}</span><StatusBadge tone={ideaStatusTone(status)}>{demo ? "Demo · " : ""}{label}</StatusBadge></div>
    <h2><Link href={href}>{title}</Link></h2>
    <p className={styles.description}>{description}</p>
    <div className={styles.metric}><span>Recorded vote amount</span><strong>{votes} <small>USDC</small></strong></div>
    <p className={styles.explanation}>{explanation} {reviewed && "A review is recorded; this is not an audit endorsement."}</p>
    <div className={styles.bottom}><Link href={href}>View idea & available actions <span aria-hidden="true">↗</span></Link></div>
    <details><summary>Author & technical details</summary><dl><div><dt>Registry status</dt><dd>{status}</dd></div>{details}</dl></details>
  </article>;
}

export function RoundSummaryCard({ id, href, startsAt, endsAt, active, ended, votes, ideas, extra, demo = false }: {
  id: number; href: string; startsAt: string | bigint; endsAt: string | bigint; active: boolean; ended: boolean;
  votes: string; ideas: number; extra?: ReactNode; demo?: boolean;
}) {
  // Contract flags describe state; the browser clock never determines write eligibility.
  const label = ended ? "Finalized" : active ? "Voting enabled" : "Inactive / scheduled";
  return <article className={styles.card} data-protocol-card="round">
    <div className={styles.top}><span>FUNDING ROUND</span><StatusBadge tone={ended ? "green" : active ? "cyan" : "amber"}>{demo ? "Demo · " : ""}{label}</StatusBadge></div>
    <h2><Link href={href}>Round #{id}</Link></h2>
    <div className={styles.metric}><span>Recorded vote amount</span><strong>{votes} <small>USDC</small></strong></div>
    <dl className={styles.facts}><div><dt>Ideas competing</dt><dd>{ideas}</dd></div><div><dt>Starts</dt><dd>{utcDate(startsAt)}</dd></div><div><dt>Ends</dt><dd>{utcDate(endsAt)}</dd></div></dl>
    <p className={styles.explanation}>{ended ? "Finalized does not imply a winner or a completed payout. Check the outcome." : "Voting requires the onchain time window and wallet eligibility. Check details before signing."}</p>
    <div className={styles.bottom}><Link href={href}>View round & outcome <span aria-hidden="true">↗</span></Link></div>
    <details><summary>Technical details</summary><dl><div><dt>Active flag</dt><dd>{String(active)}</dd></div><div><dt>Ended flag</dt><dd>{String(ended)}</dd></div>{extra}</dl></details>
  </article>;
}
