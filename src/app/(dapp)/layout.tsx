import { DappShell } from "@/components/DappShell";

const navItems = [
  { href: "/app", label: "Dashboard" },
  { href: "/rounds", label: "Rounds" },
  { href: "/ideas", label: "Ideas" },
  { href: "/pool", label: "Pool" },
  { href: "/profile", label: "Profile" },
  { href: "/ideas/new", label: "Create Idea" },
  { href: "/admin", label: "Admin" },
  { href: "/demo", label: "Demo", variant: "demo" as const },
];

export default function DappLayout({ children }: { children: React.ReactNode }) {
  return (
    <DappShell brandHref="/" navItems={navItems} searchAction="/search">
      {children}
    </DappShell>
  );
}
