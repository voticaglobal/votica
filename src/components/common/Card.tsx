import type { HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-graphite/8 bg-white/70 shadow-[0_1px_2px_rgba(43,41,38,0.04),0_12px_32px_-16px_rgba(43,41,38,0.12)]",
        className,
      )}
      {...props}
    />
  );
}
