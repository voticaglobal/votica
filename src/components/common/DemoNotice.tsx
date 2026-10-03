import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

/** Consistent "this is a demo, here's exactly what that means" banner — used wherever the app stores or claims to act on something. */
export function DemoNotice({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900", className)}>
      {children}
    </div>
  );
}
