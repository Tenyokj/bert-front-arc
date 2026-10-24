"use client";

import { useParams } from "next/navigation";

import { CommunityWorkspacePage } from "@/components/CommunityWorkspacePage";

export default function V3CommunityPage() {
  const params = useParams<{ id: string }>();
  return <CommunityWorkspacePage key={params.id} communityKey={params.id} />;
}
