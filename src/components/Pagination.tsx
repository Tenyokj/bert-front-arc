import Link from "next/link";

type PaginationProps = {
  basePath: string;
  currentPage: number;
  totalItems: number;
  pageSize: number;
};

export function Pagination({ basePath, currentPage, totalItems, pageSize }: PaginationProps) {
  const totalPages = Math.ceil(totalItems / pageSize);

  if (totalPages <= 1) {
    return null;
  }

  const clampedCurrent = Math.min(Math.max(currentPage, 1), totalPages);
  const prevPage = clampedCurrent - 1;
  const nextPage = clampedCurrent + 1;

  const pageHref = (page: number) => {
    return page <= 1 ? basePath : `${basePath}?page=${page}`;
  };

  return (
    <nav className="mt-6 flex items-center justify-center gap-2" aria-label="Pagination">
      {clampedCurrent > 1 ? (
        <Link
          href={pageHref(prevPage)}
          className="rounded-md border border-white/15 bg-[#2a2d3b] px-3 py-1.5 text-sm font-semibold text-slate-200 transition-colors hover:border-cyan-400/50"
        >
          {"<"}
        </Link>
      ) : (
        <span className="rounded-md border border-white/10 bg-[#262938] px-3 py-1.5 text-sm font-semibold text-slate-500">{"<"}</span>
      )}

      {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
        <Link
          key={page}
          href={pageHref(page)}
          className={`rounded-md border px-3 py-1.5 text-sm font-semibold transition-colors ${
            page === clampedCurrent
              ? "border-cyan-400/60 bg-cyan-500/15 text-cyan-200"
              : "border-white/15 bg-[#2a2d3b] text-slate-200 hover:border-cyan-400/50"
          }`}
        >
          {page}
        </Link>
      ))}

      {clampedCurrent < totalPages ? (
        <Link
          href={pageHref(nextPage)}
          className="rounded-md border border-white/15 bg-[#2a2d3b] px-3 py-1.5 text-sm font-semibold text-slate-200 transition-colors hover:border-cyan-400/50"
        >
          {">"}
        </Link>
      ) : (
        <span className="rounded-md border border-white/10 bg-[#262938] px-3 py-1.5 text-sm font-semibold text-slate-500">{">"}</span>
      )}
    </nav>
  );
}
