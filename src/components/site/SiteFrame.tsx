"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import Link from "next/link";
import { DM_Sans, Outfit } from "next/font/google";
import { FiCheck, FiCopy, FiGrid, FiPlus } from "react-icons/fi";
import { LandingHeader } from "../landing/LandingExperience";
import { LandingFooter } from "../landing/LandingMain";
import { LandingMotion } from "../landing/LandingMotion";
import { copyText } from "./clipboard";
import { sitePages, type SitePath } from "./routes";
import landing from "../landing/landing.module.css";
import styles from "./site.module.css";

const display = Outfit({ subsets: ["latin"], variable: "--landing-display", display: "swap" });
const body = DM_Sans({ subsets: ["latin"], variable: "--landing-body", display: "swap" });

export function SiteFrame({ route, children }: { route: SitePath; children: ReactNode }) {
  const current = sitePages.find((page) => page.path === route)!;
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const related = sitePages.filter((page) => page.path !== route && page.group !== "Legal").slice(0, 4);
  return <div className={`${landing.landing} ${styles.site} ${display.variable} ${body.variable}`} data-site-page={route}>
    <LandingMotion>
      <a className={landing.skip} href="#main-content">Skip to content</a>
      <LandingHeader />
      <div className={styles.pageBar}>
        <span><FiGrid aria-hidden />{current.group}<span className={styles.divider} />{current.label}</span>
        <button type="button" onClick={async () => {
          const success = await copyText(window.location.href);
          setCopied(success); setCopyError(!success);
        }}>{copied ? <FiCheck aria-hidden /> : <FiCopy aria-hidden />}{copied ? "Link copied" : "Copy page link"}</button>
        <span className={styles.srOnly} role="status">{copyError ? "Could not copy the link. Copy the address from your browser." : copied ? "Page link copied." : ""}</span>
      </div>
      <details className={styles.directory}>
        <summary>Explore all guides <FiPlus aria-hidden /></summary>
        <nav aria-label="Information pages">{sitePages.map((page) => <Link key={page.path} href={page.path} aria-current={page.path === route ? "page" : undefined}><span>{page.group}</span>{page.label}</Link>)}</nav>
      </details>
      <div id="main-content" className={styles.content} data-document={current.group === "Legal" ? "legal" : "guide"} tabIndex={-1}>{children}</div>
      {current.group !== "Legal" && <section className={styles.related} aria-labelledby="related-title">
        <p>KEEP EXPLORING</p><h2 id="related-title">The next useful read.</h2>
        <div>{related.map((page) => <Link href={page.path} key={page.path}><span>{page.group}<FiPlus aria-hidden /></span><h3>{page.label}</h3><p>{page.description}</p></Link>)}</div>
      </section>}
      <LandingFooter />
    </LandingMotion>
  </div>;
}
