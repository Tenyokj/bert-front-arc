import ParticleText from "@/components/ParticleText";
import Image from "next/image";
import Link from "next/link";
import { FaGithub, FaReddit, FaMailBulk } from "react-icons/fa";

type ShotRequirement = {
  title: string;
  purpose: string;
  image: string;
  checklist: string[];
};

const shotPlan: ShotRequirement[] = [
  {
    title: "1) Get Sepolia ETH from Faucet",
    purpose: "Show how user receives test ETH that is required for gas payments.",
    image: "/guides/sepolia_faucet_guide.png",
    checklist: [
      "Faucet page with Sepolia network selected.",
      "Wallet address field filled before request.",
      "Success state (request sent / completed).",
      "MetaMask balance showing received Sepolia ETH.",
    ],
  },
  {
    title: "2) Add BTK to MetaMask",
    purpose: "Show how user imports BTK token contract and verifies token config.",
    image: "/guides/metamask_guide.png",
    checklist: [
      "MetaMask Import tokens screen.",
      "BTK contract address pasted into token address field.",
      "Auto-filled symbol/decimals (or manual inputs) visible.",
      "Final wallet asset list with BTK shown.",
    ],
  },
  {
    title: "3) Pay Gas for a Real Action",
    purpose: "Show how gas appears during a transaction and what user should verify before confirming.",
    image: "/guides/gas_pay_guide.png",
    checklist: [
      "dApp action that opens transaction confirmation (for example claim/createIdea/vote).",
      "MetaMask confirmation modal with network = Sepolia.",
      "Gas fee section visible in ETH.",
      "Post-transaction success state (tx hash or explorer link).",
    ],
  },
];

export default function SepoliaGuidePage() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto max-w-[1200px] px-6 py-8 md:px-10">
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
            <Link href="/faq" className="transition-colors hover:text-slate-900">
              Docs
            </Link>
          </nav>
          <Link
            href="/rounds"
            className="rounded-full border border-white/60 bg-white/70 px-5 py-2 text-sm font-semibold text-slate-900 shadow-[0_12px_30px_rgba(15,23,42,0.08)] backdrop-blur transition hover:-translate-y-0.5"
          >
            Launch App
          </Link>
          <Link
            href="/faq"
            className="rounded-full border border-white/60 bg-white/70 px-5 py-2 text-sm font-semibold text-slate-900 shadow-[0_12px_30px_rgba(15,23,42,0.08)] backdrop-blur transition hover:-translate-y-0.5"
          >
            Back to FAQ
          </Link>
        </header>

        <main className="mt-10 space-y-12">
          <section className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-600">Sepolia Guide</p>
            <h1 className="text-4xl font-semibold text-slate-900 dark:text-slate-100 md:text-5xl">
              Gas, Faucet, and BTK Setup
            </h1>
            <p className="max-w-4xl text-lg leading-relaxed text-slate-700 dark:text-slate-200">
              This page is a practical onboarding flow for users who interact with BERT on Sepolia. It explains what gas is,
              how to fund your wallet with Sepolia ETH, and how to import BTK in MetaMask.
            </p>
          </section>

          <section className="rounded-3xl border border-white/15 bg-white/5 p-6 md:p-8">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Core Rules</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <p className="rounded-2xl border border-white/15 bg-black/10 p-4 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                <strong>Gas token:</strong> on Sepolia you always pay transaction fees in Sepolia ETH, not in BTK.
              </p>
              <p className="rounded-2xl border border-white/15 bg-black/10 p-4 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                <strong>BTK role:</strong> BTK is used by protocol mechanics (voting, balances, accounting), but never as network gas.
              </p>
              <p className="rounded-2xl border border-white/15 bg-black/10 p-4 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                <strong>Required network:</strong> chainId <code>11155111</code> (Sepolia). Wrong network is the most common cause of failed calls.
              </p>
              <p className="rounded-2xl border border-white/15 bg-black/10 p-4 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                <strong>Safety:</strong> use only test funds on Sepolia and verify contract addresses before importing tokens.
              </p>
            </div>
          </section>

          {shotPlan.map((shot) => (
            <section key={shot.title} className="space-y-5">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{shot.title}</h2>
                <p className="mt-2 text-base leading-relaxed text-slate-700 dark:text-slate-200">{shot.purpose}</p>
              </div>

              <div className="overflow-hidden rounded-3xl border border-dashed border-white/30 bg-white/5">
                <div className="relative aspect-[16/9] bg-black/20 p-2 md:p-3">
                  <Image
                    src={shot.image}
                    alt={shot.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 1100px"
                    className="object-contain"
                  />
                </div>
                <div className="border-t border-white/15 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">What to capture</p>
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-200">
                    {shot.checklist.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          ))}

          <section className="rounded-3xl border border-white/15 bg-white/5 p-6 md:p-8">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Quick Troubleshooting</h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-700 dark:text-slate-200">
              <li>If transaction does not open in wallet, first confirm wallet is connected and network is Sepolia.</li>
              <li>If BTK amount looks wrong, verify token decimals in contract and re-import token.</li>
              <li>If calls revert with network error, re-check frontend RPC config and wallet network alignment.</li>
            </ul>
          </section>
        </main>

                       <footer className="relative mt-32 border-t border-white/20 pb-16 pt-12">
                          <div className="pointer-events-none absolute -left-10 top-8 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.25),transparent_65%)] blur-2xl" />
                          <div className="pointer-events-none absolute right-[-3rem] top-16 h-52 w-52 rounded-full bg-[radial-gradient(circle,rgba(244,63,94,0.22),transparent_65%)] blur-2xl" />
                          <div className="text-sm text-slate-500">
                            Live metrics come from on-chain reads and indexed sources where available. Some roadmap sections describe planned protocol direction.
                          </div>
                
                          <div className="mt-10 grid gap-10 border-b border-white/20 pb-10 lg:grid-cols-4">
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
                                <a className="footer-link" href="https://bertdao-docs.vercel.app/">Docs</a>
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
                
                          <div className="mt-10 grid gap-10 lg:grid-cols-4">
                            <div>
                                <h4 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                                  Social Links
                              </h4>
                              <div className="mt-6 flex items-center gap-5 text-slate-600 dark:text-slate-300">
                                <a href="https://github.com/tenyokj"><FaGithub className="text-2xl transition-transform duration-300 hover:-translate-y-1" /></a>
                                <a href="https://www.reddit.com/user/PralineSeparate5261/"><FaReddit className="text-2xl transition-transform duration-300 hover:-translate-y-1" /></a>
                                <a href="mailto:av7794257@gmail.com"><FaMailBulk className="text-2xl transition-transform duration-300 hover:-translate-y-1" /></a>
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
