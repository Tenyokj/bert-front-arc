import { FaCheckCircle, FaClock, FaKey, FaListUl } from "react-icons/fa";

import { formatClaimDeadline, roleBootstrapConfig, summarizeRoleBootstrapAddresses } from "@/lib/role-bootstrap";
import { shortAddress } from "@/lib/dapp-onchain";

type RoleBootstrapAddressesShowcaseProps = {
  variant?: "home" | "dashboard";
};

export function RoleBootstrapAddressesShowcase({ variant = "home" }: RoleBootstrapAddressesShowcaseProps) {
  const seededAddresses = summarizeRoleBootstrapAddresses();

  if (!roleBootstrapConfig.distributorAddress) {
    return null;
  }

  const isHome = variant === "home";
  const wrapperClassName = isHome
    ? "rounded-[28px] border border-slate-200/80 bg-white/75 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur sm:p-7"
    : "rounded-[28px] border border-white/10 bg-[#2a2d3b] p-6 sm:p-7";

  return (
    <div className={wrapperClassName}>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
            isHome ? "border border-cyan-200 bg-cyan-50 text-cyan-900" : "border border-cyan-300/20 bg-cyan-400/10 text-cyan-100"
          }`}>
            <FaListUl className="text-[10px]" />
            Public bootstrap list
          </div>
          <h2 className={`mt-4 font-[var(--font-display)] text-3xl sm:text-4xl ${isHome ? "text-slate-900" : "text-white"}`}>
            Bootstrap role distribution is live.
          </h2>
          <p className={`mt-3 text-sm leading-relaxed sm:text-base ${isHome ? "text-slate-600" : "text-slate-300"}`}>
            If your wallet is on this seeded list, head to the dashboard and claim your bootstrap role directly from
            the distributor contract.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:max-w-md">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${isHome ? "text-slate-500" : "text-slate-400"}`}>
              Claim deadline
            </p>
            <p className={`mt-2 text-sm font-semibold ${isHome ? "text-slate-900" : "text-white"}`}>
              {formatClaimDeadline(roleBootstrapConfig.claimDeadline)}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${isHome ? "text-slate-500" : "text-slate-400"}`}>
              Distributor
            </p>
            <p className={`mt-2 text-sm font-semibold ${isHome ? "text-slate-900" : "text-white"}`}>
              {shortAddress(roleBootstrapConfig.distributorAddress)}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/12 text-cyan-300">
              <FaClock className="text-lg" />
            </div>
            <div>
              <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${isHome ? "text-slate-500" : "text-slate-400"}`}>
                How this works
              </p>
              <ul className={`mt-3 space-y-2 text-sm leading-relaxed ${isHome ? "text-slate-700" : "text-slate-300"}`}>
                <li>1. Check whether your wallet is on the seeded bootstrap list.</li>
                <li>2. Open the dApp dashboard and connect the eligible wallet.</li>
                <li>3. Claim curator, reviewer, or both roles directly onchain.</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/12 text-emerald-300">
              <FaKey className="text-lg" />
            </div>
            <div className="w-full">
              <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${isHome ? "text-slate-500" : "text-slate-400"}`}>
                Seeded addresses
              </p>
              {seededAddresses.length > 0 ? (
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {seededAddresses.map((entry) => (
                    <div key={entry.address} className="rounded-2xl border border-white/10 bg-black/10 px-3 py-3">
                      <p className={`break-all text-sm font-semibold ${isHome ? "text-slate-900" : "text-white"}`}>
                        {entry.address}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {entry.curator ? (
                          <span className="rounded-full border border-emerald-300/40 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-200">
                            Curator
                          </span>
                        ) : null}
                        {entry.reviewer ? (
                          <span className="rounded-full border border-indigo-300/40 bg-indigo-500/10 px-2 py-0.5 text-[11px] font-semibold text-indigo-200">
                            Reviewer
                          </span>
                        ) : null}
                        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-slate-300">
                          {shortAddress(entry.address)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={`mt-3 text-sm ${isHome ? "text-slate-600" : "text-slate-300"}`}>
                  No public allowlist was configured yet. Add
                  <code className="mx-1 rounded bg-black/10 px-1.5 py-0.5">NEXT_PUBLIC_ROLE_BOOTSTRAP_CURATOR_ALLOWLIST</code>
                  and
                  <code className="mx-1 rounded bg-black/10 px-1.5 py-0.5">NEXT_PUBLIC_ROLE_BOOTSTRAP_REVIEWER_ALLOWLIST</code>
                  to expose the seeded wallets on the site.
                </p>
              )}
              <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                <FaCheckCircle />
                The claim panel verifies final eligibility onchain before every role claim.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
