"use client";

export function RecordPager({ label, page, pages, count, size, onPage }: {
  label: string; page: number; pages: number; count: number; size: number; onPage: (page: number) => void;
}) {
  return <nav aria-label={`${label} pages`} className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
    <span>{count} loaded records / {size} per page / Page {page} of {pages}</span>
    <div className="flex gap-3">
      <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} className="rounded-lg border border-white/15 px-3 py-2 disabled:opacity-40">Previous {label.toLowerCase()}</button>
      <button type="button" disabled={page >= pages} onClick={() => onPage(page + 1)} className="rounded-lg border border-white/15 px-3 py-2 disabled:opacity-40">Next {label.toLowerCase()}</button>
    </div>
  </nav>;
}
