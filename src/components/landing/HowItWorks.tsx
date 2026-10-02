import { Container } from "../common/Container";
import { SectionHeading } from "../common/SectionHeading";

const STEPS = [
  { number: "01", title: "Share your story", description: "Upload a photo, sketch, symbol, or idea." },
  { number: "02", title: "Create with AI", description: "Explore jewelry concepts inspired by your story." },
  { number: "03", title: "Make it yours", description: "Customize details, material, and charms." },
  { number: "04", title: "We make it real", description: "vandida reviews the selected design and prepares it for production." },
];

export function HowItWorks() {
  return (
    <section className="bg-stone/60 py-20 sm:py-28">
      <Container>
        <SectionHeading eyebrow="How it works" title="From a memory to something you can wear." align="center" />
        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => (
            <div key={step.number}>
              <span className="font-serif text-3xl text-champagne">{step.number}</span>
              <h3 className="mt-3 text-lg font-medium text-graphite">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-graphite-soft">{step.description}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
