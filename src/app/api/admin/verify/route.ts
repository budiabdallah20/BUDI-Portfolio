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
  const gate = checkAdmin(req, secret);
  if (!gate.ok) {
    // A wrong PIN is a normal outcome (typo) — answer 200 so mistypes never
    // paint a red 401 in the browser console. Lockouts (429) and server
    // misconfiguration (500) stay true error statuses: they are exceptional.
    if (gate.status === 401) return NextResponse.json({ ok: false });
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  return NextResponse.json({ ok: true });
}
