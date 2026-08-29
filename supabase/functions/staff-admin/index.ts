// Deployed to project kjuuipvyqqjlxmmlrlhy as the "staff-admin" Edge Function
// via the Supabase MCP server. This file mirrors that deployment for
// version control — it is not auto-deployed by pushing to this repo.
//
// Lets a master staff account add/remove other staff accounts from
// Admin.html. Runs with the service-role key (only available server-side)
// to create/delete real Supabase Auth users, which the browser can never be
// trusted to do directly.

import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

// The platform's verify_jwt gate already rejects any request whose bearer
// token isn't a signature-valid Supabase session JWT before this code runs,
// so it's safe to just read the email claim back out of it here.
function emailFromJwt(jwt: string): string | null {
  const parts = jwt.split(".");
  if (parts.length !== 3) return null;
  const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  try {
    const claims = JSON.parse(atob(padded));
    return typeof claims.email === "string" ? claims.email.toLowerCase() : null;
  } catch {
    return null;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization") || "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "");
  const callerEmail = jwt ? emailFromJwt(jwt) : null;
  if (!callerEmail) return json({ error: "Invalid session" }, 401);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const { data: callerRow } = await admin
    .from("staff_users")
    .select("role")
    .eq("email", callerEmail)
    .maybeSingle();

  if (!callerRow || callerRow.role !== "master") {
    return json({ error: "Master access required" }, 403);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  if (body.action === "add") {
    const email = String(body.email || "").trim().toLowerCase();
    const fullName = body.full_name ? String(body.full_name).trim() : null;
    const role = body.role === "master" ? "master" : "staff";
    const password = String(body.password || "");

    if (!email || !email.includes("@")) return json({ error: "A valid email is required" }, 400);
    if (password.length < 8) return json({ error: "Password must be at least 8 characters" }, 400);

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: fullName ? { full_name: fullName } : {},
    });
    if (createErr) return json({ error: createErr.message }, 400);

    const { error: insertErr } = await admin.from("staff_users").insert({
      email,
      full_name: fullName,
      role,
      auth_user_id: created.user!.id,
    });
    if (insertErr) {
      await admin.auth.admin.deleteUser(created.user!.id);
      return json({ error: insertErr.message }, 400);
    }

    return json({ ok: true });
  }

  if (body.action === "remove") {
    const email = String(body.email || "").trim().toLowerCase();
    if (!email) return json({ error: "Email required" }, 400);
    if (email === callerEmail) return json({ error: "You cannot remove your own account" }, 400);

    const { data: target } = await admin
      .from("staff_users")
      .select("auth_user_id")
      .eq("email", email)
      .maybeSingle();

    if (!target) return json({ error: "No such staff member" }, 404);

    if (target.auth_user_id) {
      const { error: delAuthErr } = await admin.auth.admin.deleteUser(target.auth_user_id);
      if (delAuthErr) return json({ error: delAuthErr.message }, 400);
    }

    const { error: deleteErr } = await admin.from("staff_users").delete().eq("email", email);
    if (deleteErr) return json({ error: deleteErr.message }, 400);

    return json({ ok: true });
  }

  return json({ error: "Unknown action" }, 400);
});
