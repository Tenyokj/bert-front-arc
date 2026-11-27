"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { FiCheck, FiFileText, FiGlobe, FiPause, FiPlay, FiPlus, FiShield, FiUsers } from "react-icons/fi";
import { SiCircle, SiEthereum, SiNextdotjs, SiSolidity, SiThreedotjs } from "react-icons/si";
import styles from "./landing-main.module.css";
import { useLandingMotion } from "./LandingMotion";

const journey = [
  { title: "Propose", icon: FiFileText, label: "MAKE THE WORK SPECIFIC", heading: "An idea people can evaluate.", copy: "Set out the outcome, the funding needed and what delivery looks like. Community proposals follow their local validation rules before a vote opens.", tags: ["Scope", "Budget", "Proposal bond"], panel: "A proposal is a commitment, not just a pitch.", detail: "A clear description gives validators and supporters something concrete to assess." },
  { title: "Validate", icon: FiShield, label: "CHECK BEFORE THE VOTE", heading: "Give proposals a proper review.", copy: "Community Validators review submissions against local rules. Membership, role permissions and configured thresholds determine who can take part in each action.", tags: ["Local roles", "Validation window", "Thresholds"], panel: "Different responsibilities. Explicit permissions.", detail: "Validators, Members and Admins have distinct responsibilities within a Community." },
  { title: "Decide", icon: FiUsers, label: "TURN SUPPORT INTO A DECISION", heading: "Put collective conviction on record.", copy: "Communities use Binary proposals or Slate rounds to make decisions. USDC-backed participation follows the voting settings chosen for that Community, not a universal one-person-one-vote promise.", tags: ["Binary voting", "Slate rounds", "USDC weight"], panel: "A decision with an onchain trail.", detail: "Proposal state, support and results can be inspected through the app, indexer and explorer." },
  { title: "Deliver", icon: FiCheck, label: "FOLLOW THROUGH, IN STAGES", heading: "Approved does not mean paid in full.", copy: "V3.2.1 execution uses milestone proof, eligible supporter review and fresh Admin quorum for every tranche. Execution recipients cannot review their own delivery. Refunds and deadlines follow the plan's actual state.", tags: ["Proof + review", "Admin quorum", "Refund paths"], panel: "Execution has its own checkpoints.", detail: "A successful vote starts the delivery process. It does not bypass the Treasury's execution rules." },
];

export function ProtocolJourney() {
  const [step, setStep] = useState(0);
  const current = journey[step];
  const Icon = current.icon;
  return <div className={styles.journey}>
    <div className={styles.journeyTabs} role="tablist" aria-label="Community proposal journey">{journey.map((item, index) => <button key={item.title} id={`journey-tab-${index}`} type="button" role="tab" aria-controls="journey-panel" aria-selected={step === index} tabIndex={step === index ? 0 : -1} onClick={() => setStep(index)} onKeyDown={(event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault(); const next = event.key === "Home" ? 0 : event.key === "End" ? 3 : (step + (event.key === "ArrowRight" ? 1 : 3)) % 4;
      setStep(next); document.getElementById(`journey-tab-${next}`)?.focus();
    }}><item.icon aria-hidden /><span>{item.title}</span></button>)}</div>
    <div id="journey-panel" role="tabpanel" aria-labelledby={`journey-tab-${step}`} className={styles.journeyPanel} tabIndex={0}>
      <div className={styles.journeyCopy} key={current.title}><p className={styles.kicker}>{current.label}</p><h3>{current.heading}</h3><p>{current.copy}</p><a href="/how-it-works">Read the full flow <FiPlus aria-hidden /></a></div>
      <div className={styles.journeyDiagram}><div className={styles.journeyOrbit}><span /><span /><Icon aria-hidden /></div><strong>{current.panel}</strong><p>{current.detail}</p><div className={styles.journeyTags}>{current.tags.map((tag) => <span key={tag}>{tag}</span>)}</div><small>V3.2.1 FLOW EXPLAINER / NOT LIVE STATE</small></div>
    </div>
  </div>;
}

const technologies = [
  { name: "Arc", detail: "Testnet network", href: "https://www.arc.network", image: "/arc-logo.png" },
  { name: "USDC", detail: "Funding asset", href: "https://www.circle.com/usdc", image: "/usdc-logo.svg" },
  { name: "Circle", detail: "USDC issuer", href: "https://www.circle.com", icon: SiCircle },
  { name: "Solidity", detail: "Smart contracts", href: "https://soliditylang.org", icon: SiSolidity },
  { name: "The Graph", detail: "Protocol indexing", href: "https://thegraph.com", image: "/landing/thegraph.png" },
  { name: "Ethereum", detail: "EVM standards, on Arc", href: "https://ethereum.org/developers/docs/evm/", icon: SiEthereum },
  { name: "World ID", detail: "Planned verification", href: "https://world.org/world-id", icon: FiGlobe },
  { name: "Next.js", detail: "Web application", href: "https://nextjs.org", icon: SiNextdotjs },
  { name: "Three.js", detail: "Particle animation", href: "https://threejs.org", icon: SiThreedotjs },
];

export function TechnologyRail() {
  const [paused, setPaused] = useState(false);
  const { paused: pagePaused, setPaused: setPagePaused } = useLandingMotion();
  const effectivePaused = paused || pagePaused;
  useEffect(() => { setPaused(matchMedia("(prefers-reduced-motion: reduce)").matches); }, []);
  return <section className={styles.techSection} aria-labelledby="tech-title"><div className={styles.techIntro}><p className={styles.kicker}>BUILT WITH OPEN TOOLS</p><h2 id="tech-title">Big ideas.<br /><span>Solid foundations.</span></h2><p>The networks, standards and software behind BERT. Each has a specific job.</p><button type="button" aria-label={effectivePaused ? "Play technology carousel" : "Pause technology carousel"} aria-pressed={effectivePaused} onClick={() => { if (effectivePaused) { setPagePaused(false); setPaused(false); } else { setPaused(true); } }}>{effectivePaused ? <FiPlay /> : <FiPause />}{effectivePaused ? "Play motion" : "Pause motion"}</button></div>
    <div className={styles.techWindow} data-paused={effectivePaused}><div className={styles.techTrack}>{[0, 1].map((copy) => <div className={styles.techSet} key={copy} aria-hidden={copy === 1 || undefined}>{technologies.map(({ icon: Icon, ...item }) => <a key={item.name} href={item.href} target="_blank" rel="noreferrer" tabIndex={copy ? -1 : 0} className={styles.techItem}>{item.image ? <Image src={item.image} alt="" width={48} height={48} /> : Icon ? <Icon aria-hidden /> : null}<span><strong>{item.name}</strong><small>{item.detail}</small></span></a>)}</div>)}</div></div>
    <p className={styles.techNote}>Technology use is not a partnership or endorsement. World ID is the planned production-verification route; Arc Testnet currently uses Demo verification.</p>
  </section>;
}

export function ConsoleLaptop() {
  return <a className={styles.laptopLink} href="https://bertdao-console.vercel.app" target="_blank" rel="noreferrer" aria-label="Open BERT Console Beta in a new tab">
    <div className={styles.laptop}><div className={styles.laptopScreen}><span className={styles.laptopCamera} aria-hidden /><Image src="/landing/console-snapshot.png" alt="Actual BERT Console overview showing protocol navigation, funding and community monitoring. Screenshot captured November 25, 2026; not a live embed." width={1440} height={1000} sizes="(max-width: 760px) 94vw, 1050px" /><div className={styles.screenAction}>Explore BERT Console <FiPlus aria-hidden /></div></div><div className={styles.laptopHinge} /><div className={styles.laptopBase}><span /></div><div className={styles.laptopShadow} /></div>
  </a>;
}
