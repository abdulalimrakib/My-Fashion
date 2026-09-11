"use client";

import { useActionState } from "react";

import { subscribeToNewsletter } from "@/lib/actions/newsletter";
import { MailIcon } from "@/components/ui/icons";
import { emptyFormState } from "@/lib/validation";

export function NewsletterForm() {
  const [state, formAction, pending] = useActionState(subscribeToNewsletter, emptyFormState);

  return (
    <div className="w-full max-w-md space-y-3">
      <form action={formAction} className="space-y-3">
        <div className="flex items-center gap-2 rounded-full bg-surface px-4 py-3">
          <MailIcon className="h-5 w-5 shrink-0 text-ink-subtle" />
          <label htmlFor="newsletter-email" className="sr-only">
            Email address
          </label>
          <input
            id="newsletter-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="Enter your email address"
            aria-describedby={state.message ? "newsletter-status" : undefined}
            className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-subtle"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-surface px-6 py-3 text-sm font-medium text-ink transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Subscribing…" : "Subscribe to Newsletter"}
        </button>
      </form>

      {state.message ? (
        <p
          id="newsletter-status"
          role="status"
          className={state.ok ? "text-sm text-on-ink" : "text-sm text-sale-on-ink"}
        >
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
