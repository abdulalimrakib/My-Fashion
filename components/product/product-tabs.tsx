"use client";

import { useState, type ReactNode } from "react";

import { cn } from "@/lib/cn";

type Tab = { id: string; label: string; content: ReactNode };

export function ProductTabs({ tabs }: { tabs: Tab[] }) {
  const [active, setActive] = useState(tabs[0]?.id);

  return (
    <div>
      <div role="tablist" aria-label="Product information" className="flex border-b border-line">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={active === tab.id}
            aria-controls={`panel-${tab.id}`}
            tabIndex={active === tab.id ? 0 : -1}
            onClick={() => setActive(tab.id)}
            onKeyDown={(event) => {
              const index = tabs.findIndex((t) => t.id === active);
              if (event.key === "ArrowRight") setActive(tabs[(index + 1) % tabs.length].id);
              if (event.key === "ArrowLeft") {
                setActive(tabs[(index - 1 + tabs.length) % tabs.length].id);
              }
            }}
            className={cn(
              "flex-1 px-2 py-4 text-sm transition-colors sm:text-base",
              active === tab.id
                ? "-mb-px border-b-2 border-ink font-medium text-ink"
                : "text-ink-muted hover:text-ink",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`panel-${tab.id}`}
          aria-labelledby={`tab-${tab.id}`}
          hidden={active !== tab.id}
          className="py-8"
        >
          {active === tab.id ? tab.content : null}
        </div>
      ))}
    </div>
  );
}
