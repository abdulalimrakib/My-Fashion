import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth/auth-form";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { signIn } from "@/lib/actions/auth";
import { getCurrentUser } from "@/lib/auth";
import { safeRedirectPath } from "@/lib/validation";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false },
};

/** Explains why sign-in was required, when the shopper arrived from a gated action. */
const REASONS: Record<string, string> = {
  cart: "Sign in to add items to your cart.",
  wishlist: "Sign in to save items to your wishlist.",
  checkout: "Sign in to complete your order.",
  review: "Sign in to write a review.",
  account: "Sign in to view your account.",
};

export default async function LoginPage(props: PageProps<"/login">) {
  const searchParams = await props.searchParams;
  const next = safeRedirectPath(
    typeof searchParams.next === "string" ? searchParams.next : null,
    "/account",
  );

  const user = await getCurrentUser();
  if (user) redirect(next);

  const reason = typeof searchParams.reason === "string" ? REASONS[searchParams.reason] : undefined;

  return (
    <div className="container-page pb-20">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Sign in" }]} />
      <div className="mx-auto max-w-md space-y-6 pt-4">
        <div className="space-y-2 text-center">
          <h1 className="font-display text-3xl uppercase">Welcome back</h1>
          <p className="text-sm text-ink-muted">
            {reason ?? "Sign in to your SHOP.CO account."}
          </p>
        </div>
        <AuthForm mode="login" next={next} action={signIn} />
      </div>
    </div>
  );
}
