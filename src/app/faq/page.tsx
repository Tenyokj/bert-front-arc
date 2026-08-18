"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import SiteFooter from "@/components/SiteFooter";
import {
  FaChevronDown,
  FaQuestion,
  FaSearch,
  FaShieldAlt,
  FaTerminal,
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
        question: "What is BERT now?",
        answer:
          "BERT is programmable USDC-native funding infrastructure for Arc. It coordinates proposal intake, round voting, treasury accounting, and milestone-based grant release through upgradeable smart contracts.",
      },
      {
        question: "What economic model does BERT use?",
        answer:
          "BERT is designed around USDC-native funding flows. Proposal deposits, vote commitments, treasury balances, and grant payouts all run through USDC.",
      },
      {
        question: "What problem does BERT solve?",
        answer:
          "BERT turns grant allocation into an auditable onchain workflow. Instead of manual treasury coordination and opaque committee payouts, the funding path becomes programmable, reviewable, and measurable on Arc.",
      },
      {
        question: "Why Arc?",
        answer:
          "Arc is treated here as a stablecoin settlement environment. That makes it a strong fit for transparent treasury coordination, low-friction USDC movement, and milestone-based builder funding.",
      },
      {
        question: "How does BERT work at a high level?",
        answer:
          "A builder submits an idea with a USDC-backed proposal deposit, participants commit USDC votes in a round, treasury balances accumulate onchain, the winner moves into GrantManager, and milestone approvals unlock staged capital release.",
      },
      {
        question: "Is BERT non-custodial?",
        answer:
          "The intended design is contract-driven and non-custodial at the protocol layer. Operational trust still exists around admin keys, role wiring, and upgrade authority, so deployment discipline remains critical.",
      },
    ],
  },
  {
    id: "funding",
    title: "Funding & Voting",
    items: [
      {
        question: "What asset do I need to use the app?",
        answer:
          "USDC. On Arc deployments the protocol expects an ERC-20 compatible USDC address. On localhost, the deploy script provisions MockUSDC with 6 decimals for testing.",
      },
      {
        question: "What is the minimum deposit to create an idea?",
        answer:
          "The current default author deposit is 50 USDC. The frontend reads the live value from IdeaRegistry, so operators can adjust it onchain without redeploying the UI.",
      },
      {
        question: "What is the minimum vote amount?",
        answer:
          "The current default vote commitment is 10 USDC. Vote weight is based directly on committed USDC.",
      },
      {
        question: "Do I need verification before I can vote?",
        answer:
          "Yes, in the current live Arc configuration human-only voting is enabled. A wallet must complete the proof-of-personhood flow and finalize that verification onchain before it can vote.",
      },
      {
        question: "What is the maximum vote amount per idea?",
        answer:
          "The current live cap is 10,000 USDC per wallet for one idea. This keeps voting capital-backed while reducing single-wallet dominance over one target idea.",
      },
      {
        question: "Where does committed USDC go?",
        answer:
          "Committed USDC flows into FundingPool accounting. That treasury state becomes the capital base for subsequent grant releases once a winning idea enters execution.",
      },
      {
        question: "Why do I need to approve USDC first?",
        answer:
          "Because the protocol uses standard ERC-20 allowance flow. FundingPool must be approved before it can pull your USDC for an idea deposit or vote commitment.",
      },
      {
        question: "Can voting still be abused?",
        answer:
          "The protocol now defends against multiple layers of abuse: self-vote restrictions, minimum commitments, proof-of-personhood-gated access, per-wallet vote caps, and role-gated settlement paths. Operational monitoring is still important, especially during testnet rollout.",
      },
    ],
  },
  {
    id: "verification",
    title: "Verification",
    items: [
      {
        question: "What kind of verification does BERT use?",
        answer:
          "The current live Arc stack uses proof-of-personhood verification for voting eligibility. It is designed to prove that a real human is behind the wallet before that wallet can participate in voting.",
      },
      {
        question: "Is this the same as KYC?",
        answer:
          "No. In the current live flow, BERT uses proof-of-personhood gating rather than a traditional KYC identity onboarding process for voting.",
      },
      {
        question: "How does the verification flow work?",
        answer:
          "The frontend opens the World ID flow, the backend validates the proof and signs a BERT verification payload, and the wallet finalizes that payload onchain through PoPVerifierUpgradeable. Once that transaction lands, the wallet becomes eligible to vote until the verification expires.",
      },
      {
        question: "How long does verification stay active?",
        answer:
          "The current verification window is 14 days. After that, the wallet needs to refresh verification before voting again.",
      },
      {
        question: "Why does BERT need both verification and a vote cap?",
        answer:
          "They solve different problems. Verification reduces sybil pressure from large numbers of fresh wallets, while the 10,000 USDC cap reduces the ability of one wallet to dominate one idea with an outsized vote.",
      },
      {
        question: "What if I pass verification but still cannot vote?",
        answer:
          "Most often the wallet has not finalized the signed payload onchain yet, the verification has expired, the connected wallet is different from the verified wallet, or the vote amount exceeds the live per-idea cap.",
      },
    ],
  },
  {
    id: "milestones",
    title: "Milestones & Treasury",
    items: [
      {
        question: "How are grants released?",
        answer:
          "Winning ideas move through a milestone rail. The default release pattern is 30% initial claim, 40% after in-process proof approval, and 30% after final launch proof approval.",
      },
      {
        question: "Who approves milestone proofs?",
        answer:
          "Reviewer-gated flows approve or reject milestone submissions. This keeps treasury release tied to evidence of execution rather than only to vote outcome.",
      },
      {
        question: "Can the full grant be released immediately?",
        answer:
          "Not in the intended flow. BERT is designed for staged capital release with explicit state transitions, replay protection, and approval checkpoints.",
      },
      {
        question: "What does the treasury actually track?",
        answer:
          "At minimum: proposal-linked author stake, committed round capital, reserve balances, distribution history, and the release status of grant tranches.",
      },
      {
        question: "What happens if a milestone is rejected?",
        answer:
          "The release stays locked until valid proof is submitted again and approved through the configured reviewer flow. Rejection does not automatically advance any capital.",
      },
    ],
  },
  {
    id: "arc",
    title: "Arc & Local Testing",
    items: [
      {
        question: "What do I pay gas with on Arc testnet?",
        answer:
          "Gas is paid in the network’s native gas asset, while protocol value transfer uses USDC. Stablecoin settlement and gas payment are separate concerns.",
      },
      {
        question: "Can I test locally before using Arc testnet?",
        answer:
          "Yes, and that is the recommended path. Start with localhost, where the deploy script provisions MockUSDC and wires the full proxy stack, then repeat the same smoke flow on Arc testnet.",
      },
      {
        question: "How do I get test USDC for local testing?",
        answer:
          "On localhost, mint MockUSDC to your testing wallet through the local deployment. On Arc testnet, use the testnet USDC flow available in your environment and verify wallet balances before sending protocol transactions.",
      },
      {
        question: "Where is the user guide for network setup?",
        answer:
          "Use the developer guide and policy docs for environment setup, wallet preparation, approvals, and the live proposal and voting flow.",
      },
    ],
  },
  {
    id: "operations",
    title: "Operations",
    items: [
      {
        question: "Why can idea creation fail even if MetaMask opens?",
        answer:
          "A signature prompt only confirms the wallet can sign. The call can still revert if USDC balance is too low, allowance is missing, FundingPool wiring is wrong, or required roles were not granted during deployment.",
      },
      {
        question: "Why does the UI warn about incomplete wiring?",
        answer:
          "The frontend checks that IdeaRegistry.fundingPool() matches the FundingPool address configured in env. If the frontend is running with stale addresses or the deployment was only partially wired, submission is blocked before the transaction is sent.",
      },
      {
        question: "How should upgrades be handled?",
        answer:
          "Treat them as controlled protocol events: review the implementation diff, rehearse on localhost and Arc testnet, verify storage layout safety, execute the upgrade, and confirm post-upgrade wiring before reopening treasury flows.",
      },
      {
        question: "What should operators verify before public testing?",
        answer:
          "Check network alignment, contract addresses, role wiring, pause state, minimum stake values, human verifier configuration, max vote amount, backend signer alignment, and one complete non-admin smoke flow from verification through voting.",
      },
    ],
  },
  {
    id: "security",
    title: "Security",
    items: [
      {
        question: "What are the biggest live risks?",
        answer:
          "The main risk areas are upgrade authority, role misconfiguration, treasury release mistakes, stale env data in the frontend, backend signer misconfiguration, and incorrect handling of USDC’s 6-decimal unit model.",
      },
      {
        question: "Why are pause controls important?",
        answer:
          "Pause controls let operators stop sensitive flows during incidents, partial misconfiguration, or staged rollout. They should be documented and used with clear governance policy.",
      },
      {
        question: "How should admin keys be secured?",
        answer:
          "Use hardware-backed keys or multisig where possible. Separate deployer, operator, upgrade, and trusted-signer responsibilities by environment and keep verification records for privileged transactions.",
      },
      {
        question: "Is fork simulation enough for safety?",
        answer:
          "No. Fork simulation is useful, but it should be combined with tests, review, role audits, storage-layout checks, and staged rollout controls.",
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

      <div className="relative mx-auto max-w-7xl px-6 pb-20 pt-4">
        <header className="flex items-center justify-between">
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
            <a href="https://bertdao-docs.vercel.app/" className="transition-colors hover:text-slate-900">
              Docs
            </a>
          </nav>
          <Link
            href="/rounds"
            className="rounded-full border border-white/60 bg-white/70 px-5 py-2 text-sm font-semibold text-slate-900 shadow-[0_12px_30px_rgba(15,23,42,0.08)] backdrop-blur transition hover:-translate-y-0.5"
          >
            Launch App
          </Link>
        </header>

        <section className="mt-10 overflow-hidden rounded-[36px] border border-white/40 bg-white/20 backdrop-blur">
          <div className="grid lg:grid-cols-[1.5fr_1fr]">
            <div className="border-b border-white/30 p-8 sm:p-12 lg:border-b-0 lg:border-r">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-600">Knowledge Base</p>
              <h1 className="mt-4 font-[var(--font-display)] text-6xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-7xl lg:text-8xl">
                BERT FAQ
              </h1>
              <p className="mt-4 max-w-2xl text-xl text-slate-600 dark:text-slate-300">
                Practical answers for Arc, USDC, treasury execution, milestone release, and upgrade-safe operations.
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
              <Link href="#" className="border-b border-l border-white/30 p-8 transition-colors hover:bg-white/20">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white/80 text-rose-500">
                  <FaQuestion />
                </div>
                <h2 className="mt-8 font-[var(--font-display)] text-3xl font-semibold text-slate-900 dark:text-slate-100">
                  Help Center
                </h2>
                <p className="mt-3 text-lg text-slate-600 dark:text-slate-300">
                  Straight answers for wallet setup, vote flow, and treasury behavior.
                </p>
              </Link>

              <Link href="#" className="border-b border-l border-white/30 p-8 transition-colors hover:bg-white/20">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white/80 text-blue-600">
                  <FaTerminal />
                </div>
                <h2 className="mt-8 font-[var(--font-display)] text-3xl font-semibold text-slate-900 dark:text-slate-100">
                  Runbook
                </h2>
                <p className="mt-3 text-lg text-slate-600 dark:text-slate-300">
                  Deployment, localhost rehearsal, and Arc testnet rollout guidance.
                </p>
              </Link>

              <Link href="#" className="border-l border-white/30 p-8 transition-colors hover:bg-white/20">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white/80 text-teal-600">
                  <FaShieldAlt />
                </div>
                <h2 className="mt-8 font-[var(--font-display)] text-3xl font-semibold text-slate-900 dark:text-slate-100">
                  Security Notes
                </h2>
                <p className="mt-3 text-lg text-slate-600 dark:text-slate-300">
                  Current trust boundaries, operator assumptions, and rollout cautions.
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
              className="w-full rounded-full border border-white/50 bg-white/75 py-4 pl-12 pr-5 text-base font-medium text-slate-900 outline-none placeholder:text-slate-400 transition-colors duration-300 focus:border-slate-300"
            />
          </label>
        </section>

        <section className="mt-10 grid gap-12 lg:grid-cols-[0.32fr_0.68fr]">
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="relative overflow-hidden rounded-[28px] border border-white/40 bg-white/30 px-5 py-6 shadow-[0_20px_50px_rgba(15,23,42,0.1)] backdrop-blur">
              <div className="pointer-events-none absolute -left-8 top-2 h-24 w-24 rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.28),transparent_65%)] blur-xl" />
              <div className="pointer-events-none absolute -right-10 bottom-4 h-28 w-28 rounded-full bg-[radial-gradient(circle,rgba(244,63,94,0.22),transparent_68%)] blur-xl" />
              <p className="mb-5 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">FAQ Sections</p>
              <nav className="flex flex-col gap-3 font-[var(--font-display)] text-[32px] font-normal text-slate-700 dark:text-slate-300 lg:text-[34px]">
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
                <h3 className="font-[var(--font-display)] text-4xl font-normal tracking-tight text-slate-900 dark:text-slate-100 sm:text-5xl">
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
                          className="flex w-full items-start justify-between gap-6 text-left"
                        >
                          <div>
                            <p className="font-[var(--font-display)] text-2xl font-normal text-slate-900 dark:text-slate-100 sm:text-[30px]">
                              {item.question}
                            </p>
                          </div>
                          <span
                            className={`mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/50 bg-white/60 text-slate-500 transition-transform duration-300 ${
                              isOpen ? "rotate-180" : ""
                            }`}
                          >
                            <FaChevronDown />
                          </span>
                        </button>
                        {isOpen && (
                          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-slate-600 dark:text-slate-300">
                            {item.answer}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </section>

        <SiteFooter />
      </div>
    </div>
  );
}
