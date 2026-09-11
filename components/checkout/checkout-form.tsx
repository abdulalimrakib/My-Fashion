"use client";

import { useActionState } from "react";

import { placeOrder } from "@/lib/actions/checkout";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { emptyFormState } from "@/lib/validation";

type Props = {
  promoCode: string;
  defaults: { fullName: string; email: string };
};

export function CheckoutForm({ promoCode, defaults }: Props) {
  const [state, formAction, pending] = useActionState(placeOrder, emptyFormState);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="promoCode" value={promoCode} />

      <fieldset className="space-y-5">
        <legend className="mb-4 text-xl font-bold">Contact details</legend>
        <Field label="Full name" htmlFor="fullName" error={state.fieldErrors?.fullName}>
          <Input
            id="fullName"
            name="fullName"
            required
            autoComplete="name"
            defaultValue={defaults.fullName}
          />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Email" htmlFor="email" error={state.fieldErrors?.email}>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              defaultValue={defaults.email}
            />
          </Field>
          <Field label="Phone number" htmlFor="phone" error={state.fieldErrors?.phone}>
            <Input id="phone" name="phone" type="tel" required autoComplete="tel" />
          </Field>
        </div>
      </fieldset>

      <fieldset className="space-y-5 border-t border-line pt-6">
        <legend className="mb-4 text-xl font-bold">Delivery address</legend>
        <Field label="Address" htmlFor="address1" error={state.fieldErrors?.address1}>
          <Input id="address1" name="address1" required autoComplete="address-line1" />
        </Field>
        <Field
          label="Apartment, suite (optional)"
          htmlFor="address2"
          error={state.fieldErrors?.address2}
        >
          <Input id="address2" name="address2" autoComplete="address-line2" />
        </Field>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="City" htmlFor="city" error={state.fieldErrors?.city}>
            <Input id="city" name="city" required autoComplete="address-level2" />
          </Field>
          <Field label="Postal code" htmlFor="postalCode" error={state.fieldErrors?.postalCode}>
            <Input id="postalCode" name="postalCode" required autoComplete="postal-code" />
          </Field>
          <Field label="Country" htmlFor="country" error={state.fieldErrors?.country}>
            <Input id="country" name="country" required autoComplete="country-name" />
          </Field>
        </div>
      </fieldset>

      <div className="space-y-4 border-t border-line pt-6">
        <div className="rounded-2xl bg-surface-muted px-5 py-4 text-sm text-ink-muted">
          <p className="font-medium text-ink">Payment</p>
          <p className="mt-1">
            No payment provider is connected to this storefront, so no card details are collected.
            Placing the order records it against your account with the status{" "}
            <span className="font-medium text-ink">Pending</span>.
          </p>
        </div>

        {state.message && !state.ok ? (
          <p role="alert" className="rounded-2xl bg-sale-soft px-4 py-3 text-sm text-sale">
            {state.message}
          </p>
        ) : null}

        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? "Placing order…" : "Place order"}
        </Button>
      </div>
    </form>
  );
}
