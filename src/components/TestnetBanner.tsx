import Link from "next/link";
import { FaCircleInfo, FaTriangleExclamation } from "react-icons/fa6";

/** Persistent network warning: testnet data and assets must never look production-grade. */
export function TestnetBanner() {
  return (
    <aside className="fixed inset-x-0 top-0 z-[100] h-11 border-y border-amber-300 bg-black text-amber-200 shadow-[0_4px_18px_rgba(0,0,0,0.45)]">
      <div className="mx-auto flex h-full max-w-[1480px] items-center gap-2 px-3 sm:px-4 md:px-6 xl:px-8">
        <FaTriangleExclamation className="shrink-0 text-sm text-amber-300" aria-hidden />
        <p className="min-w-0 flex-1 truncate text-[10px] font-bold uppercase tracking-[0.09em] sm:text-xs sm:tracking-[0.14em]">
          Arc Testnet active · Testnet assets have no monetary value · Protocol under active development
        </p>
        <FaTriangleExclamation className="hidden shrink-0 text-sm text-amber-300 sm:block" aria-hidden />
        <Link href="/testnet-information" className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-300/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-amber-100 transition hover:bg-amber-300 hover:text-black">
          <span className="hidden sm:inline">Testnet guide</span><span className="sm:hidden">Info</span><FaCircleInfo />
        </Link>
      </div>
    </aside>
  );
}
