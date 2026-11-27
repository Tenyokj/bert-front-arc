"use client";

import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  useAccount,
  useConfig,
  usePublicClient,
  useWriteContract,
} from "wagmi";
import { getAccount } from "wagmi/actions";
import { type Abi, type Address, isAddress, parseAbi, zeroAddress } from "viem";
import { contracts } from "@/lib/contracts";
import { defaultChain } from "@/lib/web3";
import {
  isUncertainWalletError,
  uncertainWalletMessage,
} from "@/lib/wallet-action";
import {
  policyReady,
  readTreasurySnapshot,
  revenuePoolAbi,
  revenueTreasuryAbi,
} from "@/lib/treasury-revenue";
import { TreasuryReadout } from "./TreasuryReadout";

const roleAbi = parseAbi([
  "function hasRole(bytes32 role,address account) view returns(bool)",
]);
const adminRole = `0x${"0".repeat(64)}` as const;

export function RevenueTreasuryPanel({ mode = "public" }: { mode?: "public" | "operator" }) {
  const config = useConfig();
  const account = useAccount();
  const client = usePublicClient({ chainId: defaultChain.id });
  const { writeContractAsync } = useWriteContract();
  const [roundInput, setRoundInput] = useState("");
  const [round, setRound] = useState<string | undefined>();
  const [treasury, setTreasury] = useState("");
  const [share, setShare] = useState("");
  const [busy, setBusy] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [message, setMessage] = useState("");
  const [hash, setHash] = useState<string>();
  const actionLock = useRef(false);
  const pool = contracts.fundingPool;
  const query = useQuery({
    queryKey: ["treasury-accounting", defaultChain.id, pool, round],
    enabled: !!client && !!pool,
    queryFn: () =>
      readTreasurySnapshot(
        client!,
        pool!,
        defaultChain.id,
        round ? BigInt(round) : undefined,
      ),
    staleTime: 15_000,
    refetchInterval: 60_000,
    retry: 1,
  });
  const snapshot = query.data;
  const role = useQuery({
    queryKey: [
      "revenue-admin",
      defaultChain.id,
      snapshot?.roles,
      account.address,
    ],
    enabled: mode === "operator" && !!client && !!snapshot && !!account.address,
    queryFn: () =>
      client!.readContract({
        address: snapshot!.roles,
        abi: roleAbi,
        functionName: "hasRole",
        args: [adminRole, account.address!],
      }),
    staleTime: 0,
  });
  const disabled =
    busy ||
    uncertain ||
    query.isFetching ||
    !!query.error ||
    !snapshot ||
    !account.address ||
    account.chainId !== defaultChain.id;

  async function act(
    target: Address,
    abi: Abi,
    functionName: string,
    args: readonly unknown[] = [],
    admin = false,
  ) {
    if (
      actionLock.current ||
      mode !== "operator" ||
      disabled ||
      !client ||
      !pool ||
      !account.address ||
      snapshot?.mode !== "v2.4"
    )
      return;
    const expectedAccount = account.address;
    const assertWallet = () => {
      const current = getAccount(config);
      if (
        current.address !== expectedAccount ||
        current.chainId !== defaultChain.id
      ) {
        throw new Error("Wallet or network changed. Refresh before sending.");
      }
    };
    actionLock.current = true;
    setBusy(true);
    setMessage("Checking current onchain state...");
    setHash(undefined);
    let unresolvedBroadcast = false;
    try {
      assertWallet();
      const fresh = await readTreasurySnapshot(
        client,
        pool,
        defaultChain.id,
        round ? BigInt(round) : undefined,
      );
      if (fresh.mode !== "v2.4")
        throw new Error("V2.4 actions are unavailable on this deployment.");
      if (
        ["executeRevenuePolicy", "cancelRevenuePolicy"].includes(
          functionName,
        ) &&
        JSON.stringify(fresh.policy) !== JSON.stringify(snapshot.policy)
      ) {
        throw new Error(
          "Revenue settings changed since the displayed snapshot. Refresh and review them again.",
        );
      }
      if (
        admin &&
        !(await client.readContract({
          address: fresh.roles,
          abi: roleAbi,
          functionName: "hasRole",
          args: [adminRole, expectedAccount],
        }))
      )
        throw new Error("Protocol Admin role required.");
      if (functionName === "executeRevenuePolicy" && !policyReady(fresh))
        throw new Error("The onchain notice period has not elapsed.");
      if (
        functionName === "collect" &&
        (fresh.paused || fresh.shortfall !== "0")
      )
        throw new Error("Collection blocked by pause or shortfall.");
      const { request } = await client.simulateContract({
        address: target,
        abi,
        functionName,
        args,
        account: expectedAccount,
      });
      assertWallet();
      setMessage(
        "Confirm this transaction in your wallet. No token approval is needed.",
      );
      const tx = await writeContractAsync({
        ...request,
        chainId: defaultChain.id,
      });
      setHash(tx);
      setMessage("Submitted; waiting for an onchain receipt...");
      const receipt = await client.waitForTransactionReceipt({ hash: tx });
      if (receipt.status !== "success")
        throw new Error("Transaction reverted onchain.");
      setMessage("Confirmed onchain. Refreshing the accounting snapshot...");
      await query.refetch();
    } catch (error) {
      if (isUncertainWalletError(error)) {
        unresolvedBroadcast = true;
        setUncertain(true);
        setMessage(uncertainWalletMessage);
      } else
        setMessage(
          error instanceof Error
            ? error.message.split("Contract Call:")[0]
            : "Action failed.",
        );
    } finally {
      actionLock.current = unresolvedBroadcast;
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <form
        className="revenue-controls"
        onSubmit={(event) => {
          event.preventDefault();
          if (roundInput && !/^[1-9]\d*$/.test(roundInput)) {
            setMessage("Enter a positive round ID.");
            return;
          }
          setRound(roundInput || undefined);
        }}
      >
        <label>
          Inspect historical round
          <input
            aria-label="Revenue round ID"
            inputMode="numeric"
            value={roundInput}
            onChange={(e) => setRoundInput(e.target.value)}
            placeholder="Optional round ID"
          />
        </label>
        <button type="submit" disabled={busy}>
          Inspect round snapshot
        </button>
        <button
          type="button"
          disabled={busy || query.isFetching}
          onClick={async () => {
            const result = await query.refetch();
            if (result.isSuccess) {
              actionLock.current = false;
              setUncertain(false);
            }
          }}
        >
          Refresh accounting (read-only)
        </button>
      </form>
      {!pool && <p role="alert">FundingPool address is not configured.</p>}
      {query.isPending && pool && (
        <p role="status">Reading treasury accounting...</p>
      )}
      {query.error && (
        <p role="alert" className="revenue-warning">
          Accounting unavailable: {query.error.message}. Values have not been
          replaced with zeros.
        </p>
      )}
      {snapshot && !query.error && (
        <TreasuryReadout
          snapshot={snapshot}
          busy={disabled}
          onCollect={mode === "operator" ? (receiver) =>
            void act(receiver.address, revenueTreasuryAbi, "collect", [
              BigInt(receiver.pending),
            ])
          : undefined}
          onRelease={mode === "operator" ? (receiver, payee) =>
            void act(receiver.address, revenueTreasuryAbi, "release", [payee])
          : undefined}
        />
      )}
      {mode === "operator" && snapshot?.mode === "v2.4" && !query.error && (
        <section className="revenue-panel">
          <h2>Manage future-round revenue settings</h2>
          <p>
            Only protocol Admin can schedule or cancel. Anyone can execute after
            the chain-time deadline. No changes apply retroactively.
          </p>
          <p>
            Receiver contracts and immutable beneficiaries must be reviewed
            before scheduling; identity getters alone do not prove code safety.
            Zero address and zero share disable future-round revenue after the
            same delay.
          </p>
          <form
            className="revenue-controls"
            onSubmit={(event) => {
              event.preventDefault();
              if (
                !isAddress(treasury) ||
                !/^\d+$/.test(share) ||
                BigInt(share) > 10000n ||
                (treasury.toLowerCase() === zeroAddress) !==
                  (BigInt(share) === 0n)
              ) {
                setMessage(
                  "Enter a Treasury address and 1..10000 basis points, or zero address with 0 to disable.",
                );
                return;
              }
              if (
                window.confirm(
                  `Schedule ${share} bps of eligible earned fees to ${treasury}? This does not change existing rounds.`,
                )
              ) {
                void act(
                  pool!,
                  revenuePoolAbi,
                  "scheduleRevenuePolicy",
                  [treasury, BigInt(share)],
                  true,
                );
              }
            }}
          >
            <label>
              Reviewed Treasury address
              <input
                aria-label="Revenue Treasury address"
                value={treasury}
                onChange={(e) => setTreasury(e.target.value)}
                placeholder="0x..."
              />
            </label>
            <label>
              Share of earned fees (bps)
              <input
                aria-label="Revenue share basis points"
                inputMode="numeric"
                value={share}
                onChange={(e) => setShare(e.target.value)}
                placeholder="100 bps = 1%"
              />
            </label>
            <button disabled={disabled || role.data !== true} type="submit">
              Schedule settings
            </button>
            <button
              disabled={
                disabled ||
                role.data !== true ||
                snapshot.policy?.readyAt === "0"
              }
              type="button"
              onClick={() =>
                void act(pool!, revenuePoolAbi, "cancelRevenuePolicy", [], true)
              }
            >
              Cancel scheduled settings
            </button>
            <button
              disabled={disabled || !policyReady(snapshot)}
              type="button"
              onClick={() =>
                void act(pool!, revenuePoolAbi, "executeRevenuePolicy")
              }
            >
              Activate announced settings
            </button>
          </form>
        </section>
      )}
      <p className="text-sm text-slate-300">
        {mode === "public" ? "Public accounting is read-only. Operator forms and fixed-beneficiary payment relays are in the Control Center; these figures remain publicly visible." : !account.address
          ? "Connect a wallet to relay transactions."
          : account.chainId !== defaultChain.id
            ? `Switch the wallet to ${defaultChain.name} before using actions.`
            : "Payments go to fixed recipients, not necessarily the connected wallet."}
      </p>
      {message && (
        <p role="status" className="revenue-warning">
          {message}
        </p>
      )}
      {hash && (
        <p className="break-all">
          Transaction: <code>{hash}</code>
        </p>
      )}
    </div>
  );
}
