import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/cn";

export const inputClasses =
  "w-full rounded-full bg-surface-muted px-4 py-3 text-sm text-ink " +
  "placeholder:text-ink-subtle outline-none";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(inputClasses, className)} {...props} />;
}

type FieldProps = {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: ReactNode;
  children: ReactNode;
};

/** Pairs a visible label and an error message with a control, wired by id. */
export function Field({ label, htmlFor, error, hint, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-ink">
        {label}
      </label>
      {children}
      {hint && !error ? <p className="text-xs text-ink-muted">{hint}</p> : null}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="text-xs font-medium text-sale">
          {error}
        </p>
      ) : null}
    </div>
  );
}
