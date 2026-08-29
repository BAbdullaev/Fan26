This is the website project for Falah Academy of Nashville.

## Status

All seven public pages are built as static HTML and implemented from the Claude Design mockup:

- `index.html` — hero, four academic/faith pillars, program preview, daily rhythm teaser
- `About.html` — story, principal's welcome, mission & mantra, pillars, teacher bios, family commitments
- `Programs.html` — PreK/K curriculum, both real daily schedules, classroom rules, home routines
- `Admissions.html` — 3-step process, key dates, tuition, FAQ accordion
- `Contact.html` — tour request form
- `Apply.html` — full waitlist application with DOB-based eligibility checking
- `Directory.html` — public staff directory (name, role, photo, email, phone/extension), populated live from Supabase; content is entirely managed by master accounts through `Admin.html`

Shared nav/footer and hover states are implemented in plain CSS across all pages. Real assets (`assets/logo.jpeg`, `assets/principal.png`) are wired in.

### Backend & admin

- **Contact and Apply forms submit to Supabase.** Tour requests go to `falah_tour_requests` and waitlist applications to `falah_applications`, in project `kjuuipvyqqjlxmmlrlhy` (dedicated to Fan26, connected via the Supabase MCP server). RLS: the public publishable key can only INSERT; reads/updates require a signed-in staff account. Schema is documented in `supabase/schema.sql`.
- **`Admin.html` is the staff dashboard**, live (not demo mode). Sign in with a staff Supabase Auth account. Access is governed by the `public.staff_users` table (`supabase/schema.sql`), which has two roles: `staff` (dashboard access) and `master` (dashboard access + can manage staff). Current roster: Rashid Abdus-Salaam and Elbatoul Lemssaadi as `staff`; Dr. Eqbal Rahman, Ahmed Shehata, and Biloliddin Abdullaev as `master`. Shows stats, tour bookings, and waitlist applications; supports status changes, private notes, scheduling tours (with Google Calendar links + .ics downloads), and CSV export. It is not linked from public navigation and is `noindex`.
- **Master accounts manage staff from the dashboard itself** (the "Staff access" tab, hidden for non-masters). Adding a staff member creates a real Supabase Auth account with a temporary password the master sets and shares directly; removing one deletes both the roster row and the underlying auth account. This is handled by the `staff-admin` Edge Function (`supabase/functions/staff-admin/index.ts`), which runs with the service-role key — that privileged key never reaches the browser. The function decodes the caller's already-platform-verified JWT to identify them (see the comment in the function for why it doesn't use `supabase-js`'s `auth.getUser()` here), then checks their `master` role before doing anything.
- **Master accounts also manage the public staff directory** from Admin.html's "Staff directory" tab (hidden for non-masters): add/edit/remove entries — name, role, description, email, phone, extension, sort order, and a profile photo. Data lives in `public.falah_directory`; RLS lets anyone read it (it's public on `Directory.html`) but only `is_fan26_master()` can write. Photos go to the public `directory-photos` Storage bucket, uploaded directly from the browser under the same master-only RLS — no Edge Function needed here, since Storage uploads (unlike creating/deleting Auth users) don't require the service-role key.

### Client-confirmed content (Aug 2026)

All public-page copy is sourced from the client email of Aug 2026, the PreK/KG schedule screenshots, and the Parent Orientation 2026 deck. No placeholder or invented figures remain on the public pages.

- **Tuition:** $8,000/year, or 10 monthly payments of $800. Same rate for PreK and KG. No other fees have been confirmed — the old application/registration fees and sibling discount were removed.
- **First day of school:** Monday, August 24, 2026. The rest of the 2026–27 calendar (breaks, holidays, open house) is still being finalized and was removed from `Admissions.html` rather than guessed.
- **Daily schedules:** real PreK and Kindergarten schedules are on `Programs.html`. Staff break times and the aide's name were omitted at the client's request.
- **Staff:** Dr. Rashid Abdus-Salaam (Founding Principal), Mrs. Maha Jabbary (Lead PreK), Mrs. Sara Sofi (Lead Kindergarten).
- **Email:** the site uses `admissions@fan2026.org` and `rashid@fan2026.org`. Mrs. Maha's classroom address (`mahabad.Jabbary@fan2026.org`) is in the deck but is deliberately not published on the site.
- **Curriculum:** Wit & Wisdom + My Heggerty (literacy), STEMscopes Math, Tennessee Studies Weekly (social studies).
- Removed as unverifiable: the principal's credential list, the uniform color detail, and the tuition/calendar planning figures.

### Open items
- Photos marked `[ photo: ... ]` throughout the site are placeholders — teacher photos, classroom photos, and the map are not yet real images. Both teacher cards on `About.html` still use illustrated avatars.
- No street address yet — the site shows "Nashville, TN 37211" only.
