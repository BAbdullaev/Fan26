This is the website project for Falah Academy of Nashville.

## Status

All seven public pages are built as static HTML and implemented from the Claude Design mockup:

- `index.html` — hero, four academic/faith pillars, program preview, daily rhythm teaser
- `About.html` — story, principal's welcome, mission & mantra, pillars, teacher bios, family commitments
- `Programs.html` — PreK/K curriculum, both real daily schedules, classroom rules, home routines
- `Admissions.html` — 3-step process, key dates, tuition, FAQ accordion
- `Calendar.html` — interactive 2026–27 academic calendar (month grid + full-year list, filterable by category)
- `Contact.html` — tour request form
- `Apply.html` — enrollment handoff: DOB-based eligibility check, documents checklist, and what to expect, then out to the SchoolPro application
- `Directory.html` — public staff directory (name, role, photo, email, phone/extension), populated live from Supabase; content is entirely managed by master accounts through `Admin.html`

Shared nav/footer and hover states are implemented in plain CSS across all pages. Real assets (`assets/logo.jpeg`, `assets/principal.png`) are wired in.

### Backend & admin

- **The Contact form submits to Supabase.** Tour requests go to `falah_tour_requests`; `falah_applications` holds the historical in-house applications (see the SchoolPro note below) (table name unchanged from the site's original waitlist framing — only the public-facing copy moved to "enroll"), in project `kjuuipvyqqjlxmmlrlhy` (dedicated to Fan26, connected via the Supabase MCP server). RLS: the public publishable key can only INSERT; reads/updates require a signed-in staff account. Schema is documented in `supabase/schema.sql`.
- **Applications are handled by SchoolPro, not this site.** The live application form is `https://app.schoolpro.us/Application/StudentRegistration/38708` (Falah Academy New Student Application, 2026–27). It cannot be iframed — SchoolPro serves `X-Frame-Options: SAMEORIGIN`, which browsers enforce — so `Apply.html` is a handoff page that opens it in a new tab. To embed it for real, SchoolPro would have to replace that header with `Content-Security-Policy: frame-ancestors <our domain>`.
- **Consequence of that handoff:** new applications land in SchoolPro, so `falah_applications` and the dashboard's applications tab now hold historical rows only, and the application half of the Resend notifier no longer fires. Tour requests from `Contact.html` are unaffected and still notify. The table, tab, trigger and templates are all left in place — nothing to rebuild if the in-house form is ever reinstated.
- **Admin email notifications (Resend).** An `after insert` trigger on `falah_tour_requests` and `falah_applications` calls the `notify-admin` Edge Function via pg_net, which sends the email through Resend. Trigger in `supabase/notifications.sql`, function in `supabase/functions/notify-admin/`. Deliberately server-side: the website is never involved, so notifications can't be spoofed from a browser and aren't missed if a page closes mid-submit. Secrets (`RESEND_API_KEY`, `NOTIFY_SECRET`, optional `NOTIFY_TO` / `NOTIFY_FROM` / `SITE_URL`) are set with `supabase secrets set` and never committed. Deploy the function with `--no-verify-jwt`; the shared secret guards it instead.
- **`Admin.html` is the staff dashboard**, live (not demo mode). Sign in with a staff Supabase Auth account. Access is governed by the `public.staff_users` table (`supabase/schema.sql`), which has two roles: `staff` (dashboard access) and `master` (dashboard access + can manage staff). Current roster: Rashid Abdus-Salaam and Elbatoul Lemssaadi as `staff`; Dr. Eqbal Rahman, Ahmed Shehata, and Biloliddin Abdullaev as `master`. Shows stats, tour bookings, and enrollment applications; supports status changes, private notes, scheduling tours (with Google Calendar links + .ics downloads), and CSV export. It is not linked from public navigation and is `noindex`.
- **Master accounts manage staff from the dashboard itself** (the "Staff access" tab, hidden for non-masters). Adding a staff member creates a real Supabase Auth account with a temporary password the master sets and shares directly; removing one deletes both the roster row and the underlying auth account. This is handled by the `staff-admin` Edge Function (`supabase/functions/staff-admin/index.ts`), which runs with the service-role key — that privileged key never reaches the browser. The function decodes the caller's already-platform-verified JWT to identify them (see the comment in the function for why it doesn't use `supabase-js`'s `auth.getUser()` here), then checks their `master` role before doing anything.
- **Master accounts also manage the public staff directory** from Admin.html's "Staff directory" tab (hidden for non-masters): add/edit/remove entries — name, role, description, email, phone, extension, sort order, and a profile photo. Data lives in `public.falah_directory`; RLS lets anyone read it (it's public on `Directory.html`) but only `is_fan26_master()` can write. Photos go to the public `directory-photos` Storage bucket, uploaded directly from the browser under the same master-only RLS — no Edge Function needed here, since Storage uploads (unlike creating/deleting Auth users) don't require the service-role key.

### Client-confirmed content (Aug 2026)

All public-page copy is sourced from the client email of Aug 2026, the PreK/KG schedule screenshots, and the Parent Orientation 2026 deck. No placeholder or invented figures remain on the public pages.

- **Tuition:** $8,000/year, or 10 monthly payments of $800. Same rate for PreK and KG. No other fees have been confirmed — the old application/registration fees and sibling discount were removed.
- **First day of school:** Monday, August 24, 2026; last day Wednesday, June 2, 2027. The full 2026–27 calendar is on `Calendar.html`, transcribed from the printed *FALAH ACADEMY OF NASHVILLE Calendar 26_27* PDF. Event data lives in the `EVENTS` array at the bottom of that file — edit it there and the grid, month list and full-year list all follow.
- **Confirmed by Dr. Rashid:** Labor Day, Oct 12, Veterans Day, MLK Day and Memorial Day are all no-school days. November 3 is the year's only parent conference day and students do not report. Quarter start/end dates are markers only.
- **Still unconfirmed:** the printed calendar has Q2 ending Dec 31 and Q3 beginning Jan 1, a day the school is closed for New Year inside winter break. Left as printed.
- **Daily schedules:** real PreK and Kindergarten schedules are on `Programs.html`. Staff break times and the aide's name were omitted at the client's request.
- **Staff:** Dr. Rashid Abdus-Salaam (Founding Principal), Mrs. Maha Jabbary (Lead PreK), Mrs. Sara Sofi (Lead Kindergarten).
- **Email:** the site uses `admissions@fan2026.org` and `rashid@fan2026.org`. Mrs. Maha's classroom address (`mahabad.Jabbary@fan2026.org`) is in the deck but is deliberately not published on the site.
- **Curriculum:** Wit & Wisdom + My Heggerty (literacy), STEMscopes Math, Tennessee Studies Weekly (social studies).
- Removed as unverifiable: the principal's credential list, the uniform color detail, and the tuition/calendar planning figures.

### Open items
- Teacher photos are still illustrated avatars on `About.html`. Real classroom photos now live in `assets/classroom/` (metadata-stripped, enhanced, 1600px web JPEGs — processed from the client's phone photos) and appear on `Programs.html`: in both program cards and the "Take a peek at our classrooms" gallery with lightbox. Student first names are visible on furniture in some photos — published with the client's explicit OK.

The confirmed street address is **2311 Murfreesboro Pike Suite B, Nashville, TN 37217** — shown in every footer, the Contact page's address card, the live Google Maps embed, and `Admin.html`'s calendar location string.
