/** Shape returned by every server action that backs a form. */
export type FormState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
};

export const emptyFormState: FormState = { ok: false };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function readString(data: FormData, key: string): string {
  const value = data.get(key);
  return typeof value === "string" ? value.trim() : "";
}

type Rule = { required?: boolean; min?: number; max?: number; email?: boolean; label: string };

/**
 * Minimal field validation. A schema library would be a heavier dependency
 * than these few rules justify.
 */
export function validate(
  data: FormData,
  rules: Record<string, Rule>,
): { values: Record<string, string>; fieldErrors: Record<string, string> } {
  const values: Record<string, string> = {};
  const fieldErrors: Record<string, string> = {};

  for (const [key, rule] of Object.entries(rules)) {
    const value = readString(data, key);
    values[key] = value;

    if (rule.required && !value) {
      fieldErrors[key] = `${rule.label} is required.`;
      continue;
    }
    if (!value) continue;
    if (rule.email && !EMAIL.test(value)) {
      fieldErrors[key] = "Enter a valid email address.";
      continue;
    }
    if (rule.min && value.length < rule.min) {
      fieldErrors[key] = `${rule.label} must be at least ${rule.min} characters.`;
      continue;
    }
    if (rule.max && value.length > rule.max) {
      fieldErrors[key] = `${rule.label} must be ${rule.max} characters or fewer.`;
    }
  }

  return { values, fieldErrors };
}

/**
 * `next` comes from a query string, so it must be confined to this site's own
 * paths — an absolute or protocol-relative URL would be an open redirect.
 */
export function safeRedirectPath(value: string | null | undefined, fallback = "/"): string {
  if (!value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}
