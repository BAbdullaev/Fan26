-- Falah Academy — admin email notifications
--
-- Fires the "notify-admin" Edge Function (supabase/functions/notify-admin)
-- right after a family submits a tour request or an enrollment application.
-- The function then sends the email through Resend.
--
-- Why a database trigger rather than calling the function from the website:
-- the browser can only be trusted to insert rows. If the page called the
-- notifier directly, anyone could POST to it and mail the staff at will, and
-- a submission saved during a network blip would notify nobody. A trigger
-- fires on the row itself, so notifications match reality exactly.
--
-- pg_net sends the request asynchronously, so a slow or failing email never
-- blocks or rolls back a family's submission.
--
-- BEFORE RUNNING: replace <NOTIFY_SECRET> below with the same value set via
--   supabase secrets set NOTIFY_SECRET=...
-- Run this in the Supabase SQL Editor (project kjuuipvyqqjlxmmlrlhy).

create extension if not exists pg_net;   -- creates the "net" schema

create or replace function public.falah_notify_admin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  fn_url text := 'https://kjuuipvyqqjlxmmlrlhy.supabase.co/functions/v1/notify-admin';
  secret text := '<NOTIFY_SECRET>';
begin
  perform net.http_post(
    url     := fn_url,
    headers := jsonb_build_object(
                 'Content-Type', 'application/json',
                 'x-notify-secret', secret
               ),
    body    := jsonb_build_object(
                 'type',   tg_op,
                 'table',  tg_table_name,
                 'record', to_jsonb(new)
               ),
    timeout_milliseconds := 5000
  );
  return new;
end;
$$;

-- Only the trigger should ever run this; nothing reaches it over PostgREST.
revoke all on function public.falah_notify_admin() from anon, authenticated;

drop trigger if exists falah_tour_requests_notify on public.falah_tour_requests;
create trigger falah_tour_requests_notify
  after insert on public.falah_tour_requests
  for each row execute function public.falah_notify_admin();

drop trigger if exists falah_applications_notify on public.falah_applications;
create trigger falah_applications_notify
  after insert on public.falah_applications
  for each row execute function public.falah_notify_admin();

-- ===== Checking on it =====
-- Recent delivery attempts (pg_net keeps a short response history):
--   select id, status_code, content, created
--   from net._http_response order by created desc limit 10;
--
-- Send a test without touching real data:
--   insert into public.falah_tour_requests (name, contact, program, preferred_time, message)
--   values ('Test Parent', 'you@example.com', 'prek', 'morning', 'Testing notifications');
--   -- then delete it:
--   delete from public.falah_tour_requests where name = 'Test Parent';
