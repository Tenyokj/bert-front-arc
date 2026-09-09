"use client";

/** Compact client-side pager for bounded Community Layer lists. */
export function ClientPagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
}: {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const page = Math.min(Math.max(1, currentPage), totalPages);
  if (totalPages <= 1) return null;

  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const end = Math.min(totalPages, start + 4);
  const pages = Array.from({ length: end - start + 1 }, (_, index) => start + index);

  return <nav className="mt-6 flex flex-wrap items-center justify-center gap-2" aria-label="List pagination">
    <button type="button" disabled={page === 1} onClick={() => onPageChange(page - 1)} className="rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 disabled:opacity-40">Previous</button>
    {start > 1 ? <><button type="button" onClick={() => onPageChange(1)} className="rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300">1</button><span className="px-1 text-slate-500">...</span></> : null}
    {pages.map((item) => <button type="button" key={item} onClick={() => onPageChange(item)} className={item === page ? "rounded-lg bg-cyan-300 px-3 py-2 text-sm font-bold text-slate-950" : "rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300"}>{item}</button>)}
    {end < totalPages ? <><span className="px-1 text-slate-500">...</span><button type="button" onClick={() => onPageChange(totalPages)} className="rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300">{totalPages}</button></> : null}
    <button type="button" disabled={page === totalPages} onClick={() => onPageChange(page + 1)} className="rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 disabled:opacity-40">Next</button>
  </nav>;
}
