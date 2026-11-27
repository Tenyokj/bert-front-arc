import Link from "next/link";
import { FiArrowUpRight, FiCheck, FiClock, FiMinus, FiHelpCircle } from "react-icons/fi";
import type { JourneyStep } from "@/lib/detail-lifecycle";
import styles from "./lifecycle.module.css";

export function LifecyclePanel({ title, steps, mode, next, href, linkLabel, deadlines = [] }: {
  title: string;
  steps: JourneyStep[];
  mode: string;
  next: string;
  href: string;
  linkLabel: string;
  deadlines?: { label: string; value: string }[];
}) {
  return <section className={styles.panel} aria-label={title} data-lifecycle>
    <div className={styles.heading}><div><p className={styles.eyebrow}>FOLLOW THE PROCESS</p><h2>{title}</h2></div><span className={styles.mode}>{mode}</span></div>
    <ol className={styles.steps}>
      {steps.map((step, index) => <li key={step.title} data-state={step.state} aria-current={step.state === "current" ? "step" : undefined}>
        <span className={styles.marker} aria-hidden="true">{step.state === "done" ? <FiCheck /> : step.state === "stopped" ? <FiMinus /> : step.state === "unknown" ? <FiHelpCircle /> : step.state === "current" ? <FiClock /> : String(index + 1).padStart(2, "0")}</span>
        <div><span className={styles.state}>{({ done: "Recorded", current: "Current stage", waiting: "Ahead", unknown: "Unconfirmed", stopped: "Stopped" })[step.state]}</span><h3>{step.title}</h3><p>{step.detail}</p></div>
      </li>)}
    </ol>
    {deadlines.length > 0 && <dl className={styles.deadlines}>{deadlines.map(({ label, value }) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>}
    <div className={styles.next}><div><strong>Who acts next?</strong><p>{next}</p><small>Read-only guide. Contract checks, wallet permissions and transaction results remain authoritative.</small></div><Link href={href}>{linkLabel}<FiArrowUpRight aria-hidden="true" /></Link></div>
  </section>;
}
