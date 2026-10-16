import { NextResponse } from "next/server";
import { checkAdmin } from "../_guard";

/** PIN check — the dashboard login calls this, secret never touches the client bundle. */
export async function POST(req: Request): Promise<NextResponse> {
  let secret = "";
  try {
    const body = (await req.json()) as { secret?: unknown };
    if (typeof body.secret === "string") secret = body.secret;
  } catch {
    /* missing body — header fallback still applies */
  }
  // A megabyte-long "PIN" is a probe, not a login — cap before comparing.
  if (secret.length > 256) secret = secret.slice(0, 256);
  const gate = checkAdmin(req, secret);
  if (!gate.ok) {
    // A wrong PIN is a normal outcome (typo) — answer 200 so mistypes never
    // paint a red 401 in the browser console. Lockouts (429) and server
    // misconfiguration (500) stay true error statuses: they are exceptional.
    if (gate.status === 401) return NextResponse.json({ ok: false });
    const headers = gate.retryAfterSec ? { "Retry-After": String(gate.retryAfterSec) } : undefined;
    return NextResponse.json({ error: gate.error }, { status: gate.status, headers });
  }
  return NextResponse.json({ ok: true });
}
