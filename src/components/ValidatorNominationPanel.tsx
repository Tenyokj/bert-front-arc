"use client";

import { useEffect, useState } from "react";
import { isAddress, type Address } from "viem";
import { useAccount, usePublicClient, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";

import { communityHubAbi } from "@/lib/community-contracts";
import { communityErrorMessage } from "@/lib/community-errors";
import { ClientPagination } from "@/components/ClientPagination";

type MemberInfo = {
  active: boolean;
  proposalPoints: bigint;
};

type EligibleCandidate = {
  address: Address;
  points: bigint;
};

/** Lets an admin appoint a former Member that has met this Community's local nomination threshold. */
export function ValidatorNominationPanel({ hub }: { hub: `0x${string}` }) {
  const { chainId } = useAccount();
  const client = usePublicClient({ chainId });
  const [candidate, setCandidate] = useState("");
  const [eligibleCandidates, setEligibleCandidates] = useState<EligibleCandidate[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(true);
  const [candidatePage, setCandidatePage] = useState(1);
  const candidateAddress = isAddress(candidate) ? candidate as Address : undefined;
  const thresholdRead = useReadContract({ address: hub, abi: communityHubAbi, functionName: "validatorProposalPointsThreshold", chainId });
  const pendingValidationRead = useReadContract({ address: hub, abi: communityHubAbi, functionName: "pendingValidationProposalCount", chainId });
  const memberRead = useReadContract({
    address: hub,
    abi: communityHubAbi,
    functionName: "getMember",
    args: candidateAddress ? [candidateAddress] : undefined,
    chainId,
    query: { enabled: Boolean(candidateAddress) },
  });
  const eligibleRead = useReadContract({
    address: hub,
    abi: communityHubAbi,
    functionName: "isValidatorEligible",
    args: candidateAddress ? [candidateAddress] : undefined,
    chainId,
    query: { enabled: Boolean(candidateAddress) },
  });
  const adminRead = useReadContract({
    address: hub,
    abi: communityHubAbi,
    functionName: "isAdminAccount",
    args: candidateAddress ? [candidateAddress] : undefined,
    chainId,
    query: { enabled: Boolean(candidateAddress) },
  });
  const validatorRead = useReadContract({
    address: hub,
    abi: communityHubAbi,
    functionName: "isValidatorAccount",
    args: candidateAddress ? [candidateAddress] : undefined,
    chainId,
    query: { enabled: Boolean(candidateAddress) },
  });
  const write = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash: write.data });

  useEffect(() => {
    let cancelled = false;
    async function loadEligibleCandidates() {
      if (!client) return;
      setLoadingCandidates(true);
      try {
        const logs = await client.getLogs({
          address: hub,
          event: {
            type: "event",
            anonymous: false,
            name: "ValidatorEligibilityReached",
            inputs: [
              { indexed: true, name: "member", type: "address" },
              { indexed: false, name: "totalPoints", type: "uint256" },
            ],
          },
          fromBlock: 0n,
          toBlock: "latest",
        });
        const reached = new Map<Address, bigint>();
        for (const log of logs) {
          const args = log.args as { member?: Address; totalPoints?: bigint };
          if (args.member && args.totalPoints !== undefined) reached.set(args.member, args.totalPoints);
        }
        const candidates = await Promise.all([...reached.entries()].map(async ([address, points]) => {
          const [eligible, admin, validator] = await Promise.all([
            client.readContract({ address: hub, abi: communityHubAbi, functionName: "isValidatorEligible", args: [address] }),
            client.readContract({ address: hub, abi: communityHubAbi, functionName: "isAdminAccount", args: [address] }),
            client.readContract({ address: hub, abi: communityHubAbi, functionName: "isValidatorAccount", args: [address] }),
          ]);
          return eligible && !admin && !validator ? { address, points } : null;
        }));
        if (!cancelled) setEligibleCandidates(candidates.filter((item): item is EligibleCandidate => item !== null));
      } catch {
        if (!cancelled) setEligibleCandidates([]);
      } finally {
        if (!cancelled) setLoadingCandidates(false);
      }
    }
    void loadEligibleCandidates();
    return () => { cancelled = true; };
  }, [client, hub, receipt.isSuccess]);

  useEffect(() => {
    if (receipt.isSuccess) window.setTimeout(() => window.location.reload(), 400);
  }, [receipt.isSuccess]);

  const member = memberRead.data as MemberInfo | undefined;
  const threshold = thresholdRead.data as bigint | undefined;
  const pendingValidations = pendingValidationRead.data as bigint | undefined;
  const roleReadsComplete = adminRead.isSuccess && validatorRead.isSuccess;
  const roleConflict = adminRead.data === true || validatorRead.data === true;
  const validatorSetLocked = pendingValidations !== undefined && pendingValidations > 0n;
  const canNominate = Boolean(
    candidateAddress
    && eligibleRead.data === true
    && roleReadsComplete
    && !roleConflict
    && !validatorSetLocked
    && !write.isPending
    && !receipt.isLoading,
  );
  const candidateTotalPages = Math.max(1, Math.ceil(eligibleCandidates.length / 4));
  const currentCandidatePage = Math.min(candidatePage, candidateTotalPages);
  const visibleCandidates = eligibleCandidates.slice((currentCandidatePage - 1) * 4, currentCandidatePage * 4);

  return <article className="rounded-[28px] border border-white/10 bg-[#2a2d3b] p-5">
    <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-200">Validator nomination</p>
    <h3 className="mt-2 text-xl font-semibold text-white">Appoint an eligible former Member.</h3>
    <p className="mt-2 text-sm text-slate-300">The local threshold is <strong>{threshold?.toString() ?? "..."} proposal point{threshold === 1n ? "" : "s"}</strong>. Nomination is not automatic: the Member must first complete exit and recover their entry stake.</p>

    <div className="mt-4 rounded-2xl border border-cyan-300/15 bg-cyan-400/5 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-200">Eligible former Members</p>
      {loadingCandidates ? <p className="mt-2 text-sm text-slate-300">Reading on-chain eligibility events...</p> : eligibleCandidates.length === 0 ? <p className="mt-2 text-sm text-slate-300">No former Member currently meets every on-chain requirement.</p> : <div className="mt-3 space-y-2">
        {visibleCandidates.map((item) => <div key={item.address} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-950/20 p-3"><div><p className="font-mono text-xs text-white">{item.address}</p><p className="mt-1 text-xs text-slate-400">{item.points.toString()} proposal points</p></div><button onClick={() => setCandidate(item.address)} className="rounded-full border border-cyan-300/40 px-3 py-1.5 text-xs font-bold text-cyan-100">Select</button></div>)}
      </div>}
      <ClientPagination currentPage={currentCandidatePage} totalItems={eligibleCandidates.length} pageSize={4} onPageChange={setCandidatePage} />
    </div>

    <input
      value={candidate}
      onChange={(event) => setCandidate(event.target.value.trim())}
      placeholder="Former Member address (0x...)"
      className="mt-4 w-full rounded-xl border border-white/10 bg-slate-950/30 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
    />

    {!candidate ? <p className="mt-3 text-xs text-slate-400">Enter a former Member address to check its on-chain eligibility.</p> : !candidateAddress ? <p className="mt-3 text-xs text-rose-200">Enter a valid 0x wallet address.</p> : <div className="mt-3 rounded-xl border border-white/10 bg-slate-950/20 p-3 text-sm">
      <p className="text-slate-200">Proposal points: <strong>{member?.proposalPoints?.toString() ?? "Loading"} / {threshold?.toString() ?? "..."}</strong></p>
      <p className="mt-1 text-slate-400">Membership: {memberRead.isLoading ? "Checking..." : member?.active ? "Active - exit is required first" : "Inactive"}</p>
      <p className="mt-1 text-slate-400">On-chain eligibility: {eligibleRead.isLoading ? "Checking..." : eligibleRead.data ? "Eligible" : "Not eligible"}</p>
      {roleConflict ? <p className="mt-2 text-rose-200">This address already holds an exclusive Community role.</p> : null}
    </div>}

    {validatorSetLocked ? <p className="mt-3 rounded-xl border border-amber-300/25 bg-amber-400/10 p-3 text-xs text-amber-100">{pendingValidations.toString()} member validation case{pendingValidations === 1n ? " is" : "s are"} still open. Finish them before changing the validator set.</p> : null}
    <button
      disabled={!canNominate}
      onClick={() => { if (candidateAddress) write.writeContract({ address: hub, abi: communityHubAbi, functionName: "createAdminActionRequest", args: [5, candidateAddress, 0n] }); }}
      className="mt-4 rounded-full bg-cyan-300 px-4 py-2 text-sm font-bold text-slate-950 disabled:opacity-40"
    >
      {write.isPending || receipt.isLoading ? "Requesting nomination..." : "Request Validator nomination"}
    </button>
    {write.error ? <p className="mt-3 text-sm text-rose-200">{communityErrorMessage(write.error)}</p> : null}
    {receipt.isSuccess ? <p className="mt-3 text-sm text-emerald-200">Nomination request created. It must reach the Community Admin quorum before execution.</p> : null}
  </article>;
}
