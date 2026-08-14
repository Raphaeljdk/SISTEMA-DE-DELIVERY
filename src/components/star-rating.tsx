import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  size?: number;
  showValue?: boolean;
  className?: string;
}

export function StarRating({
  rating,
  size = 14,
  showValue = true,
  className,
}: StarRatingProps) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex">
        {Array.from({ length: 5 }).map((_, i) => {
          const isFull = i < full;
          const isHalf = i === full && half;
          return (
            <Star
              key={i}
              className={cn(
                "h-3.5 w-3.5",
                isFull
                  ? "fill-primary text-primary"
                  : isHalf
                  ? "fill-primary/50 text-primary"
                  : "fill-muted text-muted-foreground"
              )}
              style={{ width: size, height: size }}
            />
          );
        })}
      </div>
      {showValue && (
        <span className="text-xs font-medium text-foreground">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}
