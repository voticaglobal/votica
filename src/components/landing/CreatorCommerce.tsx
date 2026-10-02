import { Link } from "react-router-dom";
import { Container } from "../common/Container";
import { Button } from "../common/Button";
import { Card } from "../common/Card";
import { DefinitionRow } from "../common/DefinitionRow";
import { trackEvent } from "../../services/analytics";
import { CREATOR_COMMISSION_RATE } from "../../types/creator";
import { formatCurrency } from "../../lib/utils";

const EXAMPLE_PRICE = 149;
const EXAMPLE_EARNINGS = Math.round(EXAMPLE_PRICE * CREATOR_COMMISSION_RATE * 100) / 100;

export function CreatorCommerce() {
  return (
    <section className="bg-graphite py-20 text-ivory sm:py-28">
      <Container className="grid items-center gap-12 sm:grid-cols-2">
        <div>
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-champagne">Creator commerce</p>
          <h2 className="text-3xl font-medium sm:text-4xl">Your idea can become a collection.</h2>
          <p className="mt-5 max-w-md text-graphite-soft/90 leading-relaxed">
            Create jewelry. Share it with your audience. Earn when someone buys.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-2 text-sm text-champagne-light">
            {["Create", "Publish", "Share", "Earn"].map((step, i, arr) => (
              <span key={step} className="flex items-center gap-2">
                <span className="rounded-full bg-white/10 px-3.5 py-1.5">{step}</span>
                {i < arr.length - 1 && <span className="text-white/30">→</span>}
              </span>
            ))}
          </div>
          <Link to="/creator/onboarding" onClick={() => trackEvent("landing_cta_clicked", { cta: "start_collection" })}>
            <Button size="lg" variant="secondary" className="mt-8">
              Start a Collection
            </Button>
          </Link>
        </div>

        <Card className="border-white/10 bg-white/5 p-7 text-ivory backdrop-blur-sm">
          <dl className="space-y-3 text-sm">
            <DefinitionRow tone="dark" label="Selling Price" value={formatCurrency(EXAMPLE_PRICE)} />
            <DefinitionRow tone="dark" label="Creator Commission" value={`${Math.round(CREATOR_COMMISSION_RATE * 100)}%`} />
            <DefinitionRow tone="dark" label="Creator Earns" value={formatCurrency(EXAMPLE_EARNINGS)} emphasize />
            <DefinitionRow tone="dark" label="Inventory" value="$0" />
            <DefinitionRow tone="dark" label="Production" value="vandida" />
          </dl>
        </Card>
      </Container>
    </section>
  );
}
