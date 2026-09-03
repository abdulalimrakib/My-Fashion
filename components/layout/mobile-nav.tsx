"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { SearchField } from "@/components/layout/search-field";
import { CloseIcon, MenuIcon } from "@/components/ui/icons";
import { PRIMARY_NAV } from "@/lib/constants";

type Props = { isSignedIn: boolean };

export function MobileNav({ isSignedIn }: Props) {
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // The drawer records the route it was opened on, so navigating away closes it
  // as derived state rather than through an effect that chases `pathname`.
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const open = openedOn === pathname;
  const setOpen = useCallback(
    (next: boolean) => setOpenedOn(next ? pathname : null),
    [pathname],
  );

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;

      // Keep focus inside the drawer while it is open.
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>("button, a")?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, setOpen]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        className="-ml-1 rounded-full p-2 text-ink hover:bg-surface-muted lg:hidden"
      >
        <MenuIcon className="h-6 w-6" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-ink/40"
          />
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            className="absolute inset-y-0 left-0 flex w-[min(20rem,85vw)] flex-col gap-8 overflow-y-auto bg-surface p-6"
          >
            <div className="flex items-center justify-between">
              <span className="font-display text-xl uppercase">Shop.co</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="rounded-full p-2 hover:bg-surface-muted"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>

            <SearchField id="mobile-search" />

            <nav aria-label="Main">
              <ul className="flex flex-col gap-1">
                {PRIMARY_NAV.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="block rounded-lg px-3 py-3 text-base font-medium hover:bg-surface-muted"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="mt-auto border-t border-line pt-6">
              <ul className="flex flex-col gap-1">
                <li>
                  <Link href="/wishlist" className="block rounded-lg px-3 py-3 text-sm hover:bg-surface-muted">
                    Wishlist
                  </Link>
                </li>
                <li>
                  <Link
                    href={isSignedIn ? "/account" : "/login"}
                    className="block rounded-lg px-3 py-3 text-sm hover:bg-surface-muted"
                  >
                    {isSignedIn ? "My account" : "Sign in"}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
