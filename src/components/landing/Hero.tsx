import { Link } from "react-router-dom";
import { ArrowRight, Camera, Sparkles, Gem } from "lucide-react";
import { Container } from "../common/Container";
import { Button } from "../common/Button";
import { HoopPreview } from "../studio/HoopPreview";
import { DEMO_DESIGN } from "../../data/demo";
import { trackEvent } from "../../services/analytics";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-ivory pt-10 pb-16 sm:pt-16 sm:pb-24">
      <Container className="grid items-center gap-10 sm:grid-cols-2 sm:gap-8">
        <div className="order-2 sm:order-1">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-champagne">vandida</p>
          <h1 className="text-4xl font-medium leading-[1.08] text-graphite sm:text-5xl lg:text-6xl">
            Turn your story into jewelry.
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-graphite-soft sm:text-lg">
            Create one-of-a-kind jewelry from a photo, memory, or idea — then wear it, gift it, or turn it
            into your own collection.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/create"
              onClick={() => trackEvent("landing_cta_clicked", { cta: "create" })}
            >
              <Button size="lg" className="w-full sm:w-auto">
                Create Your Jewelry
                <ArrowRight size={16} />
              </Button>
            </Link>
            <Link
              to="/creator/luna-studio"
              onClick={() => trackEvent("landing_cta_clicked", { cta: "explore" })}
            >
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Explore Creations
              </Button>
            </Link>
          </div>
          <p className="mt-8 text-sm text-graphite-soft">
            Made on demand. Crafted one piece at a time.
          </p>
        </div>

        <div className="order-1 sm:order-2">
          <div className="mb-4 flex items-center justify-center gap-2 text-xs font-medium text-graphite-soft sm:justify-start">
            <span className="flex items-center gap-1.5">
              <Camera size={14} /> Photo
            </span>
            <span className="text-graphite-soft/40">→</span>
            <span className="flex items-center gap-1.5">
              <Sparkles size={14} /> AI Concept
            </span>
            <span className="text-graphite-soft/40">→</span>
            <span className="flex items-center gap-1.5 text-graphite">
              <Gem size={14} className="text-champagne" /> Finished Piece
            </span>
          </div>
          <div className="relative mx-auto aspect-square w-full max-w-sm rounded-[2.5rem] bg-stone p-8 sm:max-w-md">
            <HoopPreview design={DEMO_DESIGN} className="h-full w-full" />
          </div>
        </div>
      </Container>
    </section>
  );
}
