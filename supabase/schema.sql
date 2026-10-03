-- vandida "Create Your Charm" schema — NOT CONNECTED.
-- No Supabase project/credentials exist in this environment. This file is the
-- target schema for when real credentials are supplied; the app currently runs
-- entirely on the localStorage demo adapter in src/services/storage.ts.
--
-- Mirrors src/types/charmStudio.ts and src/types/catalog.ts as closely as SQL
-- allows, so swapping the demo adapter for a real Supabase-backed one later is
-- a mechanical translation, not a redesign.

create extension if not exists "pgcrypto";

-- Shared updated_at trigger function — defined up front since several tables
-- below attach a trigger to it as they're created.
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

-- Admin status lives in its OWN table, deliberately never a column on
-- `profiles`. A user can be granted an UPDATE policy on their own profile row
-- (display_name, etc.) without that ever being able to touch admin status,
-- because the column doesn't exist there to touch. Nothing below grants any
-- authenticated-role policy on this table at all — the only way a row appears
-- here is a service-role (server-side) insert, e.g. run manually by whoever
-- operates the project. This directly satisfies "관리자 권한은 사용자가 자신의
-- 프로필을 수정해서 획득할 수 없게 해".
create table admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  granted_at timestamptz not null default now()
);

alter table profiles enable row level security;
alter table admin_users enable row level security;
-- No policies on admin_users at all: RLS enabled + zero policies = zero
-- access for every role except service_role (which always bypasses RLS).

create policy "read own profile" on profiles for select using (auth.uid() = id);
create policy "update own profile" on profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "insert own profile" on profiles for insert with check (auth.uid() = id);

create or replace function is_admin(uid uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (select 1 from admin_users a where a.user_id = uid);
$$;

create table hoop_bases (
  id text primary key,
  name text not null,
  reference_part_image_url text,
  retail_price numeric,
  stock text,
  created_at timestamptz not null default now()
);

-- Operator-managed manufacturing constraints. One row per charm "profile"
-- (today there's effectively one default profile; every column is nullable —
-- a null column means "not yet confirmed", never a default real-world value.
create table manufacturing_profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'default',
  loop_inner_diameter_mm numeric,
  loop_wire_thickness_mm numeric,
  connector_dimensions_mm text,
  hoop_passthrough_note text,
  min_body_width_mm numeric,
  min_body_height_mm numeric,
  min_body_thickness_mm numeric,
  max_weight_g numeric,
  size_presets jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- Catalog data: readable by anyone (anon included — customers browse this
-- before logging in), writable by no client role at all. RLS enabled with a
-- SELECT-only policy means even an authenticated user's own client can't
-- INSERT/UPDATE/DELETE here via the REST API — only the service-role key
-- (the future admin "edit parts/prices/stock" screen's server endpoint) can.
alter table hoop_bases enable row level security;
alter table manufacturing_profiles enable row level security;
create policy "anyone can read hoop bases" on hoop_bases for select using (true);
create policy "anyone can read manufacturing profiles" on manufacturing_profiles for select using (true);

create trigger manufacturing_profiles_set_updated_at
  before update on manufacturing_profiles
  for each row execute function set_updated_at();

create table charm_designs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles (id) on delete cascade,
  brief jsonb not null,
  current_version_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create type generation_job_status as enum ('queued', 'running', 'succeeded', 'failed');

create table charm_design_versions (
  id uuid primary key default gen_random_uuid(),
  charm_design_id uuid not null references charm_designs (id) on delete cascade,
  parent_version_id uuid references charm_design_versions (id),
  edit_request_text text,
  -- Concept snapshot: name/designIntent/imageUrl/connectionDescription/needsReview/loop/connector/models.
  concept jsonb,
  status generation_job_status not null default 'queued',
  error_message text,
  created_at timestamptz not null default now()
);

alter table charm_designs
  add constraint charm_designs_current_version_fk
  foreign key (current_version_id) references charm_design_versions (id);

-- One row per async Gemini call (image generation or edit), independent of
-- whether it ever produced a usable version — lets ops see real usage/costs/
-- failure rates rather than inferring them from charm_design_versions alone.
create table generation_jobs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles (id) on delete cascade,
  charm_design_version_id uuid references charm_design_versions (id),
  kind text not null check (kind in ('concept_image', 'concept_edit', 'concept_analysis')),
  model text not null,
  status generation_job_status not null default 'queued',
  started_at timestamptz,
  finished_at timestamptz,
  duration_ms integer,
  error_message text,
  created_at timestamptz not null default now()
);

create type review_status as enum ('draft', 'submitted', 'needs_changes', 'approved', 'rejected');

create table production_requests (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles (id) on delete cascade,
  charm_design_id uuid not null references charm_designs (id),
  charm_design_version_id uuid not null references charm_design_versions (id),
  desired_size_id text,
  material_request text not null,
  finish_request text not null,
  connection_summary text not null,
  engraving_text text,
  standalone_or_on_hoop text not null check (standalone_or_on_hoop in ('charm_only', 'with_hoop')),
  quantity integer not null default 1,
  pair_or_single text check (pair_or_single in ('single', 'pair')),
  contact_name text not null,
  contact_email text not null,
  note text,
  status review_status not null default 'submitted',
  -- Admin-only fields — no client UPDATE policy on this table touches them;
  -- only a server endpoint using the service-role key writes here.
  internal_notes text,
  customer_message text,
  loop_confirmed_by_operator boolean not null default false,
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create type quote_status as enum ('draft', 'sent', 'accepted', 'declined', 'expired');

create table quotes (
  id uuid primary key default gen_random_uuid(),
  production_request_id uuid not null references production_requests (id) on delete cascade,
  status quote_status not null default 'draft',
  sample_or_tooling_cost numeric,
  unit_cost numeric,
  minimum_order_quantity integer,
  production_window_text text,
  shipping_window_text text,
  customer_approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references quotes (id) on delete cascade,
  label text not null,
  amount numeric not null,
  sort_order integer not null default 0
);

-- Row Level Security.
--
-- Two different access patterns on purpose:
--  - Customers get narrow, direct policies: read their own rows, insert their
--    own rows, and update ONLY the specific fields a customer should ever
--    change themselves (nothing here lets a customer set status/price/admin
--    fields — see the per-table notes below).
--  - Admin actions (approve/reject/request-changes/create-quote/confirm-loop)
--    are NOT granted as client-side RLS write policies at all. "관리자는
--    서버에서 확인된 관리자 권한으로 검수한다": those writes happen through a
--    server endpoint that checks is_admin(auth.uid()) itself and then writes
--    with the service-role key (which bypasses RLS entirely). This keeps every
--    status-changing admin action server-auditable instead of trusting a
--    client-side RLS grant. Admin *read* access for a dashboard is granted via
--    is_admin()-gated SELECT policies below, since that's lower-risk and
--    avoids proxying every list/detail view through a server round trip.
alter table charm_designs enable row level security;
alter table charm_design_versions enable row level security;
alter table generation_jobs enable row level security;
alter table production_requests enable row level security;
alter table quotes enable row level security;
alter table quote_items enable row level security;

create policy "select own or admin charm designs" on charm_designs
  for select using (auth.uid() = owner_id or is_admin(auth.uid()));
create policy "insert own charm designs" on charm_designs
  for insert with check (auth.uid() = owner_id);
create policy "update own charm designs" on charm_designs
  for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "select own or admin charm design versions" on charm_design_versions
  for select using (
    exists (select 1 from charm_designs d where d.id = charm_design_id and (d.owner_id = auth.uid() or is_admin(auth.uid())))
  );
create policy "insert own charm design versions" on charm_design_versions
  for insert with check (
    exists (select 1 from charm_designs d where d.id = charm_design_id and d.owner_id = auth.uid())
  );

create policy "select own or admin generation jobs" on generation_jobs
  for select using (auth.uid() = owner_id or is_admin(auth.uid()));
create policy "insert own generation jobs" on generation_jobs
  for insert with check (auth.uid() = owner_id);

-- Customers can read and create their own requests, but status/internal_notes/
-- customer_message/loop_confirmed_by_operator are admin-only fields — there is
-- deliberately no customer UPDATE policy on this table at all. A customer
-- "editing" a request in the UI (e.g. to fix a typo before it's reviewed)
-- should go through the server too, not a direct client UPDATE, so the same
-- duplicate-request check applies consistently.
create policy "select own or admin production requests" on production_requests
  for select using (auth.uid() = owner_id or is_admin(auth.uid()));
create policy "insert own production requests" on production_requests
  for insert with check (auth.uid() = owner_id);

create policy "select own or admin quotes" on quotes
  for select using (
    exists (select 1 from production_requests r where r.id = production_request_id and (r.owner_id = auth.uid() or is_admin(auth.uid())))
  );

create policy "select own or admin quote items" on quote_items
  for select using (
    exists (
      select 1 from quotes q
      join production_requests r on r.id = q.production_request_id
      where q.id = quote_id and (r.owner_id = auth.uid() or is_admin(auth.uid()))
    )
  );

-- The customer's one allowed write against a quote: accept or decline it.
-- A SECURITY DEFINER function (not a raw UPDATE policy) so the same staleness
-- rules the app enforces client-side (services/reviewStore.ts checkQuoteValidity)
-- are re-checked server-side and can't be bypassed by calling the table directly:
-- latest quote for the request, status still 'sent', not expired, and the
-- request's current version still matches what the quote was built against.
create or replace function decide_quote(p_quote_id uuid, p_decision text)
returns quotes
language plpgsql
security definer
as $$
declare
  v_quote quotes;
  v_latest_id uuid;
  v_request production_requests;
  v_design_current_version_id uuid;
begin
  if p_decision not in ('accepted', 'declined') then
    raise exception 'invalid decision';
  end if;

  select * into v_quote from quotes where id = p_quote_id;
  if v_quote is null then
    raise exception 'quote not found';
  end if;

  select * into v_request from production_requests where id = v_quote.production_request_id;
  -- Written as `is distinct from` (not <>) deliberately: a plain <> against a
  -- NULL auth.uid() (an unauthenticated/service caller) evaluates to NULL in
  -- SQL, and `if NULL then` is treated as false in PL/pgSQL — which would
  -- silently skip this check instead of rejecting the call.
  if v_request.owner_id is distinct from auth.uid() then
    raise exception 'not your request';
  end if;

  select id into v_latest_id from quotes
    where production_request_id = v_quote.production_request_id
    order by created_at desc limit 1;
  if v_latest_id <> p_quote_id then
    raise exception 'a newer quote has replaced this one';
  end if;
  if v_quote.status <> 'sent' then
    raise exception 'quote is not awaiting a decision';
  end if;
  if v_quote.valid_until < now() then
    raise exception 'quote has expired';
  end if;

  select current_version_id into v_design_current_version_id
    from charm_designs where id = v_request.charm_design_id;
  if v_quote.charm_design_version_id is distinct from v_design_current_version_id then
    raise exception 'the design has changed since this quote was sent';
  end if;

  update quotes
    set status = p_decision, customer_decision_at = now()
    where id = p_quote_id
    returning * into v_quote;
  return v_quote;
end;
$$;

-- One open (submitted/needs_changes) request per exact design version —
-- mirrors services/reviewStore.ts's client-side duplicate check, enforced
-- here too so it holds even if two requests race each other.
create unique index one_open_request_per_version
  on production_requests (charm_design_version_id)
  where status in ('submitted', 'needs_changes');

-- ---------------------------------------------------------------------------
-- Storage: original customer photos and generated concept images are private,
-- never public. The app serves them back via short-lived signed URLs (created
-- server-side), never a public bucket URL — see "필요한 접근에는 만료되는 서명
-- URL을 사용한다" in the spec.
--
-- Path convention (enforced by the policies below via storage.foldername):
--   charm-photos/{auth.uid()}/{charmDesignId}/{filename}
-- Everything after the bucket name must start with the uploader's own uid, or
-- the policy rejects it — this is what stops one user from reading or
-- overwriting another user's objects even though they share a bucket.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('charm-photos', 'charm-photos', false)
on conflict (id) do nothing;

create policy "read own charm photos" on storage.objects
  for select using (
    bucket_id = 'charm-photos'
    and (auth.uid()::text = (storage.foldername(name))[1] or is_admin(auth.uid()))
  );

create policy "upload own charm photos" on storage.objects
  for insert with check (
    bucket_id = 'charm-photos' and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "delete own charm photos" on storage.objects
  for delete using (
    bucket_id = 'charm-photos' and auth.uid()::text = (storage.foldername(name))[1]
  );
-- No update policy: objects are replaced by delete+insert, not mutated in place.

-- ---------------------------------------------------------------------------
-- updated_at triggers (function defined near the top of this file) —
-- generation_jobs/charm_design_versions intentionally excluded (they're
-- effectively append/settle-once records); applied to the tables whose rows
-- are genuinely revised after creation.
-- ---------------------------------------------------------------------------
create trigger charm_designs_set_updated_at
  before update on charm_designs
  for each row execute function set_updated_at();

create trigger production_requests_set_updated_at
  before update on production_requests
  for each row execute function set_updated_at();

create trigger quotes_set_updated_at
  before update on quotes
  for each row execute function set_updated_at();
