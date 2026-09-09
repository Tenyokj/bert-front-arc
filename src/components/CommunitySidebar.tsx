"use client";

import { FaBuildingColumns, FaCheckDouble, FaList, FaPlus, FaShieldHalved } from "react-icons/fa6";

export type CommunitySection = "binary" | "slate" | "create" | "validator" | "admin";

const entries = [
  { id: "binary", label: "Binary Proposals", icon: FaList },
  { id: "slate", label: "Slate Rounds", icon: FaCheckDouble },
  { id: "create", label: "Create Proposal", icon: FaPlus },
  { id: "validator", label: "Validator Queue", icon: FaShieldHalved },
  { id: "admin", label: "Admin Panel", icon: FaBuildingColumns },
] as const;

/** Sticky local navigation, rendered only inside an individual Community workspace. */
export function CommunitySidebar({ active, onChange, isAdmin, isValidator }: { active: CommunitySection; onChange: (section: CommunitySection) => void; isAdmin: boolean; isValidator: boolean }) {
  return <aside className="sticky top-28 h-fit rounded-[24px] border border-white/10 bg-[#2a2d3b] p-3 xl:top-32"><p className="px-3 pb-3 pt-1 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Community workspace</p><nav className="space-y-1">{entries.filter((entry) => entry.id !== "admin" || isAdmin).filter((entry) => entry.id !== "validator" || isValidator).map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => onChange(id)} className={active === id ? "flex w-full items-center gap-3 rounded-xl bg-cyan-300 px-3 py-3 text-left text-sm font-bold text-slate-950" : "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white"}><Icon />{label}</button>)}</nav></aside>;
}
