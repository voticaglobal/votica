import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "left",
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow && (
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-champagne">{eyebrow}</p>
      )}
      <h2 className="text-3xl sm:text-4xl font-medium text-graphite">{title}</h2>
      {subtitle && <p className="mt-4 text-base sm:text-lg text-graphite-soft leading-relaxed">{subtitle}</p>}
    </div>
  );
}
