"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FaArrowLeft, FaBuildingColumns, FaCheck, FaCopy, FaUsers } from "react-icons/fa6";
import { useAccount, usePublicClient } from "wagmi";

import { BinaryProposalWorkspace } from "@/components/BinaryProposalWorkspace";
import { CommunitySidebar, type CommunitySection } from "@/components/CommunitySidebar";
import { SlateRoundWorkspace } from "@/components/SlateRoundWorkspace";
import { CreateCommunityProposal } from "@/components/CreateCommunityProposal";
import { ValidatorQueue } from "@/components/ValidatorQueue";
import { CommunityAdminPanel } from "@/components/CommunityAdminPanel";
import { CommunityMembershipAction } from "@/components/CommunityMembershipAction";
import { CommunityMilestonePanel } from "@/components/CommunityMilestonePanel";
import { CommunityTreasuryPanel } from "@/components/CommunityTreasuryPanel";
import { CommunitySettingsPanel } from "@/components/CommunitySettingsPanel";
import { communityHubAbi } from "@/lib/community-contracts";
import { communityModuleAbis, getCommunityDeployment, getCommunityModules, getCommunityProposal, getCommunityProposalCount, type CommunityDeployment, type CommunityProposal } from "@/lib/community-v3";
import { formatCommunityStatus } from "@/lib/community";
import { communityReferenceHref } from "@/lib/community-links";

import { resolveCommunityReference } from "@/lib/community-reference";
import { StatusBadge } from "@/components/dapp/StatusBadge";
import { CommunityGuidance } from "@/components/dapp/CommunityGuidance";
import styles from "./dapp/community-ux.module.css";

const zeroAddress = "0x0000000000000000000000000000000000000000";

/** V3-only Community application shell. Its workspace state never affects V2 routes. */
export function CommunityWorkspacePage({ communityKey }: { communityKey: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedSection = searchParams.get("section");
  const section: CommunitySection = (["binary", "slate", "milestones", "create", "validator", "admin"] as const).find((value) => value === requestedSection) ?? "binary";
  const setSection = (next: CommunitySection) => {
    const query = new URLSearchParams(searchParams.toString());
    query.set("section", next);
    router.replace(`?${query}`, { scroll: false });
  };
  const { address, chainId } = useAccount(); const client = usePublicClient({ chainId });
  const reference = resolveCommunityReference(communityKey, client?.chain?.id);
  const communityId = reference?.id ?? 0;
  const factory = reference?.factory;
  const [deployment, setDeployment] = useState<CommunityDeployment | null>(null); const [proposals, setProposals] = useState<CommunityProposal[]>([]); const [status, setStatus] = useState<number>(); const [validatorThreshold, setValidatorThreshold] = useState<bigint>(0n); const [admin, setAdmin] = useState(false); const [validator, setValidator] = useState(false); const [member, setMember] = useState(false); const [error, setError] = useState<string | null>(null); const [loading, setLoading] = useState(true);
  useEffect(() => { let cancelled = false; async function load() { if (!client || !factory || communityId < 1) { setLoading(false); return; } setLoading(true); setError(null); setDeployment(null); setProposals([]); setAdmin(false); setValidator(false); setMember(false); try { const item = await getCommunityDeployment(client, factory, BigInt(communityId)); if (item.hub === zeroAddress) { if (!cancelled) setDeployment(item); return; } const read = (request: Record<string, unknown>) => (client as { readContract: (value: Record<string, unknown>) => Promise<unknown> }).readContract(request); const modules = await getCommunityModules(client, item.hub); const count = await getCommunityProposalCount(client, modules); const ids = Array.from({ length: Math.min(Number(count), 120) }, (_, index) => BigInt(Number(count) - index)); const [state, threshold, list, roles] = await Promise.all([read({ address: item.hub, abi: communityHubAbi, functionName: "communityStatus" }), read({ address: modules.proposal, abi: communityModuleAbis.proposal, functionName: "validatorApprovalThreshold" }), Promise.all(ids.map((id) => getCommunityProposal(client, item.hub, id))), address ? Promise.all([read({ address: item.hub, abi: communityHubAbi, functionName: "isAdminAccount", args: [address] }), read({ address: item.hub, abi: communityHubAbi, functionName: "isValidatorAccount", args: [address] }), read({ address: item.hub, abi: communityHubAbi, functionName: "getMember", args: [address] })]) : Promise.resolve([false, false, { active: false }])]); if (!cancelled) { setDeployment(item); setStatus(Number(state)); setValidatorThreshold(threshold as bigint); setProposals(list); setAdmin(Boolean(roles[0])); setValidator(Boolean(roles[1])); setMember(Boolean((roles[2] as { active: boolean }).active)); } } catch (reason) { if (!cancelled) setError(reason instanceof Error ? reason.message : "Could not load Community workspace."); } finally { if (!cancelled) setLoading(false); } } void load(); return () => { cancelled = true; }; }, [address, chainId, client, communityId, factory]);
  if (!reference) return <p className="rounded-2xl border border-amber-300/30 bg-amber-400/10 p-5 text-sm text-amber-100">Unknown Community reference or unsupported network. Open a trusted Factory-specific link from the directory.</p>;
  if (loading) return <p className="rounded-2xl border border-white/10 bg-[#313443] p-5 text-sm text-slate-300">Loading Community workspace...</p>;
  if (error || !deployment) return <p className="rounded-2xl border border-rose-300/30 bg-rose-400/10 p-5 text-sm text-rose-100">{error ?? "Community not found."}</p>;
  if (deployment.hub === zeroAddress) return <p className="rounded-2xl border border-amber-300/30 bg-amber-400/10 p-5 text-sm text-amber-100">This community has a reserved Treasury but is not activated yet.</p>;
  const metadataHref = communityReferenceHref(deployment.metadataURI);
  return <section className={`${styles.workspace} space-y-6`}>
    <Link href="/v3/communities" className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-200"><FaArrowLeft /> Community directory</Link>
    <div className="rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,#243d48,#20232f_54%,#313443)] p-7 sm:p-9">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.28em] text-cyan-200">BERT Community Layer · Community #{communityId}</p><h1 className="mt-3 text-4xl font-semibold text-white sm:text-5xl">{deployment.name || `Community #${communityId}`}</h1><p className="mt-3 text-sm leading-relaxed text-slate-300">Propose together. Decide with USDC-backed votes. Review delivery before later funding stages.</p>
        {metadataHref ? <a href={metadataHref} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-sm font-semibold text-cyan-200 underline decoration-cyan-300/40 underline-offset-4 hover:text-cyan-100">Open Community metadata</a> : deployment.metadataURI ? <p className="mt-3 break-all text-xs text-slate-400">Metadata: {deployment.metadataURI}</p> : null}</div>
        <StatusBadge tone={status === 0 ? "green" : status === 1 ? "amber" : "neutral"}>{formatCommunityStatus(status)}</StatusBadge>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2"><Stat label="Your local Community role" value={!address ? "Guest" : admin ? "Admin" : validator ? "Validator" : member ? "Member" : "Not a Member"} /><Stat label="Loaded proposals (latest 120 maximum)" value={proposals.length.toString()} /></div>
      <details className="mt-6"><summary className="cursor-pointer text-sm font-semibold text-cyan-200">Contract addresses & Community rules</summary><div className="mt-4 grid gap-3 sm:grid-cols-3"><CopyableAddressStat label="Factory" value={reference.factory} /><CopyableAddressStat label="CommunityHub" value={deployment.hub} /><CopyableAddressStat label="Treasury" value={deployment.treasury} /></div><CommunitySettingsPanel hub={deployment.hub} /></details>
    </div>
    <CommunityGuidance title="Choose your next task"><p>{!address ? "Browse proposals and execution plans without a wallet. Connect only when you want to participate." : admin ? "Manage proposals and governance in Admin Panel. Fixed tranche payments are in Execution Plans; ordinary free-balance withdrawals are separate." : validator ? "Review new Member proposals in Validator Queue. Validation is not the winning-supporter milestone review." : member ? "Open a proposal or round to vote. Winning supporters may later be eligible to review delivery; execution recipients are excluded by patched Managers." : "Check the membership requirements below, then join if you want to propose or vote. Membership is local to this Community."}</p><p>Loaded proposals are a recent sample, not the full history. Older Communities keep their deployed rules.</p></CommunityGuidance>
    <CommunitySidebar active={section} onChange={setSection} isAdmin={admin} isValidator={validator} />
    <CommunityMembershipAction hub={deployment.hub} treasury={deployment.treasury} hasGovernanceRole={admin || validator} />
    <details className="rounded-2xl border border-white/10 p-5"><summary className="cursor-pointer text-sm font-semibold text-cyan-200">Community Treasury balances & accounting</summary><div className="mt-4"><CommunityTreasuryPanel treasury={deployment.treasury} /></div></details>
    <div id="community-content" aria-label="Selected Community task">
      {section === "binary" ? <BinaryProposalWorkspace communityId={reference.key} proposals={proposals} /> : section === "slate" ? <SlateRoundWorkspace communityId={reference.key} hub={deployment.hub} /> : section === "milestones" ? <CommunityMilestonePanel hub={deployment.hub} proposalIds={proposals.map((proposal) => proposal.id)} /> : section === "create" ? <CreateCommunityProposal hub={deployment.hub} treasury={deployment.treasury} isAdmin={admin} isMember={member} /> : section === "validator" ? <ValidatorQueue hub={deployment.hub} proposals={proposals} approvalThreshold={validatorThreshold} isValidator={validator} /> : section === "admin" ? <CommunityAdminPanel hub={deployment.hub} treasury={deployment.treasury} proposals={proposals} communityStatus={status} isAdmin={admin} /> : <EmptySection section={section} admin={admin} validator={validator} />}
    </div>
  </section>;
}
function Stat({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-white/10 bg-slate-950/20 p-3"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 truncate text-sm font-semibold text-slate-200">{value}</p></div>; }
function CopyableAddressStat({ label, value }: { label: string; value: string }) { const [copied, setCopied] = useState(false); async function copyAddress() { try { await navigator.clipboard.writeText(value); setCopied(true); window.setTimeout(() => setCopied(false), 1800); } catch { setCopied(false); } } return <div className="rounded-xl border border-white/10 bg-slate-950/20 p-3"><p className="text-xs text-slate-500">{label}</p><div className="mt-1 flex items-center gap-2"><p className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-200" title={value}>{value}</p><button type="button" onClick={() => void copyAddress()} className="inline-flex shrink-0 items-center gap-1 rounded-md border border-cyan-300/25 px-2 py-1 text-xs font-semibold text-cyan-100 transition hover:border-cyan-200 hover:bg-cyan-300/10" aria-label={`Copy ${label} address`}>{copied ? <FaCheck /> : <FaCopy />}{copied ? "Copied" : "Copy"}</button></div></div>; }
function EmptySection({ section, admin, validator }: { section: Exclude<CommunitySection, "milestones">; admin: boolean; validator: boolean }) { const titles: Record<Exclude<CommunitySection, "binary" | "milestones">, string> = { slate: "Slate Rounds", create: "Create Proposal", validator: "Validator Queue", admin: "Admin Panel" }; return <div className="rounded-[28px] border border-white/10 bg-[#2a2d3b] p-8"><FaBuildingColumns className="text-2xl text-cyan-300" /><h2 className="mt-4 text-3xl font-semibold text-white">{titles[section]}</h2><p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-300">This role-aware workspace is the next V3 section being connected. {section === "admin" && !admin ? "Admin access is required." : section === "validator" && !validator ? "Validator access is required." : "Binary Proposals is available now."}</p><FaUsers className="mt-6 text-slate-500" /></div>; }
