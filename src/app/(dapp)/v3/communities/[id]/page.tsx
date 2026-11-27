"use client";

import { useParams } from "next/navigation";
import { Suspense } from "react";

import { CommunityWorkspacePage } from "@/components/CommunityWorkspacePage";

export default function V3CommunityPage() {
  const params = useParams<{ id: string }>();
  return <Suspense fallback={<p role="status">Loading Community workspace...</p>}><CommunityWorkspacePage key={params.id} communityKey={params.id} /></Suspense>;
}
