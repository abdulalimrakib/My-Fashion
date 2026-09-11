"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { submitReview } from "@/lib/actions/review";
import { Button } from "@/components/ui/button";
import { emptyFormState } from "@/lib/validation";
import { cn } from "@/lib/cn";

type Props = { slug: string; isSignedIn: boolean };

export function ReviewForm({ slug, isSignedIn }: Props) {
  const [state, formAction, pending] = useActionState(submitReview, emptyFormState);
  const [rating, setRating] = useState(5);

  if (!isSignedIn) {
    return (
      <p className="rounded-2xl border border-line px-6 py-8 text-center text-sm text-ink-muted">
        <Link
          href={`/login?next=${encodeURIComponent(`/product/${slug}`)}&reason=review`}
          className="font-medium text-ink underline underline-offset-4"
        >
          Sign in
        </Link>{" "}
        to write a review.
      </p>
    );
  }

  if (state.ok) {
    return (
      <p role="status" className="rounded-2xl border border-line px-6 py-8 text-center text-sm text-positive">
        {state.message}
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-line p-6">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="rating" value={rating} />

      <fieldset>
        <legend className="mb-2 text-sm font-medium">Your rating</legend>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              aria-label={`${value} star${value === 1 ? "" : "s"}`}
              aria-pressed={rating === value}
              className={cn(
                "text-2xl leading-none transition-colors",
                value <= rating ? "text-star" : "text-line-strong",
              )}
            >
              ★
            </button>
          ))}
        </div>
        {state.fieldErrors?.rating ? (
          <p role="alert" className="mt-1 text-xs text-sale">
            {state.fieldErrors.rating}
          </p>
        ) : null}
      </fieldset>

      <div className="space-y-1.5">
        <label htmlFor="review-body" className="block text-sm font-medium">
          Your review
        </label>
        <textarea
          id="review-body"
          name="body"
          rows={4}
          required
          minLength={10}
          maxLength={1000}
          placeholder="What did you think of the fit, fabric and quality?"
          aria-invalid={Boolean(state.fieldErrors?.body)}
          className="w-full rounded-2xl bg-surface-muted px-4 py-3 text-sm outline-none placeholder:text-ink-subtle"
        />
        {state.fieldErrors?.body ? (
          <p role="alert" className="text-xs text-sale">
            {state.fieldErrors.body}
          </p>
        ) : null}
      </div>

      {state.message && !state.ok ? (
        <p role="alert" className="text-sm text-sale">
          {state.message}
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Publishing…" : "Publish review"}
      </Button>
    </form>
  );
}
