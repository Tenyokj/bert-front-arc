"use client";

import Link from "next/link";
import { useState } from "react";
import { useSyncExternalStore } from "react";
import { FaArrowLeft } from "react-icons/fa";
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from "wagmi";

import { contracts, ideaRegistryAbi } from "@/lib/contracts";

export default function NewIdeaPage() {
  const hydrated = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false
  );
  const { isConnected } = useAccount();
  const { data: txHash, isPending, error, writeContract } = useWriteContract();
  const sendWrite = writeContract as unknown as (variables: Record<string, unknown>) => void;
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");

  const canSubmit =
    hydrated &&
    isConnected &&
    Boolean(contracts.ideaRegistry) &&
    title.trim().length > 0 &&
    description.trim().length > 0 &&
    !isPending &&
    !isConfirming;

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit || !contracts.ideaRegistry) return;

    sendWrite({
      address: contracts.ideaRegistry,
      abi: ideaRegistryAbi,
      functionName: "createIdea",
      args: [title.trim(), description.trim(), link.trim()],
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

      <div className="rounded-3xl border border-white/10 bg-[#2a2d3b] p-6 md:p-8">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Create Idea</p>
        <h1 className="mt-3 font-[var(--font-display)] text-4xl text-white md:text-6xl">
          Submit proposal
        </h1>

        {!contracts.ideaRegistry && (
          <p className="mt-4 rounded-xl border border-amber-300/35 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
            Set <code>NEXT_PUBLIC_IDEA_REGISTRY_ADDRESS</code> in `.env` to enable idea creation.
          </p>
        )}

        <form onSubmit={onSubmit} className="mt-6 grid gap-4">
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-slate-200">Title</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="rounded-xl border border-white/10 bg-[#313443] px-4 py-3 text-slate-100 outline-none focus:border-cyan-400/50"
              placeholder="Proposal title"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-semibold text-slate-200">Description</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="min-h-36 rounded-xl border border-white/10 bg-[#313443] px-4 py-3 text-slate-100 outline-none focus:border-cyan-400/50"
              placeholder="Describe your proposal in detail"
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

          <div className="mt-2 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={!canSubmit}
              className="rounded-lg bg-[#3b82f6] px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? "Awaiting signature..." : isConfirming ? "Confirming..." : "Submit idea"}
            </button>
          </div>
        </form>

        {hydrated && !isConnected && (
          <p className="mt-4 text-sm text-amber-100">
            Connect wallet to create an on-chain idea.
          </p>
        )}
        {error && <p className="mt-3 text-sm text-rose-300">{error.message}</p>}
        {txHash && (
          <p className="mt-3 break-all text-xs text-slate-300">
            Tx: {txHash}
          </p>
        )}
        {isSuccess && (
          <p className="mt-3 text-sm font-semibold text-emerald-300">
            Idea created successfully.
          </p>
        )}
      </div>
    </section>
  );
}
