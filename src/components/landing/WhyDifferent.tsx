import { Container } from "../common/Container";
import { SectionHeading } from "../common/SectionHeading";
import { cn } from "../../lib/utils";

const PATHS = [
  {
    label: "Typical AI Tool",
    steps: ["Idea", "Pretty Image", "Stop"],
    muted: true,
  },
  {
    label: "Traditional Custom Jewelry",
    steps: ["Idea", "Designer", "Revisions", "CAD", "Manufacturer", "Quote", "Production"],
    muted: true,
  },
  {
    label: "vandida",
    steps: ["Idea", "AI Design", "Customize", "Production Review", "Made On Demand"],
    muted: false,
  },
];

export function WhyDifferent() {
  return (
    <section className="py-20 sm:py-28">
      <Container>
        <SectionHeading eyebrow="Why different" title="From imagination to something you can actually wear." align="center" />
        <div className="mt-14 space-y-6">
          {PATHS.map((path) => (
            <div
              key={path.label}
              className={cn(
                "rounded-3xl border p-6 sm:p-7",
                path.muted ? "border-graphite/8 bg-white/40" : "border-champagne bg-champagne-light/20",
              )}
            >
              <p
                className={cn(
                  "mb-4 text-xs font-semibold uppercase tracking-wide",
                  path.muted ? "text-graphite-soft" : "text-champagne",
                )}
              >
                {path.label}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {path.steps.map((step, i) => (
                  <div key={step} className="flex items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full px-3.5 py-1.5 text-sm font-medium",
                        path.muted ? "bg-stone text-graphite-soft" : "bg-graphite text-ivory",
                      )}
                    >
                      {step}
                    </span>
                    {i < path.steps.length - 1 && <span className="text-graphite-soft/40">→</span>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
