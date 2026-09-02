// Emails the admin team whenever a family submits a tour request or an
// enrollment application.
//
// Not called by the browser. A database trigger on each table (see
// supabase/notifications.sql) POSTs here via pg_net right after the row is
// inserted, so the notification fires for every real submission and cannot be
// triggered by anyone hitting the public site.
//
// Deploy with --no-verify-jwt: pg_net has no user session to present. The
// shared secret below is what actually guards the endpoint.
//
// Secrets (set with `supabase secrets set`, never in this repo):
//   RESEND_API_KEY  required — from resend.com/api-keys
//   NOTIFY_SECRET   required — long random string, must match the trigger
//   NOTIFY_TO       optional — comma-separated recipients
//   NOTIFY_FROM     optional — must be a Resend-verified domain
//   SITE_URL        optional — used for the dashboard link

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const NOTIFY_SECRET = Deno.env.get("NOTIFY_SECRET");
const NOTIFY_TO = (Deno.env.get("NOTIFY_TO") ?? "admissions@fan2026.org")
  .split(",").map((s) => s.trim()).filter(Boolean);
const NOTIFY_FROM = Deno.env.get("NOTIFY_FROM") ??
  "Falah Academy <notifications@fan2026.org>";
const SITE_URL = (Deno.env.get("SITE_URL") ?? "https://fan26-omega.vercel.app")
  .replace(/\/+$/, "");

const PROGRAMS: Record<string, string> = {
  prek: "PreK", k: "Kindergarten", both: "Both kids", other: "Just curious",
};
const TIMES: Record<string, string> = {
  morning: "Weekday morning", midday: "Weekday midday", afternoon: "Weekday afternoon",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { "Content-Type": "application/json" },
  });
}
function esc(v: unknown): string {
  return String(v ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
function isEmail(v: unknown): boolean {
  return typeof v === "string" && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.trim());
}
function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit", timeZone: "America/Chicago",
  });
}
// Tennessee's kindergarten cutoff — the first thing staff check on any application
function ageOnCutoff(dob: string | null): string {
  if (!dob) return "—";
  const d = new Date(dob + "T00:00:00"), ref = new Date("2026-08-15T00:00:00");
  let a = ref.getFullYear() - d.getFullYear();
  const m = ref.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < d.getDate())) a--;
  return `${a} on Aug 15, 2026`;
}

type Row = [string, unknown];
function rowsHtml(rows: Row[]): string {
  return rows
    .filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== "")
    .map(([label, v]) => `
      <tr>
        <td style="padding:9px 0;border-bottom:1px solid #EEF3ED;font:700 12px Arial,sans-serif;color:#93A996;text-transform:uppercase;letter-spacing:.06em;width:38%;vertical-align:top">${esc(label)}</td>
        <td style="padding:9px 0;border-bottom:1px solid #EEF3ED;font:400 15px Arial,sans-serif;color:#1F3D2B;vertical-align:top">${esc(v)}</td>
      </tr>`).join("");
}
function rowsText(rows: Row[]): string {
  return rows
    .filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== "")
    .map(([label, v]) => `${label}: ${v}`).join("\n");
}

function wrap(heading: string, sub: string, rows: Row[]): string {
  return `<!doctype html><html><body style="margin:0;padding:24px;background:#FDF8EE">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:18px;padding:28px">
    <tr><td>
      <p style="margin:0 0 4px;font:700 12px Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#E07C00">Falah Academy of Nashville</p>
      <h1 style="margin:0 0 4px;font:700 22px Arial,sans-serif;color:#153A26">${esc(heading)}</h1>
      <p style="margin:0 0 18px;font:400 14px Arial,sans-serif;color:#93A996">${esc(sub)}</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rowsHtml(rows)}</table>
      <p style="margin:22px 0 0">
        <a href="${SITE_URL}/Admin.html" style="display:inline-block;background:#1B7A40;color:#ffffff;font:700 14px Arial,sans-serif;text-decoration:none;padding:12px 22px;border-radius:999px">Open the dashboard</a>
      </p>
    </td></tr>
  </table>
</body></html>`;
}

function buildTour(r: Record<string, unknown>) {
  const rows: Row[] = [
    ["Name", r.name],
    ["Contact", r.contact],
    ["Program", PROGRAMS[String(r.program)] ?? r.program],
    ["Prefers", TIMES[String(r.preferred_time)] ?? r.preferred_time],
    ["Message", r.message],
    ["Submitted", fmtDate(r.created_at as string)],
  ];
  return {
    subject: `New tour request — ${r.name ?? "someone"}`,
    html: wrap("New tour request", "Someone asked to visit the school.", rows),
    text: `New tour request\n\n${rowsText(rows)}\n\n${SITE_URL}/Admin.html`,
    replyTo: isEmail(r.contact) ? String(r.contact).trim() : undefined,
  };
}

function buildApplication(r: Record<string, unknown>) {
  const child = `${r.child_first ?? ""} ${r.child_last ?? ""}`.trim();
  const program = PROGRAMS[String(r.program)] ?? String(r.program ?? "");
  const rows: Row[] = [
    ["Child", r.child_nickname ? `${child} (“${r.child_nickname}”)` : child],
    ["Program", program],
    ["Date of birth", r.child_dob ? `${r.child_dob} — ${ageOnCutoff(r.child_dob as string)}` : null],
    ["Parent / guardian", r.p1_relationship ? `${r.p1_name} (${r.p1_relationship})` : r.p1_name],
    ["Phone", r.p1_phone],
    ["Email", r.p1_email],
    ["Address", [r.street, r.city, r.zip].filter(Boolean).join(", ")],
    ["Allergies", r.allergies],
    ["Conditions", r.conditions],
    ["Heard about us", r.heard_about],
    ["Submitted", fmtDate(r.created_at as string)],
  ];
  return {
    subject: `New enrollment application — ${child || "a child"}${program ? ` (${program})` : ""}`,
    html: wrap("New enrollment application", "A family applied through the website.", rows),
    text: `New enrollment application\n\n${rowsText(rows)}\n\n${SITE_URL}/Admin.html`,
    replyTo: isEmail(r.p1_email) ? String(r.p1_email).trim() : undefined,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  // The only thing standing between this endpoint and the open internet.
  if (!NOTIFY_SECRET || req.headers.get("x-notify-secret") !== NOTIFY_SECRET) {
    return json({ error: "Forbidden" }, 403);
  }
  if (!RESEND_API_KEY) return json({ error: "RESEND_API_KEY is not set" }, 500);

  let payload: { table?: string; record?: Record<string, unknown> };
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const record = payload.record;
  if (!record) return json({ error: "No record in payload" }, 400);

  let mail;
  if (payload.table === "falah_tour_requests") mail = buildTour(record);
  else if (payload.table === "falah_applications") mail = buildApplication(record);
  else return json({ skipped: `No template for table ${payload.table}` });

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: NOTIFY_FROM,
      to: NOTIFY_TO,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      // so staff can hit Reply and reach the family directly
      ...(mail.replyTo ? { reply_to: mail.replyTo } : {}),
    }),
  });

  const body = await res.text();
  if (!res.ok) {
    // Logged for the Supabase function logs; the insert itself already
    // succeeded, so a bad send must never look like a failed submission.
    console.error("Resend rejected the email", res.status, body);
    return json({ error: "Resend failed", status: res.status, body }, 502);
  }
  return json({ sent: true, to: NOTIFY_TO, resend: JSON.parse(body || "{}") });
});
