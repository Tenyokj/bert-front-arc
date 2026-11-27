import { Suspense } from "react";
import { AdminControlCenter } from "@/components/admin/AdminControlCenter";

export default function AdminPage() {
  return <Suspense fallback={<p role="status">Loading Control Center…</p>}><AdminControlCenter /></Suspense>;
}
