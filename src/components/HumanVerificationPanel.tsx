"use client";

import {
  deviceLegacy,
  IDKitRequestWidget,
  proofOfHuman,
  type IDKitResult,
  type RpContext,
} from "@worldcoin/idkit";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Address, Hex } from "viem";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";

import {
  contracts,
  popVerifierAbi,
  votingSystemAbi,
} from "@/lib/contracts";
import { formatDateTimeFromUnix, formatTokenAmount } from "@/lib/dapp-onchain";

type VerificationPayload = {
  verifierAddress: Address;
  verifiedUntil: number;
  nonce: string;
  provider: Hex;
  credentialHash: Hex;
  signature: Hex;
  nullifier: string;
};

type RpContextResponse = {
  rp_id: string;
  nonce: string;
  created_at: number;
  expires_at: number;
  signature: string;
};

const worldAppId = process.env.NEXT_PUBLIC_WORLD_APP_ID as `app_${string}` | undefined;
const worldAction = process.env.NEXT_PUBLIC_WORLD_ACTION || "bert-vote-human-verification";
const worldEnvironment =
  process.env.NEXT_PUBLIC_WORLD_ENVIRONMENT === "staging" ||
  process.env.NEXT_PUBLIC_WORLD_ENVIRONMENT === "sandbox"
    ? process.env.NEXT_PUBLIC_WORLD_ENVIRONMENT
    : "production";
const popBackendUrl = process.env.NEXT_PUBLIC_POP_BACKEND_URL;

function getPendingPayloadKey(address: Address, chainId: number) {
  return `bert:pop-pending:${chainId}:${address.toLowerCase()}`;
}

function normalizeBackendUrl(url: string) {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

export function HumanVerificationPanel() {
  const client = usePublicClient();
  const { address, chainId, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [verifierAddress, setVerifierAddress] = useState<Address | undefined>(contracts.popVerifier);
  const [humanOnlyVoting, setHumanOnlyVoting] = useState(false);
  const [maxVoteAmount, setMaxVoteAmount] = useState<bigint>(0n);
  const [verified, setVerified] = useState(false);
  const [verifiedUntil, setVerifiedUntil] = useState<bigint>(0n);
  const [latestNonce, setLatestNonce] = useState<bigint>(0n);
  const [pendingPayload, setPendingPayload] = useState<VerificationPayload | null>(null);
  const [rpContext, setRpContext] = useState<RpContext | null>(null);
  const [widgetOpen, setWidgetOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pendingPayloadRef = useRef<VerificationPayload | null>(null);
  const widgetFailureRef = useRef<string | null>(null);

  const canUseWorldId = Boolean(worldAppId && popBackendUrl);
  const effectiveChainId = chainId ?? 0;

  const backendBaseUrl = useMemo(() => {
    if (!popBackendUrl) return null;
    return normalizeBackendUrl(popBackendUrl);
  }, []);

  useEffect(() => {
    pendingPayloadRef.current = pendingPayload;
  }, [pendingPayload]);

  useEffect(() => {
    if (!address || !effectiveChainId) {
      setPendingPayload(null);
      return;
    }

    try {
      const raw = window.localStorage.getItem(getPendingPayloadKey(address, effectiveChainId));
      setPendingPayload(raw ? (JSON.parse(raw) as VerificationPayload) : null);
    } catch {
      setPendingPayload(null);
    }
  }, [address, effectiveChainId]);

  const refreshVerificationState = useCallback(async (options?: { silent?: boolean }) => {
    if (!client || !contracts.votingSystem) {
      setIsLoading(false);
      return;
    }

    const silent = options?.silent ?? false;
    if (!silent) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      const votingVerifier = (await client.readContract({
        address: contracts.votingSystem,
        abi: votingSystemAbi,
        functionName: "humanVerifier",
      })) as Address;

      const [nextHumanOnly, nextMaxVoteAmount] = (await Promise.all([
        client.readContract({
          address: contracts.votingSystem,
          abi: votingSystemAbi,
          functionName: "humanOnlyVoting",
        }),
        client.readContract({
          address: contracts.votingSystem,
          abi: votingSystemAbi,
          functionName: "maxVoteAmount",
        }),
      ])) as [boolean, bigint];

      setVerifierAddress(votingVerifier);
      setHumanOnlyVoting(nextHumanOnly);
      setMaxVoteAmount(nextMaxVoteAmount);

      if (
        address &&
        votingVerifier &&
        /^0x[a-fA-F0-9]{40}$/.test(votingVerifier) &&
        votingVerifier !== "0x0000000000000000000000000000000000000000"
      ) {
        const verification = (await client.readContract({
          address: votingVerifier,
          abi: popVerifierAbi,
          functionName: "getVerification",
          args: [address],
        })) as readonly [boolean, bigint, bigint];

        setVerified(verification[0]);
        setVerifiedUntil(verification[1]);
        setLatestNonce(verification[2]);
      } else {
        setVerified(false);
        setVerifiedUntil(0n);
        setLatestNonce(0n);
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to load human verification state."
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [address, client]);

  useEffect(() => {
    void refreshVerificationState();
  }, [refreshVerificationState]);

  async function fetchRpContext() {
    if (!backendBaseUrl) {
      throw new Error("NEXT_PUBLIC_POP_BACKEND_URL is not configured.");
    }

    const response = await fetch(`${backendBaseUrl}/api/world/rp-signature`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        action: worldAction,
      }),
    });

    const data = (await response.json()) as RpContextResponse & { error?: string };
    if (!response.ok) {
      throw new Error(data.error || "Failed to initialize World ID request.");
    }

    return data satisfies RpContext;
  }

  async function issueBackendSignature(result: IDKitResult) {
    if (!address) {
      throw new Error("Connect wallet before requesting proof.");
    }
    if (!backendBaseUrl) {
      throw new Error("NEXT_PUBLIC_POP_BACKEND_URL is not configured.");
    }
    if (!verifierAddress) {
      throw new Error("PoP verifier address is not configured in the protocol.");
    }

    const response = await fetch(`${backendBaseUrl}/api/pop/issue-proof`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        walletAddress: address,
        chainId: effectiveChainId,
        verifierAddress,
        action: worldAction,
        proof: result,
      }),
    });

    const data = (await response.json()) as VerificationPayload & { error?: string; details?: string };
    if (!response.ok) {
      throw new Error(data.details || data.error || "The backend rejected the World ID proof.");
    }

    window.localStorage.setItem(getPendingPayloadKey(address, effectiveChainId), JSON.stringify(data));
    // onSuccess can run before React applies setPendingPayload, so keep the
    // freshly issued payload available synchronously for finalization.
    pendingPayloadRef.current = data;
    setPendingPayload(data);
    setStatusMessage("World ID proof accepted. Finish the final on-chain activation step.");
    setErrorMessage(null);

    return data;
  }

  async function submitPendingPayload(payload: VerificationPayload) {
    if (!address || !walletClient || !client) {
      throw new Error("Wallet client is not ready.");
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setStatusMessage("Submitting PoP verification transaction...");

    try {
      const txHash = await walletClient.writeContract({
        account: address,
        address: payload.verifierAddress,
        abi: popVerifierAbi,
        functionName: "submitVerification",
        args: [
          BigInt(payload.verifiedUntil),
          BigInt(payload.nonce),
          payload.provider,
          payload.credentialHash,
          payload.signature,
        ],
      });

      await client.waitForTransactionReceipt({ hash: txHash });

      window.localStorage.removeItem(getPendingPayloadKey(address, effectiveChainId));
      setPendingPayload(null);
      setStatusMessage("Your wallet is now verified for voting.");
      await refreshVerificationState({ silent: true });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Verification transaction failed. You can retry with the saved payload."
      );
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }

  async function startVerification() {
    setErrorMessage(null);
    setStatusMessage(null);
    widgetFailureRef.current = null;

    if (!isConnected || !address) {
      setErrorMessage("Connect your wallet before starting human verification.");
      return;
    }
    if (!worldAppId) {
      setErrorMessage("NEXT_PUBLIC_WORLD_APP_ID is not configured.");
      return;
    }
    if (!canUseWorldId) {
      setErrorMessage("World ID integration is not configured yet.");
      return;
    }
    if (!verifierAddress) {
      setErrorMessage("The protocol has no PoP verifier configured yet.");
      return;
    }

    try {
      setIsSubmitting(true);
      const nextContext = await fetchRpContext();
      setRpContext(nextContext);
      setWidgetOpen(true);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to start World ID verification."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const verificationSummary = verified
    ? `Verified until ${formatDateTimeFromUnix(verifiedUntil)}`
    : pendingPayload
      ? "World ID passed, waiting for on-chain activation"
      : "Not verified yet";

  return (
    <div className="rounded-3xl border border-cyan-300/20 bg-[linear-gradient(135deg,rgba(34,211,238,0.10),rgba(15,23,42,0.85))] p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Human Verification</p>
          <h2 className="mt-3 font-[var(--font-display)] text-2xl text-white sm:text-3xl">
            Voting access now supports proof-of-personhood gating.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            This wallet can vote only after passing the World ID flow and finalizing the signed proof on-chain through the
            protocol verifier contract.
          </p>
        </div>

        <div className="min-w-[220px] rounded-2xl border border-white/10 bg-[#1f2431]/80 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Status</p>
          <p className={`mt-2 text-lg font-semibold ${verified ? "text-emerald-300" : "text-amber-200"}`}>
            {verificationSummary}
          </p>
          <p className="mt-3 text-sm text-slate-300">
            Voting cap per wallet: {maxVoteAmount > 0n ? `${formatTokenAmount(maxVoteAmount)} USDC` : "Disabled"}
          </p>
          <p className="mt-1 text-sm text-slate-300">
            Human-only voting: {humanOnlyVoting ? "Enabled" : "Disabled"}
          </p>
          <p className="mt-1 text-sm text-slate-300">
            Latest verification nonce: {latestNonce.toString()}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto]">
        <div className="rounded-2xl border border-white/10 bg-[#232938]/80 px-4 py-4 text-sm text-slate-300">
          <p>Step 1. Open World ID and prove that this wallet belongs to a unique human.</p>
          <p className="mt-2">Step 2. The backend validates the proof and signs a BERT verification payload.</p>
          <p className="mt-2">Step 3. Your wallet submits that payload to the on-chain `PoPVerifierUpgradeable` contract.</p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => void startVerification()}
            disabled={isSubmitting || !isConnected || verified}
            className="rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {verified ? "Wallet verified" : isSubmitting ? "Preparing..." : "Start World ID verification"}
          </button>

          {pendingPayload ? (
            <button
              type="button"
              onClick={() => void submitPendingPayload(pendingPayload)}
              disabled={isSubmitting || !walletClient}
              className="rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Submitting..." : "Finalize on-chain activation"}
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => void refreshVerificationState({ silent: true })}
            disabled={isLoading || isRefreshing}
            className="rounded-full border border-white/10 bg-transparent px-5 py-3 text-sm font-semibold text-slate-300 transition hover:border-cyan-300/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRefreshing ? "Refreshing..." : "Refresh status"}
          </button>
        </div>
      </div>

      {!isConnected ? (
        <p className="mt-4 rounded-xl border border-amber-300/35 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          Connect wallet to start proof-of-personhood verification.
        </p>
      ) : null}

      {!canUseWorldId ? (
        <p className="mt-4 rounded-xl border border-amber-300/35 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          Configure `NEXT_PUBLIC_WORLD_APP_ID` and `NEXT_PUBLIC_POP_BACKEND_URL` to enable the live verification flow.
        </p>
      ) : null}

      {statusMessage ? (
        <p className="mt-4 rounded-xl border border-emerald-300/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
          {statusMessage}
        </p>
      ) : null}

      {errorMessage ? (
        <p className="mt-4 rounded-xl border border-rose-300/35 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          {errorMessage}
        </p>
      ) : null}

      {rpContext && worldAppId ? (
        <IDKitRequestWidget
          open={widgetOpen}
          onOpenChange={setWidgetOpen}
          app_id={worldAppId}
          action={worldAction}
          rp_context={rpContext}
          allow_legacy_proofs={true}
          environment={worldEnvironment}
          preset={
            worldEnvironment === "staging"
              ? deviceLegacy({ signal: address?.toLowerCase() })
              : proofOfHuman({ signal: address?.toLowerCase() })
          }
          onSuccess={async () => {
            const payload = pendingPayloadRef.current;
            if (!payload) {
              throw new Error("Backend payload was not prepared.");
            }

            await submitPendingPayload(payload);
          }}
          handleVerify={async (result) => {
            try {
              await issueBackendSignature(result);
            } catch (error) {
              const message =
                error instanceof Error
                  ? error.message
                  : "The backend rejected the World ID proof.";
              // IDKit reports a host-side rejection generically. Preserve the
              // backend response so a user can act on the actual cause.
              widgetFailureRef.current = message;
              setErrorMessage(message);
              throw error;
            }
          }}
          onError={(code) => {
            setErrorMessage(
              widgetFailureRef.current ?? `World ID error: ${code}`,
            );
          }}
        />
      ) : null}
    </div>
  );
}
