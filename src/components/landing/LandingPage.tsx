import type { Metadata } from "next";
import Link from "next/link";
import { DM_Sans, Outfit } from "next/font/google";
import { FiCode, FiEye, FiLayers, FiShield, FiUsers } from "react-icons/fi";
import { NewsCarousel } from "@/components/NewsCarousel";
import { LandingHeader, LandingHeroArt } from "./LandingExperience";
import { LandingMain, LandingFooter } from "./LandingMain";
import { LandingMotion } from "./LandingMotion";
import styles from "./landing.module.css";

const display = Outfit({ subsets: ["latin"], variable: "--landing-display", display: "swap" });
const body = DM_Sans({ subsets: ["latin"], variable: "--landing-body", display: "swap" });

export const metadata: Metadata = {
  title: "BERTDAO | Fund ideas. Follow through.",
  description: "USDC-backed funding and community governance on Arc Testnet. Propose an idea, back a decision and follow milestone-based execution with BERTDAO.",
};

export default function LandingPage() {
  return (
    <div className={`${styles.landing} ${display.variable} ${body.variable}`}>
      <LandingMotion>
      <a className={styles.skip} href="#main-content">Skip to content</a>
      <div className={styles.heroShell}>
        <LandingHeader />
        <div id="main-content">
          <LandingHeroArt />
          <section id="introduction" className={`${styles.hero} ${styles.container}`} aria-labelledby="hero-title">
            <div className={styles.heroCopy}>
              <p className={styles.eyebrow}><span className={styles.redLine} /> BERT PROTOCOL / BUILT ON ARC</p>
              <h1 id="hero-title">Fund what matters.<br />Build it <span>together.</span></h1>
              <p className={styles.heroDescription}>Propose something worth building. Back it with USDC. Fund its delivery, one milestone at a time.</p>
              <div className={styles.actions}>
                <Link className={styles.primary} href="/app">Launch app <span className={styles.buttonMark} aria-hidden>+</span></Link>
                <Link className={styles.secondary} href="/demo">Demo dApp</Link>
                <Link className={styles.heroTextLink} href="/how-it-works">How it works</Link>
              </div>
              <p className={styles.heroNote}>Explore first. No wallet needed for the demo or documentation.</p>
            </div>
            <div className={styles.heroAside}>
              <span className={styles.asideAccent} aria-hidden>+</span>
              <p>One protocol.<br /><strong>Two funding and governance layers.</strong></p>
              <p>Global funding rounds or your own Community. Clear voting rules, isolated community treasuries, and execution you can follow onchain.</p>
              <Link href="/v3">Explore Communities <FiUsers aria-hidden /></Link>
            </div>
            <div className={styles.heroMetrics} aria-label="Protocol facts, not live activity totals">
              <article><FiLayers aria-hidden /><span>Connected layers</span><strong>02<span> / V2 + V3</span></strong><p>Global funding and independent Communities.</p></article>
              <article><FiShield aria-hidden /><span>Backer-reviewed V2 grants</span><strong>20<span> / </span>40<span> / </span>40</strong><p>Initial funding. Progress review. Delivery review.</p></article>
              <article><FiEye aria-hidden /><span>Funding asset</span><strong>USDC</strong><p>Test stablecoins. No investor shares or promised yield.</p></article>
              <article><FiCode aria-hidden /><span>Protocol source</span><strong>Open<span> / GPL-3.0</span></strong><p>Read the contracts, tests and known limitations.</p></article>
            </div>
          </section>
        </div>
      </div>

      <main>
        <div id="updates" className={styles.productionNews}><NewsCarousel /></div>
        <LandingMain />
      </main>
      <LandingFooter />
      </LandingMotion>
    </div>
  );
}
