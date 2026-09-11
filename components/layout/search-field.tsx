"use client";

import { useSearchParams } from "next/navigation";

import { SearchIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

type Props = {
  className?: string;
  id?: string;
};

/**
 * A plain GET form pointed at /search, so searching works with or without
 * JavaScript. It is a Client Component only to seed the box with the current
 * query, which a shared header cannot read on the server.
 */
export function SearchField({ className, id = "site-search" }: Props) {
  const params = useSearchParams();

  return (
    <form
      role="search"
      action="/search"
      method="get"
      className={cn(
        "flex w-full items-center gap-3 rounded-full bg-surface-muted px-4 py-2.5",
        className,
      )}
    >
      <label htmlFor={id} className="sr-only">
        Search for products
      </label>
      <button type="submit" aria-label="Search" className="shrink-0 text-ink-subtle">
        <SearchIcon className="h-5 w-5" />
      </button>
      <input
        id={id}
        name="q"
        type="search"
        defaultValue={params.get("q") ?? ""}
        placeholder="Search for products..."
        className="w-full bg-transparent text-sm outline-none placeholder:text-ink-subtle"
      />
    </form>
  );
}
