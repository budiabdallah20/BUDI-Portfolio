import { NextResponse } from "next/server";

/**
 * RFC 9116 vulnerability-disclosure pointer — what professional scanners
 * (and friendly hackers) look for at /.well-known/security.txt.
 * Static text, zero secrets, cached for a day at the edge.
 */
const BODY = [
  "Contact: mailto:budiabdallah922@gmail.com",
  "Expires: 2027-12-31T23:59:59.000Z",
  "Preferred-Languages: en, fr, ar",
  "Canonical: https://budi-portfolio.vercel.app/.well-known/security.txt",
].join("\n");

export function GET(): NextResponse {
  return new NextResponse(`${BODY}\n`, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
