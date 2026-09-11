"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { MonitorIcon, MoonIcon, SunIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

/** Never fires: "have we hydrated yet" is not a value that can change again. */
const subscribeToNothing = () => () => {};

/**
 * Order of the cycle. `system` sits last so a first tap moves to an explicit
 * choice rather than back to "whatever the OS says".
 */
const CYCLE = [
  { value: "light", label: "Light", Icon: SunIcon },
  { value: "dark", label: "Dark", Icon: MoonIcon },
  { value: "system", label: "System", Icon: MonitorIcon },
] as const;

type Props = {
  /** Renders as a full-width labelled row for the mobile drawer. */
  showLabel?: boolean;
  className?: string;
};

export function ThemeToggle({ showLabel = false, className }: Props) {
  const { theme, setTheme } = useTheme();

  // The stored preference lives in `localStorage`, which the server cannot
  // read, so `theme` is undefined until the client takes over. Rendering the
  // real icon before that would disagree with the server's markup, so the
  // button stays inert for the first paint — it needs JS to do anything
  // regardless.
  //
  // Read as a store rather than a `useState` + `useEffect` pair: that is the
  // hydration-safe form React intends, and the lint config rejects setting
  // state from an effect.
  const mounted = useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );

  const index = CYCLE.findIndex((option) => option.value === theme);
  const currentIndex = index === -1 ? CYCLE.length - 1 : index;
  const current = CYCLE[currentIndex];
  const next = CYCLE[(currentIndex + 1) % CYCLE.length];

  const classes = cn(
    showLabel
      ? "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm hover:bg-surface-muted"
      : "rounded-full p-2 text-ink hover:bg-surface-muted",
    className,
  );
  const iconClasses = showLabel ? "h-5 w-5 shrink-0" : "h-6 w-6";

  if (!mounted) {
    // Same box, no glyph — holds the layout without asserting a theme.
    return (
      <button type="button" disabled aria-hidden="true" className={classes}>
        <span className={cn(iconClasses, "block")} />
        {showLabel ? <span className="flex-1" /> : null}
      </button>
    );
  }

  const Icon = current.Icon;

  return (
    <button
      type="button"
      onClick={() => setTheme(next.value)}
      // A cycling button hides its next state, so both the current setting and
      // what pressing it does are spelled out.
      aria-label={`Theme: ${current.label}. Switch to ${next.label.toLowerCase()}.`}
      title={`Theme: ${current.label}`}
      className={classes}
    >
      <Icon className={cn(iconClasses, showLabel && "text-ink-muted")} />
      {showLabel ? (
        <>
          <span className="flex-1 text-left">Theme</span>
          <span className="text-ink-muted">{current.label}</span>
        </>
      ) : null}
    </button>
  );
}
