import Link from "next/link";
import { FaArrowRight, FaCompass, FaMagnifyingGlass, FaPlus, FaUser, FaUsers } from "react-icons/fa6";

const links = [
  { href: "/v3", label: "Overview", icon: FaCompass },
  { href: "/v3/communities", label: "Communities", icon: FaUsers },
  { href: "/v3/create", label: "Create", icon: FaPlus },
  { href: "/v3/search", label: "Search", icon: FaMagnifyingGlass },
  { href: "/v3/profile", label: "Profile", icon: FaUser },
];

/** V3-local navigation keeps Community Layer workflows separate from BERT V2. */
export function V3Navigation() {
  return (
    <div className="flex flex-col gap-3 rounded-[24px] border border-cyan-300/15 bg-[linear-gradient(110deg,rgba(8,47,73,0.45),rgba(42,45,59,0.9))] p-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
      <div className="flex items-center gap-3 px-2 py-1">
        <span className="h-2.5 w-2.5 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,0.9)]" />
        <div><p className="text-[10px] font-bold uppercase tracking-[0.26em] text-cyan-200">BERT V3</p><p className="text-sm font-semibold text-white">Community Layer</p></div>
      </div>
      <nav className="flex min-w-0 gap-1 overflow-x-auto pb-1 no-scrollbar sm:pb-0">
        {links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className="inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"><Icon className="text-cyan-200" />{label}</Link>)}
      </nav>
      <Link href="/app" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-white/20 hover:text-white">V2 dApp <FaArrowRight /></Link>
    </div>
  );
}
