import { useState, type ReactNode } from "react";
import { Container } from "../common/Container";
import { Button } from "../common/Button";
import { Input, FieldGroup } from "../common/Field";

const SESSION_KEY = "vandida:demo-admin-unlocked";
// NOT real security. There is no Supabase Auth / admin role connected yet, so
// this exists only to stop someone from stumbling into /admin by accident
// while testing. Real admin access must come from profiles.is_admin, checked
// server-side (RLS + service-role-only admin endpoints) — see supabase/schema.sql.
const DEMO_CODE = "vandida-ops";

export function AdminGate({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(SESSION_KEY) === "1");
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);

  if (unlocked) {
    return (
      <div>
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs text-amber-800">
          DEMO ADMIN — not real authentication. Anyone with this code can reach this screen. Do not
          use with real customer data.
        </div>
        {children}
      </div>
    );
  }

  return (
    <Container className="flex min-h-[60vh] items-center justify-center py-24">
      <div className="w-full max-w-xs text-center">
        <h1 className="font-serif text-xl text-graphite">Ops access</h1>
        <p className="mt-2 text-xs text-graphite-soft">
          No real admin auth is connected yet — this is a local-only placeholder gate.
        </p>
        <div className="mt-6 text-left">
          <FieldGroup label="Ops code" htmlFor="ops-code">
            <Input
              id="ops-code"
              type="password"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setError(false);
              }}
            />
          </FieldGroup>
        </div>
        {error && <p className="mt-2 text-xs text-red-600">Incorrect code.</p>}
        <Button
          className="mt-4 w-full"
          onClick={() => {
            if (code === DEMO_CODE) {
              sessionStorage.setItem(SESSION_KEY, "1");
              setUnlocked(true);
            } else {
              setError(true);
            }
          }}
        >
          Enter
        </Button>
      </div>
    </Container>
  );
}
