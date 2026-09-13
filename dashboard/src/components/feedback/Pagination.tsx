import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import clsx from "clsx";

export function Pagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  buildHref,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  buildHref: (page: number) => string;
}) {
  if (totalItems === 0) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="mt-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
      <p className="text-sm text-muted">
        {from} - {to} van {totalItems.toLocaleString("nl-NL")}
      </p>
      <div className="flex items-center gap-1">
        <Link
          href={buildHref(Math.max(1, page - 1))}
          aria-disabled={page === 1}
          className={clsx(
            "flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted hover:text-foreground",
            page === 1 && "pointer-events-none opacity-40"
          )}
        >
          <ChevronLeft size={15} />
        </Link>
        {pages.map((p) => (
          <Link
            key={p}
            href={buildHref(p)}
            className={clsx(
              "flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-medium",
              p === page ? "border border-brand text-brand" : "text-muted hover:text-foreground"
            )}
          >
            {p}
          </Link>
        ))}
        <Link
          href={buildHref(Math.min(totalPages, page + 1))}
          aria-disabled={page === totalPages}
          className={clsx(
            "flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted hover:text-foreground",
            page === totalPages && "pointer-events-none opacity-40"
          )}
        >
          <ChevronRight size={15} />
        </Link>
      </div>
    </div>
  );
}
