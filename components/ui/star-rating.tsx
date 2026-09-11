import { cn } from "@/lib/cn";

type Props = {
  /** 0–5, halves supported. */
  value: number;
  size?: "sm" | "md";
  className?: string;
  /** Renders the numeric value beside the stars. */
  showValue?: boolean;
};

const STAR_PATH =
  "M12 .587l3.668 7.431 8.2 1.192-5.934 5.784 1.401 8.168L12 19.011l-7.335 3.857 " +
  "1.401-8.168L.132 9.21l8.2-1.192z";

/**
 * Fractional fill is done with a clip rather than half-star glyphs, so any
 * decimal rating renders correctly.
 */
export function StarRating({ value, size = "sm", className, showValue = true }: Props) {
  const clamped = Math.max(0, Math.min(5, value));
  const dimension = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span
        className="inline-flex items-center gap-0.5"
        role="img"
        aria-label={`Rated ${clamped} out of 5`}
      >
        {[0, 1, 2, 3, 4].map((index) => {
          const fill = Math.max(0, Math.min(1, clamped - index));
          return (
            <svg
              key={index}
              viewBox="0 0 24 24"
              className={cn(dimension, "shrink-0")}
              aria-hidden="true"
            >
              <path d={STAR_PATH} fill="currentColor" className="text-line-strong" />
              {fill > 0 ? (
                <path
                  d={STAR_PATH}
                  fill="currentColor"
                  className="text-star"
                  clipPath={`inset(0 ${(1 - fill) * 100}% 0 0)`}
                />
              ) : null}
            </svg>
          );
        })}
      </span>
      {showValue ? (
        <span className="text-xs text-ink sm:text-sm">
          {clamped.toFixed(1)}
          <span className="text-ink-subtle">/5</span>
        </span>
      ) : null}
    </span>
  );
}
