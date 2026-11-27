"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { FiCheck, FiCircle, FiCode, FiDollarSign, FiFileText, FiLayers, FiMenu, FiPlus, FiUsers, FiX } from "react-icons/fi";
import HeroLogo3DClient from "@/components/HeroLogo3DClient";
import { newsItems } from "@/lib/news";
import { fundingExample, grantStages } from "@/lib/landing-funding";
import styles from "./landing.module.css";
import { useLandingMotion } from "./LandingMotion";

export function LandingHeader() {
  const isHome = usePathname() === "/";
  const nav = [{ label: "The protocol", href: isHome ? "#protocol" : "/#protocol" }, { label: "Communities", href: "/v3" }, { label: "Console", href: "https://bertdao-console.vercel.app" }, { label: "Docs", href: "https://bertdao-docs.vercel.app" }];
  const [open, setOpen] = useState(false);
  const menu = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    function onEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && menu.current?.open) {
        menu.current.open = false;
        menu.current.querySelector("summary")?.focus();
      }
    }
    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, []);
  return (
    <header className={`${styles.header} ${styles.container}`}>
      <Link className={styles.brand} href="/" aria-label="BERTDAO home"><Image src="/bert-logo.png" width={42} height={42} alt="" priority /><span>BERT</span></Link>
      <nav className={styles.desktopNav} aria-label="Main navigation">{nav.map((item) => <a key={item.href} href={item.href}>{item.label}</a>)}</nav>
      <div className={styles.headerActions}><Link href="/app" className={styles.headerLaunch}>Launch app <FiPlus aria-hidden /></Link></div>
      <details ref={menu} className={styles.mobileNav} onToggle={(event) => setOpen(event.currentTarget.open)}>
        <summary aria-label={open ? "Close navigation" : "Open navigation"}>{open ? <FiX /> : <FiMenu />}</summary>
        <nav aria-label="Mobile navigation">{nav.map((item) => <a key={item.href} href={item.href} onClick={() => { if (menu.current) menu.current.open = false; }}>{item.label}</a>)}<a href={isHome ? "#updates" : "/#updates"} onClick={() => { if (menu.current) menu.current.open = false; }}>News</a></nav>
      </details>
    </header>
  );
}

export function LandingHeroArt() {
  const { paused } = useLandingMotion();
  return (
    <section className={styles.heroArt} aria-label="BERT and Arc particle animation">
      <div className={styles.stageGlow} aria-hidden />
      <div className={styles.stageGrid} aria-hidden />
      <div className={styles.stageTop}><span>BERTDAO PROTOCOL</span><span>ON ARC TESTNET / 5042002</span></div>
      <div className={styles.orbitCore} role="img" aria-label="Animated particles forming the BERT and Arc logos"><HeroLogo3DClient className={styles.logoCanvas} paused={paused} framing="immersive" /></div>
      <span className={styles.stageWordmark} aria-hidden>BERT</span>
      <div className={styles.stageBottom}>
        <a href="#introduction" className={styles.stageExplore}><span className={styles.scrollIndicator} aria-hidden /><span>From an idea.<br /><strong>To something that exists.</strong></span></a>
        <span className={styles.stageStatus}>IDEAS / PEOPLE / POSSIBILITIES</span>
      </div>
    </section>
  );
}

const layers = [
  { tab: "Global funding", version: "V2.4", label: "ONE IDEA. A CLEAR PATH TO FUNDING.", title: "Put your idea in motion.", description: "Submit a proposal with a funding target. Backers commit USDC to the idea they choose. A viable winner receives funding through milestone-based grant delivery.", steps: [{ icon: FiFileText, title: "Propose", detail: "An idea, a target, an author bond." }, { icon: FiUsers, title: "Back", detail: "USDC pledges determine support." }, { icon: FiCheck, title: "Deliver", detail: "Proof, review, staged grant payouts." }], href: "/rounds", action: "Explore funding rounds", tag: "LOSING PLEDGES HAVE A REFUND PATH", visualTitle: "From support to delivery", visualNote: "V2.3 grant rules retained in V2.4", center: "Winning idea", legend: ["Author bond", "Voting pledges", "Grant escrow"] },
  { tab: "Community governance", version: "V3.2.1", label: "YOUR COMMUNITY. ITS OWN RULES.", title: "Build a place for collective decisions.", description: "Create a Community with its own treasury, membership and governance settings. Validate proposals, run Binary or Slate votes, then authorize execution with milestones and Admin quorum.", steps: [{ icon: FiLayers, title: "Create", detail: "An isolated Hub and Treasury." }, { icon: FiUsers, title: "Decide", detail: "Community-local roles and voting." }, { icon: FiCheck, title: "Execute", detail: "Supporter review plus Admin quorum." }], href: "/v3", action: "Explore Communities", tag: "ISOLATED TREASURY / LOCAL GOVERNANCE", visualTitle: "A shared decision, clear boundaries", visualNote: "Existing Communities retain their own contracts", center: "Community Hub", legend: ["Members", "Validators", "Admins"] },
] as const;

export function LandingLayers() {
  const [selected, setSelected] = useState(0);
  const layer = layers[selected];
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  return (
    <div className={styles.layers}>
      <div className={styles.layerTabs} role="tablist" aria-label="Protocol layer" onKeyDown={(event) => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        const next = event.key === "Home" ? 0 : event.key === "End" ? 1 : 1 - selected;
        setSelected(next); tabs.current[next]?.focus();
      }}>{layers.map((item, index) => <button ref={(node) => { tabs.current[index] = node; }} id={`layer-tab-${index}`} key={item.tab} role="tab" type="button" aria-selected={selected === index} aria-controls="layer-panel" tabIndex={selected === index ? 0 : -1} onClick={() => setSelected(index)}>{item.tab}<span>{item.version}</span></button>)}</div>
      <div id="layer-panel" role="tabpanel" aria-labelledby={`layer-tab-${selected}`} className={styles.layerPanel} tabIndex={0}>
        <div key={`${selected}-copy`} className={styles.layerCopy}><p className={styles.eyebrow}>{layer.label}</p><h3>{layer.title}</h3><p>{layer.description}</p><div className={styles.layerSteps}>{layer.steps.map(({ icon: Icon, title, detail }) => <div key={title}><Icon aria-hidden /><div><strong>{title}</strong><span>{detail}</span></div></div>)}</div><Link className={styles.darkButton} href={layer.href}>{layer.action}<FiPlus aria-hidden /></Link></div>
        <div key={`${selected}-visual`} className={`${styles.layerVisual} ${selected === 1 ? styles.layerViolet : ""}`}>
          <div className={styles.visualTop}><span>{layer.version}</span><FiCode aria-hidden /><span>PROTOCOL FLOW</span></div><p className={styles.visualTitle}>{layer.visualTitle}</p>
          <div className={styles.flowDiagram} aria-label={`${layer.center}: ${layer.legend.join(", ")}`}>
            <svg viewBox="0 0 400 260" fill="none" className={styles.flowLines} aria-hidden><path d="M75 65H155Q200 65 200 115M325 65H245Q200 65 200 115M200 145V216" /><circle cx="200" cy="130" r="53" /><circle cx="200" cy="130" r="70" strokeDasharray="3 9" /></svg>
            <div className={styles.flowNodeLeft}><FiDollarSign aria-hidden /><span>{layer.legend[0]}</span></div><div className={styles.flowNodeRight}><FiUsers aria-hidden /><span>{layer.legend[1]}</span></div>
            <div className={styles.flowCenter}><Image src="/bert-logo.png" alt="" width={52} height={52} /><strong>{layer.center}</strong></div><div className={styles.flowNodeBottom}><FiLayers aria-hidden /><span>{layer.legend[2]}</span></div>
          </div>
          <div className={styles.visualBottom}><FiCircle aria-hidden /><span>{layer.tag}</span></div><p className={styles.visualNote}>{layer.visualNote}. Simplified illustration, not live data.</p>
        </div>
      </div>
    </div>
  );
}

const money = (amount: number) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(amount);

export function LandingPayout() {
  const [pledges, setPledges] = useState(1000);
  const [stage, setStage] = useState(0);
  const result = fundingExample(pledges, stage);
  return (
    <div className={styles.payout}>
      <div className={styles.payoutControls}>
        <div className={styles.exampleLabel}><span>EXPLORE THE MECHANICS</span><span>ILLUSTRATIVE, NOT LIVE</span></div>
        <h3>Same funds.<br /><span>Every step accounted for.</span></h3>
        <label className={styles.amountLabel} htmlFor="example-pledges">Winning pledges<output htmlFor="example-pledges">{money(pledges)} <span>USDC</span></output></label>
        <input id="example-pledges" type="range" min={100} max={10000} step={100} value={pledges} onChange={(event) => setPledges(Number(event.target.value))} aria-valuetext={`${money(pledges)} USDC`} />
        <div className={styles.rangeLabels}><span>100 USDC</span><span>10,000 USDC</span></div>
        <div className={styles.stagePicker} role="group" aria-label="Illustrative grant stage">{grantStages.map((item, index) => <button key={item.label} type="button" aria-pressed={stage === index} onClick={() => setStage(index)}><span>{index === 0 ? "20%" : "+40%"}</span>{item.label}</button>)}</div>
        <p className={styles.stageDescription}>{grantStages[stage].detail}</p>
      </div>
      <div className={styles.payoutResults}>
        <div className={styles.payoutResultHeading}><span>WHERE THE PLEDGES ARE NOW</span><span>{grantStages[stage].progress}% paid out</span></div>
        <div className={styles.allocationBar} role="img" aria-label={`${money(result.author)} to author, ${money(result.reserve)} retained reserve, ${money(result.revenue)} Treasury credit, ${money(result.escrow)} remaining escrow`}><span style={{ flexBasis: `${result.author / pledges * 100}%` }} /><span style={{ flexBasis: `${result.reserve / pledges * 100}%` }} /><span style={{ flexBasis: `${result.revenue / pledges * 100}%` }} /><span style={{ flexBasis: `${result.escrow / pledges * 100}%` }} /></div>
        <dl className={styles.allocationList} aria-live="polite" aria-atomic="true">
          <div><dt><i />Paid to the author</dt><dd>{money(result.author)}<span>USDC</span></dd></div>
          <div><dt><i />Retained protocol reserve</dt><dd>{money(result.reserve)}<span>USDC</span></dd></div>
          <div><dt><i />Earned Treasury credit</dt><dd>{money(result.revenue)}<span>USDC</span></dd></div>
          <div><dt><i />Remaining grant &amp; fee escrow</dt><dd>{money(result.escrow)}<span>USDC</span></dd></div>
        </dl>
        <p className={styles.exampleDisclaimer}>Example only: a fully pledge-funded grant, a 5% round fee and 20% of eligible earned fees to Treasury. Assumes the policy was activated before the round opened. No reserve subsidy. Fee credit vests with payouts; collection and beneficiary payment are separate actions.</p>
        <Link href="/treasury-policies" className={styles.payoutLink}>Read the actual treasury rules <FiPlus aria-hidden /></Link>
      </div>
    </div>
  );
}

const newsHeadlines: Record<string, { title: string; label: string }> = {
  "v2-4-transparent-treasury": { title: "A clearer picture of every USDC.", label: "V2.4 / TRANSPARENT TREASURY" },
  "v3-2-community-governance": { title: "Community execution, with checkpoints.", label: "V3.2 + V3.2.1 / COMMUNITY GOVERNANCE" },
  "bert-console-beta": { title: "Your public window into the protocol.", label: "BERT CONSOLE / BETA" },
};

export function LandingUpdates() {
  const [selected, setSelected] = useState(0);
  const item = newsItems[selected];
  const headline = newsHeadlines[item.id];
  return (
    <div className={styles.news}>
      <div className={styles.newsImage}><a href={item.href ?? "https://bertdao-docs.vercel.app"} aria-label={`Read more: ${headline?.title ?? item.alt}`}><Image key={item.image} src={item.image} alt={item.alt} width={1600} height={600} sizes="(max-width: 760px) 100vw, 70vw" style={{ aspectRatio: item.aspectRatio ?? "16/6" }} /></a></div>
      <div className={styles.newsCaption} aria-live="polite"><div><span className={styles.eyebrow}>{headline?.label ?? "FROM THE RELEASE ARCHIVE"}</span><h3>{headline?.title ?? item.alt}</h3></div><div className={styles.newsControls}><button type="button" onClick={() => setSelected((selected + newsItems.length - 1) % newsItems.length)} aria-label="Previous release">Previous</button><span>{selected + 1} / {newsItems.length}</span><button type="button" onClick={() => setSelected((selected + 1) % newsItems.length)} aria-label="Next release">Next</button></div></div>
    </div>
  );
}

export function LandingReveal({ children }: { children: ReactNode }) {
  const element = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!element.current || !window.IntersectionObserver || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const node = element.current;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { node.classList.add(styles.revealed); observer.disconnect(); }
    }, { threshold: 0.1 });
    node.classList.add(styles.revealReady);
    observer.observe(node);
    return () => { observer.disconnect(); node.classList.remove(styles.revealReady); };
  }, []);
  return <div ref={element}>{children}</div>;
}
