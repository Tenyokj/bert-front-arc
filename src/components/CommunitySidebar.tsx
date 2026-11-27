"use client";

import { FaBuildingColumns, FaCheckDouble, FaFileShield, FaList, FaPlus, FaShieldHalved } from "react-icons/fa6";
import styles from "./dapp/community-ux.module.css";

export type CommunitySection = "binary" | "slate" | "milestones" | "create" | "validator" | "admin";

const entries = [
  { id: "binary", label: "Binary Proposals", icon: FaList },
  { id: "slate", label: "Slate Rounds", icon: FaCheckDouble },
  { id: "milestones", label: "Execution Plans", icon: FaFileShield },
  { id: "create", label: "Create Proposal", icon: FaPlus },
  { id: "validator", label: "Validator Queue", icon: FaShieldHalved },
  { id: "admin", label: "Admin Panel", icon: FaBuildingColumns },
] as const;

/** Local task navigation; the main dApp island header is unchanged. */
export function CommunitySidebar({ active, onChange, isAdmin, isValidator }: { active: CommunitySection; onChange: (section: CommunitySection) => void; isAdmin: boolean; isValidator: boolean }) {
  return <div className={styles.navigation}><nav aria-label="Community workspace">{entries.filter((entry) => entry.id !== "admin" || isAdmin).filter((entry) => entry.id !== "validator" || isValidator).map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => onChange(id)} aria-pressed={active === id} aria-controls="community-content"><Icon aria-hidden="true" />{label}</button>)}</nav></div>;
}
