import { Container } from "../common/Container";
import { SectionHeading } from "../common/SectionHeading";
import { Card } from "../common/Card";

const GROUPS = [
  {
    title: "For Memories",
    items: ["Pet", "Couple", "Family", "Personal moments"],
  },
  {
    title: "For Creators",
    items: ["Turn your design into a collection without inventory."],
  },
  {
    title: "For Communities",
    items: ["Turn original symbols and shared stories into physical products."],
  },
];

export function ForYou() {
  return (
    <section className="bg-stone/60 py-20 sm:py-28">
      <Container>
        <SectionHeading eyebrow="For you" title="Whatever the story, there's a form for it." align="center" />
        <div className="mt-14 grid gap-6 sm:grid-cols-3">
          {GROUPS.map((group) => (
            <Card key={group.title} className="p-7">
              <h3 className="font-serif text-xl text-graphite">{group.title}</h3>
              <ul className="mt-4 space-y-2 text-sm leading-relaxed text-graphite-soft">
                {group.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}
