import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";

const UPDATED_AT = "May 21, 2026";

const sections = [
  {
    title: "Acceptance",
    body: [
      "By accessing or using BERT websites, documentation, and interface surfaces, you agree to these Terms of Use.",
      "If you do not agree, do not access or use the service.",
    ],
  },
  {
    title: "Eligibility",
    body: [
      "You represent that you are legally capable of entering binding terms and that your use of the service is permitted in your jurisdiction.",
      "You are responsible for compliance with local laws, regulations, sanctions rules, and tax obligations that apply to your activity.",
    ],
  },
  {
    title: "Service scope",
    body: [
      "BERT provides non-custodial software interfaces for interacting with blockchain smart contracts and associated information surfaces.",
      "The product does not take custody of your private keys or control your wallet. Onchain execution is determined by the connected smart contracts and the transactions you authorize.",
    ],
  },
  {
    title: "Wallets and approvals",
    body: [
      "You are solely responsible for wallet security, private keys, recovery phrases, device integrity, and transaction approvals.",
      "Transactions submitted from your wallet are treated as authorized by you.",
    ],
  },
  {
    title: "Risk disclosures",
    body: [
      "Blockchain transactions are irreversible and may fail for reasons outside interface control, including network congestion, RPC instability, or contract-level reverts.",
      "Digital asset use involves financial, technical, and operational risks. BERT content does not constitute legal, tax, accounting, or investment advice.",
    ],
  },
  {
    title: "Prohibited use",
    body: [
      "You may not use the service for unlawful, fraudulent, abusive, or sanctioned activity.",
      "You may not attempt to disrupt, exploit, reverse engineer, overload, or interfere with the service or its supporting infrastructure.",
    ],
  },
  {
    title: "Disclaimers and liability",
    body: [
      "The service is provided on an “as is” and “as available” basis without warranties of any kind, express or implied.",
      "To the maximum extent permitted by law, BERT and its contributors are not liable for indirect, incidental, consequential, punitive, or special damages arising out of or related to your use of the service.",
    ],
  },
  {
    title: "Changes",
    body: [
      "The service may change, pause, or be discontinued at any time. These Terms may also be updated from time to time.",
      "Continued use after updates constitutes acceptance of the revised Terms.",
    ],
  },
];

export default function TermsOfUsePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.16),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.12),transparent_28%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.06)_1px,transparent_1px)] bg-[size:48px_48px]" />
      </div>

      <div className="relative mx-auto max-w-[1180px] px-6 py-8 md:px-10">
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

        <main className="mx-auto mt-12 max-w-[860px]">
          <section className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-500">Legal</p>
            <h1 className="mt-5 text-5xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 md:text-7xl">
              Terms of Use
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-slate-600 dark:text-slate-300">
              These terms govern access to and use of BERT websites, interfaces, and product surfaces used to interact with
              the protocol.
            </p>
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Last updated: {UPDATED_AT}
            </p>
          </section>

          <section className="mt-16 overflow-hidden rounded-[32px] border border-white/12 bg-[rgba(7,16,30,0.72)] px-8 py-8 shadow-[0_30px_80px_rgba(2,8,23,0.32)] backdrop-blur md:px-10 md:py-10">
            <div className="rounded-2xl border border-cyan-400/25 bg-cyan-400/8 px-5 py-4 text-base leading-relaxed text-slate-100">
              BERT is a non-custodial software interface. You remain responsible for your wallet, your approvals, and your
              jurisdictional compliance whenever you use the product.
            </div>

            <div className="mt-10 space-y-10">
              {sections.map((section, index) => (
                <section key={section.title} className="border-t border-white/10 pt-8 first:border-t-0 first:pt-0">
                  <h2 className="text-2xl font-semibold text-white md:text-3xl">
                    {index + 1}. {section.title}
                  </h2>
                  <div className="mt-4 space-y-4 text-lg leading-relaxed text-slate-300">
                    {section.body.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                </section>
              ))}

              <section className="border-t border-white/10 pt-8">
                <h2 className="text-2xl font-semibold text-white md:text-3xl">Practical summary</h2>
                <ul className="mt-5 list-disc space-y-2 pl-6 text-lg leading-relaxed text-slate-300">
                  <li>BERT provides interfaces, not custodial account services.</li>
                  <li>You control your wallet, private keys, and transaction approvals.</li>
                  <li>Smart contract and infrastructure risks remain part of product use.</li>
                  <li>Continued use means acceptance of the active product terms.</li>
                </ul>
              </section>
            </div>
          </section>

          <section className="mt-8 rounded-[28px] border border-white/12 bg-[rgba(7,16,30,0.54)] px-6 py-5 text-base leading-relaxed text-slate-300 shadow-[0_16px_48px_rgba(2,8,23,0.24)] backdrop-blur">
            For related policy context, review the <Link href="/privacy-notice" className="text-cyan-300 hover:text-cyan-200">Privacy Notice</Link>,{" "}
            <Link href="/policy-docs" className="text-cyan-300 hover:text-cyan-200">Policy Docs</Link>, and{" "}
            <Link href="/security-roadmap" className="text-cyan-300 hover:text-cyan-200">Security Roadmap</Link>.
          </section>
        </main>

        <SiteFooter />
      </div>
    </div>
  );
}
