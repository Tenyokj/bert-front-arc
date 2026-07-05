"use client";

import { useMemo } from "react";
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { FaCheckCircle, FaKey, FaShieldAlt, FaUsers } from "react-icons/fa";

import { shortAddress } from "@/lib/dapp-onchain";
import { roleBootstrapConfig } from "@/lib/role-bootstrap";
import { roleBootstrapDistributorAbi } from "@/lib/contracts";

type RoleBootstrapClaimPanelProps = {
  variant?: "dashboard" | "home";
};

function contractErrorText(message?: string) {
  if (!message) return "";
  if (message.includes("User rejected") || message.includes("rejected the request")) {
    return "Transaction was cancelled in wallet.";
  }
  if (message.includes("DistributionClosedError")) {
    return "Role distribution has already been closed.";
  }
  if (message.includes("ClaimWindowExpired")) {
    return "Claim deadline has already passed.";
  }
  if (message.includes("AlreadyClaimed")) {
    return "This role was already claimed by the connected address.";
  }
  if (message.includes("NotEligible")) {
    return "Connected wallet is not eligible for this role.";
  }
  if (message.includes("AlreadyHasProtocolRole")) {
    return "Connected wallet already has this protocol role.";
  }

  return message.split("Contract Call:")[0]?.trim() || "Transaction failed.";
}

export function RoleBootstrapClaimPanel({ variant = "dashboard" }: RoleBootstrapClaimPanelProps) {
  const { address, isConnected } = useAccount();
  const distributorAddress = roleBootstrapConfig.distributorAddress;

  const baseReadConfig = {
    address: distributorAddress,
    abi: roleBootstrapDistributorAbi,
    query: {
      enabled: Boolean(distributorAddress && address),
    },
  } as const;

  const { data: isDistributionActive } = useReadContract({
    ...baseReadConfig,
    functionName: "distributionActive",
  });

  const { data: curatorEligible } = useReadContract({
    ...baseReadConfig,
    functionName: "isCuratorEligible",
    args: address ? [address] : undefined,
  });

  const { data: reviewerEligible } = useReadContract({
    ...baseReadConfig,
    functionName: "isReviewerEligible",
    args: address ? [address] : undefined,
  });

  const { data: claimedCurator } = useReadContract({
    ...baseReadConfig,
    functionName: "hasClaimedCurator",
    args: address ? [address] : undefined,
  });

  const { data: claimedReviewer } = useReadContract({
    ...baseReadConfig,
    functionName: "hasClaimedReviewer",
    args: address ? [address] : undefined,
  });

  const {
    writeContract,
    data: txHash,
    isPending,
    error,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const canClaimCurator = Boolean(curatorEligible && !claimedCurator);
  const canClaimReviewer = Boolean(reviewerEligible && !claimedReviewer);
  const canClaimAnything = canClaimCurator || canClaimReviewer;

  const eligibilityLabel = useMemo(() => {
    if (!isConnected || !address) return "Connect wallet to check eligibility";
    if (canClaimCurator && canClaimReviewer) return "Eligible for curator and reviewer bootstrap";
    if (canClaimCurator) return "Eligible for curator bootstrap";
    if (canClaimReviewer) return "Eligible for reviewer bootstrap";
    if (claimedCurator || claimedReviewer) return "Already claimed from this wallet";
    return "This wallet is not on the public bootstrap list";
  }, [address, canClaimCurator, canClaimReviewer, claimedCurator, claimedReviewer, isConnected]);

  const sendWrite = writeContract as unknown as (variables: Record<string, unknown>) => void;

  const cardClassName =
    variant === "home"
      ? "rounded-[28px] border border-slate-200/80 bg-white/75 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur sm:p-7"
      : "rounded-[28px] border border-cyan-300/14 bg-[linear-gradient(180deg,rgba(8,47,73,0.58),rgba(15,23,42,0.74))] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.24)] sm:p-7";

  const headingClassName = variant === "home" ? "text-slate-900" : "text-white";
  const bodyClassName = variant === "home" ? "text-slate-600" : "text-slate-300";
  const badgeClassName =
    variant === "home"
      ? "border border-cyan-200 bg-cyan-50 text-cyan-900"
      : "border border-cyan-300/20 bg-cyan-400/10 text-cyan-100";

  if (!distributorAddress) {
    return null;
  }

  return (
    <div className={cardClassName}>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${badgeClassName}`}>
            <FaKey className="text-[10px]" />
            Role bootstrap
          </div>
          <h2 className={`mt-4 font-[var(--font-display)] text-3xl sm:text-4xl ${headingClassName}`}>
            Claim your bootstrap roles before the window closes.
          </h2>
          <p className={`mt-3 text-sm leading-relaxed sm:text-base ${bodyClassName}`}>
            This distributor grants initial BERT V2 reviewer and curator roles to wallets that were seeded into the
            bootstrap allowlist. If your wallet is eligible, claim directly from the dashboard.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:max-w-sm">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${variant === "home" ? "text-slate-500" : "text-slate-400"}`}>
              Connected wallet
            </p>
            <p className={`mt-2 text-sm font-semibold ${headingClassName}`}>{address ? shortAddress(address) : "Not connected"}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${variant === "home" ? "text-slate-500" : "text-slate-400"}`}>
              Distributor state
            </p>
            <p className={`mt-2 text-sm font-semibold ${headingClassName}`}>
              {isDistributionActive ? "Active" : "Closed or unavailable"}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/12 text-cyan-300">
              <FaUsers className="text-lg" />
            </div>
            <div>
              <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${variant === "home" ? "text-slate-500" : "text-slate-400"}`}>
                Eligibility
              </p>
              <p className={`mt-2 text-base font-semibold ${headingClassName}`}>{eligibilityLabel}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${canClaimCurator ? "border border-emerald-300/40 bg-emerald-500/10 text-emerald-200" : "border border-white/10 bg-white/5 text-slate-400"}`}>
                  Curator {claimedCurator ? "claimed" : canClaimCurator ? "available" : "inactive"}
                </span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${canClaimReviewer ? "border border-indigo-300/40 bg-indigo-500/10 text-indigo-200" : "border border-white/10 bg-white/5 text-slate-400"}`}>
                  Reviewer {claimedReviewer ? "claimed" : canClaimReviewer ? "available" : "inactive"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/12 text-emerald-300">
              <FaShieldAlt className="text-lg" />
            </div>
            <div className="w-full">
              <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${variant === "home" ? "text-slate-500" : "text-slate-400"}`}>
                Claim actions
              </p>
              <div className="mt-4 flex flex-col gap-3">
                <button
                  type="button"
                  disabled={!isConnected || !canClaimAnything || isPending || isConfirming}
                  onClick={() =>
                    sendWrite({
                      address: distributorAddress,
                      abi: roleBootstrapDistributorAbi,
                      functionName: "claimAllEligibleRoles",
                    })
                  }
                  className="rounded-full bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isPending || isConfirming ? "Claiming..." : "Claim All Eligible Roles"}
                </button>

                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    disabled={!isConnected || !canClaimCurator || isPending || isConfirming}
                    onClick={() =>
                      sendWrite({
                        address: distributorAddress,
                        abi: roleBootstrapDistributorAbi,
                        functionName: "claimCuratorRole",
                      })
                    }
                    className="rounded-full border border-emerald-300/35 bg-emerald-500/10 px-4 py-2.5 text-sm font-semibold text-emerald-100 transition disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    Claim Curator
                  </button>
                  <button
                    type="button"
                    disabled={!isConnected || !canClaimReviewer || isPending || isConfirming}
                    onClick={() =>
                      sendWrite({
                        address: distributorAddress,
                        abi: roleBootstrapDistributorAbi,
                        functionName: "claimReviewerRole",
                      })
                    }
                    className="rounded-full border border-indigo-300/35 bg-indigo-500/10 px-4 py-2.5 text-sm font-semibold text-indigo-100 transition disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    Claim Reviewer
                  </button>
                </div>

                {isSuccess && txHash ? (
                  <p className="inline-flex items-center gap-2 text-sm font-medium text-emerald-300">
                    <FaCheckCircle />
                    Claim transaction confirmed: {shortAddress(txHash)}
                  </p>
                ) : null}

                {error?.message ? (
                  <p className="text-sm text-rose-300">{contractErrorText(error.message)}</p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
