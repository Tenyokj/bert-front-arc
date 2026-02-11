import { FaLock, FaPauseCircle, FaPlayCircle, FaShieldAlt, FaWallet } from "react-icons/fa";

type ManagedContract = {
  name: string;
  address: string;
  state: "Live" | "Paused";
  linked: Array<{ label: string; value: string }>;
};

const contracts: ManagedContract[] = [
  {
    name: "GrantManager",
    address: "0xB810...01Ff",
    state: "Live",
    linked: [
      { label: "_votingSystem", value: "0x17D2...9B3A" },
      { label: "_fundingPool", value: "0x7a1E...11c0" },
      { label: "_ideaRegistry", value: "0x4aB5...89eC" },
      { label: "_rolesRegistry", value: "0xCc8E...90f1" },
    ],
  },
  {
    name: "VotingSystem",
    address: "0x17D2...9B3A",
    state: "Paused",
    linked: [
      { label: "_fundingPool", value: "0x7a1E...11c0" },
      { label: "_ideaRegistry", value: "0x4aB5...89eC" },
      { label: "_reputationSystem", value: "0x22e1...7aD0" },
      { label: "_voterProgression", value: "0x80aA...82de" },
      { label: "_rolesRegistry", value: "0xCc8E...90f1" },
    ],
  },
  {
    name: "FundingPool",
    address: "0x7a1E...11c0",
    state: "Live",
    linked: [
      { label: "_governanceToken", value: "0xF000...bTK1" },
      { label: "_ideaRegistry", value: "0x4aB5...89eC" },
      { label: "_rolesRegistry", value: "0xCc8E...90f1" },
    ],
  },
  {
    name: "IdeaRegistry",
    address: "0x4aB5...89eC",
    state: "Live",
    linked: [
      { label: "_reputationSystem", value: "0x22e1...7aD0" },
      { label: "_voterProgression", value: "0x80aA...82de" },
      { label: "_rolesRegistry", value: "0xCc8E...90f1" },
    ],
  },
  {
    name: "VoterProgression",
    address: "0x80aA...82de",
    state: "Live",
    linked: [{ label: "_rolesRegistry", value: "0xCc8E...90f1" }],
  },
  {
    name: "ReputationSystem",
    address: "0x22e1...7aD0",
    state: "Live",
    linked: [{ label: "_rolesRegistry", value: "0xCc8E...90f1" }],
  },
];

function setterLabel(paramName: string) {
  const clean = paramName.replace(/^_/, "");
  return `set${clean.charAt(0).toUpperCase()}${clean.slice(1)}`;
}

export default function AdminPage() {
  const pausedCount = contracts.filter((contract) => contract.state === "Paused").length;

  return (
    <section className="space-y-6">
      <article className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#2a2d3b] p-6 md:p-8">
        <div className="pointer-events-none absolute -top-20 right-0 h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">BERT Control Center</p>
            <h1 className="mt-3 font-[var(--font-display)] text-4xl text-white md:text-6xl">Admin Panel</h1>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-emerald-300">
            <FaShieldAlt />
            Admin Only
          </span>
        </div>

        <div className="relative mt-5 grid gap-3 md:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-[#313443] p-4">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Managed contracts</p>
            <p className="mt-2 text-3xl font-semibold text-white">{contracts.length}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#313443] p-4">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Paused now</p>
            <p className="mt-2 text-3xl font-semibold text-white">{pausedCount}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#313443] p-4">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Linked addresses</p>
            <p className="mt-2 text-3xl font-semibold text-white">{contracts.reduce((sum, item) => sum + item.linked.length, 0)}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#313443] p-4">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Last update</p>
            <p className="mt-2 text-lg font-semibold text-white">11 Feb 2026</p>
          </div>
        </div>
      </article>

      <section className="grid gap-4 xl:grid-cols-2">
        {contracts.map((contract) => (
          <article key={contract.name} className="rounded-2xl border border-white/10 bg-[#2a2d3b] p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-[var(--font-display)] text-2xl text-white">{contract.name}</h2>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  contract.state === "Live" ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"
                }`}
              >
                {contract.state}
              </span>
            </div>

            <label className="mt-4 grid gap-2">
              <span className="text-xs uppercase tracking-[0.12em] text-slate-400">Contract address (read-only)</span>
              <input
                defaultValue={contract.address}
                className="rounded-lg border border-white/10 bg-[#313443] px-3 py-2 text-sm text-slate-100 outline-none"
                readOnly
              />
            </label>

            <div className="mt-4 flex flex-wrap gap-2">
              <button className="inline-flex items-center gap-2 rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-200">
                <FaPauseCircle />
                Pause
              </button>
              <button className="inline-flex items-center gap-2 rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-200">
                <FaPlayCircle />
                Unpause
              </button>
            </div>

            <div className="mt-4 space-y-2">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Linked contract addresses</p>
              {contract.linked.map((item) => (
                <div key={`${contract.name}-${item.label}`} className="grid gap-1">
                  <span className="text-xs text-slate-400">{item.label}</span>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      defaultValue={item.value}
                      className="min-w-0 flex-1 rounded-lg border border-white/10 bg-[#252836] px-3 py-2 text-xs text-slate-100 outline-none focus:border-cyan-400/50"
                    />
                    <button className="rounded-lg bg-cyan-500 px-3 py-2 text-xs font-semibold text-white">
                      Update via {setterLabel(item.label)}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </article>
        ))}
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
              <p className="mt-2 break-all text-xs text-slate-300">RolesRegistry.hasRole(ADMIN_ROLE, connectedWallet)</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#313443] p-3">
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-100">
                <FaWallet />
                Active admin wallet
              </p>
              <p className="mt-2 break-all text-xs text-slate-300">0xA92d4F4bAF7b2A9f1a11B6c4fD2A2B0E21f352b1</p>
            </div>
            <button className="w-full rounded-lg border border-rose-400/40 bg-rose-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-rose-200">
              Emergency Pause All
            </button>
          </div>
        </article>
      </section>
    </section>
  );
}
