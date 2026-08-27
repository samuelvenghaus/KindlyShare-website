import { Star } from "lucide-react";
import clsx from "clsx";

export function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={size}
          className={clsx(
            i < Math.round(rating) ? "fill-solution text-solution" : "fill-transparent text-border"
          )}
        />
      ))}
    </div>
  );
}
