-- vandida "Create Your Charm" schema — NOT CONNECTED.
-- No Supabase project/credentials exist in this environment. This file is the
-- target schema for when real credentials are supplied; the app currently runs
-- entirely on the localStorage demo adapter in src/services/storage.ts.
--
-- Mirrors src/types/charmStudio.ts and src/types/catalog.ts as closely as SQL
-- allows, so swapping the demo adapter for a real Supabase-backed one later is
-- a mechanical translation, not a redesign.

create extension if not exists "pgcrypto";

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

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
  submitted_at timestamptz not null default now()
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

-- Row Level Security: customers see only their own rows; service-role key
-- (server-side only) bypasses RLS for the admin/ops review screens.
alter table charm_designs enable row level security;
alter table charm_design_versions enable row level security;
alter table generation_jobs enable row level security;
alter table production_requests enable row level security;
alter table quotes enable row level security;
alter table quote_items enable row level security;

create policy "own charm designs" on charm_designs
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "own charm design versions" on charm_design_versions
  for all using (
    exists (select 1 from charm_designs d where d.id = charm_design_id and d.owner_id = auth.uid())
  );

create policy "own generation jobs" on generation_jobs
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "own production requests" on production_requests
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "own quotes" on quotes
  for select using (
    exists (select 1 from production_requests r where r.id = production_request_id and r.owner_id = auth.uid())
  );

create policy "own quote items" on quote_items
  for select using (
    exists (
      select 1 from quotes q
      join production_requests r on r.id = q.production_request_id
      where q.id = quote_id and r.owner_id = auth.uid()
    )
  );
