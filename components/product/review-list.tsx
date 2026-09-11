import { StarRating } from "@/components/ui/star-rating";
import { VerifiedIcon } from "@/components/ui/icons";
import { formatDate } from "@/lib/format";

type Review = {
  id: string;
  authorName: string;
  rating: number;
  body: string;
  createdAt: Date;
};

export function ReviewList({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) {
    return (
      <p className="rounded-2xl border border-line px-6 py-10 text-center text-sm text-ink-muted">
        No reviews yet. Be the first to write one.
      </p>
    );
  }

  return (
    <ul className="grid gap-5 sm:grid-cols-2">
      {reviews.map((review) => (
        <li key={review.id} className="space-y-3 rounded-2xl border border-line p-6">
          <StarRating value={review.rating} showValue={false} size="md" />
          <div className="flex items-center gap-1.5">
            <p className="font-bold">{review.authorName}</p>
            <VerifiedIcon className="h-4 w-4 text-positive" />
            <span className="sr-only">Verified buyer</span>
          </div>
          <p className="text-sm leading-relaxed text-ink-muted">&ldquo;{review.body}&rdquo;</p>
          <p className="text-xs text-ink-subtle">Posted on {formatDate(review.createdAt)}</p>
        </li>
      ))}
    </ul>
  );
}
