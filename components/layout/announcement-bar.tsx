"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";

import { CloseIcon } from "@/components/ui/icons";

const STORAGE_KEY = "shopco:promo-dismissed";

/**
 * Dismissal is per-browser state that lives outside React, so it is read
 * through `useSyncExternalStore` rather than copied into state in an effect.
 * The server snapshot is always "not dismissed", so the bar renders on the
 * server and disappears on hydration only if this browser dismissed it.
 */
const listeners = new Set<() => void>();

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function getSnapshot() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    // Private browsing or blocked storage: keep the bar visible.
    return false;
  }
}

function dismiss() {
  try {
    window.localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // Nothing to persist to; the listeners below still hide it for this visit.
  }
  listeners.forEach((listener) => listener());
}

export function AnnouncementBar() {
  const dismissed = useSyncExternalStore(subscribe, getSnapshot, () => false);

  if (dismissed) return null;

  return (
    <div className="bg-ink text-white">
      <div className="container-page flex items-center justify-center gap-4 py-2.5">
        <p className="text-center text-xs sm:text-sm">
          Use promo code{" "}
          <Link href="/cart?promo=SHOPCO20" className="font-bold underline underline-offset-4">
            SHOPCO20
          </Link>{" "}
          for 20% off your order
        </p>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss announcement"
          className="shrink-0 rounded-full p-1 hover:bg-white/15"
        >
          <CloseIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
