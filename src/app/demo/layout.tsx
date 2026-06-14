import { DappShell } from "@/components/DappShell";

const navItems = [
  { href: "/demo", label: "Dashboard" },
  { href: "/demo/rounds", label: "Rounds" },
  { href: "/demo/ideas", label: "Ideas" },
  { href: "/demo/pool", label: "Pool" },
  { href: "/demo/profile", label: "Profile" },
  { href: "/app", label: "Live App", variant: "demo" as const },
];

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <DappShell
      brandHref="/"
      navItems={navItems}
      modeLabel="Demo mode"
      showWallet={false}
      searchAction="/demo/search"
    >
      {children}
    </DappShell>
  );
}
