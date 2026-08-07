This is the website project for Falah Academy of Nashville.

## Status

All six pages are built as static HTML and implemented from the Claude Design mockup:

- `Home.html` — hero, crest values, program preview, daily rhythm teaser
- `About.html` — story, principal's welcome, values, teacher placeholders
- `Programs.html` — PreK/K breakdown, full daily rhythm timeline
- `Admissions.html` — 3-step process, key dates, tuition, FAQ accordion
- `Contact.html` — tour request form
- `Apply.html` — full waitlist application with DOB-based eligibility checking

Shared nav/footer and hover states are implemented in plain CSS across all pages. Real assets (`assets/logo.jpeg`, `assets/principal.png`) are wired in.

### Backend & admin

- **Contact and Apply forms submit to Supabase.** Tour requests go to `falah_tour_requests` and waitlist applications to `falah_applications` (project `zovywyaobwusmxzlamea`, currently shared with premed-tracker because the org's free tier caps at 2 projects — tables are `falah_`-prefixed for easy extraction later). RLS: the public anon key can only INSERT; reads/updates require a signed-in user whose email is the admin's.
- **`Admin.html` is the staff dashboard.** Sign in with the Supabase auth admin account (create it under Authentication → Users in the Supabase dashboard, email must match the RLS policy). Shows stats, tour bookings, and waitlist applications; supports status changes, private notes, scheduling tours (with Google Calendar links + .ics downloads), and CSV export. It is not linked from public navigation and is `noindex`.

### Known gaps
- Photos marked `[ photo: ... ]` throughout the site are placeholders — teacher photos, classroom photos, and the map are not yet real images.
- Tuition figures, calendar dates, and other specifics are planning placeholders from the design and should be confirmed before going live.
