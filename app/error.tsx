"use client";

import { useEffect } from "react";

import { Button, ButtonLink } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surfaced in the server logs in production; the digest ties the two together.
    console.error("Unhandled route error", error);
  }, [error]);

  return (
    <div className="container-page flex flex-col items-center gap-6 py-20 text-center">
      <div className="space-y-3">
        <h1 className="font-display text-3xl uppercase sm:text-4xl">Something went wrong</h1>
        <p className="mx-auto max-w-md text-sm text-ink-muted sm:text-base">
          We hit an unexpected error loading this page. Trying again usually clears it.
        </p>
        {error.digest ? (
          <p className="font-mono text-xs text-ink-subtle">Reference: {error.digest}</p>
        ) : null}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button size="lg" onClick={reset}>
          Try again
        </Button>
        <ButtonLink href="/" variant="secondary" size="lg">
          Back to home
        </ButtonLink>
      </div>
    </div>
  );
}
