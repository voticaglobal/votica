import { Sparkle, PackageCheck, ShieldCheck, Store } from "lucide-react";
import { Container } from "../common/Container";
import { SectionHeading } from "../common/SectionHeading";

const BENEFITS = [
  { icon: Sparkle, title: "One-of-a-kind", description: "Made from something meaningful to you." },
  { icon: PackageCheck, title: "Made to order", description: "Produced only when you decide to make it." },
  { icon: ShieldCheck, title: "Craft-ready review", description: "Every final design is reviewed before production." },
  { icon: Store, title: "Creator-ready", description: "Turn your design into a product others can buy." },
];

export function WhatYouGet() {
  return (
    <section className="py-20 sm:py-28">
      <Container>
        <SectionHeading eyebrow="What you get" title="Made with intention, not mass produced." align="center" />
        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map(({ icon: Icon, title, description }) => (
            <div key={title} className="text-center sm:text-left">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-champagne-light/50 sm:mx-0">
                <Icon size={20} className="text-champagne" strokeWidth={1.5} />
              </div>
              <h3 className="mt-4 text-sm font-semibold uppercase tracking-wide text-graphite">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-graphite-soft">{description}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
