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
- Photos marked `[ photo: ... ]` throughout the site are placeholders — teacher photos, classroom photos, and the map are not yet real images. Both teacher cards on `About.html` still use illustrated avatars.
- No street address yet — the site shows "Nashville, TN 37211" only.

### Client-confirmed content (Aug 2026)

Sourced from the client email and the Parent Orientation 2026 deck:

- **Tuition:** $8,000/year, or 10 monthly payments of $800. Same rate for PreK and KG. No other fees have been confirmed — the old application/registration fees and sibling discount were removed.
- **First day of school:** Monday, August 24, 2026. The rest of the 2026–27 calendar (breaks, holidays, open house) is still being finalized and was removed from `Admissions.html` rather than guessed.
- **Daily schedules:** real PreK and Kindergarten schedules are on `Programs.html`. Staff break times and the aide's name were omitted at the client's request.
- **Staff:** Dr. Rashid Abdus-Salaam (Founding Principal), Mrs. Maha Jabbary (Lead PreK), Mrs. Sara Sofi (Lead Kindergarten).
- **Email:** the site uses `admissions@fan2026.org` and `rashid@fan2026.org`. Mrs. Maha's classroom address (`mahabad.Jabbary@fan2026.org`) is in the deck but is deliberately not published on the site.
- **Curriculum:** Wit & Wisdom + My Heggerty (literacy), STEMscopes Math, Tennessee Studies Weekly (social studies).
- Removed as unverifiable: the principal's credential list, the uniform color detail, and the tuition/calendar planning figures.
