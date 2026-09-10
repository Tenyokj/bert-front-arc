import Link from "next/link";
import { FaArrowRight, FaBug, FaCircleCheck, FaFlask, FaGithub, FaShieldHalved, FaTriangleExclamation } from "react-icons/fa6";

import SiteFooter from "@/components/SiteFooter";

const advisoryUrl = "https://github.com/Tenyokj/bert-core-arc/security/advisories/new";

export default function TestnetInformationPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto max-w-[1450px] px-6 py-8 md:px-10 lg:px-14">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.24em] text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
            <span className="h-9 w-9 rounded-full bg-gradient-to-br from-teal-400 to-blue-600 shadow-[0_8px_24px_rgba(37,99,235,0.35)]" />
            BERT
          </Link>
          <Link href="/app" className="rounded-full border border-white/60 bg-white/70 px-5 py-2 text-sm font-semibold text-slate-900 shadow-[0_12px_30px_rgba(15,23,42,0.08)] backdrop-blur transition hover:-translate-y-0.5">
            Open dApp
          </Link>
        </header>

        <main className="mt-10 grid gap-12 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-8 lg:h-[calc(100vh-72px)]">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-teal-600">Arc Testnet</p>
            <h1 className="mt-3 text-4xl font-semibold text-slate-900 dark:text-slate-100">Test safely. Report clearly.</h1>
            <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">Everything here is a real interaction with deployed testnet contracts, but no testnet asset has monetary value.</p>
            <nav className="mt-7 space-y-2 border-l border-white/20 pl-4 text-sm text-slate-600 dark:text-slate-300">
              <a href="#before-you-start" className="block hover:text-slate-900 dark:hover:text-white">Before you start</a>
              <a href="#world-id" className="block hover:text-slate-900 dark:hover:text-white">World ID Simulator</a>
              <a href="#bug-bounty" className="block hover:text-slate-900 dark:hover:text-white">Testnet bug bounty</a>
              <a href="#report" className="block hover:text-slate-900 dark:hover:text-white">Report a vulnerability</a>
            </nav>
          </aside>

          <section className="space-y-10 border-t border-white/12 pt-8">
            <section className="rounded-[28px] border border-amber-300/25 bg-[linear-gradient(135deg,rgba(245,158,11,0.14),rgba(15,23,42,0.04))] p-6 dark:bg-[linear-gradient(135deg,rgba(245,158,11,0.13),rgba(15,23,42,0.5))]">
              <div className="flex items-start gap-4"><FaTriangleExclamation className="mt-1 shrink-0 text-2xl text-amber-500" /><div><p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-700 dark:text-amber-200">Important</p><h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">This is an active test environment.</h2><p className="mt-3 leading-relaxed text-slate-700 dark:text-slate-200">BERT runs on Arc Testnet while we validate security, economics and UX before mainnet. Testnet USDC, ETH and every displayed testnet balance are for testing only. Do not treat them as redeemable assets or rely on the testnet for production activity.</p></div></div>
            </section>

            <section id="before-you-start" className="space-y-4">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-teal-600">Before you start</p>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">What is real, and what can change.</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <InfoCard icon={<FaCircleCheck />} title="Real testnet execution" text="Wallet signatures, USDC approvals, Community roles, votes, settlements, Treasury requests and validator rewards are sent to deployed Arc Testnet contracts." />
                <InfoCard icon={<FaFlask />} title="Testnet conditions" text="Deployments, settings, indexers and testnet balances can be reset or changed during development. Record transaction hashes when reporting unexpected behavior." />
                <InfoCard icon={<FaShieldHalved />} title="PoP is required" text="BERT uses World ID proof-of-personhood to issue a short-lived on-chain verification signature. Verify before attempting protected actions such as creating an idea or voting." />
                <InfoCard icon={<FaBug />} title="Help harden BERT" text="If something behaves incorrectly, reproduce it on testnet first and report it privately. Do not exploit a weakness beyond the minimum proof needed to demonstrate impact." />
              </div>
            </section>

            <section id="world-id" className="space-y-5">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-teal-600">World ID Simulator</p>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Complete verification without scanning a QR code.</h2>
              <p className="leading-relaxed text-slate-700 dark:text-slate-200">For the staging World App, click <strong>Start verification</strong> in BERT and use the browser simulator. A physical World App or QR scan is not required for this testnet flow.</p>
              <ol className="grid gap-3 sm:grid-cols-2">
                <Step number="1" title="Open the simulator" text="When World ID opens, select “Use simulator” rather than scanning the displayed QR code." />
                <Step number="2" title="Use the correct proof" text="In the simulated phone flow choose World ID v3, then choose the Device credential." />
                <Step number="3" title="Approve once" text="Finish the simulator flow and return to BERT. Keep the wallet connected to the same address that started verification." />
                <Step number="4" title="Retry cleanly if needed" text="If the widget reports duplicate_nonce, refresh BERT and start a new verification. Do not retry within the same old modal." />
              </ol>
              <p className="rounded-2xl border border-cyan-300/25 bg-cyan-400/8 p-4 text-sm leading-relaxed text-slate-700 dark:text-cyan-50"><strong>Why v3 + Device?</strong> The current BERT staging integration verifies this credential path. Selecting World ID v4 in the simulator does not match the active staging proof flow and will be rejected by the host application.</p>
            </section>

            <section id="bug-bounty" className="space-y-5">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-teal-600">Testnet bug bounty</p>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Help find the issue before mainnet.</h2>
              <p className="leading-relaxed text-slate-700 dark:text-slate-200">BERT welcomes responsible reports for the open core contracts, V3 Community Layer, backend verification service and frontend integration. Public source code is intentional: security must survive review, not depend on hiding implementation details.</p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-white/15 bg-white/45 p-5 dark:bg-white/[0.04]"><h3 className="font-semibold text-slate-900 dark:text-white">In scope</h3><ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700 dark:text-slate-200"><li>Smart-contract access control, accounting, upgrade and state-machine flaws.</li><li>V2/V3 business logic, Treasury, voting, settlement and reward defects.</li><li>Backend proof validation and signature integration.</li><li>Frontend defects that misrepresent on-chain state or enable an unsafe flow.</li></ul></div>
                <div className="rounded-2xl border border-white/15 bg-white/45 p-5 dark:bg-white/[0.04]"><h3 className="font-semibold text-slate-900 dark:text-white">Out of scope</h3><ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700 dark:text-slate-200"><li>Known, duplicate or purely theoretical reports without a reproduction.</li><li>Social engineering, phishing, denial of service, spam or third-party service issues.</li><li>Testnet token value claims and reports that require harming other users.</li><li>Reports containing copied secrets, personal data or public exploit details.</li></ul></div>
              </div>
              <div className="rounded-2xl border border-teal-300/30 bg-teal-400/8 p-5 text-slate-800 dark:text-teal-50"><h3 className="font-semibold">Reward: an initial Validator seat</h3><p className="mt-2 text-sm leading-relaxed">For a confirmed, previously unknown and responsibly disclosed high-impact report before mainnet launch, BERT may include the researcher&apos;s wallet in <code>initialValidators</code> when the official BERT Community is deployed. It is not an immediate cash payment or transferable asset, and remains subject to available seats and conduct requirements. After the Community is live, new Validators must follow the standard on-chain eligibility path.</p></div>
              <Link href="/bug-bounty" className="inline-flex items-center gap-2 rounded-full border border-cyan-300/40 px-5 py-2.5 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-400/10 dark:text-cyan-100">Open full program and report form <FaArrowRight /></Link>
            </section>

            <section id="report" className="rounded-[28px] border border-cyan-300/25 bg-[linear-gradient(135deg,rgba(14,116,144,0.16),rgba(30,41,59,0.05))] p-6 dark:bg-[linear-gradient(135deg,rgba(14,116,144,0.18),rgba(30,41,59,0.55))]">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-700 dark:text-cyan-200">Private disclosure only</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">Send a reproducible report.</h2>
              <p className="mt-3 max-w-3xl leading-relaxed text-slate-700 dark:text-slate-200">Use a GitHub Private Security Advisory. Include the affected repository and component, preconditions, exact reproduction steps, expected and actual behavior, impact, transaction hashes or screenshots, and a proposed mitigation if you have one.</p>
              <div className="mt-5 flex flex-wrap gap-3"><a href={advisoryUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 dark:bg-cyan-300 dark:text-slate-950"><FaGithub /> Open private security advisory <FaArrowRight /></a><Link href="/security-roadmap" className="inline-flex items-center gap-2 rounded-full border border-white/30 px-5 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100">Security roadmap <FaArrowRight /></Link></div>
            </section>
          </section>
        </main>
        <SiteFooter />
      </div>
    </div>
  );
}

function InfoCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <article className="rounded-2xl border border-white/15 bg-white/45 p-5 dark:bg-white/[0.04]"><div className="text-xl text-teal-600 dark:text-cyan-200">{icon}</div><h3 className="mt-3 font-semibold text-slate-900 dark:text-white">{title}</h3><p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-200">{text}</p></article>;
}

function Step({ number, title, text }: { number: string; title: string; text: string }) {
  return <li className="rounded-2xl border border-white/15 bg-white/45 p-5 dark:bg-white/[0.04]"><span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-teal-500 text-xs font-bold text-white">{number}</span><h3 className="mt-3 font-semibold text-slate-900 dark:text-white">{title}</h3><p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-200">{text}</p></li>;
}
