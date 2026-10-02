import { Link } from "react-router-dom";
import { Container } from "../common/Container";

export function Footer() {
  return (
    <footer className="border-t border-graphite/8 py-10">
      <Container className="flex flex-col items-center justify-between gap-4 text-sm text-graphite-soft sm:flex-row">
        <span className="font-serif text-base text-graphite">vandida</span>
        <nav className="flex gap-6">
          <Link to="/create" className="hover:text-graphite">
            Create
          </Link>
          <Link to="/creator/onboarding" className="hover:text-graphite">
            Become a Creator
          </Link>
          <Link to="/creator/luna-studio" className="hover:text-graphite">
            Explore
          </Link>
        </nav>
        <span>© {new Date().getFullYear()} vandida</span>
      </Container>
    </footer>
  );
}
