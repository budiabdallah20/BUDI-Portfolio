import { NextResponse } from "next/server";
import { checkAdmin } from "@/app/api/admin/_guard";
import { insertNotification, type NotifyType } from "@/lib/notify";
import { supabaseService } from "@/lib/supabase/server";

const TYPES: NotifyType[] = ["visit", "error", "prayer", "birthday", "appointment", "info"];

/** Admin inbox — list recent notifications + unread count. */
export async function GET(req: Request): Promise<NextResponse> {
  const gate = checkAdmin(req);
  if (!gate.ok) {
    return NextResponse.json(
      { error: gate.error },
      { status: gate.status, headers: gate.retryAfterSec ? { "Retry-After": String(gate.retryAfterSec) } : undefined },
    );
  }
  try {
    const sb = supabaseService();
    const url = new URL(req.url);
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? "50") || 50));
    const list = await sb.from("notifications").select("*").order("created_at", { ascending: false }).limit(limit);
    const unread = await sb.from("notifications").select("id", { count: "exact", head: true }).eq("read", false);
    return NextResponse.json({
      ok: true,
      items: (list.data as unknown[] | null) ?? [],
      unread: unread.count ?? 0,
    });
  } catch {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }
}

/** Admin send — manual/test notification (also fans out to push devices). */
export async function POST(req: Request): Promise<NextResponse> {
  const gate = checkAdmin(req);
  if (!gate.ok) {
    return NextResponse.json(
      { error: gate.error },
      { status: gate.status, headers: gate.retryAfterSec ? { "Retry-After": String(gate.retryAfterSec) } : undefined },
    );
  }
  let body: { type?: unknown; title?: unknown; body?: unknown; url?: unknown; push?: unknown } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }
  const type: NotifyType = TYPES.includes(body.type as NotifyType) ? (body.type as NotifyType) : "info";
  const title = typeof body.title === "string" ? body.title.trim().slice(0, 120) : "";
  if (title === "") return NextResponse.json({ error: "Title required" }, { status: 400 });
  const text = typeof body.body === "string" ? body.body.trim().slice(0, 500) : "";
  const url = typeof body.url === "string" && body.url.startsWith("/") ? body.url.slice(0, 300) : "/admin";
  await insertNotification({ type, title, body: text, url });
  if (body.push === true) {
    try {
      const { fanoutPush } = await import("@/lib/push");
      void fanoutPush({ title, body: text, url }).catch(() => undefined);
    } catch {
      /* push misconfigured — inbox row already saved */
    }
  }
  return NextResponse.json({ ok: true });
}

/** Admin read — mark one (or all) as read. */
export async function PATCH(req: Request): Promise<NextResponse> {
  const gate = checkAdmin(req);
  if (!gate.ok) {
    return NextResponse.json(
      { error: gate.error },
      { status: gate.status, headers: gate.retryAfterSec ? { "Retry-After": String(gate.retryAfterSec) } : undefined },
    );
  }
  let body: { id?: unknown; all?: unknown } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }
  try {
    const sb = supabaseService();
    if (body.all === true) {
      await sb.from("notifications").update({ read: true }).eq("read", false);
    } else if (typeof body.id === "string" && body.id !== "") {
      await sb.from("notifications").update({ read: true }).eq("id", body.id.slice(0, 80));
    } else {
      return NextResponse.json({ error: "id or all required" }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }
}
