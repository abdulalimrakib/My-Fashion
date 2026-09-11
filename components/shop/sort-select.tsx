"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { SORT_OPTIONS } from "@/lib/constants";

export function SortSelect({ value }: { value: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  return (
    <div className="flex items-center gap-2 text-sm text-ink-muted">
      <label htmlFor="sort" className="hidden sm:inline">
        Sort by:
      </label>
      <select
        id="sort"
        value={value}
        onChange={(event) => {
          const next = new URLSearchParams(params.toString());
          if (event.target.value === "featured") next.delete("sort");
          else next.set("sort", event.target.value);
          next.delete("page");
          const query = next.toString();
          router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
        }}
        className="min-h-11 rounded-full bg-transparent py-1 pr-2 font-medium text-ink outline-none"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
