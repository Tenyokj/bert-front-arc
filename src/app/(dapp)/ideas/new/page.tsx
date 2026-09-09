"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSyncExternalStore } from "react";
import { formatUnits, parseUnits } from "viem";
import { FaArrowLeft } from "react-icons/fa";
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";

import {
  contracts,
  ideaRegistryAbi,
  popVerifierAbi,
  usdcAbi,
} from "@/lib/contracts";
import { formatTokenAmount, USDC_DECIMALS } from "@/lib/dapp-onchain";

function safeParseAmount(value: string) {
  const input = value.trim();
  if (!input) return 0n;
  try {
    return parseUnits(input, USDC_DECIMALS);
  } catch {
    return -1n;
  }
}

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
    return "Stake amount is below the contract minimum.";
  }
  if (message.includes("InsufficientTokenBalance")) {
    return "Wallet balance is lower than the stake required for idea creation.";
  }
  if (message.includes("InsufficientAllowance")) {
    return "FundingPool allowance is too low for the selected stake amount.";
  }
  if (message.includes("HumanVerifierNotConfigured")) {
    return "Idea creation is human-only, but its PoP verifier is not configured by the protocol administrator.";
  }
  if (message.includes("HumanVerificationRequired")) {
    return "Complete World ID proof-of-personhood verification before creating an idea.";
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
  const { address, isConnected } = useAccount();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [stakeAmount, setStakeAmount] = useState("");
  const [allowanceOwner, setAllowanceOwner] = useState<string | null>(null);
  const [balanceOwner, setBalanceOwner] = useState<string | null>(null);

  const {
    data: approveTxHash,
    isPending: isApprovePending,
    error: approveError,
    writeContract: writeApprove,
  } = useWriteContract();
  const sendApprove = writeApprove as unknown as (variables: Record<string, unknown>) => void;
  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({
    hash: approveTxHash,
  });

  const {
    data: createTxHash,
    isPending: isCreatePending,
    error: createError,
    writeContract,
  } = useWriteContract();
  const sendWrite = writeContract as unknown as (variables: Record<string, unknown>) => void;
  const { isLoading: isCreateConfirming, isSuccess: isCreateSuccess } = useWaitForTransactionReceipt({
    hash: createTxHash,
  });

  const { data: authorMinStake } = useReadContract({
    address: contracts.ideaRegistry,
    abi: ideaRegistryAbi,
    functionName: "authorMinStake",
    query: { enabled: Boolean(contracts.ideaRegistry) },
  });

  const { data: registryFundingPool } = useReadContract({
    address: contracts.ideaRegistry,
    abi: ideaRegistryAbi,
    functionName: "fundingPool",
    query: { enabled: Boolean(contracts.ideaRegistry) },
  });

  const { data: humanOnlyIdeaCreation } = useReadContract({
    address: contracts.ideaRegistry,
    abi: ideaRegistryAbi,
    functionName: "humanOnlyIdeaCreation",
    query: { enabled: Boolean(contracts.ideaRegistry) },
  });

  const { data: isVerifiedHuman } = useReadContract({
    address: contracts.popVerifier,
    abi: popVerifierAbi,
    functionName: "isVerifiedHuman",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address && contracts.popVerifier && humanOnlyIdeaCreation) },
  });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: contracts.usdc,
    abi: usdcAbi,
    functionName: "allowance",
    args: address && contracts.fundingPool ? [address, contracts.fundingPool] : undefined,
    query: { enabled: Boolean(address && contracts.usdc && contracts.fundingPool) },
  });

  const { data: tokenBalance, refetch: refetchTokenBalance } = useReadContract({
    address: contracts.usdc,
    abi: usdcAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address && contracts.usdc) },
  });

  useEffect(() => {
    if (!authorMinStake || stakeAmount.trim().length > 0) return;
    setStakeAmount(formatPlainAmount(authorMinStake as bigint));
  }, [authorMinStake, stakeAmount]);

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
      setStakeAmount("");
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
  const parsedStake = useMemo(() => safeParseAmount(stakeAmount), [stakeAmount]);
  const invalidStake = parsedStake <= 0n;
  const belowMinStake = minStakeValue !== undefined && parsedStake > 0n && parsedStake < minStakeValue;
  const allowanceReady = !normalizedAddress || allowanceOwner === normalizedAddress;
  const balanceReady = !normalizedAddress || balanceOwner === normalizedAddress;
  const effectiveAllowance = allowanceReady ? allowanceValue : undefined;
  const effectiveBalance = balanceReady ? tokenBalanceValue : undefined;
  const insufficientBalance = (effectiveBalance ?? 0n) < parsedStake;
  const needsApproval = parsedStake > 0n && (effectiveAllowance ?? 0n) < parsedStake;
  const accountDataReady = !isConnected || (!normalizedAddress ? true : allowanceReady && balanceReady);
  const writeBusy = isApprovePending || isApproveConfirming || isCreatePending || isCreateConfirming;
  const expectedFundingPool = contracts.fundingPool;
  const hasFundingPoolMismatch =
    Boolean(registryFundingPoolValue && expectedFundingPool) &&
    normalizeAddress(registryFundingPoolValue) !== normalizeAddress(expectedFundingPool);
  const hasInvalidMinStake = minStakeValue !== undefined && minStakeValue <= 0n;
  const isRegistryWiringBroken = hasFundingPoolMismatch || hasInvalidMinStake;
  const requiresHumanVerification = Boolean(humanOnlyIdeaCreation);
  const verificationReady = !requiresHumanVerification || isVerifiedHuman === true;

  const canApprove =
    hydrated &&
    isConnected &&
    Boolean(contracts.usdc && contracts.fundingPool) &&
    accountDataReady &&
    parsedStake > 0n &&
    !insufficientBalance &&
    !isRegistryWiringBroken &&
    !writeBusy;

  const canSubmit =
    hydrated &&
    isConnected &&
    Boolean(contracts.ideaRegistry) &&
    title.trim().length > 0 &&
    description.trim().length > 0 &&
    accountDataReady &&
    !invalidStake &&
    !belowMinStake &&
    !insufficientBalance &&
    !needsApproval &&
    verificationReady &&
    !isRegistryWiringBroken &&
    !writeBusy;

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit || !contracts.ideaRegistry) return;

    sendWrite({
      address: contracts.ideaRegistry,
      abi: ideaRegistryAbi,
      functionName: "createIdea",
      args: [title.trim(), description.trim(), link.trim(), parsedStake],
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
          Share a funding proposal with the BERT community. Idea creation requires a USDC deposit that is locked on-chain to reduce spam and prove real commitment from the author.
        </p>

        {!contracts.ideaRegistry && (
          <p className="mt-4 rounded-xl border border-amber-300/35 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
            Idea submission is not available in this environment yet because the live Idea Registry address has not been configured.
          </p>
        )}

        <div className="mt-6 grid gap-3 xl:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-[#313443] p-4">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-400">1. Describe the proposal</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-200">
              Add a clear title, explain the problem, and include a reference link so reviewers can validate the idea fast.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#313443] p-4">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-400">2. Approve the deposit</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-200">
              Your wallet grants FundingPool permission to move the exact USDC stake required for this submission.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#313443] p-4">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-400">3. Submit on-chain</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-200">
              Once confirmed, the proposal becomes part of the live registry and can later enter community voting rounds.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-[#313443] p-4">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Required minimum stake</p>
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
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-slate-200">Title</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="rounded-xl border border-white/10 bg-[#313443] px-4 py-3 text-slate-100 outline-none focus:border-cyan-400/50"
              placeholder="AI healthcare coordination network"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-semibold text-slate-200">Description</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="min-h-32 rounded-xl border border-white/10 bg-[#313443] px-4 py-3 text-slate-100 outline-none focus:border-cyan-400/50 sm:min-h-36"
              placeholder="Explain the problem, who benefits, what you want to build, and how the grant would be used."
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-semibold text-slate-200">Reference link</span>
            <input
              value={link}
              onChange={(event) => setLink(event.target.value)}
              className="rounded-xl border border-white/10 bg-[#313443] px-4 py-3 text-slate-100 outline-none focus:border-cyan-400/50"
              placeholder="https://..."
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-semibold text-slate-200">Stake amount</span>
            <input
              value={stakeAmount}
              onChange={(event) => setStakeAmount(event.target.value)}
              className="rounded-xl border border-white/10 bg-[#313443] px-4 py-3 text-slate-100 outline-none focus:border-cyan-400/50"
              placeholder="50"
            />
            <p className="text-xs text-slate-400">
              The current live minimum is {formatTokenAmount(minStakeValue)} USDC. You can deposit more, but not less.
            </p>
          </label>

          <div className="rounded-2xl border border-white/10 bg-[#313443] p-4">
            <p className="text-sm font-semibold text-white">Before you submit</p>
            <div className="mt-3 grid gap-2 text-sm text-slate-300">
              <p>Use a title that explains the outcome, not just the category.</p>
              <p>Write enough context so a reviewer understands the value in under a minute.</p>
              <p>Include a public link to docs, deck, repo, or research if you have one.</p>
              <p>Make sure your wallet has enough USDC for both the deposit and gas.</p>
            </div>
          </div>

          {requiresHumanVerification && !isVerifiedHuman && (
            <p className="rounded-xl border border-amber-300/25 bg-amber-300/10 p-3 text-sm text-amber-100">
              Complete <Link href="/profile" className="font-semibold underline">World ID verification</Link> before submitting an idea.
            </p>
          )}

          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              disabled={!canApprove || !needsApproval}
              onClick={() => {
                if (!contracts.usdc || !contracts.fundingPool || parsedStake <= 0n) return;
                sendApprove({
                  address: contracts.usdc,
                  abi: usdcAbi,
                  functionName: "approve",
                  args: [contracts.fundingPool, parsedStake],
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
                    ? "Approve USDC deposit"
                    : "Deposit approved"}
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="rounded-lg bg-[#3b82f6] px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isCreatePending ? "Awaiting signature..." : isCreateConfirming ? "Confirming..." : "Submit idea"}
            </button>
          </div>
        </form>

        {hydrated && !isConnected && (
          <p className="mt-4 text-sm text-amber-100">
            Connect your wallet to approve the deposit and publish an on-chain idea.
          </p>
        )}
        {invalidStake && stakeAmount.trim().length > 0 && <p className="mt-3 text-sm text-rose-300">Enter a valid USDC amount.</p>}
        {belowMinStake && minStakeValue !== undefined && (
          <p className="mt-3 text-sm text-rose-300">
            The deposit is below the current minimum of {formatTokenAmount(minStakeValue)} USDC.
          </p>
        )}
        {insufficientBalance && (
          <p className="mt-3 text-sm text-rose-300">Your wallet balance is too low for this USDC deposit.</p>
        )}
        {needsApproval && parsedStake > 0n && !insufficientBalance && (
          <p className="mt-3 text-sm text-slate-300">
            Approve the treasury contract for at least {formatTokenAmount(parsedStake)} USDC before you submit the idea.
          </p>
        )}
        {isRegistryWiringBroken && (
          <p className="mt-3 text-sm text-rose-300">
            Submission is blocked because the live registry is not correctly connected to the treasury contract on this network.
          </p>
        )}
        {approveError && <p className="mt-3 break-words text-sm text-rose-300">{prettyCreateIdeaError(approveError.message)}</p>}
        {approveTxHash && <p className="mt-3 break-all text-xs text-slate-300">Approval transaction reference: {approveTxHash}</p>}
        {isApproveSuccess && !needsApproval && (
          <p className="mt-3 text-sm font-semibold text-emerald-300">USDC deposit approval confirmed.</p>
        )}
        {createError && <p className="mt-3 break-words text-sm text-rose-300">{prettyCreateIdeaError(createError.message)}</p>}
        {createTxHash && <p className="mt-3 break-all text-xs text-slate-300">Submission transaction reference: {createTxHash}</p>}
        {isCreateSuccess && (
          <p className="mt-3 text-sm font-semibold text-emerald-300">
            Idea created successfully and the deposit is now locked on-chain.
          </p>
        )}
      </div>
    </section>
  );
}
