"use client";

import { useEffect, useMemo, useState } from "react";
import { formatUnits, parseUnits } from "viem";
import type { Abi, Address } from "viem";
import {
  FaLock,
  FaPauseCircle,
  FaPlayCircle,
  FaShieldAlt,
  FaWallet,
} from "react-icons/fa";
import { useAccount, usePublicClient, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { useChainId } from "wagmi";

import {
  contracts,
  brtfaucetAbi,
  fundingPoolAbi,
  grantManagerAbi,
  ideaRegistryAbi,
  reputationSystemAbi,
  rolesRegistryAbi,
  voterProgressionAbi,
  votingSystemAbi,
} from "@/lib/contracts";
import { shortAddress } from "@/lib/dapp-onchain";

type LinkedAddressConfig = {
  key: string;
  label: string;
  readFn: string;
  setterFn?: string;
};

type ManagedContractConfig = {
  key: string;
  name: string;
  address?: Address;
  abi: Abi;
  stateFn?: "isPaused" | "paused";
  linked: LinkedAddressConfig[];
  params?: NumericParamConfig[];
};

type ContractUiState = {
  state: "Live" | "Paused" | "Unknown";
  linkedValues: Record<string, string>;
  paramValues: Record<string, bigint>;
};

type NumericParamConfig = {
  key: string;
  label: string;
  readFn: string;
  setterFn: string;
  unit: "raw" | "token18";
  min?: bigint;
  max?: bigint;
  hint?: string;
};

const managedContracts: ManagedContractConfig[] = [
  {
    key: "grantManager",
    name: "GrantManager",
    address: contracts.grantManager,
    abi: grantManagerAbi,
    stateFn: "isPaused",
    linked: [
      { key: "votingSystem", label: "votingSystem", readFn: "votingSystem", setterFn: "setVotingSystem" },
      { key: "fundingPool", label: "fundingPool", readFn: "fundingPool", setterFn: "setFundingPool" },
      { key: "ideaRegistry", label: "ideaRegistry", readFn: "ideaRegistry", setterFn: "setIdeaRegistry" },
      { key: "roles", label: "rolesRegistry", readFn: "roles" },
    ],
    params: [
      {
        key: "authorSharePercent",
        label: "Author share",
        readFn: "authorSharePercent",
        setterFn: "setAuthorShare",
        unit: "raw",
        min: 0n,
        max: 100n,
        hint: "percent (0-100)",
      },
    ],
  },
  {
    key: "votingSystem",
    name: "VotingSystem",
    address: contracts.votingSystem,
    abi: votingSystemAbi,
    stateFn: "isPaused",
    linked: [
      { key: "fundingPool", label: "fundingPool", readFn: "fundingPool", setterFn: "setFundingPool" },
      { key: "ideaRegistry", label: "ideaRegistry", readFn: "ideaRegistry", setterFn: "setIdeaRegistry" },
      {
        key: "reputationSystem",
        label: "reputationSystem",
        readFn: "reputationSystem",
        setterFn: "setReputationSystem",
      },
      {
        key: "voterProgression",
        label: "voterProgression",
        readFn: "voterProgression",
        setterFn: "setVoterProgression",
      },
      { key: "roles", label: "rolesRegistry", readFn: "roles" },
    ],
    params: [
      {
        key: "votingDuration",
        label: "Voting duration",
        readFn: "VOTING_DURATION",
        setterFn: "setVotingDuration",
        unit: "raw",
        min: 1n,
        hint: "seconds",
      },
      {
        key: "minStake",
        label: "Minimum stake",
        readFn: "minStake",
        setterFn: "setMinStake",
        unit: "token18",
        min: 1n,
        hint: "BTK",
      },
      {
        key: "ideasPerRound",
        label: "Ideas per round",
        readFn: "IDEAS_PER_ROUND",
        setterFn: "setIdeaPerRound",
        unit: "raw",
        min: 1n,
      },
    ],
  },
  {
    key: "faucet",
    name: "BRTFaucet",
    address: contracts.faucet,
    abi: brtfaucetAbi,
    stateFn: "isPaused",
    linked: [
      { key: "token", label: "token", readFn: "token" },
      { key: "roles", label: "rolesRegistry", readFn: "roles" },
    ],
    params: [
      {
        key: "claimAmount",
        label: "Claim amount",
        readFn: "claimAmount",
        setterFn: "setClaimAmount",
        unit: "token18",
        min: 1n,
        hint: "BTK",
      },
      {
        key: "cooldown",
        label: "Cooldown",
        readFn: "cooldown",
        setterFn: "setCooldown",
        unit: "raw",
        min: 1n,
        hint: "seconds",
      },
    ],
  },
  {
    key: "fundingPool",
    name: "FundingPool",
    address: contracts.fundingPool,
    abi: fundingPoolAbi,
    stateFn: "isPaused",
    linked: [
      {
        key: "governanceToken",
        label: "governanceToken",
        readFn: "governanceToken",
        setterFn: "setGovernanceToken",
      },
      { key: "ideaRegistry", label: "ideaRegistry", readFn: "ideaRegistry", setterFn: "setIdeaRegistry" },
      { key: "roles", label: "rolesRegistry", readFn: "roles" },
    ],
  },
  {
    key: "ideaRegistry",
    name: "IdeaRegistry",
    address: contracts.ideaRegistry,
    abi: ideaRegistryAbi,
    linked: [
      {
        key: "fundingPool",
        label: "fundingPool",
        readFn: "fundingPool",
        setterFn: "setFundingPool",
      },
      {
        key: "reputationSystem",
        label: "reputationSystem",
        readFn: "reputationSystem",
        setterFn: "setReputationSystem",
      },
      {
        key: "voterProgression",
        label: "voterProgression",
        readFn: "voterProgression",
        setterFn: "setVoterProgression",
      },
      { key: "roles", label: "rolesRegistry", readFn: "roles" },
    ],
  },
  {
    key: "voterProgression",
    name: "VoterProgression",
    address: contracts.voterProgression,
    abi: voterProgressionAbi,
    linked: [{ key: "roles", label: "rolesRegistry", readFn: "roles" }],
  },
  {
    key: "reputationSystem",
    name: "ReputationSystem",
    address: contracts.reputationSystem,
    abi: reputationSystemAbi,
    linked: [{ key: "roles", label: "rolesRegistry", readFn: "roles" }],
  },
];

function isAddress(value: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

function inputKey(contractKey: string, linkKey: string) {
  return `${contractKey}:${linkKey}`;
}

function formatParamInput(value: bigint, unit: NumericParamConfig["unit"]) {
  if (unit === "token18") return formatUnits(value, 18);
  return value.toString();
}

function parseParamInput(value: string, unit: NumericParamConfig["unit"]) {
  const cleaned = value.trim();
  if (!cleaned) return null;
  try {
    return unit === "token18" ? parseUnits(cleaned, 18) : BigInt(cleaned);
  } catch {
    return null;
  }
}

function presentableError(message?: string) {
  if (!message) return "";

  if (message.includes("User rejected") || message.includes("rejected the request")) {
    return "Transaction was cancelled in wallet.";
  }
  if (message.includes("No contract code at")) {
    return message;
  }
  if (message.includes("NotAdmin")) {
    return "Connected wallet does not have admin role for this action.";
  }
  if (message.includes("ZeroAddress")) {
    return "Invalid address: zero address is not allowed.";
  }
  if (message.includes("InvalidShare")) {
    return "Invalid share value. Allowed range is 0 to 100.";
  }
  if (message.includes("EnforcedPause")) {
    return "Contract is paused.";
  }
  if (message.includes("NetworkError when attempting to fetch resource")) {
    return "RPC connection failed. Check active network and RPC URL.";
  }
  if (message.includes("Internal error")) {
    return "Transaction reverted by contract rules. Check roles, input values, and contract state.";
  }

  const cleaned = message.split("Contract Call:")[0].trim();
  return cleaned || "Transaction failed.";
}

export default function AdminPage() {
  const publicClient = usePublicClient();
  const { address } = useAccount();
  const chainId = useChainId();
  const { data: txHash, isPending, error, writeContract } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const [states, setStates] = useState<Record<string, ContractUiState>>({});
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  const availableContracts = managedContracts.filter((item) => Boolean(item.address));

  useEffect(() => {
    let cancelled = false;

    async function loadAdmin() {
      if (!publicClient) return;
      const readContract = (config: Record<string, unknown>) =>
        (publicClient as { readContract: (arg: Record<string, unknown>) => Promise<unknown> }).readContract(config);

      if (!contracts.rolesRegistry || !address) {
        setIsAdmin(null);
      } else {
        try {
          const adminRole = (await readContract({
            address: contracts.rolesRegistry,
            abi: rolesRegistryAbi,
            functionName: "DEFAULT_ADMIN_ROLE",
          })) as `0x${string}`;

          const hasRole = (await readContract({
            address: contracts.rolesRegistry,
            abi: rolesRegistryAbi,
            functionName: "hasRole",
            args: [adminRole, address],
          })) as boolean;

          if (!cancelled) setIsAdmin(hasRole);
        } catch {
          if (!cancelled) setIsAdmin(null);
        }
      }

      setIsLoading(true);
      setLoadError(null);

      try {
        const nextStates: Record<string, ContractUiState> = {};
        const nextInputs: Record<string, string> = {};

        for (const contract of managedContracts) {
          if (!contract.address) {
            nextStates[contract.key] = { state: "Unknown", linkedValues: {}, paramValues: {} };
            continue;
          }

          let contractState: ContractUiState["state"] = "Unknown";
          if (contract.stateFn) {
            try {
              const paused = (await readContract({
                address: contract.address,
                abi: contract.abi,
                functionName: contract.stateFn,
              })) as boolean;
              contractState = paused ? "Paused" : "Live";
            } catch {
              contractState = "Unknown";
            }
          } else {
            contractState = "Live";
          }

          const linkedValues: Record<string, string> = {};
          for (const linked of contract.linked) {
            try {
              const value = (await readContract({
                address: contract.address,
                abi: contract.abi,
                functionName: linked.readFn,
              })) as string;
              linkedValues[linked.key] = value;
              nextInputs[inputKey(contract.key, linked.key)] = value;
            } catch {
              linkedValues[linked.key] = "-";
              nextInputs[inputKey(contract.key, linked.key)] = "";
            }
          }

          const paramValues: Record<string, bigint> = {};
          for (const param of contract.params ?? []) {
            try {
              const value = (await readContract({
                address: contract.address,
                abi: contract.abi,
                functionName: param.readFn,
              })) as bigint;
              paramValues[param.key] = value;
              nextInputs[inputKey(contract.key, param.key)] = formatParamInput(value, param.unit);
            } catch {
              paramValues[param.key] = 0n;
              nextInputs[inputKey(contract.key, param.key)] = "";
            }
          }

          nextStates[contract.key] = {
            state: contractState,
            linkedValues,
            paramValues,
          };
        }

        if (!cancelled) {
          setStates(nextStates);
          setInputs(nextInputs);
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : "Failed to load admin state");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadAdmin();
    return () => {
      cancelled = true;
    };
  }, [publicClient, address, isSuccess]);

  const pausedCount = useMemo(
    () => Object.values(states).filter((value) => value.state === "Paused").length,
    [states]
  );

  const linkedCount = useMemo(
    () => availableContracts.reduce((sum, item) => sum + item.linked.length, 0),
    [availableContracts]
  );

  const busy = isPending || isConfirming;
  const isWriteBlocked = busy || isAdmin !== true;
  const sendWrite = writeContract as unknown as (variables: Record<string, unknown>, options?: Record<string, unknown>) => void;

  const runWrite = async (params: {
    actionKey: string;
    address: Address;
    abi: Abi;
    functionName: string;
    args?: unknown[];
    gas?: bigint;
  }) => {
    setActionError(null);
    setActiveAction(params.actionKey);
    try {
      if (!publicClient) {
        setActionError("No RPC client available.");
        setActiveAction(null);
        return;
      }
      const bytecode = await publicClient.getBytecode({ address: params.address });
      if (!bytecode || bytecode === "0x") {
        setActionError(`No contract code at ${params.address} on current chain.`);
        setActiveAction(null);
        return;
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to verify contract address on current chain.");
      setActiveAction(null);
      return;
    }

    sendWrite(
      {
        address: params.address,
        abi: params.abi,
        functionName: params.functionName,
        args: params.args,
        gas: params.gas,
      },
      {
        onError: (err) => {
          setActionError(err.message);
          setActiveAction(null);
        },
        onSuccess: () => {
          setActionError(null);
          setActiveAction(null);
        },
      }
    );
  };

  const onPause = (contract: ManagedContractConfig) => {
    if (!contract.address) return;
    void runWrite({
      actionKey: `${contract.key}:pause`,
      address: contract.address,
      abi: contract.abi,
      functionName: "pause",
      gas: 300_000n,
    });
  };

  const onUnpause = (contract: ManagedContractConfig) => {
    if (!contract.address) return;
    void runWrite({
      actionKey: `${contract.key}:unpause`,
      address: contract.address,
      abi: contract.abi,
      functionName: "unpause",
      gas: 300_000n,
    });
  };

  const onUpdateAddress = (contract: ManagedContractConfig, linked: LinkedAddressConfig) => {
    if (!contract.address || !linked.setterFn) return;
    const key = inputKey(contract.key, linked.key);
    const value = (inputs[key] ?? "").trim();

    if (!isAddress(value)) {
      setActionError(`Invalid address for ${contract.name}.${linked.label}`);
      return;
    }

    void runWrite({
      actionKey: `${contract.key}:${linked.key}:set`,
      address: contract.address,
      abi: contract.abi,
      functionName: linked.setterFn,
      args: [value as Address],
      gas: 500_000n,
    });
  };

  const onUpdateParam = (contract: ManagedContractConfig, param: NumericParamConfig) => {
    if (!contract.address) return;
    const key = inputKey(contract.key, param.key);
    const rawInput = inputs[key] ?? "";
    const parsed = parseParamInput(rawInput, param.unit);
    if (parsed === null) {
      setActionError(`Invalid value for ${contract.name}.${param.label}`);
      return;
    }
    if (param.min !== undefined && parsed < param.min) {
      setActionError(`${contract.name}.${param.label} must be >= ${param.min.toString()}`);
      return;
    }
    if (param.max !== undefined && parsed > param.max) {
      setActionError(`${contract.name}.${param.label} must be <= ${param.max.toString()}`);
      return;
    }

    void runWrite({
      actionKey: `${contract.key}:${param.key}:set`,
      address: contract.address,
      abi: contract.abi,
      functionName: param.setterFn,
      args: [parsed],
      gas: 500_000n,
    });
  };

  const onSyncBalance = (contract: ManagedContractConfig) => {
    if (!contract.address) return;
    void runWrite({
      actionKey: `${contract.key}:syncBalance`,
      address: contract.address,
      abi: contract.abi,
      functionName: "syncBalance",
      gas: 500_000n,
    });
  };

  return (
    <section className="space-y-6">
      <article className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#2a2d3b] p-5 sm:p-6 md:p-8">
        <div className="pointer-events-none absolute -top-20 right-0 h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">BERT Control Center</p>
            <h1 className="mt-3 font-[var(--font-display)] text-3xl text-white sm:text-4xl md:text-6xl">Admin Panel</h1>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-emerald-300">
            <FaShieldAlt />
            Admin Only
          </span>
        </div>

        <div className="relative mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-[#313443] p-4">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Managed contracts</p>
            <p className="mt-2 text-3xl font-semibold text-white">{availableContracts.length}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#313443] p-4">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Paused now</p>
            <p className="mt-2 text-3xl font-semibold text-white">{pausedCount}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#313443] p-4">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Linked addresses</p>
            <p className="mt-2 text-3xl font-semibold text-white">{linkedCount}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#313443] p-4">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Wallet admin role</p>
            <p className="mt-2 text-lg font-semibold text-white">
              {isAdmin === null ? "Unknown" : isAdmin ? "Granted" : "Not granted"}
            </p>
          </div>
        </div>
      </article>

      {!contracts.rolesRegistry && (
        <p className="rounded-xl border border-amber-300/35 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          Set <code>NEXT_PUBLIC_ROLES_REGISTRY_ADDRESS</code> to verify admin role on-chain.
        </p>
      )}
      <p className="rounded-xl border border-white/10 bg-[#313443] px-4 py-3 text-xs text-slate-300">
        Connected chain ID: <code>{chainId}</code>
      </p>
      {isAdmin === false && (
        <p className="rounded-xl border border-amber-300/35 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          Connected wallet does not have <code>DEFAULT_ADMIN_ROLE</code>. Admin actions are disabled.
        </p>
      )}

      {loadError && (
        <p className="rounded-xl border border-rose-300/35 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          {presentableError(loadError)}
        </p>
      )}

      {actionError && (
        <p className="rounded-xl border border-rose-300/35 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          {presentableError(actionError)}
        </p>
      )}

      {error?.message && (
        <p className="rounded-xl border border-rose-300/35 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          {presentableError(error.message)}
        </p>
      )}

      {txHash && (
        <p className="rounded-xl border border-white/10 bg-[#313443] px-4 py-3 text-xs break-all text-slate-300">Tx: {txHash}</p>
      )}

      <section className="grid gap-4 2xl:grid-cols-2">
        {managedContracts.map((contract) => {
          const state = states[contract.key];
          const contractAddress = contract.address ?? "";
          const isContractMissing = !contract.address;
          const isPaused = state?.state === "Paused";

          return (
            <article key={contract.key} className="rounded-2xl border border-white/10 bg-[#2a2d3b] p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-[var(--font-display)] text-2xl text-white">{contract.name}</h2>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    isContractMissing
                      ? "bg-slate-500/15 text-slate-300"
                      : isPaused
                        ? "bg-amber-500/15 text-amber-300"
                        : "bg-emerald-500/15 text-emerald-300"
                  }`}
                >
                  {isContractMissing ? "Missing" : state?.state ?? "Loading"}
                </span>
              </div>

              <label className="mt-4 grid gap-2">
                <span className="text-xs uppercase tracking-[0.12em] text-slate-400">Contract address</span>
                <input
                  value={contractAddress}
                  className="min-w-0 break-all rounded-lg border border-white/10 bg-[#313443] px-3 py-2 text-sm text-slate-100 outline-none"
                  readOnly
                />
              </label>

              {contract.stateFn && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    disabled={isContractMissing || isWriteBlocked}
                    onClick={() => onPause(contract)}
                    className="inline-flex items-center gap-2 rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <FaPauseCircle />
                    {busy && activeAction === `${contract.key}:pause` ? "Pausing..." : "Pause"}
                  </button>
                  <button
                    disabled={isContractMissing || isWriteBlocked}
                    onClick={() => onUnpause(contract)}
                    className="inline-flex items-center gap-2 rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <FaPlayCircle />
                    {busy && activeAction === `${contract.key}:unpause` ? "Unpausing..." : "Unpause"}
                  </button>
                  {contract.key === "fundingPool" && (
                    <button
                      disabled={isContractMissing || isWriteBlocked}
                      onClick={() => onSyncBalance(contract)}
                      className="inline-flex items-center gap-2 rounded-lg border border-indigo-400/40 bg-indigo-500/10 px-3 py-2 text-xs font-semibold text-indigo-200 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {busy && activeAction === `${contract.key}:syncBalance` ? "Syncing..." : "Sync Balance"}
                    </button>
                  )}
                </div>
              )}

              <div className="mt-4 space-y-2">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Linked contract addresses</p>
                {contract.linked.map((item) => {
                  const key = inputKey(contract.key, item.key);
                  const readOnly = !item.setterFn;
                  const displayedValue = inputs[key] ?? state?.linkedValues[item.key] ?? "";

                  return (
                    <div key={`${contract.key}-${item.key}`} className="grid gap-1">
                      <span className="text-xs text-slate-400">{item.label}</span>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <input
                          value={displayedValue}
                          onChange={(event) =>
                            setInputs((prev) => ({
                              ...prev,
                              [key]: event.target.value,
                            }))
                          }
                          className="min-w-0 flex-1 rounded-lg border border-white/10 bg-[#252836] px-3 py-2 text-xs text-slate-100 outline-none focus:border-cyan-400/50"
                          readOnly={readOnly}
                        />
                        {item.setterFn && (
                          <button
                            disabled={isContractMissing || isWriteBlocked}
                            onClick={() => onUpdateAddress(contract, item)}
                            className="rounded-lg bg-cyan-500 px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {busy && activeAction === `${contract.key}:${item.key}:set` ? "Updating..." : `Update via ${item.setterFn}`}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {(contract.params?.length ?? 0) > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Protocol parameters</p>
                  {contract.params!.map((param) => {
                    const key = inputKey(contract.key, param.key);
                    const displayedValue = inputs[key] ?? "";
                    const current = state?.paramValues[param.key];
                    const currentLabel =
                      current === undefined
                        ? "-"
                        : param.unit === "token18"
                          ? `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 4 }).format(
                              Number(formatUnits(current, 18))
                            )} BTK`
                          : current.toString();

                    return (
                      <div key={`${contract.key}-${param.key}`} className="grid gap-1">
                        <span className="text-xs text-slate-400">
                          {param.label} {param.hint ? `(${param.hint})` : ""}
                        </span>
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <input
                            value={displayedValue}
                            onChange={(event) =>
                              setInputs((prev) => ({
                                ...prev,
                                [key]: event.target.value,
                              }))
                            }
                            className="min-w-0 flex-1 rounded-lg border border-white/10 bg-[#252836] px-3 py-2 text-xs text-slate-100 outline-none focus:border-cyan-400/50"
                            placeholder={currentLabel}
                          />
                          <button
                            disabled={isContractMissing || isWriteBlocked}
                            onClick={() => onUpdateParam(contract, param)}
                            className="rounded-lg bg-indigo-500 px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {busy && activeAction === `${contract.key}:${param.key}:set` ? "Updating..." : "Update"}
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-400">Current: {currentLabel}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </article>
          );
        })}
      </section>

      <section>
        <article className="rounded-2xl border border-white/10 bg-[#2a2d3b] p-5">
          <h2 className="font-[var(--font-display)] text-3xl text-white">Security + Access</h2>
          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-white/10 bg-[#313443] p-3">
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-100">
                <FaLock />
                Admin role source
              </p>
              <p className="mt-2 break-all text-xs text-slate-300">RolesRegistry.hasRole(DEFAULT_ADMIN_ROLE, connectedWallet)</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#313443] p-3">
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-100">
                <FaWallet />
                Active wallet
              </p>
              <p className="mt-2 break-all text-xs text-slate-300">{address ? `${shortAddress(address)} (${address})` : "Not connected"}</p>
            </div>
          </div>
        </article>
      </section>

      {isLoading && (
        <p className="rounded-xl border border-white/10 bg-[#313443] px-4 py-3 text-sm text-slate-300">Loading on-chain admin state...</p>
      )}
    </section>
  );
}
