"use client";

import Link from "next/link";
import { useRef, useState, useSyncExternalStore, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAccount, useConfig, usePublicClient, useWriteContract } from "wagmi";
import { getAccount } from "wagmi/actions";
import { encodeFunctionData, getAddress, isAddress, formatUnits, type Address, type Hex } from "viem";
import { contracts, rolesRegistryAbi } from "@/lib/contracts";
import { communityContracts } from "@/lib/community-contracts";
import { defaultChain } from "@/lib/web3";
import { uncertainWalletMessage } from "@/lib/wallet-action";
import { adminContracts, protocolRoles, type AdminContract, type AdminOperation } from "@/lib/admin-catalog";
import { adminRole, explicitlyRejected, inspectProxy, jsonValue, parseAdminArgs, parseAdminIntent, prepareAdminOperation, readAdminIntentReceipt, roleId, type AdminIntent } from "@/lib/admin-engine";
import { RevenueTreasuryPanel } from "@/components/RevenueTreasuryPanel";
import styles from "./admin.module.css";

const tabs = ["overview", "treasury", "governance", "access", "reputation", "infrastructure"] as const;
const labels = { overview: "Overview", treasury: "Treasury & revenue", governance: "Voting & ideas", access: "Access & verification", reputation: "Reputation & progression", infrastructure: "Infrastructure" };
const journalKey = "bert:admin-intent:v1";
type Journal = AdminIntent;
type Review = { contract: AdminContract; operation: AdminOperation; args: readonly unknown[]; current: unknown; account: Address; data: Hex };
type ReadState = { values: Record<string, unknown>; errors: Record<string, string> };
const messageOf = (error: unknown) => error instanceof Error ? error.message : String(error);
const storageSnapshot = () => { try { return window.sessionStorage.getItem(journalKey) || ""; } catch { return "unavailable"; } };
function subscribe(listener: () => void) { window.addEventListener("bert:admin-intent", listener); window.addEventListener("storage", listener); return () => { window.removeEventListener("bert:admin-intent", listener); window.removeEventListener("storage", listener); }; }
function saveJournal(value: Journal | null) {
  if (value) window.sessionStorage.setItem(journalKey, JSON.stringify(value));
  else window.sessionStorage.removeItem(journalKey);
  window.dispatchEvent(new Event("bert:admin-intent"));
}
function valueLabel(value: unknown, unit?: string) {
  if (value === undefined) return "Unavailable / not read";
  if (typeof value === "boolean") return value ? "Enabled" : "Disabled";
  if (typeof value === "bigint") return unit === "usdc" ? `${formatUnits(value, 6)} USDC` : unit === "bps" ? `${value} bps (${Number(value) / 100}%)` : unit === "seconds" ? `${value} seconds (${Number(value) / 3600} hours)` : value.toString();
  return typeof value === "string" ? value : jsonValue(value);
}
function AddressValue({ address }: { address?: string }) {
  const [copied, setCopied] = useState(false);
  return <span className={styles.address}><code>{address || "Not configured"}</code>{address && <button type="button" aria-label={`Copy ${address}`} onClick={async () => { try { await navigator.clipboard.writeText(address); setCopied(true); } catch { setCopied(false); } }}>{copied ? "Copied" : "Copy"}</button>}</span>;
}

export function AdminControlCenter() {
  const account = useAccount();
  const config = useConfig();
  const client = usePublicClient({ chainId: defaultChain.id });
  const { writeContractAsync } = useWriteContract();
  const search = useSearchParams();
  const requested = search.get("tab");
  const tab = tabs.find((item) => item === requested) || "overview";
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [status, setStatus] = useState("No transaction requested.");
  const [error, setError] = useState("");
  const [txHash, setTxHash] = useState<Hex>();
  const [review, setReview] = useState<Review | null>(null);
  const [recoveryHash, setRecoveryHash] = useState("");
  const [lookup, setLookup] = useState("");
  const [inspected, setInspected] = useState<Address>();
  const [proxy, setProxy] = useState<Record<string, Awaited<ReturnType<typeof inspectProxy>>>>({});
  const rawJournal = useSyncExternalStore(subscribe, storageSnapshot, () => "");
  const journal = parseAdminIntent(rawJournal);
  const journalBlocked = Boolean(rawJournal);
  const correctWalletChain = account.chainId === defaultChain.id;
  const permission = useQuery({
    queryKey: ["admin-permission", defaultChain.id, contracts.rolesRegistry, account.address],
    enabled: !!client && !!contracts.rolesRegistry && !!account.address,
    queryFn: () => client!.readContract({ address: contracts.rolesRegistry!, abi: rolesRegistryAbi, functionName: "hasRole", args: [adminRole, account.address!] }),
    staleTime: 0, refetchInterval: 30000,
  });
  const reads = useQuery({
    queryKey: ["admin-snapshot", defaultChain.id, ...adminContracts.map((item) => item.address)],
    enabled: !!client && adminContracts.some((item) => item.address),
    queryFn: async () => {
      if (await client!.getChainId() !== defaultChain.id) throw new Error("RPC chain mismatch.");
      const block = await client!.getBlock();
      const states: Record<string, ReadState> = {};
      // Sequential contracts and two reads per batch keep the operator view bounded.
      for (const item of adminContracts) {
        const state: ReadState = { values: {}, errors: {} };
        if (item.address) for (let start = 0; start < item.reads.length; start += 2) await Promise.all(item.reads.slice(start, start + 2).map(async (method) => {
          try { state.values[method] = await client!.readContract({ address: item.address!, abi: item.abi, functionName: method, blockNumber: block.number }); }
          catch (cause) { state.errors[method] = messageOf(cause); }
        }));
        states[item.id] = state;
      }
      return { block: block.number.toString(), states };
    }, staleTime: 30000, retry: 1,
  });
  const lookupReads = useQuery({
    queryKey: ["admin-inspect-wallet", defaultChain.id, inspected, contracts.rolesRegistry, contracts.popVerifier, contracts.voterProgression, contracts.reputationSystem],
    enabled: !!client && !!inspected,
    queryFn: async () => {
      const rows: { label: string; value: string }[] = [];
      const inspect = async (label: string, target: AdminContract | undefined, method: string, args: readonly unknown[]) => {
        if (!target?.address) { rows.push({ label, value: "Contract not configured" }); return; }
        try { rows.push({ label, value: valueLabel(await client!.readContract({ address: target.address, abi: target.abi, functionName: method, args })) }); }
        catch { rows.push({ label, value: "Unavailable; not assumed false or zero" }); }
      };
      for (const name of protocolRoles) await inspect(name, adminContracts.find((item) => item.registry), "hasRole", [roleId(name), inspected!]);
      await inspect("Verified-human access", adminContracts.find((item) => item.id === "popVerifier"), "isVerifiedHuman", [inspected!]);
      await inspect("Winning votes", adminContracts.find((item) => item.id === "voterProgression"), "getWinningVotes", [inspected!]);
      await inspect("Reputation points", adminContracts.find((item) => item.id === "reputationSystem"), "getReputation", [inspected!]);
      return rows;
    }, retry: false,
  });
  const canPrepare = !!account.address && correctWalletChain && permission.data === true && !busy && !journalBlocked;
  function assertWallet(expected: Address) {
    const current = getAccount(config);
    if (current.address?.toLowerCase() !== expected.toLowerCase() || current.chainId !== defaultChain.id) throw new Error("Wallet or network changed. Review the action again.");
  }
  async function prepare(contract: AdminContract, operation: AdminOperation, values: Record<string, string>) {
    if (lock.current || !canPrepare || !client || !contracts.rolesRegistry || !account.address) return;
    lock.current = true; setBusy(true); setError(""); setReview(null);
    try {
      if (storageSnapshot()) throw new Error("Resolve the saved admin intent before preparing another action.");
      const args = parseAdminArgs(operation, values, protocolRoles);
      assertWallet(account.address);
      const prepared = await prepareAdminOperation(client, contract, operation, args, account.address, contracts.rolesRegistry, defaultChain.id);
      assertWallet(account.address);
      setReview({ contract, operation, args, current: prepared.current, account: account.address, data: encodeFunctionData({ abi: contract.abi, functionName: operation.method, args }) });
      setStatus("Simulation passed. Review the exact action before opening your wallet.");
    } catch (cause) { setError(messageOf(cause)); }
    finally { lock.current = false; setBusy(false); }
  }
  async function confirm() {
    if (lock.current || !review || !client || !contracts.rolesRegistry) return;
    const plan = review;
    lock.current = true; setBusy(true); setError(""); setTxHash(undefined);
    let hash: Hex | undefined;
    let intent: Journal | undefined;
    let receiptObserved = false;
    let walletRequested = false;
    try {
      if (storageSnapshot()) throw new Error("An unresolved admin intent is already saved.");
      assertWallet(plan.account);
      const fresh = await prepareAdminOperation(client, plan.contract, plan.operation, plan.args, plan.account, contracts.rolesRegistry, defaultChain.id);
      if (jsonValue(fresh.current) !== jsonValue(plan.current)) throw new Error("The current setting changed. Cancel this review and prepare the action again.");
      assertWallet(plan.account);
      intent = { account: plan.account, chain: defaultChain.id, target: fresh.target, method: plan.operation.method, data: plan.data, createdAt: new Date().toISOString() };
      saveJournal(intent);
      setStatus("Confirm in your wallet. No transaction has been confirmed yet.");
      walletRequested = true;
      hash = await writeContractAsync({ ...fresh.request, chainId: defaultChain.id });
      setTxHash(hash); saveJournal({ ...intent, hash });
      setStatus("Submitted. Waiting for the onchain receipt.");
      const receipt = await client.waitForTransactionReceipt({ hash });
      receiptObserved = receipt.status === "success" || receipt.status === "reverted";
      if (receipt.status !== "success") throw new Error("Transaction reverted onchain.");
      saveJournal(null); setReview(null); setStatus("Confirmed onchain. Refreshing displayed state.");
      await Promise.all([reads.refetch(), permission.refetch()]);
    } catch (cause) {
      if (intent && walletRequested && !receiptObserved && !explicitlyRejected(cause)) {
        setError(uncertainWalletMessage); setReview(null);
        try { saveJournal({ ...intent, ...(hash ? { hash } : {}) }); } catch { /* Earlier pre-send intent remains the fail-closed journal. */ }
      } else { if (intent) { try { saveJournal(null); } catch { /* Keep the existing journal if storage is unavailable. */ } } setError(messageOf(cause)); }
    } finally { lock.current = false; setBusy(false); }
  }
  async function reconcile() {
    if (lock.current || !client || !journal) return;
    lock.current = true; setBusy(true); setError("");
    try {
      const hash = journal.hash || txHash || recoveryHash;
      if (!/^0x[0-9a-fA-F]{64}$/.test(hash || "")) throw new Error("Paste the transaction hash from your wallet or explorer. No transaction will be resent.");
      const receipt = await readAdminIntentReceipt(client, journal, hash as Hex, defaultChain.id);
      setTxHash(hash as Hex); saveJournal(null); setReview(null);
      setStatus(receipt.status === "success" ? "Saved action confirmed onchain." : "Saved action reverted onchain. No successful change was confirmed.");
      await Promise.all([reads.refetch(), permission.refetch()]);
    } catch (cause) { setError(`Still unresolved: ${messageOf(cause)}`); }
    finally { lock.current = false; setBusy(false); }
  }

  return <section className={styles.center}>
    <header className={styles.heading}><div><p>PROTOCOL OPERATIONS</p><h1>Control Center</h1><p>Review live configuration, permissions and the exact effect of each action. Community governance remains local to each Community.</p></div><Link href="/v3/communities">Open Community management →</Link></header>
    <div className={styles.summary}><span>Network <strong>{defaultChain.name} · {defaultChain.id}</strong></span><span>Wallet permissions <strong>{!account.address ? "Connect a wallet" : !correctWalletChain ? "Wrong network" : permission.data === true ? "Protocol Admin" : permission.data === false ? "Read-only visitor" : "Unavailable / checking"}</strong></span><span>Snapshot <strong>{reads.data ? `Block ${reads.data.block}` : "Not read"}</strong></span><button type="button" disabled={busy || reads.isFetching} onClick={() => { void reads.refetch(); void permission.refetch(); }}>Refresh reads</button></div>
    <nav aria-label="Control Center sections" className={styles.tabs}>{tabs.map((item) => <Link key={item} href={`/admin?tab=${item}`} aria-current={tab === item ? "page" : undefined}>{labels[item]}</Link>)}</nav>
    <p className={styles.notice}>Hiding a button is not authorization. Contract permissions and simulation are checked again before every administrative write. Treasury relays have their own permissionless rules.</p>
    {reads.error && <p role="alert" className={styles.error}>{messageOf(reads.error)}</p>}
    <section className={styles.activity} aria-label="Operation status"><h2>Operation status</h2><p role="status">{status}</p>{txHash && <a href={`${defaultChain.blockExplorers?.default.url}/tx/${txHash}`} target="_blank" rel="noreferrer">View transaction <code>{txHash}</code> ↗</a>}{error && <details open className={styles.error}><summary>Action details</summary><p role="alert">{error}</p></details>}
      {journalBlocked && <div className={styles.warning}><strong>Unresolved admin intent: sending another action is blocked.</strong>{journal ? <><p>{journal.method} · {journal.createdAt}</p><AddressValue address={journal.target} /><p>Sender: {journal.account}. Chain: {journal.chain}. Check your wallet activity. Do not increase the nonce or repeat the write.</p>{!journal.hash && <label>Transaction hash from wallet/explorer<input value={recoveryHash} onChange={(event) => setRecoveryHash(event.target.value)} placeholder="0x…" /></label>}<button type="button" disabled={busy} onClick={() => void reconcile()}>Check matching receipt (read-only)</button></> : <p>Browser journal is unavailable or malformed. Do not send until the previous intent and browser storage have been checked.</p>}</div>}
    </section>
    {tab === "treasury" && <RevenueTreasuryPanel mode="operator" />}
    {(tab === "access" || tab === "reputation") && <section className={styles.panel}><h2>Inspect a wallet</h2><p>This is a read-only lookup, not the wallet that authorizes the action.</p><form onSubmit={(event) => { event.preventDefault(); if (isAddress(lookup)) setInspected(getAddress(lookup)); }}><label>Wallet address<input value={lookup} onChange={(event) => setLookup(event.target.value)} placeholder="0x…" required /></label><button disabled={!isAddress(lookup)} type="submit">Read access & reputation</button></form>{lookupReads.isFetching && <p role="status">Reading wallet state…</p>}{lookupReads.data && <dl className={styles.values}>{lookupReads.data.map((row) => <div key={row.label}><dt>{row.label}</dt><dd>{row.value}</dd></div>)}</dl>}</section>}
    {tab === "overview" && <div className={styles.grid}>{adminContracts.map((item) => <article className={styles.panel} key={item.id}><h2>{item.name}</h2><AddressValue address={item.address} /><p>{item.address ? "Configured address; permissions and deployed capabilities require live reads." : "Not configured in this preview. Actions are unavailable."}</p><p>{item.operations.length} reviewed operations · {item.reads.length} configuration reads</p><Link href={`/admin?tab=${item.operations[0]?.group || "infrastructure"}`}>Inspect operations →</Link></article>)}</div>}
    {tab !== "overview" && <div className={styles.groups}>{adminContracts.map((item) => {
      const operations = item.operations.filter((op) => op.group === tab);
      if (!operations.length) return null;
      const state = reads.data?.states[item.id];
      return <section className={styles.panel} key={item.id}><h2>{item.name}</h2><AddressValue address={item.address} />{operations.map((op) => <OperationForm key={op.id} contract={item} operation={op} current={op.getter ? state?.values[op.getter] : undefined} readError={op.getter ? state?.errors[op.getter] : undefined} enabled={canPrepare && !!item.address} onPrepare={prepare} />)}</section>;
    })}</div>}
    {tab === "infrastructure" && <section className={styles.panel}><h2>Deployment inspector · read-only</h2><p>Proxy ownership is not the protocol Admin role. A missing EIP-1967 slot is not proof of immutability. No upgrade or initializer buttons are exposed here.</p>{[...adminContracts, { id: "factory", name: "CommunityFactory", address: communityContracts.factory }, { id: "bootstrap", name: "RoleBootstrapDistributor", address: contracts.roleBootstrapDistributor }].map((item) => <details key={item.id} className={styles.deployment}><summary>{item.name}</summary><AddressValue address={item.address} /><button type="button" disabled={!client || !item.address || busy} onClick={async () => { if (!client || !item.address) return; try { const result = await inspectProxy(client, item.address); setProxy((old) => ({ ...old, [item.id]: result })); } catch (cause) { setError(messageOf(cause)); } }}>Read proxy slots</button>{proxy[item.id] && <dl className={styles.values}><div><dt>Pinned block</dt><dd>{proxy[item.id].block}</dd></div><div><dt>Implementation slot</dt><dd><AddressValue address={proxy[item.id].implementation || undefined} /></dd></div><div><dt>Admin slot</dt><dd><AddressValue address={proxy[item.id].proxyAdmin || undefined} /></dd></div><div><dt>Admin owner getter</dt><dd><AddressValue address={proxy[item.id].owner || undefined} /></dd></div></dl>}</details>)}</section>}
    <details className={styles.panel}><summary>Advanced configuration snapshot and unavailable reads</summary><p>Unknown values are not zero. A local ABI is not evidence that the deployed version supports every method.</p>{adminContracts.map((item) => <details key={item.id}><summary>{item.name}</summary><dl className={styles.values}>{item.reads.map((method) => <div key={method}><dt>{method}</dt><dd>{valueLabel(reads.data?.states[item.id]?.values[method])}{reads.data?.states[item.id]?.errors[method] && <details><summary>Read failed</summary><p>{reads.data.states[item.id].errors[method]}</p></details>}</dd></div>)}</dl></details>)}</details>
    {review && <ReviewDialog key={`${review.contract.id}:${review.operation.id}`} review={review} busy={busy} onCancel={() => setReview(null)} onConfirm={() => void confirm()} />}
  </section>;
}

function OperationForm({ contract, operation: op, current, readError, enabled, onPrepare }: { contract: AdminContract; operation: AdminOperation; current: unknown; readError?: string; enabled: boolean; onPrepare: (contract: AdminContract, operation: AdminOperation, values: Record<string, string>) => Promise<void> }) {
  const [values, setValues] = useState<Record<string, string>>({});
  return <details className={styles.operation}><summary><span>{op.title}</span><small>{op.critical ? "Review required" : "Configuration"}</small></summary><p>{op.description}</p>{op.getter && <p>Current: <strong>{valueLabel(current, op.fields[0]?.unit)}</strong></p>}{readError && <details className={styles.warning}><summary>Current value could not be read</summary><p>{readError}</p></details>}<form onSubmit={(event) => { event.preventDefault(); void onPrepare(contract, op, values); }}>{op.fields.map((field) => <label key={field.name}>{field.label}{field.kind === "bool" ? <select required value={values[field.name] ?? ""} onChange={(event) => setValues((old) => ({ ...old, [field.name]: event.target.value }))}><option value="">Choose explicitly</option><option value="true">Enabled / approved</option><option value="false">Disabled / revoked</option></select> : field.kind === "role" ? <select required value={values[field.name] ?? ""} onChange={(event) => setValues((old) => ({ ...old, [field.name]: event.target.value }))}><option value="">Choose a role</option>{protocolRoles.map((role) => <option key={role} value={role}>{role}</option>)}</select> : field.kind === "addresses" ? <textarea required value={values[field.name] ?? ""} onChange={(event) => setValues((old) => ({ ...old, [field.name]: event.target.value }))} /> : <input required inputMode={field.kind === "uint" ? "decimal" : "text"} value={values[field.name] ?? ""} placeholder={field.kind === "address" ? "0x…" : "Enter a value"} onChange={(event) => setValues((old) => ({ ...old, [field.name]: event.target.value }))} />}</label>)}<button type="submit" disabled={!enabled}>Simulate & review</button></form><details><summary>Contract method</summary><code>{contract.name}.{op.method}</code></details></details>;
}

function ReviewDialog({ review, busy, onCancel, onConfirm }: { review: Review; busy: boolean; onCancel: () => void; onConfirm: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [acknowledged, setAcknowledged] = useState("");
  useEffect(() => { const dialog = ref.current; dialog?.showModal(); return () => dialog?.close(); }, []);
  return <dialog ref={ref} className={styles.review} aria-labelledby="admin-review-title" onCancel={(event) => { event.preventDefault(); if (!busy) onCancel(); }}><h2 id="admin-review-title">Review: {review.operation.title}</h2><p>{review.operation.description}</p><dl className={styles.values}><div><dt>Network</dt><dd>{defaultChain.name} · {defaultChain.id}</dd></div><div><dt>Signing wallet</dt><dd>{review.account}</dd></div><div><dt>Target contract</dt><dd>{review.contract.address}</dd></div>{review.operation.getter && <div><dt>Current value</dt><dd>{valueLabel(review.current, review.operation.fields[0]?.unit)}</dd></div>}{review.operation.fields.map((field, index) => <div key={field.name}><dt>{field.label}</dt><dd>{field.kind === "role" ? String(review.args[index]) : valueLabel(review.args[index], field.unit)}</dd></div>)}</dl><p>The transaction will be simulated and permissions checked again. Simulation is not an audit or a guarantee of execution.</p><label>Type {review.contract.name} to confirm the target<input autoComplete="off" value={acknowledged} onChange={(event) => setAcknowledged(event.target.value)} /></label><details><summary>Exact calldata</summary><code>{review.data}</code></details><div className={styles.buttons}><button disabled={busy} type="button" onClick={onCancel}>Cancel</button><button disabled={busy || acknowledged !== review.contract.name} type="button" onClick={onConfirm}>{busy ? "Processing…" : "Confirm in wallet"}</button></div></dialog>;
}
