"use client";

import dynamic from "next/dynamic";

const HeroLogo3D = dynamic(() => import("@/components/HeroLogo3D"), {
  ssr: false,
});

export default function HeroLogo3DClient(props: { className?: string; paused?: boolean; framing?: "default" | "immersive" }) {
  return <HeroLogo3D {...props} />;
}
