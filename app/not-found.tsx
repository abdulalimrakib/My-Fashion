import Image from "next/image";

import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container-page flex flex-col items-center gap-8 py-16 text-center">
      <Image
        src="/images/states/not-found.png"
        alt=""
        width={560}
        height={403}
        className="h-auto w-full max-w-md"
        priority
      />
      <div className="space-y-3">
        <h1 className="font-display text-3xl uppercase sm:text-4xl">Page not found</h1>
        <p className="mx-auto max-w-md text-sm text-ink-muted sm:text-base">
          The page you were looking for doesn&rsquo;t exist, or the product may have been removed
          from the catalogue.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <ButtonLink href="/" size="lg">
          Back to home
        </ButtonLink>
        <ButtonLink href="/shop" variant="secondary" size="lg">
          Browse the shop
        </ButtonLink>
      </div>
    </div>
  );
}
