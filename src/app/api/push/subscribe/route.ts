import { NextResponse } from "next/server";
import { checkAdmin } from "@/app/api/admin/_guard";
import { supabaseService } from "@/lib/supabase/server";

/** Save (upsert) this device's push subscription — owner devices only. */
export async function POST(req: Request): Promise<NextResponse> {
  const gate = checkAdmin(req);
  if (!gate.ok) {
    return NextResponse.json(
      { error: gate.error },
      { status: gate.status, headers: gate.retryAfterSec ? { "Retry-After": String(gate.retryAfterSec) } : undefined },
    );
  }
  let body: { endpoint?: unknown; p256dh?: unknown; auth?: unknown } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }
  const endpoint = typeof body.endpoint === "string" ? body.endpoint.trim() : "";
  const p256dh = typeof body.p256dh === "string" ? body.p256dh.trim() : "";
  const auth = typeof body.auth === "string" ? body.auth.trim() : "";
  if (endpoint === "" || !endpoint.startsWith("https://") || p256dh === "" || auth === "") {
    return NextResponse.json({ error: "Bad subscription" }, { status: 400 });
  }
  if (endpoint.length > 2000 || p256dh.length > 500 || auth.length > 500) {
    return NextResponse.json({ error: "Too long" }, { status: 400 });
  }
  try {
    const sb = supabaseService();
    await sb.from("push_subscriptions").upsert({ endpoint, p256dh, auth }, { onConflict: "endpoint" });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }
}

/** Remove this device's subscription (logout / disable). */
export async function DELETE(req: Request): Promise<NextResponse> {
  const gate = checkAdmin(req);
  if (!gate.ok) {
    return NextResponse.json(
      { error: gate.error },
      { status: gate.status, headers: gate.retryAfterSec ? { "Retry-After": String(gate.retryAfterSec) } : undefined },
    );
  }
  let body: { endpoint?: unknown } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }
  const endpoint = typeof body.endpoint === "string" ? body.endpoint.trim().slice(0, 2000) : "";
  if (endpoint === "") return NextResponse.json({ error: "Empty" }, { status: 400 });
  try {
    const sb = supabaseService();
    await sb.from("push_subscriptions").delete().eq("endpoint", endpoint);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }
}
