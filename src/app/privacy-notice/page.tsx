import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";

const UPDATED_AT = "May 21, 2026";

const sections = [
  {
    title: "Scope",
    body: [
      "This Privacy Notice applies to BERT web interfaces, documentation pages, and application surfaces used to interact with the protocol.",
      "It explains practical data handling at the interface layer. It does not change the public nature of blockchain records or the transparency of onchain transactions.",
    ],
  },
  {
    title: "What data is processed",
    body: [
      "When you connect a wallet, the interface can read your public wallet address and the public onchain state needed to render balances, proposals, rounds, treasury information, and milestone status.",
      "The interface may also rely on standard technical request metadata from RPC providers, hosting providers, or infrastructure partners, including request logs, IP address handling, and reliability diagnostics.",
      "Local browser storage may be used for interface preferences, cached selections, or session-level convenience features.",
    ],
  },
  {
    title: "How data is used",
    body: [
      "Data is used to render the dApp correctly, route signed transactions to blockchain nodes, maintain operational reliability, and support security diagnostics or abuse prevention where needed.",
      "BERT does not use this interface to take custody of your assets, private keys, or wallet secrets.",
    ],
  },
  {
    title: "Third-party services",
    body: [
      "Depending on deployment, the interface may rely on wallet providers, RPC endpoints, hosting services, indexing infrastructure, and analytics or telemetry tools selected by operators.",
      "Those providers process data under their own terms and privacy practices. If indexed reads are enabled, public blockchain events may be served through query infrastructure such as The Graph.",
    ],
  },
  {
    title: "Storage and retention",
    body: [
      "Local interface state remains in your browser unless you clear it. Infrastructure logs or diagnostic records are retained according to the policies of the providers involved in the deployment.",
      "Onchain records are public and persistent by design.",
    ],
  },
  {
    title: "Your controls",
    body: [
      "You can disconnect your wallet, clear local browser storage, or stop using the interface at any time. Requests related to infrastructure logs should be directed to the relevant provider.",
      "If a deployment operator runs additional offchain services, those services should publish their own operational contact details and handling policies.",
    ],
  },
];

export default function PrivacyNoticePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.16),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.12),transparent_28%)]" />
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
              Privacy
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-slate-600 dark:text-slate-300">
              This page explains the practical privacy model for BERT: what the interface reads, which services are involved,
              and how operational data is handled when you use the product.
            </p>
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Last updated: {UPDATED_AT}
            </p>
          </section>

          <section className="mt-16 overflow-hidden rounded-[32px] border border-white/12 bg-[rgba(7,16,30,0.72)] px-8 py-8 shadow-[0_30px_80px_rgba(2,8,23,0.32)] backdrop-blur md:px-10 md:py-10">
            <div className="rounded-2xl border border-cyan-400/25 bg-cyan-400/8 px-5 py-4 text-base leading-relaxed text-slate-100">
              BERT operates as an interface to onchain infrastructure. Public blockchain activity remains visible by design,
              while interface-level data handling is limited to what is necessary for product operation, rendering, and reliability.
            </div>

            <div className="mt-10 space-y-10">
              {sections.map((section) => (
                <section key={section.title} className="border-t border-white/10 pt-8 first:border-t-0 first:pt-0">
                  <h2 className="text-2xl font-semibold text-white md:text-3xl">{section.title}</h2>
                  <div className="mt-4 space-y-4 text-lg leading-relaxed text-slate-300">
                    {section.body.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                </section>
              ))}

              <section className="border-t border-white/10 pt-8">
                <h2 className="text-2xl font-semibold text-white md:text-3xl">Practical privacy summary</h2>
                <ul className="mt-5 list-disc space-y-2 pl-6 text-lg leading-relaxed text-slate-300">
                  <li>The interface reads public blockchain state and wallet connection data needed for product operation.</li>
                  <li>Local browser state may be used for preferences or session-level convenience.</li>
                  <li>Infrastructure providers may process technical request metadata under their own policies.</li>
                  <li>Onchain records remain public and persistent by design.</li>
                </ul>
              </section>
            </div>
          </section>

          <section className="mt-8 rounded-[28px] border border-white/12 bg-[rgba(7,16,30,0.54)] px-6 py-5 text-base leading-relaxed text-slate-300 shadow-[0_16px_48px_rgba(2,8,23,0.24)] backdrop-blur">
            For privacy-related questions, product or deployment operators should provide a live contact channel. You can also
            review the related <Link href="/terms-of-use" className="text-cyan-300 hover:text-cyan-200">Terms of Use</Link> and{" "}
            <Link href="/policy-docs" className="text-cyan-300 hover:text-cyan-200">Policy Docs</Link>.
          </section>
        </main>

        <SiteFooter />
      </div>
    </div>
  );
}
