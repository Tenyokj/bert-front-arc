"use client";

import Link from "next/link";
import { CreationSteps, CreationReview } from "@/components/dapp/CreationSteps";
import { ideaStepProblems, parseCreationUsdc, reviewIdentity } from "@/lib/creation-form";
import { defaultChain } from "@/lib/web3";
import { useEffect, useMemo, useState } from "react";
import { useSyncExternalStore } from "react";
import { formatUnits } from "viem";
import { FaArrowLeft } from "react-icons/fa";
import {
  useAccount,
  useReadContract,
  useWriteContract,
} from "wagmi";
import { useProtocolReceipt as useWaitForTransactionReceipt } from "@/hooks/useProtocolReceipt";

import {
  contracts,
  ideaRegistryAbi,
  popVerifierAbi,
  usdcAbi,
} from "@/lib/contracts";
import { formatTokenAmount, USDC_DECIMALS } from "@/lib/dapp-onchain";

function formatPlainAmount(value: bigint | undefined) {
  if (value === undefined) return "";
  return formatUnits(value, USDC_DECIMALS);
}

function prettyCreateIdeaError(message?: string) {
  if (!message) return "";
  if (message.toLowerCase().includes("gas limit too high")) {
    return "The RPC rejected the automatic gas estimate. The dApp now sends a fixed gas limit for idea creation; retry the transaction.";
  }
  if (message.includes("FundingPoolNotConfigured")) {
    return "IdeaRegistry is not wired to FundingPool yet. Re-run deployment wiring or call setFundingPool() on the deployed IdeaRegistry.";
  }
  if (message.includes("InsufficientStake")) {
    return "Author bond is below the contract minimum.";
  }
  if (message.includes("InvalidMinimumFunding")) {
    return "Minimum net funding must be a positive USDC amount.";
  }
  if (message.includes("InsufficientTokenBalance")) {
    return "Wallet balance is lower than the stake required for idea creation.";
  }
  if (message.includes("InsufficientAllowance")) {
    return "FundingPool allowance is too low for the selected author bond.";
  }
  if (message.includes("HumanVerifierNotConfigured")) {
    return "Idea creation is human-only, but its PoP verifier is not configured by the protocol administrator.";
  }
  if (message.includes("HumanVerificationRequired")) {
    return "Complete human verification before creating an idea.";
  }
  if (message.includes("ExternalCallFailed") && message.includes("FundingPool")) {
    return "FundingPool rejected the author stake deposit. This usually means the deployment wiring or contract roles are incomplete.";
  }
  if (message.includes("ExternalCallFailed") && message.includes("ReputationSystem")) {
    return "Reputation system rejected author initialization. Check REPUTATION_MANAGER_ROLE wiring for IdeaRegistry.";
  }
  if (message.includes("Internal error")) {
    return "Contract wiring looks incomplete. Most likely IdeaRegistry has no FundingPool configured on this deployment.";
  }
  return message;
}

function normalizeAddress(value?: string) {
  return value?.toLowerCase();
}

export default function NewIdeaPage() {
  const hydrated = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false
  );
  const { address, chainId, isConnected } = useAccount();
  const [step, setStep] = useState(0);
  const [acceptedReview, setAcceptedReview] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [authorBond, setAuthorBond] = useState("");
  const [minimumNetFunding, setMinimumNetFunding] = useState("");
  const [allowanceOwner, setAllowanceOwner] = useState<string | null>(null);
  const [balanceOwner, setBalanceOwner] = useState<string | null>(null);

  const {
    data: approveTxHash,
    isPending: isApprovePending,
    error: approveError,
    writeContract: writeApprove,
  } = useWriteContract();
  const sendApprove = writeApprove as unknown as (variables: Record<string, unknown>) => void;
  const { data: approveReceipt, error: approveReceiptError, refetch: refreshApprovalReceipt, isLoading: isApproveConfirming, isSuccess: isApproveReceiptLoaded } = useWaitForTransactionReceipt({
    chainId: defaultChain.id,
    hash: approveTxHash,
  });

  const {
    data: createTxHash,
    isPending: isCreatePending,
    error: createError,
    writeContract,
  } = useWriteContract();
  const sendWrite = writeContract as unknown as (variables: Record<string, unknown>) => void;
  const { data: createReceipt, error: createReceiptError, refetch: refreshCreationReceipt, isLoading: isCreateConfirming, isSuccess: isCreateReceiptLoaded } = useWaitForTransactionReceipt({
    chainId: defaultChain.id,
    hash: createTxHash,
  });
  const isApproveSuccess = isApproveReceiptLoaded && approveReceipt?.status === "success";
  const isCreateSuccess = isCreateReceiptLoaded && createReceipt?.status === "success";
  const receiptUnresolved = Boolean(approveTxHash && (approveReceipt?.transactionHash !== approveTxHash || !["success", "reverted"].includes(approveReceipt?.status ?? ""))) || Boolean(createTxHash && (createReceipt?.transactionHash !== createTxHash || !["success", "reverted"].includes(createReceipt?.status ?? "")));

  const { data: authorMinStake } = useReadContract({
    chainId: defaultChain.id,
    address: contracts.ideaRegistry,
    abi: ideaRegistryAbi,
    functionName: "authorMinStake",
    query: { enabled: Boolean(contracts.ideaRegistry) },
  });

  const { data: registryFundingPool } = useReadContract({
    chainId: defaultChain.id,
    address: contracts.ideaRegistry,
    abi: ideaRegistryAbi,
    functionName: "fundingPool",
    query: { enabled: Boolean(contracts.ideaRegistry) },
  });

  const { data: humanOnlyIdeaCreation } = useReadContract({
    chainId: defaultChain.id,
    address: contracts.ideaRegistry,
    abi: ideaRegistryAbi,
    functionName: "humanOnlyIdeaCreation",
    query: { enabled: Boolean(contracts.ideaRegistry) },
  });

  const { data: isVerifiedHuman } = useReadContract({
    chainId: defaultChain.id,
    address: contracts.popVerifier,
    abi: popVerifierAbi,
    functionName: "isVerifiedHuman",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address && contracts.popVerifier && humanOnlyIdeaCreation) },
  });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    chainId: defaultChain.id,
    address: contracts.usdc,
    abi: usdcAbi,
    functionName: "allowance",
    args: address && contracts.fundingPool ? [address, contracts.fundingPool] : undefined,
    query: { enabled: Boolean(address && contracts.usdc && contracts.fundingPool) },
  });

  const { data: tokenBalance, refetch: refetchTokenBalance } = useReadContract({
    chainId: defaultChain.id,
    address: contracts.usdc,
    abi: usdcAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address && contracts.usdc) },
  });

  useEffect(() => {
    if (!authorMinStake || authorBond.trim().length > 0) return;
    setAuthorBond(formatPlainAmount(authorMinStake as bigint));
  }, [authorMinStake, authorBond]);

  const normalizedAddress = address?.toLowerCase() ?? null;
  const minStakeValue = authorMinStake as bigint | undefined;
  const registryFundingPoolValue = registryFundingPool as string | undefined;
  const allowanceValue = allowance as bigint | undefined;
  const tokenBalanceValue = tokenBalance as bigint | undefined;

  useEffect(() => {
    if (!isApproveSuccess) return;
    void refetchAllowance();
  }, [isApproveSuccess, refetchAllowance]);

  useEffect(() => {
    if (!isCreateSuccess) return;
    void Promise.all([refetchAllowance(), refetchTokenBalance()]);
  }, [isCreateSuccess, refetchAllowance, refetchTokenBalance]);

  useEffect(() => {
    setAllowanceOwner(null);
    setBalanceOwner(null);
    if (!normalizedAddress) {
      setAuthorBond("");
      setMinimumNetFunding("");
      return;
    }
    void Promise.all([refetchAllowance(), refetchTokenBalance()]);
  }, [normalizedAddress, refetchAllowance, refetchTokenBalance]);

  useEffect(() => {
    if (!normalizedAddress || allowanceValue === undefined) return;
    setAllowanceOwner(normalizedAddress);
  }, [normalizedAddress, allowanceValue]);

  useEffect(() => {
    if (!normalizedAddress || tokenBalanceValue === undefined) return;
    setBalanceOwner(normalizedAddress);
  }, [normalizedAddress, tokenBalanceValue]);
  const parsedAuthorBond = useMemo(() => parseCreationUsdc(authorBond), [authorBond]);
  const parsedMinimumNetFunding = useMemo(
    () => parseCreationUsdc(minimumNetFunding),
    [minimumNetFunding]
  );
  const invalidAuthorBond = parsedAuthorBond <= 0n;
  const invalidMinimumFunding = parsedMinimumNetFunding <= 0n;
  const belowMinStake =
    minStakeValue !== undefined && parsedAuthorBond > 0n && parsedAuthorBond < minStakeValue;
  const allowanceReady = !normalizedAddress || allowanceOwner === normalizedAddress;
  const balanceReady = !normalizedAddress || balanceOwner === normalizedAddress;
  const effectiveAllowance = allowanceReady ? allowanceValue : undefined;
  const effectiveBalance = balanceReady ? tokenBalanceValue : undefined;
  const insufficientBalance = (effectiveBalance ?? 0n) < parsedAuthorBond;
  const needsApproval = parsedAuthorBond > 0n && (effectiveAllowance ?? 0n) < parsedAuthorBond;
  const accountDataReady = !!normalizedAddress && allowanceReady && balanceReady && effectiveAllowance !== undefined && effectiveBalance !== undefined;
  const writeBusy = isApprovePending || isApproveConfirming || isCreatePending || isCreateConfirming;
  const expectedFundingPool = contracts.fundingPool;
  const hasFundingPoolMismatch =
    Boolean(registryFundingPoolValue && expectedFundingPool) &&
    normalizeAddress(registryFundingPoolValue) !== normalizeAddress(expectedFundingPool);
  const hasInvalidMinStake = minStakeValue !== undefined && minStakeValue <= 0n;
  const isRegistryWiringBroken = hasFundingPoolMismatch || hasInvalidMinStake;
  const requiresHumanVerification = Boolean(humanOnlyIdeaCreation);
  const verificationReady = humanOnlyIdeaCreation === false || (humanOnlyIdeaCreation === true && isVerifiedHuman === true);
  const draft = { title, description, link, authorBond, minimumNetFunding };
  const problems = ideaStepProblems(step, draft, minStakeValue);
  const allProblems = [...ideaStepProblems(0, draft), ...ideaStepProblems(1, draft, minStakeValue)];
  const reviewKey = reviewIdentity({ draft, address, chainId, registry: contracts.ideaRegistry, pool: expectedFundingPool, wiredPool: registryFundingPoolValue, minimum: minStakeValue?.toString() });
  const reviewAccepted = step === 2 && acceptedReview === reviewKey && allProblems.length === 0;
  const chainReady = chainId === defaultChain.id;
  const deploymentReady = minStakeValue !== undefined && registryFundingPoolValue !== undefined && humanOnlyIdeaCreation !== undefined;

  const canApprove =
    hydrated &&
    reviewAccepted && chainReady && deploymentReady &&
    isConnected &&
    Boolean(contracts.usdc && contracts.fundingPool) &&
    !isCreateSuccess &&
    !receiptUnresolved &&
    accountDataReady &&
    parsedAuthorBond > 0n &&
    !insufficientBalance &&
    !isRegistryWiringBroken &&
    !writeBusy;

  const canSubmit =
    hydrated &&
    reviewAccepted && chainReady && deploymentReady &&
    isConnected &&
    Boolean(contracts.ideaRegistry) &&
    !isCreateSuccess &&
    !receiptUnresolved &&
    title.trim().length > 0 &&
    description.trim().length > 0 &&
    accountDataReady &&
    !invalidAuthorBond &&
    !invalidMinimumFunding &&
    !belowMinStake &&
    !insufficientBalance &&
    !needsApproval &&
    verificationReady &&
    !isRegistryWiringBroken &&
    !writeBusy;

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit || !reviewAccepted || !contracts.ideaRegistry) return;

    sendWrite({
      address: contracts.ideaRegistry,
      abi: ideaRegistryAbi,
      functionName: "createFundingProposal",
      args: [
        title.trim(),
        description.trim(),
        link.trim(),
        parsedAuthorBond,
        parsedMinimumNetFunding,
      ],
      gas: 1_200_000n,
    });
  };

  return (
    <section className="space-y-6">
      <Link
        href="/ideas"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white"
      >
        <FaArrowLeft />
        Back to ideas
      </Link>

      <div className="rounded-3xl border border-white/10 bg-[#2a2d3b] p-5 sm:p-6 md:p-8">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Create Idea</p>
        <h1 className="mt-3 font-[var(--font-display)] text-3xl text-white sm:text-4xl md:text-6xl">
          Submit proposal
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-300">
          Publish a conditional funding proposal. The author bond is locked to deter spam; your requested minimum is the post-fee USDC amount the proposal must attract before it can win a grant.
        </p>

        {!contracts.ideaRegistry && (
          <p className="mt-4 rounded-xl border border-amber-300/35 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
            Idea submission is not available in this environment yet because the live Idea Registry address has not been configured.
          </p>
        )}

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-[#313443] p-4">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Minimum author bond</p>
            <p className="mt-2 break-words text-xl font-semibold text-white sm:text-2xl">{formatTokenAmount(minStakeValue)} USDC</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#313443] p-4">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Wallet balance</p>
            <p className="mt-2 break-words text-xl font-semibold text-white sm:text-2xl">{formatTokenAmount(tokenBalanceValue)} USDC</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#313443] p-4">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Allowance to FundingPool</p>
            <p className="mt-2 break-words text-xl font-semibold text-white sm:text-2xl">{formatTokenAmount(allowanceValue)} USDC</p>
          </div>
        </div>

        {isRegistryWiringBroken && (
          <div className="mt-6 rounded-xl border border-rose-300/35 bg-rose-400/10 px-4 py-4 text-sm text-rose-100">
            <p className="font-semibold">Live idea submission is temporarily blocked on this network.</p>
            {hasInvalidMinStake && (
              <p className="mt-2">
                The registry is returning an invalid minimum deposit, so the form cannot safely submit a proposal.
              </p>
            )}
            {hasFundingPoolMismatch && (
              <p className="mt-2 break-all">
                The Idea Registry is pointing to a different treasury contract than the dApp expects for this deployment.
              </p>
            )}
            <p className="mt-2">
              Until the deployment wiring is fixed on-chain, transactions from this form will keep reverting.
            </p>
          </div>
        )}

        <form onSubmit={onSubmit} className="mt-6 grid gap-4">
          <CreationSteps labels={["Describe", "Budget", "Review & sign"]} step={step} onStep={setStep} problems={problems} busy={writeBusy}>
          <div hidden={step !== 0}>
          <h2 className="mb-2 text-2xl font-semibold text-white">What will you build?</h2>
          <p className="mb-5 text-sm leading-relaxed text-slate-300">Explain the outcome, who benefits and what delivery looks like. These fields will be public onchain. Your draft stays in this tab; it is not automatically saved after a reload.</p>
          <fieldset disabled={writeBusy || step !== 0} className="grid min-w-0 gap-4">
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-slate-200">Title</span>
            <input
              value={title}
              aria-label="Title"
              onChange={(event) => setTitle(event.target.value)}
              className="rounded-xl border border-white/10 bg-[#313443] px-4 py-3 text-slate-100 outline-none focus:border-cyan-400/50"
              placeholder="AI healthcare coordination network"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-semibold text-slate-200">Description</span>
            <textarea
              value={description}
              aria-label="Description"
              onChange={(event) => setDescription(event.target.value)}
              className="min-h-32 rounded-xl border border-white/10 bg-[#313443] px-4 py-3 text-slate-100 outline-none focus:border-cyan-400/50 sm:min-h-36"
              placeholder="Explain the problem, who benefits, what you want to build, and how the grant would be used."
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-semibold text-slate-200">Reference link</span>
            <input
              value={link}
              aria-label="Reference link"
              onChange={(event) => setLink(event.target.value)}
              className="rounded-xl border border-white/10 bg-[#313443] px-4 py-3 text-slate-100 outline-none focus:border-cyan-400/50"
              placeholder="https://..."
            />
          </label>

          </fieldset></div>
          <div hidden={step !== 1}>
          <h2 className="mb-2 text-2xl font-semibold text-white">A bond is not your funding target.</h2>
          <p className="mb-5 text-sm leading-relaxed text-slate-300">The author bond is locked when publishing. The net funding target is the minimum grant needed after round fees, not a withdrawal or a guaranteed award.</p>
          <fieldset disabled={writeBusy || step !== 1} className="grid min-w-0 gap-4">
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-slate-200">Author bond</span>
            <input
              value={authorBond}
              aria-label="Author bond"
              onChange={(event) => setAuthorBond(event.target.value)}
              className="rounded-xl border border-white/10 bg-[#313443] px-4 py-3 text-slate-100 outline-none focus:border-cyan-400/50"
              inputMode="decimal"
              placeholder="50"
            />
            <p className="text-xs text-slate-400">
              Locked when you submit. The current live minimum is {formatTokenAmount(minStakeValue)} USDC; this bond is distinct from voter pledges.
            </p>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-semibold text-slate-200">Minimum net funding target</span>
            <input
              value={minimumNetFunding}
              aria-label="Minimum net funding target"
              onChange={(event) => setMinimumNetFunding(event.target.value)}
              className="rounded-xl border border-white/10 bg-[#313443] px-4 py-3 text-slate-100 outline-none focus:border-cyan-400/50"
              inputMode="decimal"
              placeholder="1000"
            />
            <p className="text-xs text-slate-400">
              The proposal can receive more than this target. The value is checked after the round fee, so choose the minimum viable grant rather than a hard cap.
            </p>
          </label>

          </fieldset></div>
          <div hidden={step !== 2}>
          <h2 className="text-2xl font-semibold text-white">Check the exact proposal.</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">First approve the author bond if needed, then submit a separate proposal transaction. A wallet connection or token approval does not publish the idea.</p>
          <CreationReview rows={[
            { label: "Network", value: defaultChain.name },
            { label: "Author", value: address || "Connect your wallet before signing" },
            { label: "Title", value: title.trim() }, { label: "Description", value: description.trim() },
            { label: "Reference", value: link.trim() || "None supplied" },
            { label: "Author bond", value: `${authorBond.trim()} USDC` },
            { label: "Minimum net funding", value: `${minimumNetFunding.trim()} USDC (after round fees)` },
            { label: "Registry", value: contracts.ideaRegistry || "Not configured" },
            { label: "Approval spender", value: contracts.fundingPool || "Not configured" },
            { label: "Milestone plan", value: "Separate commitment after creation: public URL + 32-byte content hash. Required before a backer-governed round." },
          ]} />
          <label className="my-4 flex items-start gap-3 rounded-xl border border-violet-300/25 p-4 text-sm text-slate-200">
            <input type="checkbox" checked={reviewAccepted} disabled={writeBusy || !isConnected || !chainReady || allProblems.length > 0} onChange={(event) => setAcceptedReview(event.target.checked ? reviewKey : null)} className="mt-1 h-4 w-4 shrink-0" />
            <span>I reviewed this proposal, the bond and the net target. I understand a milestone plan still needs to be committed after publication.</span>
          </label>
          {allProblems.length > 0 && <p role="status" className="mb-4 text-sm text-amber-100">Return to the previous steps and resolve their validation messages before signing.</p>}
          {!isConnected && <p className="mb-4 text-sm text-amber-100">Connect through the existing wallet menu to confirm this review and publish.</p>}
          {isConnected && !chainReady && <p role="status" className="mb-4 text-sm text-amber-100">Switch to {defaultChain.name} through the wallet menu. No write is available on the current wallet network.</p>}
          {isConnected && !deploymentReady && <p role="status" className="mb-4 text-sm text-amber-100">Waiting for contract minimum, FundingPool wiring and verification policy. Missing reads do not mean approval to submit.</p>}
          <details className="rounded-2xl border border-white/10 bg-[#313443] p-4"><summary className="cursor-pointer text-sm font-semibold text-white">Publishing checklist and milestone plan</summary>
          <div>
            <p className="text-sm font-semibold text-white">Before you submit</p>
            <div className="mt-3 grid gap-2 text-sm text-slate-300">
              <p>Use a title that explains the outcome, not just the category.</p>
              <p>Write enough context so a reviewer understands the value in under a minute.</p>
              <p>Include a public link to docs, deck, repo, or research if you have one.</p>
              <p>Set a realistic minimum funding target. It determines whether your proposal can become the round winner.</p>
              <p>For V2.3, prepare a public milestone plan now. After creation, commit its URL and 32-byte content hash on the proposal page before the proposal enters a round.</p>
              <p>Make sure your wallet has enough USDC for the author bond and gas.</p>
            </div>
          </div>

          </details>
          {requiresHumanVerification && !isVerifiedHuman && (
            <p className="rounded-xl border border-amber-300/25 bg-amber-300/10 p-3 text-sm text-amber-100">
              Complete <Link href="/profile" className="font-semibold underline">human verification</Link> before submitting an idea.
            </p>
          )}

          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              disabled={!canApprove || !needsApproval}
              onClick={() => {
                if (!canApprove || !needsApproval || !contracts.usdc || !contracts.fundingPool || parsedAuthorBond <= 0n) return;
                sendApprove({
                  address: contracts.usdc,
                  abi: usdcAbi,
                  functionName: "approve",
                  args: [contracts.fundingPool, parsedAuthorBond],
                  gas: 200_000n,
                });
              }}
              className="rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-6 py-3 text-sm font-semibold text-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isApprovePending
                ? "Awaiting signature..."
                : isApproveConfirming
                  ? "Approving USDC..."
                  : needsApproval
                    ? "Approve author bond"
                    : "Author bond approved"}
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="rounded-lg bg-[#3b82f6] px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isCreatePending ? "Awaiting signature..." : isCreateConfirming ? "Confirming..." : "Submit funding proposal"}
            </button>
          </div>
          </div>
          </CreationSteps>
        </form>

        {hydrated && !isConnected && (
          <p className="mt-4 text-sm text-amber-100">
            Connect your wallet to approve the author bond and publish an on-chain funding proposal.
          </p>
        )}
        {invalidAuthorBond && authorBond.trim().length > 0 && <p className="mt-3 text-sm text-rose-300">Enter a valid author-bond amount.</p>}
        {invalidMinimumFunding && minimumNetFunding.trim().length > 0 && (
          <p className="mt-3 text-sm text-rose-300">Enter a positive minimum net funding target.</p>
        )}
        {belowMinStake && minStakeValue !== undefined && (
          <p className="mt-3 text-sm text-rose-300">
            The author bond is below the current minimum of {formatTokenAmount(minStakeValue)} USDC.
          </p>
        )}
        {isConnected && effectiveBalance !== undefined && insufficientBalance && (
          <p className="mt-3 text-sm text-rose-300">Your wallet balance is too low for this author bond.</p>
        )}
        {needsApproval && parsedAuthorBond > 0n && !insufficientBalance && (
          <p className="mt-3 text-sm text-slate-300">
            Approve the treasury contract for at least {formatTokenAmount(parsedAuthorBond)} USDC before you submit the proposal.
          </p>
        )}
        {isRegistryWiringBroken && (
          <p className="mt-3 text-sm text-rose-300">
            Submission is blocked because the live registry is not correctly connected to the treasury contract on this network.
          </p>
        )}
        {approveError && <p className="mt-3 break-words text-sm text-rose-300">{prettyCreateIdeaError(approveError.message)}</p>}
        {receiptUnresolved && <div role="status" className="mt-3 rounded-xl border border-amber-300/30 p-4 text-sm text-amber-100">
          <p>A submitted transaction is awaiting a confirmed outcome. New approval and publication are blocked; do not send a duplicate.</p>
          <button type="button" disabled={writeBusy} onClick={() => { if (approveTxHash) void refreshApprovalReceipt(); if (createTxHash) void refreshCreationReceipt(); }} className="mt-3 rounded-lg border border-amber-200/30 px-3 py-2 disabled:opacity-50">Refresh transaction receipts (read-only)</button>
        </div>}
        {approveReceiptError && <p role="alert" className="mt-3 break-words text-sm text-amber-100">Approval receipt could not be confirmed. Check the transaction reference before sending again: {approveReceiptError.message}</p>}
        {approveReceipt?.status === "reverted" && <p role="alert" className="mt-3 text-sm text-rose-300">The approval was mined but reverted. It did not grant a new allowance.</p>}
        {approveTxHash && <p className="mt-3 break-all text-xs text-slate-300">Approval transaction reference: {approveTxHash}</p>}
        {isApproveSuccess && !needsApproval && (
          <p className="mt-3 text-sm font-semibold text-emerald-300">USDC deposit approval confirmed.</p>
        )}
        {createError && <p className="mt-3 break-words text-sm text-rose-300">{prettyCreateIdeaError(createError.message)}</p>}
        {createReceiptError && <p role="alert" className="mt-3 break-words text-sm text-amber-100">Submission receipt could not be confirmed. Check the transaction reference before sending again: {createReceiptError.message}</p>}
        {createReceipt?.status === "reverted" && <p role="alert" className="mt-3 text-sm text-rose-300">The submission was mined but reverted. This transaction did not create a proposal.</p>}
        {createTxHash && <p className="mt-3 break-all text-xs text-slate-300">Submission transaction reference: {createTxHash}</p>}
        {isCreateSuccess && (
          <p className="mt-3 text-sm font-semibold text-emerald-300">
            Funding proposal created successfully. Its author bond is locked on-chain; open the new proposal from the ideas list and commit its milestone plan before it enters a V2.3 round.
            {" "}<Link href="/ideas" className="underline">Open ideas</Link>
          </p>
        )}
      </div>
    </section>
  );
}
