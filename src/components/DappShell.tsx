import Link from "next/link";
import { FaFlask, FaSearch } from "react-icons/fa";
import { WalletConnectButton } from "@/components/WalletConnectButton";

type NavItem = {
  href: string;
  label: string;
  variant?: "default" | "demo";
};

type DappShellProps = {
  brandHref: string;
  navItems: NavItem[];
  children: React.ReactNode;
  modeLabel?: string;
  showWallet?: boolean;
  searchAction?: string;
};

export function DappShell({
  brandHref,
  navItems,
  children,
  modeLabel,
  showWallet = true,
  searchAction,
}: DappShellProps) {
  const primaryNavItems = navItems.filter((item) => item.variant !== "demo");
  const accentNavItems = navItems.filter((item) => item.variant === "demo");

  return (
    <div className="min-h-screen bg-[#20232f] text-slate-100">
      <div className="mx-auto min-h-screen max-w-[1480px] px-3 pb-10 pt-3 sm:px-4 sm:pb-12 sm:pt-4 md:px-6 xl:px-8">
        <header className="sticky top-3 z-30 rounded-2xl border border-white/10 bg-[#2a2d3b]/95 px-3 py-3 shadow-[0_18px_45px_rgba(0,0,0,0.35)] backdrop-blur sm:top-4 sm:px-4 md:px-5">
          <div className="flex items-center gap-3">
            <Link href={brandHref} className="flex shrink-0 items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_18px_rgba(34,211,238,0.8)]" />
              <span className="font-[var(--font-display)] text-xs uppercase tracking-[0.38em] text-slate-100 sm:text-sm sm:tracking-[0.45em]">
                BERT
              </span>
            </Link>

            {modeLabel ? (
              <span className="rounded-full border border-cyan-300/30 bg-cyan-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-200">
                <span className="inline-flex items-center gap-1.5">
                  <FaFlask className="text-[10px]" />
                  {modeLabel}
                </span>
              </span>
            ) : null}

            <nav className="hidden min-w-0 flex-wrap items-center gap-1 md:flex">
              {primaryNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-lg px-2.5 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-300 transition-colors duration-200 hover:bg-white/5 hover:text-white lg:px-3"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {accentNavItems.length > 0 ? (
              <div className="hidden items-center gap-2 lg:flex">
                {accentNavItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-full border border-cyan-300/35 bg-cyan-500/12 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-200 transition-colors duration-200 hover:bg-cyan-500/18 hover:text-cyan-100"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            ) : null}

            {searchAction ? (
              <form action={searchAction} method="get" className="relative ml-auto hidden max-w-[280px] flex-1 xl:block">
                <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
                <input
                  type="text"
                  name="q"
                  placeholder="Search rounds or ideas"
                  className="w-full rounded-lg border border-white/10 bg-[#1e212d] py-2 pl-8 pr-3 text-sm text-slate-200 outline-none transition-colors focus:border-cyan-400/60"
                />
              </form>
            ) : (
              <div className="ml-auto hidden flex-1 xl:block" />
            )}

            {showWallet ? (
              <div className="ml-auto shrink-0 sm:ml-auto xl:ml-0">
                <WalletConnectButton />
              </div>
            ) : null}
          </div>

          {searchAction ? (
            <form action={searchAction} method="get" className="relative mt-3 xl:hidden">
              <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
              <input
                type="text"
                name="q"
                placeholder="Search rounds or ideas"
                className="w-full rounded-xl border border-white/10 bg-[#1e212d] py-2.5 pl-9 pr-3 text-sm text-slate-200 outline-none transition-colors focus:border-cyan-400/60"
              />
            </form>
          ) : null}

          <div className="mt-3 overflow-x-auto pb-1 no-scrollbar md:hidden">
            <nav className="flex min-w-max gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    item.variant === "demo"
                      ? "rounded-full border border-cyan-300/35 bg-cyan-500/12 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.11em] text-cyan-200 transition-colors duration-200 hover:bg-cyan-500/18 hover:text-cyan-100"
                      : "rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.11em] text-slate-300 transition-colors duration-200 hover:bg-white/10 hover:text-white"
                  }
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        <main className="mt-5 sm:mt-7 md:mt-8">{children}</main>
      </div>
    </div>
  );
}
