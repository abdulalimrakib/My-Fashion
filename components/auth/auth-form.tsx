"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { emptyFormState, type FormState } from "@/lib/validation";

type Props = {
  mode: "login" | "register";
  next: string;
  action: (prev: FormState, data: FormData) => Promise<FormState>;
};

export function AuthForm({ mode, next, action }: Props) {
  const [state, formAction, pending] = useActionState(action, emptyFormState);
  const isRegister = mode === "register";

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="next" value={next} />

      {isRegister ? (
        <Field label="Name" htmlFor="name" error={state.fieldErrors?.name}>
          <Input
            id="name"
            name="name"
            required
            autoComplete="name"
            placeholder="Alex Morgan"
            aria-invalid={Boolean(state.fieldErrors?.name)}
          />
        </Field>
      ) : null}

      <Field label="Email" htmlFor="email" error={state.fieldErrors?.email}>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          aria-invalid={Boolean(state.fieldErrors?.email)}
        />
      </Field>

      <Field
        label="Password"
        htmlFor="password"
        error={state.fieldErrors?.password}
        hint={isRegister ? "At least 8 characters." : undefined}
      >
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={isRegister ? 8 : undefined}
          autoComplete={isRegister ? "new-password" : "current-password"}
          aria-invalid={Boolean(state.fieldErrors?.password)}
        />
      </Field>

      {isRegister ? (
        <Field
          label="Confirm password"
          htmlFor="confirmPassword"
          error={state.fieldErrors?.confirmPassword}
        >
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            autoComplete="new-password"
            aria-invalid={Boolean(state.fieldErrors?.confirmPassword)}
          />
        </Field>
      ) : null}

      {state.message ? (
        <p role="alert" className="rounded-2xl bg-sale-soft px-4 py-3 text-sm text-sale">
          {state.message}
        </p>
      ) : null}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Please wait…" : isRegister ? "Create account" : "Sign in"}
      </Button>

      <p className="text-center text-sm text-ink-muted">
        {isRegister ? "Already have an account? " : "New to SHOP.CO? "}
        <Link
          href={`${isRegister ? "/login" : "/register"}?next=${encodeURIComponent(next)}`}
          className="font-medium text-ink underline underline-offset-4"
        >
          {isRegister ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </form>
  );
}
