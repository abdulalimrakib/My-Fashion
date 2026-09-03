"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { signOut } from "@/lib/actions/auth";
import { UserIcon } from "@/components/ui/icons";
import type { SessionUser } from "@/lib/auth";

export function AccountMenu({ user }: { user: SessionUser | null }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!user) {
    return (
      <Link
        href="/login"
        aria-label="Sign in"
        className="rounded-full p-2 text-ink hover:bg-surface-muted"
      >
        <UserIcon className="h-6 w-6" />
      </Link>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Account menu for ${user.name ?? user.email}`}
        className="rounded-full p-2 text-ink hover:bg-surface-muted"
      >
        <UserIcon className="h-6 w-6" />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-line bg-surface py-2 shadow-lg"
        >
          <p className="truncate px-4 py-2 text-xs text-ink-muted">
            Signed in as <span className="font-medium text-ink">{user.name ?? user.email}</span>
          </p>
          <Link
            role="menuitem"
            href="/account"
            className="block px-4 py-2.5 text-sm hover:bg-surface-muted"
          >
            My account
          </Link>
          <Link
            role="menuitem"
            href="/account/orders"
            className="block px-4 py-2.5 text-sm hover:bg-surface-muted"
          >
            My orders
          </Link>
          <Link
            role="menuitem"
            href="/wishlist"
            className="block px-4 py-2.5 text-sm hover:bg-surface-muted"
          >
            Wishlist
          </Link>
          <form action={signOut}>
            <button
              role="menuitem"
              type="submit"
              className="w-full px-4 py-2.5 text-left text-sm text-sale hover:bg-surface-muted"
            >
              Sign out
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
