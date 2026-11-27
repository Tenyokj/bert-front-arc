"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import styles from "./attractor.module.css";

const Canvas = dynamic(() => import("./PoolAttractorCanvas"), { ssr: false, loading: () => <div className={styles.fallback} aria-hidden="true" /> });
export function PoolAttractor() {
  const [paused, setPaused] = useState(false);
  return <div className={styles.attractor} data-pool-attractor>
    <div className={styles.visual} aria-hidden="true"><Canvas paused={paused} /></div>
    <div className={styles.legend}><span>GRAVITATIONAL FIELD / ARTISTIC VISUAL</span><button type="button" aria-pressed={paused} onClick={() => setPaused((value) => !value)}>{paused ? "Resume visual" : "Pause visual"}</button></div>
  </div>;
}
