"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { FiPause, FiPlay } from "react-icons/fi";

const MotionContext = createContext({ paused: false, setPaused: (_paused: boolean) => {} });

export function LandingMotion({ children }: { children: ReactNode }) {
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setPaused(preference.matches);
    sync();
    preference.addEventListener("change", sync);
    return () => preference.removeEventListener("change", sync);
  }, []);
  return <MotionContext.Provider value={{ paused, setPaused }}><div data-landing-motion={paused ? "paused" : "playing"}>{children}</div></MotionContext.Provider>;
}

export const useLandingMotion = () => useContext(MotionContext);

export function FooterMotionControl({ className }: { className?: string }) {
  const { paused, setPaused } = useLandingMotion();
  return <button className={className} type="button" aria-label={paused ? "Resume page animations" : "Pause page animations"} aria-pressed={paused} onClick={() => setPaused(!paused)}>{paused ? <FiPlay aria-hidden /> : <FiPause aria-hidden />}{paused ? "Enable motion" : "Reduce motion"}</button>;
}
