"use client";

import { useRef } from "react";

import { SectionHeading } from "@/components/ui/section-heading";
import { StarRating } from "@/components/ui/star-rating";
import { VerifiedIcon } from "@/components/ui/icons";

type Testimonial = {
  id: string;
  authorName: string;
  body: string;
  rating: number;
  isVerified: boolean;
};

export function TestimonialCarousel({ testimonials }: { testimonials: Testimonial[] }) {
  const trackRef = useRef<HTMLUListElement>(null);

  function scrollByCard(direction: 1 | -1) {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector("li");
    const amount = card ? card.getBoundingClientRect().width + 20 : track.clientWidth * 0.8;
    track.scrollBy({ left: amount * direction, behavior: "smooth" });
  }

  if (testimonials.length === 0) return null;

  return (
    <section className="py-12 sm:py-16">
      <div className="container-page">
        <div className="flex items-end justify-between gap-4">
          <SectionHeading align="start" className="max-w-md">
            Our happy customers
          </SectionHeading>
          <div className="flex shrink-0 gap-4 pb-1">
            <button
              type="button"
              onClick={() => scrollByCard(-1)}
              aria-label="Previous testimonials"
              className="rounded-full p-1 text-ink hover:bg-surface-muted"
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                <path d="M19 12H5m0 0 6-6m-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => scrollByCard(1)}
              aria-label="Next testimonials"
              className="rounded-full p-1 text-ink hover:bg-surface-muted"
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                <path d="M5 12h14m0 0-6-6m6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* The rail bleeds to the page edge with negative margins that match the
          gutter, rather than by putting `container-page` on the scroller
          itself — a scroll container that is also the page container leaks its
          content into the document's scroll width. */}
      <div className="container-page">
        <ul
          ref={trackRef}
          className="rail-scroll mt-8 gap-5 -mx-4 px-4 xs:-mx-6 xs:px-6 md:-mx-16 md:px-16 xl:-mx-24 xl:px-24"
          aria-label="Customer testimonials"
        >
          {testimonials.map((testimonial) => (
            <li
              key={testimonial.id}
              className="w-[18rem] space-y-3 rounded-2xl border border-line p-6 sm:w-[24rem]"
            >
              <StarRating value={testimonial.rating} showValue={false} size="md" />
              <div className="flex items-center gap-1.5">
                <p className="font-bold">{testimonial.authorName}</p>
                {testimonial.isVerified ? (
                  <>
                    <VerifiedIcon className="h-4 w-4 text-positive" />
                    <span className="sr-only">Verified buyer</span>
                  </>
                ) : null}
              </div>
              <p className="text-sm leading-relaxed text-ink-muted">
                &ldquo;{testimonial.body}&rdquo;
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
