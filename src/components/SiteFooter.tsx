import Link from "next/link";
import ParticleText from "@/components/ParticleText";
import { FaGithub, FaMailBulk, FaTelegramPlane, FaYoutube } from "react-icons/fa";

export default function SiteFooter() {
  return (
    <footer className="relative mt-32 border-t border-white/20 pb-16 pt-12">
      <div className="pointer-events-none absolute -left-10 top-8 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.25),transparent_65%)] blur-2xl" />
      <div className="pointer-events-none absolute right-[-3rem] top-16 h-52 w-52 rounded-full bg-[radial-gradient(circle,rgba(244,63,94,0.22),transparent_65%)] blur-2xl" />
      <div className="text-sm text-slate-500">
        Live metrics come from on-chain reads and indexed sources where available. Some roadmap sections describe planned
        protocol direction.
      </div>

      <div className="mt-10 grid gap-4 border-b border-white/20 pb-8 md:hidden">
        <div className="flex flex-wrap gap-3 text-base text-slate-600 dark:text-slate-300">
          <a className="footer-link" href="https://bertdao-docs.vercel.app/">
            Docs
          </a>
          <Link className="footer-link" href="/privacy-notice">
            Privacy Notice
          </Link>
          <Link className="footer-link" href="/terms-of-use">
            Terms of Use
          </Link>
        </div>
        <div className="flex items-center gap-5 text-slate-600 dark:text-slate-300">
          <a href="https://github.com/Tenyokj/bert-core-arc" target="_blank" rel="noreferrer" aria-label="GitHub">
            <FaGithub className="text-2xl transition-transform duration-300 hover:-translate-y-1" />
          </a>
          <a href="https://www.youtube.com/@bertdaoARC" target="_blank" rel="noreferrer" aria-label="YouTube">
            <FaYoutube className="text-2xl transition-transform duration-300 hover:-translate-y-1" />
          </a>
          <a href="https://t.me/+8DEt_M62Db00NzYy" target="_blank" rel="noreferrer" aria-label="Telegram">
            <FaTelegramPlane className="text-2xl transition-transform duration-300 hover:-translate-y-1" />
          </a>
          <a href="mailto:bertdaoarc@gmail.com" aria-label="Email">
            <FaMailBulk className="text-2xl transition-transform duration-300 hover:-translate-y-1" />
          </a>
        </div>
      </div>

      <div className="mt-10 hidden gap-10 border-b border-white/20 pb-10 md:grid lg:grid-cols-4">
        <div>
          <h4 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">BERT Products</h4>
          <div className="mt-6 flex flex-col gap-3 text-lg text-slate-600 dark:text-slate-300">
            <a className="footer-link" href="https://github.com/Tenyokj/bert-core-arc/blob/main/contracts/BERT/docs_contracts/IdeaRegistryUpgradeable.md">
              Idea Registry
            </a>
            <a className="footer-link" href="https://github.com/Tenyokj/bert-core-arc/blob/main/contracts/BERT/docs_contracts/VotingSystemUpgradeable.md">
              Voting Rounds
            </a>
            <a className="footer-link" href="https://github.com/Tenyokj/bert-core-arc/blob/main/contracts/BERT/docs_contracts/GrantManagerUpgradeable.md">
              Grant Engine
            </a>
            <a className="footer-link" href="https://github.com/Tenyokj/bert-core-arc/blob/main/contracts/BERT/docs_contracts/ReputationSystemUpgradeable.md">
              Reputation Layer
            </a>
            <a className="footer-link" href="https://github.com/Tenyokj/bert-core-arc/blob/main/docs/UPGRADES.md">
              Upgrade Modules
            </a>
          </div>
        </div>

        <div>
          <h4 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">BERT Protocol</h4>
          <div className="mt-6 flex flex-col gap-3 text-lg text-slate-600 dark:text-slate-300">
            <Link className="footer-link" href="/governance-stack">
              Governance stack
            </Link>
            <Link className="footer-link" href="/policy-docs">
              Policy docs
            </Link>
            <Link className="footer-link" href="/on-chain-votes">
              On-chain votes
            </Link>
            <Link className="footer-link" href="/treasury-policies">
              Treasury policies
            </Link>
          </div>
        </div>

        <div>
          <h4 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Builders</h4>
          <div className="mt-6 flex flex-col gap-3 text-lg text-slate-600 dark:text-slate-300">
            <a className="footer-link" href="https://bertdao-docs.vercel.app/">
              Docs
            </a>
            <Link className="footer-link" href="/developer-guide">
              Developer guide
            </Link>
            <a className="footer-link" href="https://github.com/Tenyokj/bert-core-arc/blob/main/docs/CONTRACTS.md">
              Smart contracts
            </a>
          </div>
        </div>

        <div>
          <h4 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Resources</h4>
          <div className="mt-6 flex flex-col gap-3 text-lg text-slate-600 dark:text-slate-300">
            <Link className="footer-link" href="/how-it-works">
              How it works
            </Link>
            <Link className="footer-link" href="/faq">
              FAQ
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-10 hidden gap-10 md:grid lg:grid-cols-4">
        <div>
          <h4 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Social Links</h4>
          <div className="mt-6 flex items-center gap-5 text-slate-600 dark:text-slate-300">
            <a href="https://github.com/Tenyokj/bert-core-arc" target="_blank" rel="noreferrer" aria-label="GitHub">
              <FaGithub className="text-2xl transition-transform duration-300 hover:-translate-y-1" />
            </a>
            <a href="https://www.youtube.com/@bertdaoARC" target="_blank" rel="noreferrer" aria-label="YouTube">
              <FaYoutube className="text-2xl transition-transform duration-300 hover:-translate-y-1" />
            </a>
            <a href="https://t.me/+8DEt_M62Db00NzYy" target="_blank" rel="noreferrer" aria-label="Telegram">
              <FaTelegramPlane className="text-2xl transition-transform duration-300 hover:-translate-y-1" />
            </a>
            <a href="mailto:bertdaoarc@gmail.com" aria-label="Email">
              <FaMailBulk className="text-2xl transition-transform duration-300 hover:-translate-y-1" />
            </a>
          </div>
        </div>
        <div>
          <h4 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Analytics</h4>
          <div className="mt-6 flex flex-col gap-3 text-lg text-slate-600 dark:text-slate-300">
            <Link className="footer-link" href="/protocol-stats">
              Protocol stats
            </Link>
            <Link className="footer-link" href="/treasury-policies#reporting">
              Treasury Reporting
            </Link>
          </div>
        </div>
        <div className="lg:col-span-2">
          <div className="flex flex-col gap-3 text-lg text-slate-500 dark:text-slate-300 lg:flex-row lg:items-center lg:justify-end">
            <Link className="footer-link" href="/privacy-notice">
              Privacy Notice
            </Link>
            <Link className="footer-link" href="/terms-of-use">
              Terms of Use
            </Link>
            <Link className="footer-link" href="/security-roadmap">
              Security Roadmap
            </Link>
          </div>
          <div className="mt-2 ml-auto w-fit">
            <ParticleText text="BERT" width={680} height={160} />
          </div>
        </div>
      </div>
    </footer>
  );
}
