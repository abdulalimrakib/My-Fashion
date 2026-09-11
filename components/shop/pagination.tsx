import Link from "next/link";

import { ChevronRightIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

type Props = {
  page: number;
  pageCount: number;
  /** Called with a page number to produce its href. */
  buildHref: (page: number) => string;
};

/** Link-based so pagination works without JavaScript and is crawlable. */
export function Pagination({ page, pageCount, buildHref }: Props) {
  if (pageCount <= 1) return null;

  const pages = Array.from({ length: pageCount }, (_, i) => i + 1).filter(
    (n) => n === 1 || n === pageCount || Math.abs(n - page) <= 1,
  );

  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-4 border-t border-line pt-5">
      {page > 1 ? (
        <Link
          href={buildHref(page - 1)}
          rel="prev"
          className="flex min-h-11 items-center gap-2 rounded-full border border-line-strong px-4 text-sm"
        >
          <ChevronRightIcon className="h-4 w-4 rotate-180" />
          Previous
        </Link>
      ) : (
        <span aria-hidden="true" className="min-h-11 w-24" />
      )}

      <ul className="flex items-center gap-1">
        {pages.map((n, index) => (
          <li key={n} className="flex items-center gap-1">
            {index > 0 && n - pages[index - 1] > 1 ? (
              <span className="px-1 text-ink-subtle" aria-hidden="true">
                …
              </span>
            ) : null}
            <Link
              href={buildHref(n)}
              aria-current={n === page ? "page" : undefined}
              aria-label={`Page ${n}`}
              className={cn(
                "flex h-10 min-w-10 items-center justify-center rounded-lg px-2 text-sm",
                n === page ? "bg-surface-muted font-medium text-ink" : "text-ink-muted hover:bg-surface-muted",
              )}
            >
              {n}
            </Link>
          </li>
        ))}
      </ul>

      {page < pageCount ? (
        <Link
          href={buildHref(page + 1)}
          rel="next"
          className="flex min-h-11 items-center gap-2 rounded-full border border-line-strong px-4 text-sm"
        >
          Next
          <ChevronRightIcon className="h-4 w-4" />
        </Link>
      ) : (
        <span aria-hidden="true" className="min-h-11 w-24" />
      )}
    </nav>
  );
}
