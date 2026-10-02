import { cn } from "../../lib/utils";

/** A label/value line inside a <dl>, used for pricing and creator-economics breakdowns. */
export function DefinitionRow({
  label,
  value,
  emphasize,
  tone = "light",
}: {
  label: string;
  value: string;
  emphasize?: boolean;
  tone?: "light" | "dark";
}) {
  const isDark = tone === "dark";
  return (
    <div
      className={cn(
        "flex items-center justify-between border-b pb-3 last:border-0 last:pb-0",
        isDark ? "border-white/10" : "border-graphite/8",
      )}
    >
      <dt className={isDark ? "text-graphite-soft/80" : "text-graphite-soft"}>{label}</dt>
      <dd
        className={
          emphasize ? "font-semibold text-champagne" : cn("font-medium", isDark ? "text-ivory" : "text-graphite")
        }
      >
        {value}
      </dd>
    </div>
  );
}
