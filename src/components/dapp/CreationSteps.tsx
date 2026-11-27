"use client";

import { useRef, useSyncExternalStore, type ReactNode } from "react";
import { FiArrowLeft, FiArrowRight, FiCheck } from "react-icons/fi";
import styles from "./creation.module.css";

const subscribe = () => () => {};

export function CreationSteps({ labels, step, onStep, problems, busy = false, locked = false, children }: {
  labels: readonly string[]; step: number; onStep: (value: number) => void; problems: string[]; busy?: boolean; locked?: boolean; children: ReactNode;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const ready = useSyncExternalStore(subscribe, () => true, () => false);
  const go = (next: number) => { onStep(next); requestAnimationFrame(() => { panel.current?.focus({ preventScroll: true }); panel.current?.scrollIntoView({ block: "start", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" }); }); };
  return <div className={styles.wizard} data-creation-step={step} data-creation-ready={ready}>
    <nav aria-label="Creation steps"><ol>{labels.map((label, index) => <li key={label}><button type="button" aria-current={index === step ? "step" : undefined} disabled={!ready || busy || locked || index > step} onClick={() => go(index)}><span aria-hidden="true">{index < step ? <FiCheck /> : String(index + 1).padStart(2, "0")}</span>{label}</button></li>)}</ol></nav>
    <div ref={panel} tabIndex={-1} className={styles.panel} aria-label={`Step ${step + 1}: ${labels[step]}`}>
      <p className={styles.eyebrow}>STEP {step + 1} OF {labels.length} / {step === labels.length - 1 ? "REVIEW BEFORE SIGNING" : "NO TRANSACTION YET"}</p>
      {children}
      {problems.length > 0 && <div className={styles.problems} role="status"><strong>Before continuing</strong><ul>{problems.map((problem) => <li key={problem}>{problem}</li>)}</ul></div>}
      <div className={styles.actions}>
        {step > 0 && <button type="button" disabled={!ready || busy || locked} onClick={() => go(step - 1)}><FiArrowLeft aria-hidden="true" /> Back to {labels[step - 1].toLowerCase()}</button>}
        {step < labels.length - 1 && <button type="button" disabled={!ready || busy || locked || problems.length > 0} onClick={() => go(step + 1)} className={styles.primary}>Continue to {labels[step + 1].toLowerCase()} <FiArrowRight aria-hidden="true" /></button>}
      </div>
    </div>
  </div>;
}

export function CreationReview({ rows }: { rows: { label: string; value: ReactNode }[] }) {
  return <dl className={styles.review}>{rows.map((row) => <div key={row.label}><dt>{row.label}</dt><dd>{row.value}</dd></div>)}</dl>;
}
