"use client";

import { useParams } from "next/navigation";

import { CommunityWorkspacePage } from "@/components/CommunityWorkspacePage";

export default function V3CommunityPage() {
  const params = useParams<{ id: string }>();
  return <CommunityWorkspacePage communityId={Number(params.id)} />;
}
