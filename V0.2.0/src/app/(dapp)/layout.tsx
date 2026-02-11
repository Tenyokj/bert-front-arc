import Link from "next/link";
import { FaSearch } from "react-icons/fa";
import { WalletConnectButton } from "@/components/WalletConnectButton";

const navItems = [
  { href: "/rounds", label: "Rounds" },
  { href: "/ideas", label: "Ideas" },
  { href: "/pool", label: "Pool" },
  { href: "/profile", label: "Profile" },
  { href: "/ideas/new", label: "Create Idea" },
  { href: "/admin", label: "Admin" },
];

export default function DappLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#20232f] text-slate-100">
      <div className="mx-auto min-h-screen max-w-[1200px] px-4 pb-12 pt-4 md:px-6">
        <header className="sticky top-4 z-30 rounded-2xl border border-white/10 bg-[#2a2d3b]/95 px-4 py-3 shadow-[0_18px_45px_rgba(0,0,0,0.35)] backdrop-blur md:px-5">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex shrink-0 items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_18px_rgba(34,211,238,0.8)]" />
              <span className="font-[var(--font-display)] text-sm uppercase tracking-[0.45em] text-slate-100">BERT</span>
            </Link>

            <nav className="hidden items-center gap-1 md:flex">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-[0.11em] text-slate-300 transition-colors duration-200 hover:bg-white/5 hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <form action="/search" method="get" className="relative ml-auto hidden max-w-[340px] flex-1 lg:block">
              <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
              <input
                type="text"
                name="q"
                placeholder="Search rounds or ideas"
                className="w-full rounded-lg border border-white/10 bg-[#1e212d] py-2 pl-8 pr-3 text-sm text-slate-200 outline-none transition-colors focus:border-cyan-400/60"
              />
            </form>

            <WalletConnectButton />
          </div>
        </header>

        <main className="mt-8">{children}</main>
      </div>
    </div>
  );
}
