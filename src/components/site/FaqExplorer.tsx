"use client";

import { useDeferredValue, useState } from "react";
import Link from "next/link";
import { FiBookOpen, FiCode, FiPlus, FiSearch, FiShield, FiX } from "react-icons/fi";
import styles from "./faq.module.css";

type Section = { id: string; title: string; items: { question: string; answer: string }[] };

export function FaqExplorer({ sections }: { sections: Section[] }) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [category, setCategory] = useState(sections[0].id);
  const [open, setOpen] = useState(`${sections[0].id}-0`);
  const search = deferredQuery.trim().toLowerCase();
  const filtered = search ? sections.map((section) => ({ ...section, items: section.items.filter((item) => `${section.title} ${item.question} ${item.answer}`.toLowerCase().includes(search)) })).filter((section) => section.items.length) : sections.filter((section) => section.id === category);
  const count = filtered.reduce((sum, section) => sum + section.items.length, 0);
  return <main className={styles.faq}>
    <section className={styles.hero}>
      <div><p className={styles.eyebrow}>BERT KNOWLEDGE BASE</p><h1>Good questions.<br /><span>Clear answers.</span></h1><p>Understand the rules before you commit. Funding, Communities, verification and the limits of the current testnet.</p></div>
      <div className={styles.shortcuts}>
        <Link href="/how-it-works"><FiBookOpen aria-hidden /><span>New to BERT?<strong>Start with the flow</strong></span><FiPlus aria-hidden /></Link>
        <Link href="/developer-guide"><FiCode aria-hidden /><span>Building an integration?<strong>Open the developer guide</strong></span><FiPlus aria-hidden /></Link>
        <Link href="/security-roadmap"><FiShield aria-hidden /><span>Assessing the risks?<strong>Read the limitations</strong></span><FiPlus aria-hidden /></Link>
      </div>
    </section>
    <div className={styles.search}>
      <FiSearch aria-hidden /><label className={styles.srOnly} htmlFor="faq-search">Search all FAQ sections</label>
      <input id="faq-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search funding, milestones, verification…" />
      {query && <button aria-label="Clear FAQ search" onClick={() => setQuery("")}><FiX aria-hidden /></button>}
    </div>
    <div className={styles.layout}>
      <aside><p className={styles.eyebrow}>BROWSE BY TOPIC</p><nav aria-label="FAQ topics">{sections.map((section) => <button key={section.id} aria-pressed={!search && section.id === category} onClick={() => { setCategory(section.id); setQuery(""); setOpen(`${section.id}-0`); }}><span>{section.title}</span><span>{section.items.length}</span></button>)}</nav></aside>
      <div className={styles.results} aria-busy={query !== deferredQuery}>
        <p className={styles.resultCount} role="status">{count} {count === 1 ? "answer" : "answers"}{search ? " across all topics" : " in this topic"}</p>
        {!count && <div className={styles.empty}><FiSearch aria-hidden /><h2>No matching answers.</h2><p>Try a shorter phrase, another topic, or read the developer guide.</p><button onClick={() => setQuery("")}>Reset search</button></div>}
        {filtered.map((section) => <section key={section.id} aria-labelledby={`faq-${section.id}`}><h2 id={`faq-${section.id}`}>{section.title}</h2><div>{section.items.map((item, index) => {
          const key = `${section.id}-${index}`;
          const expanded = open === key;
          return <article key={item.question}><h3><button aria-expanded={expanded} aria-controls={`answer-${key}`} onClick={() => setOpen(expanded ? "" : key)}><span>{item.question}</span><FiPlus aria-hidden className={expanded ? styles.rotated : ""} /></button></h3><div id={`answer-${key}`} hidden={!expanded}><p>{item.answer}</p></div></article>;
        })}</div></section>)}
      </div>
    </div>
  </main>;
}
