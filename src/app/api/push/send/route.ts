import { NextResponse } from "next/server";
import { checkAdmin } from "@/app/api/admin/_guard";
import { fanoutPush } from "@/lib/push";
import { insertNotification } from "@/lib/notify";

/** Owner test/send — pushes to all subscribed devices + saves inbox row. */
export async function POST(req: Request): Promise<NextResponse> {
  const gate = checkAdmin(req);
  if (!gate.ok) {
    return NextResponse.json(
      { error: gate.error },
      { status: gate.status, headers: gate.retryAfterSec ? { "Retry-After": String(gate.retryAfterSec) } : undefined },
    );
  }
  let body: { title?: unknown; body?: unknown; url?: unknown } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }
  const title = typeof body.title === "string" ? body.title.trim().slice(0, 120) : "";
  if (title === "") return NextResponse.json({ error: "Title required" }, { status: 400 });
  const text = typeof body.body === "string" ? body.body.trim().slice(0, 300) : "";
  const url = typeof body.url === "string" && body.url.startsWith("/") ? body.url.slice(0, 300) : "/admin";
  await insertNotification({ type: "info", title, body: text, url });
  const res = await fanoutPush({ title, body: text, url, tag: `manual-${Date.now()}` });
  return NextResponse.json({ ok: true, ...res });
}
