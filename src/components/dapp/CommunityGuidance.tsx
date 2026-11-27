"use client";

import Link from "next/link";
import { useCommunityClock } from "@/lib/use-community-clock";
import { slatePhase } from "@/lib/protocol-status";
import { StatusBadge } from "./StatusBadge";
import styles from "./community-ux.module.css";

export function CommunityGuidance({ title = "Who acts next?", children, href, linkLabel }: {
  title?: string; children: React.ReactNode; href?: string; linkLabel?: string;
}) {
  return <div className={styles.guidance} data-community-guidance><div><strong>{title}</strong><div>{children}</div></div>
    {href && <Link href={href}>{linkLabel ?? "Open execution plans"}</Link>}
  </div>;
}

export function CommunityRoundGuide({ hub, round, href }: {
  hub: `0x${string}`;
  round: { settled: boolean; startTime: bigint; endTime: bigint; winningProposalId: bigint };
  href?: string;
}) {
  const { communityTime, paused } = useCommunityClock(hub);
  const phase = slatePhase(round, communityTime);
  return <div className={styles.roundGuide}>
    <StatusBadge tone={phase.tone}>{phase.label}</StatusBadge>
    <CommunityGuidance href={href} linkLabel="Open Community workspace"><p>{phase.next}</p>
      {paused && <p>Community is paused. Its active-time clock is frozen; actions remain subject to contract checks.</p>}
    </CommunityGuidance>
  </div>;
}
