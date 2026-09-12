"use client";

import { useActionState, useId, useMemo, useState } from "react";

import { VariantImageField } from "@/components/admin/variant-image-field";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { CheckIcon, CloseIcon } from "@/components/ui/icons";
import { emptyFormState, type FormState } from "@/lib/validation";
import { formatPrice } from "@/lib/format";
import {
  hasErrors,
  parsePriceToCents,
  variantColorField,
  variantImageField,
  type CatalogueReference,
  type FieldErrors,
} from "@/lib/admin/product-input";
import {
  addVariant,
  draftToInput,
  emptyDraft,
  nextAvailableColorId,
  removeVariant,
  setVariantColor,
  setVariantImage,
  STEPS,
  STEP_LABELS,
  validateStep,
  type ProductDraft,
  type Step,
} from "@/lib/admin/product-draft";
import type { CatalogueOptions } from "@/lib/admin/product-service";
import { cn } from "@/lib/cn";

type Props = {
  options: CatalogueOptions;
  action: (state: FormState, data: FormData) => Promise<FormState>;
  /** Present when editing; sent back so the action knows what to update. */
  productId?: string;
  initialDraft?: ProductDraft;
  submitLabel: string;
  cancelHref: string;
};

export function ProductForm({
  options,
  action,
  productId,
  initialDraft,
  submitLabel,
  cancelHref,
}: Props) {
  const [draft, setDraft] = useState<ProductDraft>(() => initialDraft ?? emptyDraft());
  const [step, setStep] = useState<Step>("details");
  const [clientErrors, setClientErrors] = useState<FieldErrors>({});
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});
  const [state, formAction, pending] = useActionState(action, emptyFormState);

  const fieldId = useId();

  const catalogue = useMemo<CatalogueReference>(
    () => ({
      categoryIds: new Set(options.categories.map((c) => c.id)),
      colorNames: new Map(options.colors.map((c) => [c.id, c.name])),
      sizeIds: new Set(options.sizes.map((s) => s.id)),
      styleIds: new Set(options.styles.map((s) => s.id)),
    }),
    [options],
  );

  // The server's answer and the form's own checks share one map, so a field
  // shows whichever complaint arrived last.
  const errors: FieldErrors = { ...state.fieldErrors, ...clientErrors };

  function update(changes: Partial<ProductDraft>, clearFields: string[] = []) {
    setDraft((current) => ({ ...current, ...changes }));
    if (clearFields.length) {
      setClientErrors((current) => {
        const next = { ...current };
        for (const field of clearFields) delete next[field];
        return next;
      });
    }
  }

  function goTo(target: Step) {
    const currentIndex = STEPS.indexOf(step);
    const targetIndex = STEPS.indexOf(target);

    // Going back never validates; going forward checks every step in between.
    if (targetIndex <= currentIndex) {
      setClientErrors({});
      setStep(target);
      return;
    }

    for (const intermediate of STEPS.slice(currentIndex, targetIndex)) {
      const stepErrors = validateStep(intermediate, draft, catalogue);
      if (hasErrors(stepErrors)) {
        setClientErrors(stepErrors);
        setStep(intermediate);
        return;
      }
    }

    setClientErrors({});
    setStep(target);
  }

  const colorById = new Map(options.colors.map((color) => [color.id, color]));
  const categoryName = options.categories.find((c) => c.id === draft.categoryId)?.name;
  const priceCents = parsePriceToCents(draft.price);
  const remainingColor = nextAvailableColorId(draft, options.colors);

  const input = draftToInput(draft);
  const reviewErrors = validateStep("review", draft, catalogue);
  const readyToSubmit = !hasErrors(reviewErrors);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        // The submit button only exists on the review step, but a stray Enter
        // key anywhere else would still post the form.
        const blocking = validateStep("review", draft, catalogue);
        if (hasErrors(blocking)) {
          event.preventDefault();
          setClientErrors(blocking);
          setStep(hasErrors(validateStep("details", draft, catalogue)) ? "details" : "colors");
        }
      }}
      className="space-y-8"
    >
      {productId ? <input type="hidden" name="productId" value={productId} /> : null}
      <input type="hidden" name="variants" value={JSON.stringify(input.variants)} />

      <Stepper current={step} onSelect={goTo} />

      {/* Panels stay mounted so their native inputs are still part of the
          submitted FormData, and so going back never loses what was typed. */}
      <section hidden={step !== "details"} className="space-y-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Product name" htmlFor={`${fieldId}-name`} error={errors.name}>
              <Input
                id={`${fieldId}-name`}
                name="name"
                value={draft.name}
                maxLength={120}
                placeholder="Classic T-Shirt"
                aria-invalid={Boolean(errors.name)}
                onChange={(e) => update({ name: e.target.value }, ["name"])}
              />
            </Field>
          </div>

          <Field label="Category" htmlFor={`${fieldId}-category`} error={errors.categoryId}>
            <Select
              id={`${fieldId}-category`}
              name="categoryId"
              value={draft.categoryId}
              aria-invalid={Boolean(errors.categoryId)}
              onChange={(e) => update({ categoryId: e.target.value }, ["categoryId"])}
            >
              <option value="">Choose a category…</option>
              {options.categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Price (USD)"
            htmlFor={`${fieldId}-price`}
            error={errors.price}
            hint="What the shopper pays, for example 120 or 99.50."
          >
            <Input
              id={`${fieldId}-price`}
              name="price"
              inputMode="decimal"
              value={draft.price}
              placeholder="120"
              aria-invalid={Boolean(errors.price)}
              onChange={(e) => update({ price: e.target.value }, ["price"])}
            />
          </Field>

          <Field
            label="Original price (optional)"
            htmlFor={`${fieldId}-compare`}
            error={errors.compareAtPrice}
            hint="Set this to put the product on sale. The discount badge is derived from it."
          >
            <Input
              id={`${fieldId}-compare`}
              name="compareAtPrice"
              inputMode="decimal"
              value={draft.compareAtPrice}
              placeholder="160"
              aria-invalid={Boolean(errors.compareAtPrice)}
              onChange={(e) => update({ compareAtPrice: e.target.value }, ["compareAtPrice"])}
            />
          </Field>

          <div className="sm:col-span-2">
            <Field
              label="Short description"
              htmlFor={`${fieldId}-description`}
              error={errors.description}
              hint="One or two sentences, shown under the product title."
            >
              <Textarea
                id={`${fieldId}-description`}
                name="description"
                rows={3}
                maxLength={500}
                value={draft.description}
                aria-invalid={Boolean(errors.description)}
                onChange={(e) => update({ description: e.target.value }, ["description"])}
              />
            </Field>
          </div>

          <div className="sm:col-span-2">
            <Field
              label="Full details"
              htmlFor={`${fieldId}-details`}
              error={errors.details}
              hint="Fabric, fit and care. Shown in the Product Details tab."
            >
              <Textarea
                id={`${fieldId}-details`}
                name="details"
                rows={5}
                maxLength={4000}
                value={draft.details}
                aria-invalid={Boolean(errors.details)}
                onChange={(e) => update({ details: e.target.value }, ["details"])}
              />
            </Field>
          </div>
        </div>

        <CheckboxGroup
          legend="Sizes"
          error={errors.sizeIds}
          name="sizeIds"
          items={options.sizes}
          selected={draft.sizeIds}
          onToggle={(id) => update({ sizeIds: toggle(draft.sizeIds, id) }, ["sizeIds"])}
        />

        <CheckboxGroup
          legend="Dress styles (optional)"
          error={errors.styleIds}
          name="styleIds"
          items={options.styles}
          selected={draft.styleIds}
          onToggle={(id) => update({ styleIds: toggle(draft.styleIds, id) }, ["styleIds"])}
        />

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium">Collections</legend>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm text-ink-muted">
              <input
                type="checkbox"
                name="isNewArrival"
                checked={draft.isNewArrival}
                onChange={(e) => update({ isNewArrival: e.target.checked })}
                className="h-4 w-4 accent-ink"
              />
              New arrival
            </label>
            <label className="flex items-center gap-2 text-sm text-ink-muted">
              <input
                type="checkbox"
                name="isTopSelling"
                checked={draft.isTopSelling}
                onChange={(e) => update({ isTopSelling: e.target.checked })}
                className="h-4 w-4 accent-ink"
              />
              Top selling
            </label>
          </div>
        </fieldset>
      </section>

      <section hidden={step !== "colors"} className="space-y-5">
        <div className="space-y-1">
          <h2 className="text-lg font-bold">Colors</h2>
          <p className="text-sm text-ink-muted">
            Every color is a variant of this same product, and each one needs its own photograph.
          </p>
        </div>

        {errors.variants ? (
          <p role="alert" className="rounded-2xl bg-sale-soft px-4 py-3 text-sm font-medium text-sale">
            {errors.variants}
          </p>
        ) : null}

        {draft.variants.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line-strong px-5 py-8 text-center text-sm text-ink-muted">
            No colors yet. Add the first one below.
          </p>
        ) : (
          <ul className="space-y-4">
            {draft.variants.map((variant, index) => {
              const color = colorById.get(variant.colorId);
              const colorError = errors[variantColorField(index)];
              const imageError =
                uploadErrors[variant.key] ?? errors[variantImageField(index)] ?? undefined;

              return (
                <li key={variant.key} className="rounded-2xl border border-line p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3 pb-4">
                    <div className="min-w-0 flex-1">
                      <Field
                        label={`Color ${index + 1}`}
                        htmlFor={`${fieldId}-color-${variant.key}`}
                        error={colorError}
                      >
                        <Select
                          id={`${fieldId}-color-${variant.key}`}
                          value={variant.colorId}
                          aria-invalid={Boolean(colorError)}
                          onChange={(e) => {
                            setDraft((current) =>
                              setVariantColor(current, variant.key, e.target.value),
                            );
                            setClientErrors((current) => {
                              const next = { ...current };
                              delete next[variantColorField(index)];
                              return next;
                            });
                          }}
                        >
                          <option value="">Choose a color…</option>
                          {options.colors.map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.name}
                            </option>
                          ))}
                        </Select>
                      </Field>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="mt-7 text-sale"
                      aria-label={`Remove ${color?.name ?? `color ${index + 1}`}`}
                      onClick={() => {
                        setDraft((current) => removeVariant(current, variant.key));
                        setClientErrors({});
                        setUploadErrors((current) => {
                          const next = { ...current };
                          delete next[variant.key];
                          return next;
                        });
                      }}
                    >
                      <CloseIcon className="h-4 w-4" />
                      Remove
                    </Button>
                  </div>

                  <VariantImageField
                    colorName={color?.name ?? "this color"}
                    colorHex={color?.hex ?? "transparent"}
                    image={variant.image}
                    error={imageError}
                    onChange={(image) => {
                      setDraft((current) => setVariantImage(current, variant.key, image));
                      setClientErrors((current) => {
                        const next = { ...current };
                        delete next[variantImageField(index)];
                        return next;
                      });
                    }}
                    onError={(message) =>
                      setUploadErrors((current) => {
                        const next = { ...current };
                        if (message) next[variant.key] = message;
                        else delete next[variant.key];
                        return next;
                      })
                    }
                  />
                </li>
              );
            })}
          </ul>
        )}

        <Button
          type="button"
          variant="secondary"
          disabled={!remainingColor}
          onClick={() => {
            if (!remainingColor) return;
            setDraft((current) => addVariant(current, remainingColor));
            setClientErrors((current) => {
              const next = { ...current };
              delete next.variants;
              return next;
            });
          }}
        >
          + Add another color
        </Button>
        {!remainingColor ? (
          <p className="text-xs text-ink-subtle">Every available color has been added.</p>
        ) : null}
      </section>

      <section hidden={step !== "review"} className="space-y-6">
        <div className="rounded-2xl border border-line p-5 sm:p-6">
          <h2 className="font-display text-xl uppercase">{draft.name || "Untitled product"}</h2>
          <p className="mt-2 max-w-2xl text-sm text-ink-muted">{draft.description}</p>

          <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
            <div className="flex justify-between gap-4 border-b border-line pb-3">
              <dt className="text-ink-muted">Price</dt>
              <dd className="font-medium">
                {priceCents === null ? "—" : formatPrice(priceCents)}
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-line pb-3">
              <dt className="text-ink-muted">Category</dt>
              <dd className="font-medium">{categoryName ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-line pb-3">
              <dt className="text-ink-muted">Sizes</dt>
              <dd className="font-medium">
                {options.sizes
                  .filter((size) => draft.sizeIds.includes(size.id))
                  .map((size) => size.name)
                  .join(", ") || "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-line pb-3">
              <dt className="text-ink-muted">Dress styles</dt>
              <dd className="font-medium">
                {options.styles
                  .filter((style) => draft.styleIds.includes(style.id))
                  .map((style) => style.name)
                  .join(", ") || "—"}
              </dd>
            </div>
          </dl>

          <h3 className="mt-6 text-sm font-medium">Colors</h3>
          <ul className="mt-3 space-y-2">
            {draft.variants.map((variant) => {
              const color = colorById.get(variant.colorId);
              const hasImage = Boolean(variant.image);
              return (
                <li key={variant.key} className="flex items-center gap-3 text-sm">
                  <span
                    aria-hidden="true"
                    style={{ backgroundColor: color?.hex ?? "transparent" }}
                    className="h-4 w-4 shrink-0 rounded-full ring-1 ring-inset ring-line-strong"
                  />
                  <span className="flex-1 font-medium">{color?.name ?? "No color chosen"}</span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 text-xs font-medium",
                      hasImage ? "text-positive" : "text-sale",
                    )}
                  >
                    {hasImage ? (
                      <>
                        <CheckIcon className="h-4 w-4" />
                        Image
                      </>
                    ) : (
                      "Image missing"
                    )}
                  </span>
                </li>
              );
            })}
            {draft.variants.length === 0 ? (
              <li className="text-sm text-sale">Please add at least one color.</li>
            ) : null}
          </ul>
        </div>

        {!readyToSubmit ? (
          <p role="alert" className="rounded-2xl bg-sale-soft px-4 py-3 text-sm font-medium text-sale">
            Some details are still missing. Go back and fix the highlighted fields.
          </p>
        ) : null}
      </section>

      {state.message && !state.ok ? (
        <p role="alert" className="rounded-2xl bg-sale-soft px-4 py-3 text-sm font-medium text-sale">
          {state.message}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-6">
        {step === "details" ? (
          <a
            href={cancelHref}
            className="min-h-11 rounded-full px-6 text-sm leading-[2.75rem] text-ink-muted hover:bg-surface-muted"
          >
            Cancel
          </a>
        ) : (
          <Button
            type="button"
            variant="secondary"
            onClick={() => goTo(STEPS[STEPS.indexOf(step) - 1])}
          >
            Back
          </Button>
        )}

        <div className="flex-1" />

        {step === "review" ? (
          <Button type="submit" size="lg" disabled={pending || !readyToSubmit}>
            {pending ? "Saving…" : submitLabel}
          </Button>
        ) : (
          <Button type="button" size="lg" onClick={() => goTo(STEPS[STEPS.indexOf(step) + 1])}>
            Continue
          </Button>
        )}
      </div>
    </form>
  );
}

function toggle(values: string[], id: string): string[] {
  return values.includes(id) ? values.filter((value) => value !== id) : [...values, id];
}

function Stepper({ current, onSelect }: { current: Step; onSelect: (step: Step) => void }) {
  return (
    <ol className="flex flex-wrap gap-2" aria-label="Product creation steps">
      {STEPS.map((step, index) => {
        const isCurrent = step === current;
        const isDone = STEPS.indexOf(current) > index;
        return (
          <li key={step}>
            <button
              type="button"
              onClick={() => onSelect(step)}
              aria-current={isCurrent ? "step" : undefined}
              className={cn(
                "flex min-h-11 items-center gap-2 rounded-full px-4 text-sm transition-colors",
                isCurrent
                  ? "bg-ink text-on-ink"
                  : "bg-surface-muted text-ink-muted hover:bg-line",
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                  isCurrent ? "bg-on-ink text-ink" : "bg-surface text-ink",
                )}
              >
                {isDone ? <CheckIcon className="h-3.5 w-3.5" /> : index + 1}
              </span>
              {STEP_LABELS[step]}
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function CheckboxGroup({
  legend,
  name,
  items,
  selected,
  error,
  onToggle,
}: {
  legend: string;
  name: string;
  items: { id: string; name: string }[];
  selected: string[];
  error?: string;
  onToggle: (id: string) => void;
}) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => {
          const isSelected = selected.includes(item.id);
          return (
            <label
              key={item.id}
              className={cn(
                "flex min-h-9 cursor-pointer items-center rounded-full px-4 text-sm transition-colors",
                isSelected ? "bg-ink text-on-ink" : "bg-surface-muted text-ink-muted hover:bg-line",
              )}
            >
              <input
                type="checkbox"
                name={name}
                value={item.id}
                checked={isSelected}
                onChange={() => onToggle(item.id)}
                className="sr-only"
              />
              {item.name}
            </label>
          );
        })}
      </div>
      {error ? (
        <p role="alert" className="text-xs font-medium text-sale">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
