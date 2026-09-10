"use client";

import { useState } from "react";
import { FaCheck, FaCopy, FaExternalLinkAlt } from "react-icons/fa";

const advisoryUrl = "https://github.com/Tenyokj/bert-core-arc/security/advisories/new";

type FormState = {
  title: string;
  repository: string;
  severity: string;
  component: string;
  impact: string;
  reproduction: string;
  evidence: string;
  mitigation: string;
};

const initialForm: FormState = {
  title: "",
  repository: "bert-core-arc",
  severity: "Medium",
  component: "",
  impact: "",
  reproduction: "",
  evidence: "",
  mitigation: "",
};

/** Builds a structured report locally; sensitive findings are never posted through the public frontend. */
export function BugBountyReportForm() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const update = (field: keyof FormState, value: string) => setForm((current) => ({ ...current, [field]: value }));
  const report = `# ${form.title || "Security report"}

## Repository
${form.repository}

## Severity (reporter estimate)
${form.severity}

## Affected component
${form.component || "Not specified"}

## Impact
${form.impact || "Not specified"}

## Reproduction steps
${form.reproduction || "Not specified"}

## Evidence
${form.evidence || "Not specified"}

## Suggested mitigation
${form.mitigation || "Not specified"}
`;
  const copyReport = async () => {
    setCopyError(null);
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(report);
      } else {
        // Clipboard API is unavailable on some non-secure localhost contexts.
        const textarea = document.createElement("textarea");
        textarea.value = report;
        textarea.setAttribute("readonly", "");
        textarea.style.cssText = "position:fixed;left:-9999px;top:0;opacity:0;";
        document.body.appendChild(textarea);
        textarea.select();
        const copiedFallback = document.execCommand("copy");
        textarea.remove();
        if (!copiedFallback) throw new Error("Browser denied clipboard access.");
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2_000);
    } catch {
      setCopyError("Could not access the clipboard. Select the generated report manually and copy it before opening the private advisory.");
    }
  };

  return (
    <form onSubmit={(event) => { event.preventDefault(); void copyReport(); }} className="rounded-[28px] border border-cyan-300/30 bg-[#20232f] p-5 text-slate-100 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-200">Private report builder</p><h2 className="mt-2 text-2xl font-semibold text-white">Prepare the report locally.</h2></div>
        <span className="rounded-full border border-amber-300/35 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-100">Never paste secrets here</span>
      </div>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-300">This form does not send data to BERT. It formats your report in this browser; copy it, then paste it into a private GitHub Security Advisory.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Field label="Report title"><input required value={form.title} onChange={(event) => update("title", event.target.value)} placeholder="Short description of the issue" className={inputClassName} /></Field>
        <Field label="Repository"><select value={form.repository} onChange={(event) => update("repository", event.target.value)} className={inputClassName}><option>bert-core-arc</option><option>bert-backend-arc</option><option>bert-front-arc</option></select></Field>
        <Field label="Severity estimate"><select value={form.severity} onChange={(event) => update("severity", event.target.value)} className={inputClassName}><option>Critical</option><option>High</option><option>Medium</option><option>Low</option></select></Field>
        <Field label="Affected component"><input required value={form.component} onChange={(event) => update("component", event.target.value)} placeholder="Contract, endpoint, route or component" className={inputClassName} /></Field>
      </div>
      <div className="mt-4 grid gap-4">
        <Field label="Impact"><textarea required value={form.impact} onChange={(event) => update("impact", event.target.value)} placeholder="What can an attacker do? Who is affected?" className={textareaClassName} /></Field>
        <Field label="Reproduction steps"><textarea required value={form.reproduction} onChange={(event) => update("reproduction", event.target.value)} placeholder="Minimal, ordered steps. Include testnet configuration or transaction hashes where relevant." className={textareaClassName} /></Field>
        <Field label="Evidence"><textarea value={form.evidence} onChange={(event) => update("evidence", event.target.value)} placeholder="Transaction hashes, logs, screenshots or proof-of-concept summary. Do not include private keys or World ID credentials." className={textareaClassName} /></Field>
        <Field label="Suggested mitigation (optional)"><textarea value={form.mitigation} onChange={(event) => update("mitigation", event.target.value)} placeholder="A safe patch idea, invariant or regression test." className={textareaClassName} /></Field>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <button type="submit" className="inline-flex items-center gap-2 rounded-full bg-cyan-300 px-5 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-200">{copied ? <><FaCheck /> Copied</> : <><FaCopy /> Copy private report</>}</button>
        <a href={advisoryUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-cyan-300/40 px-5 py-2.5 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/10"><FaExternalLinkAlt /> Open GitHub private advisory</a>
      </div>
      {copyError ? <p className="mt-3 text-sm text-rose-200">{copyError}</p> : null}
    </form>
  );
}

const inputClassName = "mt-2 w-full rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2.5 text-sm text-white outline-none transition focus:border-cyan-300/70";
const textareaClassName = `${inputClassName} min-h-28 resize-y`;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-sm font-semibold text-slate-200">{label}{children}</label>;
}
