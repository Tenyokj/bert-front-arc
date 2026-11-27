import Link from "next/link";
import { ProtocolNavigator } from "@/components/dapp/ProtocolNavigator";
import { DappDashboardLiveStats } from "@/components/DappDashboardLiveStats";
import { HumanVerificationPanel } from "@/components/HumanVerificationPanel";
import { RoleBootstrapClaimPanel } from "@/components/RoleBootstrapClaimPanel";
import { RoleBootstrapAddressesShowcase } from "@/components/RoleBootstrapAddressesShowcase";
import styles from "@/components/dapp/workspace.module.css";

const destinations = [
  { title: "Ideas", text: "Proposal context, requested funding and author intent.", href: "/ideas", tag: "DISCOVER" },
  { title: "Rounds", text: "Voting windows, competing ideas, outcomes and pledge refunds.", href: "/rounds", tag: "PARTICIPATE" },
  { title: "Communities", text: "Local membership, validators, governance and execution plans.", href: "/v3", tag: "COORDINATE" },
  { title: "Pool", text: "Public accounting, protocol reserve and voluntary contributions.", href: "/pool", tag: "VERIFY" },
  { title: "Your workspace", text: "Your wallet, ideas, access and recent global-round actions.", href: "/profile", tag: "CONTINUE" },
  { title: "BERT Console", text: "Read-only datasets and queries. No wallet signature required.", href: "https://bertdao-console.vercel.app", tag: "INSPECT DATA" },
];
export default function DappDashboardPage() {
  return <section className={styles.workspace}>
    <ProtocolNavigator />
    <section aria-labelledby="dashboard-records"><div className={styles.sectionHeading}><div><p className={styles.eyebrow}>PROTOCOL RECORDS / NOT A PRICE TICKER</p><h2 id="dashboard-records">A view into the funding layer.</h2></div><Link href="/protocol-stats">See sources and wider metrics ↗</Link></div><p className="mb-5 mt-3 text-sm text-slate-400">V2.4 global accounting. Not a combined total of every Community Treasury, and not money available to withdraw.</p><DappDashboardLiveStats /></section>
    <section className={styles.panel} aria-labelledby="dashboard-directory"><p className={styles.eyebrow}>THE APP AT A GLANCE</p><h2 id="dashboard-directory">Every page has a job.</h2><div className={styles.actionList}>{destinations.map((item) => <Link key={item.href} href={item.href} {...(item.href.startsWith("https:") ? { target: "_blank", rel: "noreferrer" } : {})}><span>{item.tag}</span><strong>{item.title} ↗</strong><p>{item.text}</p></Link>)}</div></section>
    <details id="dashboard-access" className={styles.panel}><summary>Prepare a wallet: verification, testnet roles and bootstrap access</summary><p>Public browsing needs no wallet. Gated actions check your actual onchain access. Arc demo verification is not proof of personhood; eligibility for testnet role claims is separate.</p><HumanVerificationPanel /><RoleBootstrapClaimPanel /><RoleBootstrapAddressesShowcase variant="dashboard" /></details>
    <section className={styles.panel}><p className={styles.eyebrow}>TWO CONNECTED PRODUCTS / DIFFERENT RULES</p><h2>Global grants or a local Community?</h2><p>Global V2.4 keeps existing round modes: backer-governed grants use 20/40/40 of the net grant with winning-supporter milestone review. V3.2 Communities keep their own membership, Treasury and governance lanes; execution payments also need fresh Admin quorum. Existing V3.1 Communities keep their original contracts.</p><div className={styles.quickLinks}><Link href="/how-it-works">Compare the flows ↗</Link><Link href="/treasury-policies">Understand treasury rules ↗</Link><Link href="/testnet-information">Get testnet access ↗</Link></div></section>
  </section>;
}
