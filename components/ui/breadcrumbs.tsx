import Link from "next/link";
import { Fragment } from "react";

export type Crumb = { label: string; href?: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="py-5">
      <ol className="flex flex-wrap items-center gap-2 text-sm">
        {items.map((item, index) => (
          <Fragment key={`${item.label}-${index}`}>
            <li>
              {item.href ? (
                <Link href={item.href} className="text-ink-muted hover:text-ink">
                  {item.label}
                </Link>
              ) : (
                <span aria-current="page" className="text-ink">
                  {item.label}
                </span>
              )}
            </li>
            {index < items.length - 1 ? (
              <li aria-hidden="true" className="text-ink-subtle">
                ›
              </li>
            ) : null}
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}
