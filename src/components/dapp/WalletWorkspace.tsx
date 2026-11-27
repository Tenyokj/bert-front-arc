"use client";

import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { formatUnits } from "viem";
import { useAccount, usePublicClient } from "wagmi";
import { contracts } from "@/lib/contracts";
import { defaultChain } from "@/lib/web3";
import { PROFILE_PAGE_SIZE, readProfileSnapshot, readRecentWalletActions } from "@/lib/profile-snapshot";
import { mapIdeaStatus } from "@/lib/dapp-onchain";
import { Pagination } from "@/components/Pagination";
import { HumanVerificationPanel } from "@/components/HumanVerificationPanel";
import { WalletConnectButton } from "@/components/WalletConnectButton";
import { RevenueAccessLink } from "@/components/RevenueAccessLink";
import { IdeaSummaryCard, utcDate } from "./ProtocolCards";
import { CollectionFilter } from "./CollectionFilter";
import styles from "./workspace.module.css";

const money = (value: bigint | null | undefined) => value == null ? "Unavailable" : `${formatUnits(value, 6)} USDC`;
export function WalletWorkspace() {
  const { address, isConnected, chainId } = useAccount();
  const client = usePublicClient({ chainId: defaultChain.id });
  const search = useSearchParams();
  const pageInput = Number(search.get("page") || 1);
  const requestedPage = Number.isSafeInteger(pageInput) && pageInput > 0 ? pageInput : 1;
  const [copyStatus, setCopyStatus] = useState("");
  const [scanIdentity, setScanIdentity] = useState("");
  const identity = `${defaultChain.id}:${address?.toLowerCase() || ""}`;
  const query = useQuery({ queryKey: ["wallet-workspace", defaultChain.id, address, requestedPage, contracts.ideaRegistry, contracts.fundingPool, contracts.usdc, contracts.reputationSystem, contracts.voterProgression], enabled: !!client && !!address, queryFn: () => readProfileSnapshot(client!, address!, defaultChain.id, requestedPage), staleTime: 15000, retry: 1 });
  const actions = useQuery({ queryKey: ["wallet-recent-actions", identity, contracts.votingSystem, contracts.fundingPool, contracts.ideaRegistry, contracts.grantManager], enabled: !!client && !!address && scanIdentity === identity, queryFn: () => readRecentWalletActions(client!, address!, defaultChain.id), staleTime: 30000, retry: false });
  const snapshot = query.error ? undefined : query.data;
  const progression = snapshot?.progression;
  const selected = snapshot?.ideas.filter((idea) => [2, 3, 5, 6].includes(idea.status)).length;
  const bonds = snapshot?.ideas.every((idea) => idea.lockedStake !== null) ? snapshot.ideas.reduce((sum, idea) => sum + idea.lockedStake!, 0n) : undefined;
  return <section className={styles.workspace}>
    <header className={styles.profileHero}>
      <div className={styles.identicon} aria-hidden="true"><span /><span /><span /></div>
      <div><p className={styles.eyebrow}>YOUR WORKSPACE / {defaultChain.name}</p><h1>Your place in BERT.</h1><p>Wallet access, your proposals and the next action. One wallet is not a universal identity across every Community.</p></div>
      {address && <div className={styles.walletAddress}><code>{address}</code><button type="button" onClick={async () => { try { await navigator.clipboard.writeText(address); setCopyStatus("Address copied."); } catch { setCopyStatus("Copy unavailable. Select the address above to copy it manually."); } }}>Copy address</button><span role="status">{copyStatus}</span></div>}
    </header>
    {!isConnected ? <section className={styles.guest}><div><p className={styles.eyebrow}>NO WALLET REQUIRED TO EXPLORE</p><h2>Your workspace starts with your wallet.</h2><p>Connect to read your own balances, reputation and ideas. Connecting does not send a transaction or prove personhood.</p><WalletConnectButton /></div><div className={styles.steps}><Link href="/demo/profile">Explore a clearly labelled demo profile ↗</Link><Link href="/rounds">Browse public funding rounds ↗</Link><Link href="/v3">Find a Community ↗</Link></div></section> : <>
      <nav aria-label="Workspace sections" className={styles.quickLinks}><a href="#my-ideas">My ideas</a><a href="#my-actions">Recent actions</a><a href="#verification">Access & verification</a><a href="#progression">Reputation & roles</a></nav>
      {chainId !== defaultChain.id && <p className={styles.warning}>Your wallet is on another network. This page reads {defaultChain.name}; switch networks through the wallet menu before signing.</p>}
      <div className={styles.snapshotBar}><span>{snapshot ? `Pinned block ${snapshot.block} · ${snapshot.chain}` : query.isFetching ? "Reading your onchain workspace…" : "No confirmed profile snapshot"}</span><button disabled={query.isFetching} type="button" onClick={() => void query.refetch()}>{query.isFetching ? "Refreshing…" : "Refresh profile"}</button></div>
      {query.error && <details open className={styles.error}><summary>Profile could not be loaded. Unknown values are not zero.</summary><p role="alert">{query.error.message}</p></details>}
      <div className={styles.metrics}>{[
        { label: "Wallet token balance", value: money(snapshot?.balance), note: "ERC-20 USDC; not the native gas balance." },
        { label: "Ideas submitted", value: snapshot?.totalIdeas.toString() ?? "Unavailable", note: "All IDs in this wallet's author index." },
        { label: "Reputation", value: snapshot?.reputation?.toString() ?? "Unavailable", note: snapshot?.initialized === false ? "Contract default score; not initialized yet." : snapshot?.initialized === true ? "Initialized score from ReputationSystem." : "Initialization status not confirmed." },
        { label: "Required author bond", value: money(snapshot?.requiredBond), note: "A creation bond, not a funding target." },
      ].map((metric) => <article key={metric.label}><p>{metric.label}</p><strong>{metric.value}</strong><small>{metric.note}</small></article>)}</div>
      <section id="my-actions" className={styles.panel}>
        <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>NEXT ACTIONS</p><h2>Pick up where you left off.</h2></div><button type="button" disabled={actions.isFetching} onClick={() => { setScanIdentity(identity); if (scanIdentity === identity) void actions.refetch(); }}>{actions.isFetching ? "Checking…" : "Check recent V2 rounds"}</button></div>
        <p>This opt-in read scans at most 8 recent global rounds for your pledges and winning ideas. It is not a full wallet history, a V3 inbox or a transaction submission.</p>
        {actions.isFetching && <p role="status">Reading round state and simulating refunds without sending them…</p>}
        {actions.error && <details open className={styles.error}><summary>Action scan unavailable</summary><p>{actions.error.message}</p></details>}
        {actions.data && !actions.error && <><p className={styles.scope}>{actions.data.lastId === 0n ? "No created rounds" : `Rounds ${actions.data.firstId}–${actions.data.lastId}`} · block {String(actions.data.block)}. Check results again on the destination page.</p>{actions.data.actions.length ? <div className={styles.actionList}>{actions.data.actions.map((action) => <Link key={`${action.round}:${action.title}`} href={action.href}><span>Round #{String(action.round)} / Idea #{String(action.idea)}</span><strong>{action.title} ↗</strong><p>{action.description}</p></Link>)}</div> : <p>No actions found in the successfully read rounds of this limited scan. Something may still be due elsewhere.</p>}{actions.data.errors.length > 0 && <details className={styles.warning}><summary>{actions.data.errors.length} rounds could not be fully checked</summary>{actions.data.errors.map((error) => <p key={String(error.round)}>Round #{String(error.round)}: {error.message}</p>)}</details>}</>}
      </section>
      <RevenueAccessLink />
      <section id="my-ideas" className={styles.panel}>
        <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>YOUR AUTHOR INDEX</p><h2>Ideas with your signature.</h2></div><Link href="/ideas/new" className={styles.primary}>Create an idea ↗</Link></div>
        <p className={styles.scope}>{snapshot ? `${selected} selected/started/completed ideas and ${money(bonds)} in author bonds on this page only. Not lifetime payout totals.` : "Your ideas appear after a confirmed profile read."}</p>
        {snapshot && (snapshot.ideas.length ? <CollectionFilter key={`${identity}:${snapshot.page}`} items={snapshot.ideas} getTitle={(idea) => idea.title} getStatus={(idea) => mapIdeaStatus(idea.status)} renderItem={(idea) => <IdeaSummaryCard key={idea.id} id={idea.id} href={`/ideas/${idea.id}`} title={idea.title} description={idea.description} status={mapIdeaStatus(idea.status)} votes={formatUnits(idea.totalVotes, 6)} details={<><div><dt>Author bond</dt><dd>{money(idea.lockedStake)}</dd></div><div><dt>Created</dt><dd>{utcDate(idea.createdAt)}</dd></div></>} />} /> : <div className={styles.empty}><h3>No ideas in your author index yet.</h3><p>Compare existing rounds first, or prepare your first proposal.</p><Link href="/ideas">Explore other ideas ↗</Link></div>)}
        {snapshot && <Pagination basePath="/profile" currentPage={snapshot.page} totalItems={snapshot.totalIdeas} pageSize={PROFILE_PAGE_SIZE} />}
      </section>
      <section id="progression" className={styles.panel}><p className={styles.eyebrow}>REPUTATION & PROGRESSION</p><h2>Roles are earned, not assumed.</h2><div className={styles.metrics}>{[
        { label: "Winning votes", value: progression?.wins.toString() ?? "Unavailable", note: "Progression counter, not a USDC balance." },
        { label: "Curator", value: progression ? progression.curator ? "Granted" : "Not granted" : "Unavailable", note: progression ? `${progression.toCurator} winning votes remaining per module getter.` : "No confirmed progression read." },
        { label: "Reviewer", value: progression ? progression.reviewer ? "Granted" : "Not granted" : "Unavailable", note: progression ? `${progression.toReviewer} winning votes remaining per module getter.` : "No confirmed progression read." },
      ].map((metric) => <article key={metric.label}><p>{metric.label}</p><strong>{metric.value}</strong><small>{metric.note}</small></article>)}</div><p>Global V2 progression is not a grant of local V3 Admin/Validator/Member permissions. Contracts check actual roles again for each action.</p></section>
      {snapshot && snapshot.errors.length > 0 && <details className={styles.warning}><summary>{snapshot.errors.length} profile fields unavailable</summary>{snapshot.errors.map((error) => <p key={error.label}>{error.label}: {error.message}</p>)}</details>}
    </>}
    <section id="verification" className={styles.panel}><p className={styles.eyebrow}>ACCESS IS A SEPARATE STEP</p><h2>Prepare your wallet.</h2><p>Reading BERT is public. Gated actions may require verification; Arc Testnet demo access is not proof of personhood. A Community has its own membership requirements.</p><HumanVerificationPanel /></section>
    <details className={styles.panel}><summary>How grant payouts differ across versions</summary><p>Legacy V2.2 grants follow reviewer-gated 30/40/30. Backer-governed V2.3 rounds retained in V2.4 follow 20/40/40 of the net grant. V3.2 Communities use their own execution plans and fresh Admin quorum for payments. Open the specific idea or Community for its stored rules.</p></details>
  </section>;
}
