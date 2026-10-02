import { Link, useLocation } from "react-router-dom";
import { Container } from "./Container";
import { Button } from "./Button";

export function Header() {
  const location = useLocation();
  const isStudio = location.pathname.startsWith("/studio");

  if (isStudio) return null;

  return (
    <header className="sticky top-0 z-40 border-b border-graphite/8 bg-ivory/85 backdrop-blur-md" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
      <Container className="flex h-16 items-center justify-between">
        <Link to="/" className="font-serif text-xl font-medium tracking-tight text-graphite">
          vandida
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-graphite-soft sm:flex">
          <Link to="/create" className="hover:text-graphite">
            Create
          </Link>
          <Link to="/try-on" className="hover:text-graphite">
            Try It On
          </Link>
          <Link to="/creator/onboarding" className="hover:text-graphite">
            Become a Creator
          </Link>
        </nav>
        <Link to="/create">
          <Button size="sm">Create Your Jewelry</Button>
        </Link>
      </Container>
    </header>
  );
}
