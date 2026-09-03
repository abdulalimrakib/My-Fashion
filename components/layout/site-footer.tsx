import Image from "next/image";
import Link from "next/link";

import { NewsletterForm } from "@/components/layout/newsletter-form";
import { FOOTER_SECTIONS } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="mt-16 sm:mt-24">
      {/* Positioned so the whole card paints above the band that is pulled
          up over it below. Without this only the card's text clears the band
          — backgrounds of in-flow siblings all paint first — so the panel got
          clipped mid-heading. */}
      <div className="container-page">
        <div className="relative flex flex-col gap-8 rounded-3xl bg-ink px-6 py-8 text-on-ink sm:px-10 sm:py-12 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="max-w-lg font-display text-2xl uppercase leading-tight sm:text-3xl lg:text-4xl">
            Stay up to date about our latest offers
          </h2>
          <NewsletterForm />
        </div>
      </div>

      {/* The tinted band starts behind the newsletter card, as in the reference. */}
      <div className="-mt-24 bg-surface-sunken pt-32 pb-8">
        <div className="container-page">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_repeat(4,1fr)]">
            <div className="space-y-5">
              <p className="font-display text-2xl uppercase">Shop.co</p>
              <p className="max-w-xs text-sm text-ink-muted">
                We have clothes that suit your style and which you&rsquo;re proud to wear. From
                women to men.
              </p>
            </div>

            {FOOTER_SECTIONS.map((section) => (
              <div key={section.title} className="space-y-4">
                <h3 className="text-sm font-medium uppercase tracking-[0.2em] text-ink">
                  {section.title}
                </h3>
                <ul className="space-y-3">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-ink-muted underline-offset-4 hover:text-ink hover:underline"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col items-center gap-5 border-t border-line pt-6 sm:flex-row sm:justify-between">
            <p className="text-sm text-ink-muted">
              Shop.co &copy; 2000&ndash;{new Date().getFullYear()}, All Rights Reserved
            </p>
            <Image
              src="/icons/payments.svg"
              alt="We accept Visa, Mastercard, PayPal, Apple Pay and Google Pay"
              width={301}
              height={49}
              className="h-8 w-auto"
            />
          </div>
        </div>
      </div>
    </footer>
  );
}
