# Supabase setup (not connected yet)

No Supabase project exists in this environment. The app runs entirely on the
localStorage demo adapters (`src/services/storage.ts`, `src/services/reviewStore.ts`,
`src/services/charmDesignStore.ts`). This file is what's needed to connect a
real project — nothing here has been executed against a live database.

## 1. Create the project

1. Create a project at https://supabase.com/dashboard.
2. In SQL Editor, run `schema.sql` (this directory) once, top to bottom.
   It hasn't been run against a real Postgres instance — there's no local
   `psql`/Docker available in this environment to dry-run it, so treat the
   first run as the actual syntax check and fix anything that errors.
3. In Storage, confirm the `charm-photos` bucket was created by the script
   (private, not public) — the bucket + its policies are created by the
   script itself, not a dashboard step.

## 2. Create the first admin

`admin_users` has no client-reachable policies at all (by design — see the
comment in `schema.sql`). Grant the first admin directly in SQL Editor:

```sql
insert into admin_users (user_id)
values ('<the auth.users.id of the account you want as admin>');
```

## 3. Environment variables

Add to `.env.local` for local dev, and to Vercel's Production/Preview env for
deployment (see `.env.example`):

| Variable | Where used | Notes |
|---|---|---|
| `VITE_SUPABASE_URL` | client + server | Project Settings → API |
| `VITE_SUPABASE_ANON_KEY` | client | Project Settings → API — safe to expose, RLS does the enforcing |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | Project Settings → API — **never** prefix with `VITE_`, never send to the browser |

## 4. What's NOT built yet

The schema and RLS policies are ready, but no code in `src/` talks to Supabase
yet — `src/services/storage.ts` and friends are still the localStorage demo
adapters. Wiring a real adapter means:

- A Supabase client (`@supabase/supabase-js`, not yet a dependency of this
  project) initialized from `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`.
- Swapping `reviewStore.ts`/`charmDesignStore.ts`'s function bodies to query
  Supabase when a session exists, falling back to localStorage when signed
  out (per the spec: "로그인 전 임시 편집은 localStorage, 로그인 후 저장은 Supabase").
  The function *signatures* were written to match what a Supabase-backed
  implementation would need, so this should be a swap, not a redesign.
- Photo/concept-image uploads going to the `charm-photos` bucket instead of
  being kept as base64 strings — the `generateId`-based local records
  currently store `imageUrl` as a `data:` URL; a real adapter should upload
  to Storage and store the resulting path/signed URL instead.
- The admin write actions (`applyAdminRequestAction`, `createOrReviseQuote`)
  moving behind a server endpoint that checks `is_admin(auth.uid())` and
  writes with the service-role key, per the RLS design notes in `schema.sql`.
- `decide_quote(quote_id, decision)` — the Postgres function in the schema —
  called via `supabase.rpc('decide_quote', {...})` from the client instead of
  `services/reviewStore.ts`'s `recordCustomerDecision`.

None of this can be verified without real project credentials. Once connected,
re-run the verification checklist from the session report against the real
backend (cross-device, cross-user isolation, admin-escalation attempts).
