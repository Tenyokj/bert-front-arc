import { Suspense } from "react";
import { WalletWorkspace } from "@/components/dapp/WalletWorkspace";

export default function ProfilePage() {
  return <Suspense fallback={<p className="p-6 text-slate-300">Loading your workspace...</p>}><WalletWorkspace /></Suspense>;
}
