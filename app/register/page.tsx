import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth/auth-form";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { register } from "@/lib/actions/auth";
import { getCurrentUser } from "@/lib/auth";
import { safeRedirectPath } from "@/lib/validation";

export const metadata: Metadata = {
  title: "Create an account",
  robots: { index: false },
};

export default async function RegisterPage(props: PageProps<"/register">) {
  const searchParams = await props.searchParams;
  const next = safeRedirectPath(
    typeof searchParams.next === "string" ? searchParams.next : null,
    "/account",
  );

  const user = await getCurrentUser();
  if (user) redirect(next);

  return (
    <div className="container-page pb-20">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Create account" }]} />
      <div className="mx-auto max-w-md space-y-6 pt-4">
        <div className="space-y-2 text-center">
          <h1 className="font-display text-3xl uppercase">Create account</h1>
          <p className="text-sm text-ink-muted">
            You need an account to add items to your cart and place orders.
          </p>
        </div>
        <AuthForm mode="register" next={next} action={register} />
      </div>
    </div>
  );
}
