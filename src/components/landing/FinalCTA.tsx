import { Link } from "react-router-dom";
import { Container } from "../common/Container";
import { Button } from "../common/Button";
import { trackEvent } from "../../services/analytics";

export function FinalCTA() {
  return (
    <section className="py-20 sm:py-28">
      <Container className="text-center">
        <h2 className="mx-auto max-w-xl text-3xl font-medium text-graphite sm:text-4xl">
          What would you turn into jewelry?
        </h2>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link to="/create" onClick={() => trackEvent("landing_cta_clicked", { cta: "final_create" })}>
            <Button size="lg" className="w-full sm:w-auto">
              Create Your Jewelry
            </Button>
          </Link>
          <Link
            to="/creator/onboarding"
            onClick={() => trackEvent("landing_cta_clicked", { cta: "final_become_creator" })}
          >
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              Become a Creator
            </Button>
          </Link>
        </div>
      </Container>
    </section>
  );
}
