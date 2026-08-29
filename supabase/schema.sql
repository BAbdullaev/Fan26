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

-- ===== Staff roster =====
-- Who can sign into Admin.html, and who among them ("master") can add/remove
-- others through the dashboard's Staff access tab. Adding/removing rows here
-- happens only through the staff-admin Edge Function (service role) — see
-- supabase/functions/staff-admin/index.ts — never directly by the client, so
-- a staff_users row always stays paired with a real auth.users account.

create table public.staff_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text,
  role text not null default 'staff' check (role in ('staff', 'master')),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- security definer so the check itself isn't blocked by staff_users' own RLS
create or replace function public.is_fan26_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.staff_users
    where email = coalesce((select auth.jwt() ->> 'email'), '')
  );
$$;

create or replace function public.is_fan26_master()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.staff_users
    where email = coalesce((select auth.jwt() ->> 'email'), '')
      and role = 'master'
  );
$$;

alter table public.staff_users enable row level security;

-- Read-only from the client; see the header note above for why.
create policy "staff can view staff roster"
  on public.staff_users for select
  to authenticated
  using (public.is_fan26_staff());

-- ===== Row Level Security (tour requests & applications) =====
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
