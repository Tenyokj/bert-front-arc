"use client";

import Link from "next/link";
import { useId, useState, type KeyboardEvent } from "react";
import { FaArrowRight, FaCodeBranch, FaCompass, FaLayerGroup, FaLightbulb } from "react-icons/fa6";
import styles from "./navigator.module.css";

const paths = [
  { id: "build", label: "Propose an idea", icon: FaLightbulb, title: "Give your idea a clear next step.", text: "Submit scope, a funding target and a committed milestone plan. A bond shows intent; it is not an investment in the protocol.", steps: ["Prepare your wallet and check verification", "Submit an idea with its required bond", "Track round selection, delivery and reviews"], href: "/ideas/new", action: "Prepare a proposal", secondary: "/ideas", secondaryLabel: "Compare existing ideas", note: "Global funding / V2.4. Existing rounds keep their stored rules." },
  { id: "vote", label: "Support builders", icon: FaCompass, title: "Compare first. Support with context.", text: "Open a round, inspect its ideas, budget and dates, then check the rights available to your wallet. A pledge is real testnet accounting, not a social like.", steps: ["Find a round and check its onchain window", "Read the proposal and its execution plan", "Follow results, refunds and milestone reviews"], href: "/rounds", action: "Explore funding rounds", secondary: "/profile#verification", secondaryLabel: "Check wallet access", note: "Backer review is for eligible winning supporters, not every connected wallet." },
  { id: "community", label: "Run a Community", icon: FaLayerGroup, title: "A shared mission. Your own rules.", text: "Explore local membership, proposal validation and governance lanes. Each Community has its own Treasury, roles and execution plans.", steps: ["Explore existing Communities and their rules", "Join with the Community's required stake", "Follow proposals, reviews and Admin payment quorum"], href: "/v3", action: "Explore Communities", secondary: "/v3/create", secondaryLabel: "Create a Community", note: "Community Layer / V3.2. Existing immutable generations keep their original contracts." },
  { id: "explore", label: "Just exploring", icon: FaCodeBranch, title: "Understand the system before signing.", text: "Browse without a wallet. The isolated demo uses labelled sample data; the public Pool and Console show protocol records and their limits.", steps: ["Try the labelled demo without funds", "Read the version-specific protocol flow", "Inspect public accounting and indexed data"], href: "/demo", action: "Try the demo", secondary: "/how-it-works", secondaryLabel: "Read the protocol flow", note: "Demo records are illustrative. Decorative motion does not represent live transactions." },
] as const;

export function ProtocolNavigator() {
  const [index, setIndex] = useState(0);
  const id = useId();
  const active = paths[index];
  function keyboard(event: KeyboardEvent<HTMLButtonElement>, current: number) {
    const next = event.key === "ArrowRight" ? (current + 1) % paths.length : event.key === "ArrowLeft" ? (current + paths.length - 1) % paths.length : event.key === "Home" ? 0 : event.key === "End" ? paths.length - 1 : null;
    if (next === null) return;
    event.preventDefault(); setIndex(next);
    event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>("button")[next]?.focus();
  }
  return <section className={styles.navigator} aria-labelledby={`${id}-title`}>
    <div className={styles.intro}><p className={styles.eyebrow}>BERT / YOUR STARTING POINT</p><h1 id={`${id}-title`}>Good ideas need<br /><span>a way forward.</span></h1><p>Propose, support and deliver with transparent onchain records. Choose a path; you do not need to understand every contract to get started.</p></div>
    <div role="tablist" aria-label="Choose your BERT path" className={styles.tabs}>{paths.map((path, i) => <button key={path.id} id={`${id}-${path.id}`} role="tab" aria-controls={`${id}-panel`} aria-selected={index === i} tabIndex={index === i ? 0 : -1} onKeyDown={(event) => keyboard(event, i)} type="button" onClick={() => setIndex(i)}><path.icon aria-hidden="true" />{path.label}</button>)}</div>
    <div id={`${id}-panel`} role="tabpanel" tabIndex={0} aria-labelledby={`${id}-${active.id}`} className={styles.body}>
      <div className={styles.path} key={active.id}><span className={styles.counter}>0{index + 1} / FIND YOUR ROUTE</span><h2>{active.title}</h2><p>{active.text}</p><ol>{active.steps.map((step, i) => <li key={step}><span>0{i + 1}</span>{step}</li>)}</ol><div className={styles.links}><Link className={styles.primary} href={active.href}>{active.action}<FaArrowRight aria-hidden="true" /></Link><Link href={active.secondary}>{active.secondaryLabel} ↗</Link></div><p className={styles.note}>{active.note}</p></div>
      <div className={styles.diagram} aria-hidden="true" data-protocol-compass="decorative">
        <svg viewBox="0 0 600 520" fill="none"><defs><linearGradient id={`${id}-gradient`}><stop stopColor="#459aff" /><stop offset=".5" stopColor="#a080ff" /><stop offset="1" stopColor="#f080b6" /></linearGradient></defs><g stroke={`url(#${id}-gradient)`}><ellipse cx="300" cy="260" rx="230" ry="145" transform="rotate(-30 300 260)" /><ellipse cx="300" cy="260" rx="230" ry="145" transform="rotate(30 300 260)" /><circle cx="300" cy="260" r="185" strokeDasharray="2 14" /><path className={styles.signal} d="M70 260Q300 0 530 260Q300 520 70 260Z" /></g><g className={styles.orbit}><circle cx="300" cy="75" r="7" fill="#8ca6ff" /><circle cx="300" cy="445" r="5" fill="#e4a0ef" /></g></svg>
        <div className={styles.core}><span>B</span><small>IDEAS INTO ACTION</small></div><span className={`${styles.node} ${styles.nodeA}`} data-active={index === 0}>01 / PROPOSE</span><span className={`${styles.node} ${styles.nodeB}`} data-active={index === 1}>02 / SUPPORT</span><span className={`${styles.node} ${styles.nodeC}`} data-active={index === 2}>03 / COORDINATE</span><span className={`${styles.node} ${styles.nodeD}`} data-active={index === 3}>04 / EXPLORE</span><p className={styles.diagramCaption}>A map of the product. Not a live transaction feed.</p>
      </div>
    </div>
  </section>;
}
