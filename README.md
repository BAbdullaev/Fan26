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

### Known gaps

- **Contact and Apply forms are front-end only.** Validation and the success/thank-you states work (plain JS), but nothing is actually submitted anywhere — no email, no database. Needs a real backend or a form service (e.g. Formspree, a serverless function) before launch.
- Photos marked `[ photo: ... ]` throughout the site are placeholders — teacher photos, classroom photos, and the map are not yet real images.
- Tuition figures, calendar dates, and other specifics are planning placeholders from the design and should be confirmed before going live.
