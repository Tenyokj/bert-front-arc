"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import ParticleText from "@/components/ParticleText";
import {
  FaGithub,
  FaReddit,
  FaChevronDown,
  FaQuestion,
  FaSearch,
  FaShieldAlt,
  FaTerminal,
  FaMailBulk,
  FaTelegramPlane,
} from "react-icons/fa";

type FaqItem = {
  question: string;
  answer: string;
};

type FaqSection = {
  id: string;
  title: string;
  items: FaqItem[];
};

const sections: FaqSection[] = [
  {
    id: "introduction",
    title: "Introduction",
    items: [
      {
        question: "What is a DAO?",
        answer:
          "A DAO is an on-chain governance model where community members propose ideas and vote on decisions using predefined protocol rules. Instead of centralized control, decision authority is distributed across participants.",
      },
      {
        question: "What is a proposal in BERT?",
        answer:
          "A proposal is a structured request for funding or action. In BERT, proposals move through review and voting rounds before they can receive treasury allocation.",
      },
      {
        question: "What does on-chain mean?",
        answer:
          "On-chain means a state change is recorded on the blockchain. In practice, this gives public traceability for events like votes, role updates, and payouts.",
      },
      {
        question: "Why BERT?",
        answer:
          "BERT is built around measurable outcomes: ideas, voting, funding, and distribution in one system. The protocol is designed so contributors can verify process integrity on-chain instead of relying on opaque off-chain reporting.",
      },
      {
        question: "How does BERT work?",
        answer:
          "A contributor submits an idea, the DAO evaluates it in structured rounds, voting determines eligible winners, and the treasury distributes grants according to protocol rules. Role guards and upgrade controls protect critical operations.",
      },
      {
        question: "What exactly changed in BERT Protocol V2?",
        answer:
          "Two core things changed. First, idea creation now requires a minimum 5000 BTK author stake. Second, grant payouts are no longer one-shot: the winner claims 30% first, then 40% unlocks after in-process proof approval, and the final 30% unlocks after launch proof approval.",
      },
      {
        question: "What is BTK?",
        answer:
          "BTK is the ecosystem token used for governance dynamics and participation incentives in the BERT model. Exact economics depend on your active token policy and network deployment configuration.",
      },
      {
        question: "How can I get BTK?",
        answer:
          "Acquisition depends on token launch and distribution policy. Typical paths include community allocations, ecosystem programs, and secondary market access when enabled by the project.",
      },
      {
        question: "Is BERT non-custodial?",
        answer:
          "The intended architecture is non-custodial at the protocol level: funds are managed by contracts and permission rules. Operational custody risk still exists at signer and admin key level, so key management remains critical.",
      },
      {
        question: "Is this FAQ production-safe guidance?",
        answer:
          "This FAQ is operational guidance, not legal or financial advice. Use it with your deployment docs, test suite, and explicit release runbooks before touching production assets.",
      },
    ],
  },
  {
    id: "staking",
    title: "Staking",
    items: [
      {
        question: "How is stake used in voting?",
        answer:
          "Stake-weighted voting gives higher influence to participants with higher committed stake. To keep this fair, combine stake with quorum constraints, anti-spam mechanics, and reputation-based progression.",
      },
      {
        question: "Why does idea creation now ask for 5000 BTK?",
        answer:
          "In V2, idea creation is stake-backed. The 5000 BTK minimum is there to reduce spam and force economic commitment before a proposal enters the governance pipeline. The transaction also requires enough wallet balance and allowance for FundingPool.",
      },
      {
        question: "Can voting rewards be abused?",
        answer:
          "Without anti-abuse controls, yes. Mitigate with lock periods, minimum participation thresholds, delayed reward release, and suspicious-pattern monitoring for coordinated manipulation.",
      },
      {
        question: "What is a safe voting window duration?",
        answer:
          "Use windows long enough for broad participation but short enough for execution velocity. A common pattern is 3-7 days with clear cutoff timestamps and explicit tie-break rules.",
      },
      {
        question: "Can unstaked users participate?",
        answer:
          "Depends on your governance policy. Many systems allow proposal discussion by all users, but enforce stake conditions for voting or proposal finalization.",
      },
      {
        question: "Should rewards be paid every round?",
        answer:
          "Not always. Round-level rewards increase participation but can incentivize low-quality behavior. Consider quality multipliers, minimum participation quality, and delayed claim windows.",
      },
      {
        question: "How do I prevent last-minute vote swings?",
        answer:
          "Use anti-sniping mechanics like vote extension windows, cooldown phases, or weighted time-locking. Document this clearly so participants understand finalization behavior.",
      },
    ],
  },
  {
    id: "ethereum",
    title: "Ethereum",
    items: [
      {
        question: "Why do I see multiple ProxyAdmins?",
        answer:
          "Each Transparent proxy creates its own ProxyAdmin in OpenZeppelin v5. In current BERT architecture this is expected. It is not an issue by itself, but it increases operational complexity.",
      },
      {
        question: "Why does the admin slot show 0x0?",
        answer:
          "This usually means the proxy address is wrong or node state was reset. Redeploy, use fresh addresses, and verify that your script and network point to the same deployment manifest.",
      },
      {
        question: "Why does IMPL not resolve?",
        answer:
          "IMPL must be the Solidity contract name, not the file name. Check artifact output from compile and reference the exact contract identifier in your script config.",
      },
      {
        question: "Why does upgrade fail with owner errors?",
        answer:
          "Only the owner of the relevant ProxyAdmin can upgrade. Confirm current owner on-chain and ensure the signer matches before executing upgrade transactions.",
      },
      {
        question: "Why does createIdea revert even when MetaMask opens correctly?",
        answer:
          "The wallet popup only means signing is possible. The contract can still revert if author stake is below the current minimum, BTK allowance is too low, FundingPool wiring is wrong, or IdeaRegistry and FundingPool roles are incomplete after an upgrade.",
      },
      {
        question: "Is there a single ProxyAdmin for all contracts?",
        answer:
          "No in current deployment pattern. Each proxy has a dedicated ProxyAdmin. A shared-admin model requires architectural changes and migration planning.",
      },
      {
        question: "Can I reduce the number of admins?",
        answer:
          "Yes, with a different deployment model. That changes upgrade controls and risk profile, so validate security assumptions before migrating.",
      },
    ],
  },
  {
    id: "sepolia-gas",
    title: "Sepolia & Gas",
    items: [
      {
        question: "What do I pay gas with on Sepolia?",
        answer:
          "On Sepolia, every write transaction is paid in Sepolia ETH. BTK is your protocol token, but gas fees are always paid in the network native token (ETH).",
      },
      {
        question: "How do I get Sepolia ETH?",
        answer:
          "Use a Sepolia faucet and request test ETH to your wallet address on network chainId 11155111. If one faucet rate-limits you, use another supported faucet and verify balance in wallet before sending transactions.",
      },
      {
        question: "How do I add BTK token in MetaMask?",
        answer:
          "In MetaMask on Sepolia, click Import tokens, paste the BTK contract address, confirm token symbol and decimals, then save. If amount looks incorrect, verify token decimals directly from contract.",
      },
      {
        question: "What is gas and why does it fail?",
        answer:
          "Gas is the execution fee for blockchain transactions. Failures usually come from insufficient Sepolia ETH, wrong network selected in wallet, or reverted contract conditions. For practical walkthroughs, open the Sepolia guide page.",
      },
      {
        question: "Where is the full user walkthrough with screenshots?",
        answer:
          "Use the dedicated Sepolia guide: /sepolia-guide. It includes step-by-step instructions and screenshot slots for faucet flow, BTK import, and gas payment confirmation.",
      },
    ],
  },
  {
    id: "bert-dao",
    title: "BERT DAO",
    items: [
      {
        question: "How do I confirm role wiring?",
        answer:
          "Run verification scripts and read `hasRole` on-chain for all critical actors. Validate proposer, upgrader, treasury executor, and emergency controls before enabling production flows.",
      },
      {
        question: "Why can a winning author claim only 30% at first?",
        answer:
          "That is the V2 treasury rule. Winning unlocks only the initial 30% claim. The remaining 70% is deliberately held behind milestone validation so treasury release tracks real execution rather than only vote outcome.",
      },
      {
        question: "What blocks the 40% and final 30% payouts?",
        answer:
          "The 40% in-process release needs validator approval that the project is actively being built. The final 30% needs validator approval that the project is launched and working. If proof is rejected or approvals are missing, those tranches remain locked.",
      },
      {
        question: "Why does ProxyAdmin ownership differ from deployer?",
        answer:
          "Typical causes include stale env values, mixed deployment logs, or unintended owner assignment. Always reconcile ownership from a single deployment run.",
      },
      {
        question: "What is a safe governance process for upgrades?",
        answer:
          "Propose upgrade, run public review window, execute fork simulation, run staging upgrade, then execute production upgrade with post-state verification and incident rollback notes.",
      },
      {
        question: "Should governance parameters be mutable?",
        answer:
          "Yes, but only via auditable controlled paths. Immutable logic improves predictability; mutable parameters improve adaptability. Balance both using explicit role boundaries.",
      },
      {
        question: "Can reputation override token voting?",
        answer:
          "It can be blended, but define the formula clearly and publish rationale. Hidden weighting creates governance distrust even if mathematically sound.",
      },
      {
        question: "How should off-chain discussion map to on-chain decisions?",
        answer:
          "Use clear process states: discussion, formal proposal, vote, execution. Prevent off-chain ambiguity by documenting decision checkpoints and final authority source.",
      },
    ],
  },
  {
    id: "node-operators",
    title: "Node operators",
    items: [
      {
        question: "Do I need hardhat node for tests?",
        answer:
          "Usually no. `hardhat test` uses in-process network. Run `hardhat node` when you need persistent RPC for external tooling, manual QA, or multi-process debugging.",
      },
      {
        question: "Can I use tsx to run scripts?",
        answer:
          "For deploy and upgrade paths, prefer `npx hardhat run`. It ensures proper plugin context, signer wiring, network config, and artifact resolution.",
      },
      {
        question: "What if I lose ProxyAdmin ownership?",
        answer:
          "Upgrade operations are blocked for affected proxies. Recovery depends on current owner path; if unrecoverable, redeploy may be required.",
      },
      {
        question: "What should be monitored after deploy?",
        answer:
          "Monitor role changes, upgrade events, proposal transitions, payout events, failed privileged txs, and unexpected ownership changes.",
      },
      {
        question: "What logs should operators archive?",
        answer:
          "Archive deployment outputs, tx hashes, manifests, role snapshots, and post-upgrade verification logs. These are essential for incident response and auditability.",
      },
      {
        question: "How do I avoid stale address mixups between networks?",
        answer:
          "Use one manifest per network and hard-fail scripts when network and manifest IDs mismatch.",
      },
    ],
  },
  {
    id: "security",
    title: "Security",
    items: [
      {
        question: "How should we secure admin keys?",
        answer:
          "Use hardware-backed keys or multisig where possible. Apply key rotation policies, strict signer separation by environment, and audit logging for all privileged operations.",
      },
      {
        question: "What is the biggest upgrade risk?",
        answer:
          "Storage layout incompatibility and misconfigured ownership paths. Always run layout checks and controlled staging upgrades before production execution.",
      },
      {
        question: "How do we detect unauthorized control changes?",
        answer:
          "Alert on ownership transfers, role grants/revokes, ProxyAdmin changes, and unexpected upgrade events. Use automated watchers and incident playbooks.",
      },
      {
        question: "Do we need bug bounty before launch?",
        answer:
          "Strongly recommended once core surfaces stabilize. If not immediate, publish a roadmap with timing and scope so users understand current assurance level.",
      },
      {
        question: "Is fork simulation enough for security?",
        answer:
          "No. Fork simulation is essential but not sufficient. Combine with tests, review, static checks, role audits, and staged rollout controls.",
      },
      {
        question: "How should emergency pause be handled?",
        answer:
          "Define clear pause authority, conditions, and unpause policy. Ensure governance transparency so emergency controls do not become hidden centralization.",
      },
    ],
  },
  {
    id: "additional",
    title: "Additional",
    items: [
      {
        question: "Do reputation and voting weights require indexing?",
        answer:
          "Core reads can come from on-chain state. For fast history pages, filtering, and analytics, indexing is strongly recommended.",
      },
      {
        question: "How should I version upgrade releases?",
        answer:
          "Use semver tied to commit hashes and implementation addresses. Keep migration notes and post-upgrade verification artifacts with each release tag.",
      },
      {
        question: "Why does verification fail on local fork?",
        answer:
          "Explorer verification applies to deployed public networks. Local ephemeral forks do not support equivalent public verification workflows.",
      },
      {
        question: "What docs should always exist before mainnet?",
        answer:
          "Deployment runbook, upgrade runbook, role matrix, incident response process, and network manifests should be maintained as mandatory artifacts.",
      },
      {
        question: "Can FAQ answers replace formal docs?",
        answer:
          "No. FAQ accelerates troubleshooting but should reference canonical technical docs and scripts as source of truth.",
      },
      {
        question: "How often should we review governance parameters?",
        answer:
          "At minimum every release cycle or after major incidents. Parameter drift without review can create hidden risk and governance imbalance.",
      },
    ],
  },
];

export default function FaqPage() {
  const [query, setQuery] = useState("");
  const [activeSectionId, setActiveSectionId] = useState(sections[0].id);
  const [openItem, setOpenItem] = useState<string>(`${sections[0].id}-0`);

  const queryTrimmed = query.trim().toLowerCase();
  const isGlobalSearch = queryTrimmed.length > 0;

  const filteredSections = useMemo(() => {
    if (!isGlobalSearch) {
      const active = sections.find((s) => s.id === activeSectionId) ?? sections[0];
      return [active];
    }

    return sections
      .map((section) => {
        const items = section.items.filter(
          (item) =>
            item.question.toLowerCase().includes(queryTrimmed) ||
            item.answer.toLowerCase().includes(queryTrimmed) ||
            section.title.toLowerCase().includes(queryTrimmed)
        );
        return { ...section, items };
      })
      .filter((section) => section.items.length > 0);
  }, [activeSectionId, isGlobalSearch, queryTrimmed]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      <div className="hero-ambient absolute inset-0" />

      <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-4 sm:px-6 sm:pb-20">
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-teal-400 to-blue-600 shadow-[0_8px_24px_rgba(37,99,235,0.35)]" />
            <span className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-600">
            <Link href="/" className="transition-colors hover:text-slate-900">
              BERT
            </Link>
            </span>
          </div>
          <nav className="hidden items-center gap-8 text-sm text-slate-600 md:flex">
            <Link href="/how-it-works" className="transition-colors hover:text-slate-900">
              How it works
            </Link>
            <Link href="/rounds" className="transition-colors hover:text-slate-900">
              Active rounds
            </Link>
            <Link href="/faq" className="transition-colors hover:text-slate-900">
              Docs
            </Link>
          </nav>
          <Link
            href="/rounds"
            className="rounded-full border border-white/60 bg-white/70 px-4 py-2 text-xs font-semibold text-slate-900 shadow-[0_12px_30px_rgba(15,23,42,0.08)] backdrop-blur transition hover:-translate-y-0.5 sm:px-5 sm:text-sm"
          >
            Launch App
          </Link>
        </header>

        <section className="mt-8 overflow-hidden rounded-[28px] border border-white/40 bg-white/20 backdrop-blur sm:mt-10 sm:rounded-[36px]">
          <div className="grid lg:grid-cols-[1.5fr_1fr]">
            <div className="border-b border-white/30 p-5 sm:p-8 lg:border-b-0 lg:border-r lg:p-12">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-600">Knowledge Base</p>
              <h1 className="mt-4 font-[var(--font-display)] text-4xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-6xl lg:text-8xl">
                BERT FAQ
              </h1>
              <p className="mt-4 max-w-2xl text-lg text-slate-600 dark:text-slate-300 sm:text-xl">
                Operational answers for upgradeable contracts, governance roles, deployment safety, and troubleshooting.
              </p>
              <div className="mt-8">
                <Image
                  src="/illustrations/faq-signal.svg"
                  alt="BERT FAQ signal graphic"
                  width={560}
                  height={360}
                  className="w-full max-w-[560px]"
                  priority
                />
              </div>
            </div>

            <div className="grid border-white/30 sm:grid-cols-2 lg:grid-cols-1">
              <Link
                href="#"
                className="border-b border-l border-white/30 p-5 transition-colors hover:bg-white/20 sm:p-8"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white/80 text-rose-500">
                  <FaQuestion />
                </div>
                <h2 className="mt-6 font-[var(--font-display)] text-2xl font-semibold text-slate-900 dark:text-slate-100 sm:mt-8 sm:text-3xl">Help Center</h2>
                <p className="mt-3 text-base text-slate-600 dark:text-slate-300 sm:text-lg">
                  Core troubleshooting paths for deployment and upgrade failures.
                </p>
              </Link>

              <Link
                href="#"
                className="border-b border-l border-white/30 p-5 transition-colors hover:bg-white/20 sm:p-8"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white/80 text-blue-600">
                  <FaTerminal />
                </div>
                <h2 className="mt-6 font-[var(--font-display)] text-2xl font-semibold text-slate-900 dark:text-slate-100 sm:mt-8 sm:text-3xl">Runbook</h2>
                <p className="mt-3 text-base text-slate-600 dark:text-slate-300 sm:text-lg">
                  Deployment, ownership, and recovery checklists for operators.
                </p>
              </Link>

              <Link
                href="#"
                className="border-l border-white/30 p-5 transition-colors hover:bg-white/20 sm:p-8"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white/80 text-teal-600">
                  <FaShieldAlt />
                </div>
                <h2 className="mt-6 font-[var(--font-display)] text-2xl font-semibold text-slate-900 dark:text-slate-100 sm:mt-8 sm:text-3xl">Security Notes</h2>
                <p className="mt-3 text-base text-slate-600 dark:text-slate-300 sm:text-lg">
                  Current assumptions, planned audits, and risk boundaries.
                </p>
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-12">
          <label className="relative block max-w-2xl">
            <FaSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search all FAQ sections"
              className="w-full rounded-full border border-white/50 bg-white/75 py-4 pl-12 pr-5 text-base font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-300 transition-colors duration-300"
            />
          </label>
        </section>

        <section className="mt-10 grid gap-8 lg:grid-cols-[0.32fr_0.68fr] lg:gap-12">
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="relative overflow-hidden rounded-[28px] border border-white/40 bg-white/30 px-5 py-6 shadow-[0_20px_50px_rgba(15,23,42,0.1)] backdrop-blur">
              <div className="pointer-events-none absolute -left-8 top-2 h-24 w-24 rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.28),transparent_65%)] blur-xl" />
              <div className="pointer-events-none absolute -right-10 bottom-4 h-28 w-28 rounded-full bg-[radial-gradient(circle,rgba(244,63,94,0.22),transparent_68%)] blur-xl" />
              <p className="mb-5 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                FAQ Sections
              </p>
              <nav className="flex flex-col gap-3 font-[var(--font-display)] text-[24px] font-normal text-slate-700 dark:text-slate-300 sm:text-[28px] lg:text-[34px]">
              {sections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => {
                    setActiveSectionId(section.id);
                    setOpenItem(`${section.id}-0`);
                  }}
                  className={`group flex items-center justify-between rounded-2xl px-3 py-3 text-left transition-all duration-300 hover:bg-white/40 hover:pl-4 hover:text-slate-900 dark:hover:bg-white/10 dark:hover:text-white ${
                    section.id === activeSectionId && !isGlobalSearch
                      ? "bg-white/55 pl-4 text-slate-900 shadow-[0_10px_28px_rgba(15,23,42,0.1)] dark:bg-white/10 dark:text-slate-100"
                      : ""
                  }`}
                >
                  <span>{section.title}</span>
                  <span
                    className={`h-2.5 w-2.5 rounded-full bg-slate-300 transition-all duration-300 group-hover:bg-teal-500 ${
                      section.id === activeSectionId && !isGlobalSearch
                        ? "bg-teal-500 shadow-[0_0_12px_rgba(20,184,166,0.7)]"
                        : ""
                    }`}
                  />
                </button>
              ))}
              </nav>
            </div>
          </aside>

          <div className="space-y-14">
            {filteredSections.map((section) => (
              <section id={section.id} key={section.id} className="scroll-mt-10 transition-opacity duration-500">
                <h3 className="font-[var(--font-display)] text-3xl font-normal tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl lg:text-5xl">
                  {section.title}
                </h3>

                <div className="mt-6 border-t border-white/40">
                  {section.items.map((item, idx) => {
                    const key = `${section.id}-${idx}`;
                    const isOpen = openItem === key;
                    return (
                      <div key={item.question} className="border-b border-white/40 py-6">
                        <button
                          type="button"
                          onClick={() => setOpenItem(isOpen ? "" : key)}
                          className="flex w-full items-center justify-between gap-8 text-left"
                        >
                          <span className="text-xl font-semibold text-slate-900 dark:text-slate-100 sm:text-2xl lg:text-3xl">
                            {item.question}
                          </span>
                          <span
                            className={`rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition-transform duration-500 ${
                              isOpen ? "rotate-180" : ""
                            }`}
                          >
                            <FaChevronDown />
                          </span>
                        </button>
                        <div
                          className={`grid transition-all duration-500 ease-out ${
                            isOpen ? "grid-rows-[1fr] opacity-100 mt-5" : "grid-rows-[0fr] opacity-0 mt-0"
                          }`}
                        >
                          <div className="overflow-hidden">
                            <p className="max-w-4xl text-lg leading-relaxed text-slate-600 dark:text-slate-300 sm:text-xl">
                              {item.answer}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}

            {filteredSections.length === 0 ? (
              <div className="rounded-2xl border border-white/50 bg-white/60 p-8 text-xl text-slate-700 dark:text-slate-200">
                No results found for &quot;{query}&quot; across all sections.
              </div>
            ) : null}
          </div>
        </section>

                       <footer className="relative mt-32 border-t border-white/20 pb-16 pt-12">
                          <div className="pointer-events-none absolute -left-10 top-8 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.25),transparent_65%)] blur-2xl" />
                          <div className="pointer-events-none absolute right-[-3rem] top-16 h-52 w-52 rounded-full bg-[radial-gradient(circle,rgba(244,63,94,0.22),transparent_65%)] blur-2xl" />
                          <div className="text-sm text-slate-500">
                            Live metrics come from on-chain reads and indexed sources where available. Some roadmap sections describe planned protocol direction.
                          </div>
                
                          <div className="mt-10 grid gap-4 border-b border-white/20 pb-8 md:hidden">
                            <div className="flex flex-wrap gap-3 text-base text-slate-600 dark:text-slate-300">
                              <a className="footer-link" href="https://bertdao-docs.vercel.app/">Docs</a>
                              <a className="footer-link" href="/privacy-notice">Privacy Notice</a>
                              <a className="footer-link" href="/terms-of-use">Terms of Use</a>
                            </div>
                            <div className="flex items-center gap-5 text-slate-600 dark:text-slate-300">
                              <a href="https://github.com/tenyokj" aria-label="GitHub"><FaGithub className="text-2xl transition-transform duration-300 hover:-translate-y-1" /></a>
                              <a href="https://www.reddit.com/user/PralineSeparate5261/" aria-label="Reddit"><FaReddit className="text-2xl transition-transform duration-300 hover:-translate-y-1" /></a>
                              <a href="https://t.me/+8DEt_M62Db00NzYy" target="_blank" rel="noreferrer" aria-label="Telegram"><FaTelegramPlane className="text-2xl transition-transform duration-300 hover:-translate-y-1" /></a>
                              <a href="mailto:av7794257@gmail.com" aria-label="Email"><FaMailBulk className="text-2xl transition-transform duration-300 hover:-translate-y-1" /></a>
                            </div>
                          </div>

                          <div className="mt-10 hidden gap-10 border-b border-white/20 pb-10 md:grid lg:grid-cols-4">
                            <div>
                              <h4 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                                BERT Products
                              </h4>
                              <div className="mt-6 flex flex-col gap-3 text-lg text-slate-600 dark:text-slate-300">
                                <a className="footer-link" href="https://github.com/Tenyokj/bert-core/blob/main/contracts/BERT/docs_contracts/IdeaRegistryUpgradeable.md">Idea Registry</a>
                                <a className="footer-link" href="https://github.com/Tenyokj/bert-core/blob/main/contracts/BERT/docs_contracts/VotingSystemUpgradeable.md">Voting Rounds</a>
                                <a className="footer-link" href="https://github.com/Tenyokj/bert-core/blob/main/contracts/BERT/docs_contracts/GrantManagerUpgradeable.md">Grant Engine</a>
                                <a className="footer-link" href="https://github.com/Tenyokj/bert-core/blob/main/contracts/BERT/docs_contracts/ReputationSystemUpgradeable.md">Reputation Layer</a>
                                <a className="footer-link" href="https://github.com/Tenyokj/bert-core/blob/main/docs/UPGRADES.md">Upgrade Modules</a>
                              </div>
                            </div>
                
                            <div>
                              <h4 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                                BERT DAO
                              </h4>
                              <div className="mt-6 flex flex-col gap-3 text-lg text-slate-600 dark:text-slate-300">
                                <a className="footer-link" href="/governance-stack">Governance stack</a>
                                <a className="footer-link" href="/policy-docs">Policy docs</a>
                                <a className="footer-link" href="/on-chain-votes">On-chain votes</a>
                                <a className="footer-link" href="/treasury-policies">Treasury policies</a>
                              </div>
                            </div>
                
                            <div>
                              <h4 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                                Builders
                              </h4>
                              <div className="mt-6 flex flex-col gap-3 text-lg text-slate-600 dark:text-slate-300">
                                <a className="footer-link" href="https://bertdao-docs.vercel.app">Docs</a>
                                <a className="footer-link" href="/developer-guide">Developer guide</a>
                                <a className="footer-link" href="https://github.com/Tenyokj/bert-core/blob/main/docs/CONTRACTS.md">Smart contracts</a>
                              </div>
                            </div>
                
                            <div>
                              <h4 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                                Resources
                              </h4>
                              <div className="mt-6 flex flex-col gap-3 text-lg text-slate-600 dark:text-slate-300">
                                <a className="footer-link" href="/how-it-works">How it works</a>
                                <a className="footer-link" href="/faq">FAQ</a>
                                <a className="footer-link" href="/sepolia-guide">Sepolia guide</a>
                                <a className="footer-link" href="/press-kit">Press kit</a>
                                <a className="footer-link" href="/build-dapps">Build dApps</a>
                              </div>
                            </div>
                          </div>
                
                          <div className="mt-10 hidden gap-10 md:grid lg:grid-cols-4">
                            <div>
              <h4 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                Social Links
              </h4>
              <div className="mt-6 flex items-center gap-5 text-slate-600 dark:text-slate-300">
                <a href="https://github.com/tenyokj" aria-label="GitHub"><FaGithub className="text-2xl transition-transform duration-300 hover:-translate-y-1" /></a>
                <a href="https://www.reddit.com/user/PralineSeparate5261/" aria-label="Reddit"><FaReddit className="text-2xl transition-transform duration-300 hover:-translate-y-1" /></a>
                <a href="https://t.me/+8DEt_M62Db00NzYy" target="_blank" rel="noreferrer" aria-label="Telegram"><FaTelegramPlane className="text-2xl transition-transform duration-300 hover:-translate-y-1" /></a>
                <a href="mailto:av7794257@gmail.com" aria-label="Email"><FaMailBulk className="text-2xl transition-transform duration-300 hover:-translate-y-1" /></a>
              </div>
            </div>
            <div>
              <h4 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                Analytics
                              </h4>
                              <div className="mt-6 flex flex-col gap-3 text-lg text-slate-600 dark:text-slate-300">
                                <a className="footer-link" href="/protocol-stats">Protocol stats</a>
                                <a className="footer-link" href="/treasury-policies#reporting">Treasury metrics</a>
                              </div>
                            </div>
                            <div className="lg:col-span-2">
                              <div className="flex flex-col gap-3 text-lg text-slate-500 dark:text-slate-300 lg:flex-row lg:items-center lg:justify-end">
                                <a className="footer-link" href="/privacy-notice">Privacy Notice</a>
                                <a className="footer-link" href="/terms-of-use">Terms of Use</a>
                                <a className="footer-link" href="/security-roadmap">Security Roadmap</a>
                              </div>
                              <div className="mt-2 ml-auto w-fit">
                                <ParticleText text="BERT" width={680} height={160} />
                              </div>
                            </div>
                          </div>
                        </footer>
      </div>
    </div>
  );
}
