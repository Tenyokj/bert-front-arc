import Image from "next/image";
import Link from "next/link";
import { FiCode, FiDatabase, FiEye, FiFileText, FiGithub, FiLayers, FiLock, FiPlus, FiShield, FiUsers } from "react-icons/fi";
import { LandingLayers, LandingPayout, LandingReveal } from "./LandingExperience";
import { ConsoleLaptop, ProtocolJourney, TechnologyRail } from "./LandingMore";
import { WorldAvailability } from "./WorldAvailability";
import { FooterMotionControl } from "./LandingMotion";
import styles from "./landing-main.module.css";

const paths = [
  { icon: FiFileText, label: "I have an idea", title: "Give good work a starting point.", copy: "Present the problem, the outcome and the budget. Let support become a funding decision, then demonstrate progress through milestones.", href: "/ideas/new", action: "Create an idea", more: "Start by reading an existing proposal and the grant rules. An author bond and eligibility checks apply to onchain submissions." },
  { icon: FiUsers, label: "I want to participate", title: "Back more than a headline.", copy: "Compare proposals, understand the risks and support work with test USDC. Eligible winning backers have a role in reviewing later grant milestones.", href: "/rounds", action: "Explore rounds", more: "Backing is not buying equity. Voting weight, settlement and refund rules depend on the round; read them before committing funds." },
  { icon: FiLayers, label: "We are a community", title: "Make collective decisions your own.", copy: "Create a Community with its own membership, treasury and governance settings. Give proposal review, voting and execution distinct responsibilities.", href: "/v3", action: "Explore Communities", more: "Community roles are local, not automatically inherited from the global protocol. Existing Communities keep their deployed contract generation." },
];

const footerGroups = [
  { title: "Protocol", links: [["How it works", "/how-it-works"], ["Protocol metrics", "/protocol-stats"], ["Governance stack", "/governance-stack"], ["Governance policies", "/policy-docs"], ["Voting rules", "/on-chain-votes"], ["Treasury policies", "/treasury-policies"], ["Security & limitations", "/security-roadmap"], ["Responsible disclosure", "/bug-bounty"]] },
  { title: "Application", links: [["Dashboard", "/app"], ["Ideas", "/ideas"], ["Create an idea", "/ideas/new"], ["Funding rounds", "/rounds"], ["Funding pool", "/pool"], ["Communities", "/v3"], ["Isolated demo", "/demo"]] },
  { title: "Learn", links: [["Documentation", "https://bertdao-docs.vercel.app"], ["Whitepaper", "https://bertdao-docs.vercel.app/whitepaper/BERTDAO-Protocol-Whitepaper.pdf"], ["Testnet guide", "/testnet-information"], ["FAQ", "/faq"], ["Developer guide", "/developer-guide"], ["Release history", "https://github.com/Tenyokj/bert-core-arc/releases"]] },
  { title: "Open source", links: [["Core contracts", "https://github.com/Tenyokj/bert-core-arc"], ["Frontend", "https://github.com/Tenyokj/bert-front-arc"], ["Backend", "https://github.com/Tenyokj/bert-backend-arc"], ["Documentation source", "https://github.com/Tenyokj/bert-docs-arc"], ["Console source", "https://github.com/Tenyokj/bert-console-arc"], ["Contribute", "https://github.com/Tenyokj/bert-core-arc/blob/arc-usdc-migration/CONTRIBUTING.md"]] },
  { title: "Explore", links: [["Console overview", "https://bertdao-console.vercel.app"], ["Data explorer", "https://bertdao-console.vercel.app/explore"], ["Query Studio", "https://bertdao-console.vercel.app/console"], ["Deployments", "https://bertdao-console.vercel.app/deployments"], ["Arc explorer", "https://testnet.arcscan.app"], ["USDC faucet", "https://faucet.circle.com"]] },
];

export function LandingMain() {
  return <div className={styles.flow}>
    <section id="protocol" className={`${styles.storySection} ${styles.section}`} aria-labelledby="protocol-title"><div className={styles.wrap}>
      <LandingReveal><div className={styles.storyHeading}><p className={styles.kicker}>TWO DEPLOYED LAYERS / ARC TESTNET</p><h2 id="protocol-title">From a proposal<br /><span>to reviewed execution.</span></h2><div className={styles.storyIntro}><p>The global funding layer runs USDC-backed funding rounds. Authors submit ideas with funding targets; backers commit pledges, and winning grants follow the round&apos;s snapshotted payout and review rules.</p><p>The Community layer adds an isolated treasury, local membership and configurable governance. Communities validate proposals, use Binary or Slate voting, and authorize execution through milestones and role-based thresholds.</p></div></div></LandingReveal>
      <div className={styles.releaseFacts} aria-label="Current public testnet release scope"><div><span>Global funding</span><strong>V2.4</strong><p>FundingPool upgrade and RevenueTreasury deployed. Revenue policy activation is separate; check the app for current state.</p><a href="/docs/V2.4-ARC-TESTNET-RELEASE.md" target="_blank" rel="noreferrer">Rollout record <FiPlus aria-hidden /></a></div><div><span>Community layer</span><strong>V3.2.1</strong><p>Milestone execution with Admin quorum. Existing Communities retain their original deployed contract generation.</p><a href="https://bertdao-console.vercel.app/deployments" target="_blank" rel="noreferrer">Inspect deployments <FiPlus aria-hidden /></a></div><div><span>Release boundaries</span><strong>Testnet</strong><p>Chain 5042002. Demo verification is not proof of personhood. No completed independent audit or mainnet-readiness claim.</p><Link href="/security-roadmap">Security &amp; limitations <FiPlus aria-hidden /></Link></div></div>
      <div className={styles.pathCards}>{paths.map(({ icon: Icon, ...path }) => <article key={path.href}><div className={styles.pathIcon}><Icon aria-hidden /></div><span className={styles.pathLabel}>{path.label}</span><h3>{path.title}</h3><p>{path.copy}</p><details><summary>Before you start <FiPlus aria-hidden /></summary><p>{path.more}</p></details><Link href={path.href}>{path.action} <FiPlus aria-hidden /></Link></article>)}</div>
      <div className={styles.sectionLead}><div><p className={styles.kicker}>TWO LAYERS. DIFFERENT RESPONSIBILITIES.</p><h3>A funding round.<br />Or a whole Community.</h3></div><p>Switch between the global funding flow and community-local governance. The roles and treasury rules are different; neither should be mistaken for an unrestricted shared wallet.</p></div>
      <LandingLayers />
    </div></section>

    <section className={`${styles.journeySection} ${styles.section}`} aria-labelledby="journey-title"><div className={styles.wrap}>
      <div className={styles.sectionLead}><div><p className={styles.kicker}>INSIDE A COMMUNITY</p><h2 id="journey-title">Decisions are a beginning.<br /><span>Not the finish line.</span></h2></div><p>A Community has a lifecycle, not just a voting button. Explore how a proposal moves from a concrete request to reviewed execution.</p></div><ProtocolJourney />
      <div className={styles.guardrails}><div><FiLock aria-hidden /><p><strong>Funds have obligations.</strong> Reserved execution funds are not the same as freely withdrawable balance.</p></div><div><FiUsers aria-hidden /><p><strong>Review has boundaries.</strong> In V3.2.1, the execution recipient cannot approve their own milestone review.</p></div><div><FiShield aria-hidden /><p><strong>Authority is explicit.</strong> V3.2.1 adds fresh Admin quorum to each execution tranche, including the initial release.</p></div></div>
    </div></section>

    <section id="funding" className={`${styles.fundingSection} ${styles.section}`} aria-labelledby="funding-title"><div className={styles.wrap}>
      <div className={styles.sectionLead}><div><p className={styles.kicker}>GLOBAL FUNDING / FOLLOW THE USDC</p><h2 id="funding-title">Support becomes funding.<br /><span>Progress unlocks the rest.</span></h2></div><p>Backer-governed V2 grants release the author&apos;s net grant in 20 / 40 / 40 tranches, after the round&apos;s snapshotted fee. Later tranches require milestone proof and eligible winning-backer review. Explore the example below.</p></div><LandingPayout />
      <div className={styles.treasuryCallout}><FiEye aria-hidden /><div><strong>Money in custody is not team revenue.</strong><p>V2.4 distinguishes recorded custody, reserve and earned eligible fee credit. Bonds, refundable pledges, unearned fees and direct top-ups are not a team withdrawal allowance. No investor shares. No promised APY.</p></div><Link href="/treasury-policies">Treasury rules <FiPlus aria-hidden /></Link></div>
    </div></section>

    <WorldAvailability />
    <TechnologyRail />

    <section id="console" className={styles.consoleSection} aria-labelledby="console-title"><div className={styles.wrap}>
      <LandingReveal><div className={styles.consoleHeading}><span className={styles.consoleTag}>BERT CONSOLE / V0.1.0 BETA</span><h2 id="console-title">Don&apos;t take our word for it.<br /><span>Take a closer look.</span></h2><p>Your read-only window into BERT: funding, Communities, treasuries, deployments and the records behind them. Browse the protocol or write your own query.</p><a className={styles.solidButton} href="https://bertdao-console.vercel.app" target="_blank" rel="noreferrer">Open BERT Console <FiPlus aria-hidden /></a></div></LandingReveal>
      <ConsoleLaptop /><p className={styles.consoleCaption}>Actual Console screenshot · 25 November 2026 · Not a live embed</p>
      <div className={styles.consoleFeatures}><div><FiLayers aria-hidden /><h3>Monitor the layers.</h3><p>Follow global funding and Community activity, with source and indexer state visible.</p></div><div><FiDatabase aria-hidden /><h3>Explore the records.</h3><p>Browse indexed collections and inspect deployed proxy and implementation addresses.</p></div><div><FiCode aria-hidden /><h3>Ask your own questions.</h3><p>Use Query Studio for read-only GraphQL. No wallet, signatures or transactions needed.</p></div></div>
    </div></section>

    <section id="get-involved" className={`${styles.joinSection} ${styles.section}`} aria-labelledby="join-title"><div className={styles.wrap}>
      <div className={styles.joinHeading}><div><p className={styles.kicker}>OPEN SOURCE. STILL EARLY.</p><h2 id="join-title">Build the next<br /><span>chapter with us.</span></h2></div><div><p>BERT is a testnet product looking for real feedback, contributors and communities willing to try a complete funding flow. Start with one useful contribution, not a promise to do everything.</p><a className={styles.lightButton} href="https://github.com/Tenyokj/bert-core-arc/blob/arc-usdc-migration/CONTRIBUTING.md" target="_blank" rel="noreferrer">Find your first contribution <FiGithub aria-hidden /></a></div></div>
      <div className={styles.contributionRoles}>{["Testers & QA", "Frontend", "Solidity", "Security review", "Docs & education", "Community & content"].map((role) => <span key={role}><FiPlus aria-hidden />{role}</span>)}</div>
      <div className={styles.caution}><FiShield aria-hidden /><p><strong>Open does not mean risk-free.</strong> BERT is under active development. Independent audit is not complete; known findings and privileged roles are documented. Testing participation does not promise a token, payment or future reward.</p><Link href="/security-roadmap">Read the limitations</Link></div>
      <div className={styles.questions}><details open><summary>Do I need a wallet to explore?<FiPlus aria-hidden /></summary><p>No. The site, documentation and Console can be explored without a wallet. Public testnet onchain actions need a compatible wallet, test tokens and any verification or role requirements for that action.</p></details><details><summary>Is this real money?<FiPlus aria-hidden /></summary><p>No. The current deployment is on Arc Testnet. Test assets have no monetary value. BERT does not offer deposit interest, investor shares or guaranteed returns.</p></details><details><summary>Do I need to visit an Orb now?<FiPlus aria-hidden /></summary><p>No. BERT&apos;s current Arc Testnet flow uses clearly labelled Demo verification. It proves nothing about a real person. Production World ID verification is a separate planned requirement; the availability map is context, not a country blocklist.</p></details><details><summary>What does V2.4 change?<FiPlus aria-hidden /></summary><p>The upgraded FundingPool and immutable ProtocolRevenueTreasury add transparent accounting and revenue from eligible earned fees, not user principal. Policy activation is a separate onchain action. The app displays its current state; new eligible rounds snapshot the policy when opened.</p></details></div>
    </div></section>
  </div>;
}

export function LandingFooter() {
  return <footer className={styles.footer}>
    <div className={styles.footerGlow} aria-hidden />
    <div className={styles.wrap}>
      <div className={styles.footerOpening}><div><Image src="/bert-logo.png" alt="BERT" width={50} height={50} /><p>From collective conviction.<br /><strong>To something that exists.</strong></p></div><div><Link className={styles.lightButton} href="/app">Launch app <FiPlus aria-hidden /></Link><a className={styles.outlineButton} href="https://github.com/Tenyokj/bert-core-arc" target="_blank" rel="noreferrer">Explore the source <FiGithub aria-hidden /></a></div></div>
      <nav className={styles.footerNavigation} aria-label="Footer navigation">{footerGroups.map((group) => <div key={group.title}><h3>{group.title}</h3>{group.links.map(([label, href]) => <a key={href} href={href} {...(href.startsWith("https:") ? { target: "_blank", rel: "noreferrer" } : {})}>{label}</a>)}</div>)}</nav>
      <div className={styles.footerSocial}><div><a href="https://t.me/bertdao" target="_blank" rel="noreferrer">Telegram</a><a href="https://www.youtube.com/@bertdaoARC" target="_blank" rel="noreferrer">YouTube</a><a href="mailto:bertdaoarc@gmail.com">Email</a></div><div><Link href="/privacy-notice">Privacy</Link><Link href="/terms-of-use">Terms</Link><a href="#main-content">Back to top</a></div></div>
      <div className={styles.footerLegal}><span>© 2026 BERTDAO · Open source under GPL-3.0</span><FooterMotionControl className={styles.motionControl} /><span>Built for Arc Testnet. Test assets have no monetary value.</span></div>
    </div><div className={styles.cutWord} aria-hidden><span>BERTDAO</span></div>
  </footer>;
}
