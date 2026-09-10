"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FaArrowRight, FaCircleInfo, FaRocket } from "react-icons/fa6";
import { parseEventLogs, parseUnits, type Address } from "viem";
import {
  useAccount,
  useDeployContract,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";

import communityHubArtifact from "@/abi/v3/CommunityHub.json";
import {
  communityContracts,
  communityFactoryAbi,
} from "@/lib/community-contracts";
import { contracts, popVerifierAbi } from "@/lib/contracts";
import { shortAddress } from "@/lib/dapp-onchain";

type Form = Record<
  | "name"
  | "metadataURI"
  | "entryStake"
  | "proposalBond"
  | "voteMinStake"
  | "exitCooldownMinutes"
  | "validatorThreshold"
  | "validatorPointsThreshold"
  | "adminThreshold"
  | "rejectionFeeBps"
  | "validatorRewardBps"
  | "validationMinutes"
  | "binaryVotingMinutes"
  | "roundVotingMinutes"
  | "rewardEpochMinutes"
  | "validatorActivityBps",
  string
>;
type TimingField =
  | "exitCooldownMinutes"
  | "validationMinutes"
  | "binaryVotingMinutes"
  | "roundVotingMinutes"
  | "rewardEpochMinutes";
type TimingPreset = "production" | "demo" | "custom";
const productionTiming: Pick<Form, TimingField> = {
  exitCooldownMinutes: "1440",
  validationMinutes: "1440",
  binaryVotingMinutes: "2880",
  roundVotingMinutes: "2880",
  rewardEpochMinutes: "10080",
};
const demoTiming: Pick<Form, TimingField> = {
  exitCooldownMinutes: "5",
  validationMinutes: "5",
  binaryVotingMinutes: "5",
  roundVotingMinutes: "5",
  rewardEpochMinutes: "5",
};
const timingFields: TimingField[] = [
  "exitCooldownMinutes",
  "validationMinutes",
  "binaryVotingMinutes",
  "roundVotingMinutes",
  "rewardEpochMinutes",
];
const defaults: Form = {
  name: "",
  metadataURI: "",
  entryStake: "10",
  proposalBond: "50",
  voteMinStake: "10",
  validatorThreshold: "3",
  validatorPointsThreshold: "15",
  adminThreshold: "1",
  rejectionFeeBps: "300",
  validatorRewardBps: "1500",
  validatorActivityBps: "6000",
  ...productionTiming,
};
const maxBinaryRejectionFeeBps = 1_000n;
const whole = (value: string, name: string) => {
  if (!/^\d+$/.test(value) || BigInt(value) === 0n)
    throw new Error(`${name} must be a positive whole number.`);
  return BigInt(value);
};
const minutes = (value: string, name: string) => whole(value, name) * 60n;

/** Replaces Hardhat library placeholders with the deployed V3 Admin-actions library address. */
function linkCommunityHubBytecode(library: Address) {
  const artifact = communityHubArtifact as typeof communityHubArtifact & {
    linkReferences?: Record<
      string,
      Record<string, { start: number; length: number }[]>
    >;
  };
  let bytecode = artifact.bytecode.slice(2);
  const references = Object.values(artifact.linkReferences ?? {}).flatMap(
    (file) => Object.values(file).flat(),
  );
  if (references.length) {
    for (const reference of references) {
      const start = reference.start * 2;
      bytecode = `${bytecode.slice(0, start)}${library.slice(2)}${bytecode.slice(start + reference.length * 2)}`;
    }
  } else {
    // The synced Hardhat artifact keeps library placeholders but omits linkReferences.
    bytecode = bytecode.replace(/__\$[a-fA-F0-9]{34}\$__/g, library.slice(2));
  }
  if (!/^[a-fA-F0-9]+$/.test(bytecode))
    throw new Error("CommunityHub bytecode was not linked completely.");
  return `0x${bytecode}` as `0x${string}`;
}

export default function CreateCommunityPage() {
  const { address, isConnected } = useAccount();
  const { data: isVerifiedHuman } = useReadContract({
    address: contracts.popVerifier,
    abi: popVerifierAbi,
    functionName: "isVerifiedHuman",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address && contracts.popVerifier) },
  });
  const [form, setForm] = useState<Form>(defaults);
  const [timingPreset, setTimingPreset] = useState<TimingPreset>("production");
  const [admins, setAdmins] = useState<Address[]>([]);
  const [validators, setValidators] = useState<Address[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [reservation, setReservation] = useState<{
    id: bigint;
    treasury: Address;
  } | null>(null);
  const [hub, setHub] = useState<Address | null>(null);
  const [config, setConfig] = useState<Record<string, unknown> | null>(null);
  const reserve = useWriteContract();
  const reserveReceipt = useWaitForTransactionReceipt({ hash: reserve.data });
  const deploy = useDeployContract();
  const deployReceipt = useWaitForTransactionReceipt({ hash: deploy.data });
  const activate = useWriteContract();
  const activationReceipt = useWaitForTransactionReceipt({
    hash: activate.data,
  });
  const busy =
    reserve.isPending ||
    deploy.isPending ||
    deployReceipt.isLoading ||
    activate.isPending ||
    activationReceipt.isLoading;
  const field = (key: keyof Form, value: string) => {
    if (timingFields.includes(key as TimingField)) setTimingPreset("custom");
    setForm((current) => ({ ...current, [key]: value }));
  };
  const applyTimingPreset = (preset: Exclude<TimingPreset, "custom">) => {
    setTimingPreset(preset);
    setForm((current) => ({
      ...current,
      ...(preset === "demo" ? demoTiming : productionTiming),
    }));
  };

  useEffect(() => {
    if (!reserveReceipt.isSuccess || !reserveReceipt.data || reservation)
      return;
    try {
      const event = parseEventLogs({
        abi: communityFactoryAbi,
        eventName: "CommunityTreasuryCreated",
        logs: reserveReceipt.data.logs,
      }).at(-1);
      if (!event?.args.communityId || !event.args.treasury)
        throw new Error("Factory reservation event was not found.");
      setReservation({
        id: event.args.communityId,
        treasury: event.args.treasury,
      });
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not read Factory receipt.",
      );
    }
  }, [reservation, reserveReceipt.data, reserveReceipt.isSuccess]);
  useEffect(() => {
    if (deployReceipt.isSuccess && deployReceipt.data?.contractAddress && !hub)
      setHub(deployReceipt.data.contractAddress);
  }, [deployReceipt.data?.contractAddress, deployReceipt.isSuccess, hub]);

  const build = () => {
    if (!address || !contracts.usdc || !contracts.fundingPool || !contracts.popVerifier)
      throw new Error("Connect a wallet and configure USDC, FundingPool, and PoPVerifier.");
    if (!isVerifiedHuman)
      throw new Error("Complete World ID proof-of-personhood verification before creating a Community.");
    if (!form.name.trim()) throw new Error("Community name is required.");
    const initialAdmins = admins.some(
      (item) => item.toLowerCase() === address.toLowerCase(),
    )
      ? admins
      : [address, ...admins];
    if (!validators.length) throw new Error("Add at least one validator.");
    if (
      initialAdmins.some((admin) =>
        validators.some(
          (validator) => validator.toLowerCase() === admin.toLowerCase(),
        ),
      )
    )
      throw new Error("An address cannot be both admin and validator.");
    const validatorApprovalThreshold = whole(
      form.validatorThreshold,
      "Validator threshold",
    );
    const validatorProposalPointsThreshold = whole(
      form.validatorPointsThreshold,
      "Validator points threshold",
    );
    const adminApprovalThreshold = whole(form.adminThreshold, "Admin quorum");
    const binaryRejectionFeeBps = whole(form.rejectionFeeBps, "NO fee");
    if (
      validatorApprovalThreshold > BigInt(validators.length) ||
      adminApprovalThreshold > BigInt(initialAdmins.length)
    )
      throw new Error("A threshold cannot exceed its role-holder count.");
    if (validatorProposalPointsThreshold > 100n)
      throw new Error("Validator points threshold cannot exceed 100.");
    if (binaryRejectionFeeBps > maxBinaryRejectionFeeBps)
      throw new Error("NO fee cannot exceed 1,000 bps (10%).");
    return {
      name: form.name.trim(),
      metadataURI: form.metadataURI.trim(),
      usdc: contracts.usdc,
      globalBertReserve: contracts.fundingPool,
      initialAdmins,
      initialValidators: validators,
      entryStakeUSDC: parseUnits(form.entryStake, 6),
      proposalBondUSDC: parseUnits(form.proposalBond, 6),
      voteMinStakeUSDC: parseUnits(form.voteMinStake, 6),
      membershipExitCooldown: minutes(
        form.exitCooldownMinutes,
        "Exit cooldown",
      ),
      validatorApprovalThreshold,
      adminApprovalThreshold,
      binaryRejectionFeeBps,
      validatorRewardShareBps: whole(form.validatorRewardBps, "Reward"),
      validationWindow: minutes(form.validationMinutes, "Validation"),
      binaryVotingDuration: minutes(form.binaryVotingMinutes, "Binary voting"),
      roundVotingDuration: minutes(form.roundVotingMinutes, "Slate voting"),
      validatorRewardEpoch: minutes(form.rewardEpochMinutes, "Epoch"),
      validatorActiveThresholdBps: whole(form.validatorActivityBps, "Activity"),
      validatorProposalPointsThreshold,
    };
  };
  const reserveTreasury = () => {
    try {
      if (!communityContracts.factory)
        throw new Error("Set NEXT_PUBLIC_V3_FACTORY_ADDRESS.");
      const next = build();
      setConfig(next);
      setError(null);
      reserve.writeContract({
        address: communityContracts.factory,
        abi: communityFactoryAbi,
        functionName: "createCommunity",
        args: [next],
      });
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Invalid configuration.",
      );
    }
  };
  const deployHub = () => {
    if (
      reservation &&
      config &&
      address &&
      communityContracts.adminActionsLibrary
    )
      deploy.deployContract({
        abi: communityHubArtifact.abi,
        bytecode: linkCommunityHubBytecode(
          communityContracts.adminActionsLibrary,
        ),
        args: [config, reservation.treasury, address],
      } as never);
  };
  const activateHub = () => {
    if (reservation && hub && communityContracts.factory)
      activate.writeContract({
        address: communityContracts.factory,
        abi: communityFactoryAbi,
        functionName: "activateCommunity",
        args: [reservation.id, hub],
      });
  };
  if (!communityContracts.factory || !communityContracts.adminActionsLibrary)
    return (
      <p className="rounded-2xl border border-amber-300/30 bg-amber-400/10 p-5 text-sm text-amber-100">
        Set <code>NEXT_PUBLIC_V3_FACTORY_ADDRESS</code> and{" "}
        <code>NEXT_PUBLIC_V3_ADMIN_ACTIONS_LIBRARY_ADDRESS</code> before using
        Community Creator.
      </p>
    );
  return (
    <section className="space-y-6">
      <div className="rounded-[32px] border border-cyan-300/18 bg-[linear-gradient(135deg,#123946,#20232f_56%,#313443)] p-7 sm:p-9">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-200">
          Community Creator
        </p>
        <h1 className="mt-4 text-4xl font-semibold text-white sm:text-5xl">
          Launch an on-chain room in three verified steps.
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-300">
          Reserve Treasury, deploy the matching Hub from your wallet, then
          activate Factory verification.
        </p>
      </div>
      {!isConnected ? (
        <p className="rounded-2xl border border-white/10 bg-[#313443] p-5 text-sm text-slate-300">
          Connect the creator wallet first.
        </p>
      ) : (
        <>
          <div className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-[28px] border border-white/10 bg-[#2a2d3b] p-6">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
                Identity & roles
              </p>
              <Field
                label="Community name"
                value={form.name}
                set={(v) => field("name", v)}
                placeholder="Minecraft Governance"
              />
              <Field
                label="Metadata URI"
                value={form.metadataURI}
                set={(v) => field("metadataURI", v)}
                placeholder="ipfs://... (optional)"
              />
              <AddressChips
                label="Additional admins"
                addresses={admins}
                set={setAdmins}
                helper="Creator is automatically included."
              />
              <AddressChips
                label="Validators"
                addresses={validators}
                set={setValidators}
                helper="Add each validator wallet separately."
              />
              <p className="mt-4 text-xs text-cyan-100">
                <FaCircleInfo className="mr-2 inline" />
                Admin and validator roles cannot overlap.
              </p>
            </div>
            <div className="rounded-[28px] border border-white/10 bg-[#2a2d3b] p-6">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
                Economics & local timing
              </p>
              <p className="mt-2 text-xs text-amber-100">
                Timing is immutable after Treasury reservation. Choose a
                production Community or an accelerated demo Community before
                deployment.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={Boolean(reservation)}
                  onClick={() => applyTimingPreset("production")}
                  className={
                    timingPreset === "production"
                      ? "rounded-full bg-cyan-300 px-3 py-2 text-xs font-bold text-slate-950 disabled:opacity-40"
                      : "rounded-full border border-white/15 px-3 py-2 text-xs font-bold text-slate-300 disabled:opacity-40"
                  }
                >
                  Production timing
                </button>
                <button
                  type="button"
                  disabled={Boolean(reservation)}
                  onClick={() => applyTimingPreset("demo")}
                  className={
                    timingPreset === "demo"
                      ? "rounded-full bg-amber-300 px-3 py-2 text-xs font-bold text-slate-950 disabled:opacity-40"
                      : "rounded-full border border-amber-300/35 px-3 py-2 text-xs font-bold text-amber-100 disabled:opacity-40"
                  }
                >
                  Hackathon demo
                </button>
              </div>
              <p className="mt-3 text-xs text-slate-400">
                {timingPreset === "production"
                  ? "Production: 1-day validation and exit cooldown, 2-day voting, 7-day validator reward epoch."
                  : timingPreset === "demo"
                    ? "Demo: every local timing is 5 minutes, so a judge can complete a real contract flow in one session."
                    : "Custom: timing values were edited manually. Review them carefully before reserving the Treasury."}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label="Entry stake"
                  value={form.entryStake}
                  set={(v) => field("entryStake", v)}
                  suffix="USDC"
                />
                <Field
                  label="Proposal bond"
                  value={form.proposalBond}
                  set={(v) => field("proposalBond", v)}
                  suffix="USDC"
                />
                <Field
                  label="Min vote"
                  value={form.voteMinStake}
                  set={(v) => field("voteMinStake", v)}
                  suffix="USDC"
                />
                <Field
                  label="Exit cooldown"
                  value={form.exitCooldownMinutes}
                  set={(v) => field("exitCooldownMinutes", v)}
                  suffix="min"
                />
                <Field
                  label="Validator approvals"
                  value={form.validatorThreshold}
                  set={(v) => field("validatorThreshold", v)}
                />
                <Field
                  label="Validator points"
                  value={form.validatorPointsThreshold}
                  set={(v) => field("validatorPointsThreshold", v)}
                  suffix="pts"
                />
                <Field
                  label="Admin quorum"
                  value={form.adminThreshold}
                  set={(v) => field("adminThreshold", v)}
                />
                <Field
                  label="NO fee (max 10%)"
                  value={form.rejectionFeeBps}
                  set={(v) => field("rejectionFeeBps", v)}
                  suffix="bps"
                  max={1000}
                />
                <Field
                  label="Validator reward"
                  value={form.validatorRewardBps}
                  set={(v) => field("validatorRewardBps", v)}
                  suffix="bps"
                />
                <Field
                  label="Validation"
                  value={form.validationMinutes}
                  set={(v) => field("validationMinutes", v)}
                  suffix="min"
                />
                <Field
                  label="Binary voting"
                  value={form.binaryVotingMinutes}
                  set={(v) => field("binaryVotingMinutes", v)}
                  suffix="min"
                />
                <Field
                  label="Slate voting"
                  value={form.roundVotingMinutes}
                  set={(v) => field("roundVotingMinutes", v)}
                  suffix="min"
                />
                <Field
                  label="Reward epoch"
                  value={form.rewardEpochMinutes}
                  set={(v) => field("rewardEpochMinutes", v)}
                  suffix="min"
                />
                <Field
                  label="Validator activity"
                  value={form.validatorActivityBps}
                  set={(v) => field("validatorActivityBps", v)}
                  suffix="bps"
                />
              </div>
            </div>
          </div>
          <div className="rounded-[28px] border border-cyan-300/18 bg-[linear-gradient(145deg,rgba(8,47,73,0.45),rgba(42,45,59,0.96))] p-6">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-200">
              Deploy
            </p>
            <div className="mt-4 space-y-3">
              <Action
                label="1. Reserve Treasury"
                detail={
                  reservation
                    ? `#${reservation.id.toString()} · ${shortAddress(reservation.treasury)}`
                    : "Creates isolated Treasury."
                }
                run={reserveTreasury}
                disabled={busy || Boolean(reservation) || !isVerifiedHuman}
              />
              <Action
                label="2. Deploy Hub"
                detail={
                  hub
                    ? shortAddress(hub)
                    : "Deploy exact reserved configuration."
                }
                run={deployHub}
                disabled={busy || !reservation || Boolean(hub)}
              />
              <Action
                label="3. Activate"
                detail={
                  activationReceipt.isSuccess
                    ? "Community is live."
                    : "Factory verifies Hub and Treasury."
                }
                run={activateHub}
                disabled={busy || !hub || activationReceipt.isSuccess}
              />
            </div>
            {activationReceipt.isSuccess && reservation ? (
              <Link
                href={`/v3/communities/${reservation.id}`}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-emerald-300 px-4 py-2.5 text-sm font-bold text-slate-950"
              >
                Open community <FaArrowRight />
              </Link>
            ) : null}
          </div>
        </>
            )}
            {!isVerifiedHuman && (
              <p className="rounded-xl border border-amber-300/25 bg-amber-300/10 p-3 text-sm text-amber-100">
                Complete <Link href="/profile" className="font-semibold underline">World ID verification</Link> before reserving a Community.
              </p>
            )}
      {error || reserve.error || deploy.error || activate.error ? (
        <p className="rounded-xl border border-rose-300/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          {error ??
            reserve.error?.message ??
            deploy.error?.message ??
            activate.error?.message}
        </p>
      ) : null}
    </section>
  );
}

function Field({
  label,
  value,
  set,
  placeholder,
  suffix,
  max,
}: {
  label: string;
  value: string;
  set: (value: string) => void;
  placeholder?: string;
  suffix?: string;
  max?: number;
}) {
  return (
    <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.13em] text-slate-400">
      {label}
      <div className="relative mt-2">
        <input
          value={value}
          onChange={(e) => set(e.target.value)}
          placeholder={placeholder}
          inputMode="numeric"
          max={max}
          className="w-full rounded-xl border border-white/10 bg-slate-950/35 px-3 py-3 pr-14 text-sm font-normal normal-case tracking-normal text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/50"
        />
        {suffix ? (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500">
            {suffix}
          </span>
        ) : null}
      </div>
    </label>
  );
}
function Action({
  label,
  detail,
  run,
  disabled,
}: {
  label: string;
  detail: string;
  run: () => void;
  disabled: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/25 p-4">
      <p className="font-semibold text-white">{label}</p>
      <p className="mt-1 text-xs text-slate-400">{detail}</p>
      <button
        onClick={run}
        disabled={disabled}
        className="mt-3 rounded-full bg-cyan-300 px-3 py-2 text-xs font-bold text-slate-950 disabled:opacity-40"
      >
        <FaRocket className="mr-1 inline" /> Continue
      </button>
    </div>
  );
}
function AddressChips({
  label,
  addresses,
  set,
  helper,
}: {
  label: string;
  addresses: Address[];
  set: (value: Address[]) => void;
  helper: string;
}) {
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const add = () => {
    try {
      if (!/^0x[a-fA-F0-9]{40}$/.test(input.trim()))
        throw new Error("Enter a valid 0x address.");
      const next = input.trim() as Address;
      if (addresses.some((a) => a.toLowerCase() === next.toLowerCase()))
        throw new Error("Address already added.");
      set([...addresses, next]);
      setInput("");
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid address.");
    }
  };
  return (
    <div className="mt-4">
      <p className="text-xs font-semibold uppercase tracking-[0.13em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-xs text-slate-500">{helper}</p>
      <div className="mt-2 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="0x..."
          className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-950/35 px-3 py-3 text-sm text-white outline-none"
        />
        <button
          type="button"
          onClick={add}
          className="rounded-xl bg-cyan-300 px-4 text-lg font-bold text-slate-950"
        >
          +
        </button>
      </div>
      {error ? <p className="mt-2 text-xs text-rose-200">{error}</p> : null}
      <div className="mt-3 flex flex-wrap gap-2">
        {addresses.map((a) => (
          <span
            key={a}
            className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-400/10 py-1.5 pl-3 pr-1.5 text-xs text-cyan-100"
          >
            {shortAddress(a)}
            <button
              type="button"
              onClick={() =>
                set(
                  addresses.filter(
                    (item) => item.toLowerCase() !== a.toLowerCase(),
                  ),
                )
              }
              className="rounded-full bg-cyan-100/15 px-2 py-0.5 text-sm leading-none"
            >
              −
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
