import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

export function Chip({
  active,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "rounded-full border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-40 disabled:pointer-events-none",
        active
          ? "border-graphite bg-graphite text-ivory"
          : "border-graphite/20 bg-transparent text-graphite-soft hover:border-graphite/50",
        className,
      )}
      {...props}
    />
  );
}
