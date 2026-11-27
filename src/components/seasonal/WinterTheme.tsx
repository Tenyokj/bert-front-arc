"use client";

import { useEffect, useRef, useSyncExternalStore, type CSSProperties } from "react";
import { SNOWFLAKES, WINTER_THEME, winterSeasonActive } from "@/lib/seasonal-theme";
import styles from "./winter.module.css";

const changed = "bert:winter-preference";
let fallbackEnabled = true;
function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(changed, onChange);
  const timer = window.setInterval(onChange, 60_000);
  return () => { window.removeEventListener("storage", onChange); window.removeEventListener(changed, onChange); window.clearInterval(timer); };
}
const noServerTheme = () => false;
const seasonSnapshot = () => winterSeasonActive(Date.now());
function preferenceSnapshot() {
  try { return window.localStorage.getItem(WINTER_THEME.preferenceKey) !== "off"; }
  catch { return fallbackEnabled; }
}
function togglePreference() {
  fallbackEnabled = !preferenceSnapshot();
  try { window.localStorage.setItem(WINTER_THEME.preferenceKey, fallbackEnabled ? "on" : "off"); } catch { /* The current tab still supports opt-out when storage is blocked. */ }
  window.dispatchEvent(new Event(changed));
}

function Evergreen() {
  return <svg viewBox="0 0 120 100" fill="none" aria-hidden="true" className={styles.evergreen}>
    <g strokeLinecap="round"><path d="M4 4 85 62M5 5 31 91" stroke="#587b70" strokeWidth="2" />
      <path d="m18 14 3 20m-3-20 20-2m-9 10 2 24m-2-24 24-1m-12 9 2 23m-2-23 24 2m-14 6 3 24m-3-24 23 3m-15 3 4 22m-4-22 20 4M11 24 1 35m10-11 15 6M16 41 3 54m13-13 16 9M20 59 8 73m12-14 16 8M25 76 15 88m10-12 13 6" stroke="#56a28c" strokeWidth="1.6" />
      <path d="m15 13 16 12m-8-5 5 13m11-5 13 9m6 8 12 9m-51-3 2 17" stroke="#c9e5ec" strokeWidth="1.1" opacity=".65" />
    </g>
    <path d="M39 31C17 6 12 34 33 39c-15 8-17 21-12 26l18-20 17 20c5-8-1-20-12-26 24-2 20-31-5-8Z" fill="#b93d5e" stroke="#ef8eaa" strokeWidth=".8" />
    <path d="m38 31-4 10 9 1 2-11Z" fill="#f48ba3" />
  </svg>;
}

export function WinterTheme() {
  const inSeason = useSyncExternalStore(subscribe, seasonSnapshot, noServerTheme);
  const enabled = useSyncExternalStore(subscribe, preferenceSnapshot, noServerTheme);
  const layer = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const visibility = () => { if (layer.current) layer.current.dataset.paused = String(document.hidden); };
    visibility(); document.addEventListener("visibilitychange", visibility);
    return () => document.removeEventListener("visibilitychange", visibility);
  }, [inSeason, enabled]);
  if (!inSeason) return null;
  return <>
    {enabled && <div ref={layer} className={styles.layer} data-winter-theme aria-hidden="true">
      {(["left", "right"] as const).map((side) => <div key={side} className={`${styles.edge} ${styles[side]}`}>
        {SNOWFLAKES.map((flake, index) => <span key={index} className={styles.flake} style={{ "--lane": `${flake.lane}%`, "--size": `${flake.size}px`, "--duration": `${flake.duration}s`, "--delay": `${flake.delay}s`, "--drift": `${flake.drift}px` } as CSSProperties}>{index % 3 === 0 ? "+" : ""}</span>)}
      </div>)}
      <div className={`${styles.corner} ${styles.topLeft}`}><Evergreen /></div>
      <div className={`${styles.corner} ${styles.topRight}`}><Evergreen /></div>
      <div className={`${styles.frost} ${styles.frostLeft}`} /><div className={`${styles.frost} ${styles.frostRight}`} />
    </div>}
    <button type="button" className={styles.toggle} onClick={togglePreference} aria-pressed={enabled} aria-label={enabled ? "Disable winter effects" : "Enable winter effects"} title={enabled ? "Turn winter effects off" : "Turn winter effects on"}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><path d="M12 2v20M3.34 7l17.32 10M3.34 17 20.66 7M9 4l3 3 3-3M9 20l3-3 3 3M4 10l4-1-1-4M20 14l-4 1 1 4M4 14l4 1-1 4M20 10l-4-1 1-4" /></svg>
    </button>
  </>;
}
