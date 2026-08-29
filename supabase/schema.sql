-- Falah Academy of Nashville — Supabase schema
-- Deployed to project kjuuipvyqqjlxmmlrlhy via the Supabase MCP server.
-- This file documents that schema for reference / disaster recovery — it is
-- not auto-applied. Staff auth accounts are provisioned separately (see
-- README "Backend & admin" section) and are not represented here.

create extension if not exists pgcrypto;

-- ===== Tables =====

create table public.falah_tour_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  contact text not null,
  program text,
  preferred_time text,
  message text,
  status text not null default 'new',
  scheduled_at timestamptz
);

create table public.falah_applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  program text not null,
  child_first text not null,
  child_last text not null,
  child_nickname text,
  child_dob date not null,
  child_sex text,
  child_languages text,
  p1_name text not null,
  p1_relationship text,
  p1_phone text,
  p1_email text,
  street text,
  city text,
  zip text,
  residency_doc text,
  p2_name text,
  p2_phone text,
  em_name text,
  em_phone text,
  em_relationship text,
  pickups text,
  doctor_name text,
  doctor_phone text,
  allergies text,
  conditions text,
  immunization_status text,
  physical_status text,
  docs jsonb,
  heard_about text,
  consent_contact boolean not null default false,
  status text not null default 'new',
  admin_notes text
);

-- ===== Staff allowlist =====
-- Centralizes who counts as "staff" for RLS. To add/remove staff, replace
-- this function's email array (or move to a table if the list grows much
-- more) and re-apply via the Supabase MCP server / SQL editor.

create or replace function public.is_fan26_staff()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(auth.jwt() ->> 'email', '') = any (array[
    'rashid@fan2026.org',
    'admissions@fan2026.org',
    'merahman01@gmail.com',
    'ashehata929+spark@gmail.com',
    'abdullaevbilaliddin@gmail.com'
  ]);
$$;

-- ===== Row Level Security =====
-- Public site can only INSERT (submit a tour request / application).
-- Only signed-in staff (per is_fan26_staff()) can SELECT/UPDATE.

alter table public.falah_tour_requests enable row level security;
alter table public.falah_applications enable row level security;

create policy "public can submit tour requests"
  on public.falah_tour_requests for insert
  to anon
  with check (true);

create policy "public can submit applications"
  on public.falah_applications for insert
  to anon
  with check (true);

create policy "staff can read tour requests"
  on public.falah_tour_requests for select
  to authenticated
  using (public.is_fan26_staff());

create policy "staff can update tour requests"
  on public.falah_tour_requests for update
  to authenticated
  using (public.is_fan26_staff())
  with check (public.is_fan26_staff());

create policy "staff can read applications"
  on public.falah_applications for select
  to authenticated
  using (public.is_fan26_staff());

create policy "staff can update applications"
  on public.falah_applications for update
  to authenticated
  using (public.is_fan26_staff())
  with check (public.is_fan26_staff());
