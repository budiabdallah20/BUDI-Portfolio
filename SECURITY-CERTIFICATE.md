# 🛡️ BUDI Portfolio — Security Certificate
**Date:** 2026-10-16 · **Scope:** app code + headers + HTTPS + Supabase · **Ref:** `check-security.md`

## 1) Verdict
**PASS (local).** No secrets in git, security headers live on both servers,
HTTPS enforced in production, admin writes gated + rate-limited + audited.
One noted item: 7× `high` in `npm audit` come from the `shadcn` CLI chain
(dev tooling: braces/micromatch/fast-glob) — NOT the production runtime.
Fix = breaking (`shadcn@1.0.0`), so it is **deferred by owner decision**.

## 2) Live evidence (2026-10-16)
- `GET /` dev (`:3000`) → `200`, prod (`:3001`) → `200`
- CSP prod has **no** `unsafe-eval` (strict); dev adds it (React dev needs it)
- Headers on both: `CSP`, `nosniff`, `SAMEORIGIN`, `Referrer-Policy`,
  `Permissions-Policy`, `HSTS: max-age=63072000; includeSubDomains; preload`,
  `Cache-Control: no-cache, must-revalidate` (prod)
- `POST /api/admin/verify` with wrong PIN → `{"ok":false}` (200, no 500) =
  `ADMIN_API_SECRET` **is configured** on the running server
- `GET /api/content-hash` → `200` with real counts (10/11/3/6, likes 4)
- `git ls-files` → `.env` **not tracked**; secrets scan → only placeholder
  in `.env.example`

## 3) HTTPS / SSL — how it is professional here
- **Vercel (deploy target):** TLS terminates at the edge automatically
  (Let's Encrypt, TLS 1.2/1.3, auto-renew). Nothing to install.
- **App layer:** `src/proxy.ts` 308-forces `http→https` (method-preserving)
  for public hosts; `localhost` + private LAN are **never** redirected
  (no local cert exists — by design). `x-forwarded-proto` is honored so
  there is no redirect loop behind the platform LB.
- **HSTS preload** (`63072000 + includeSubDomains + preload`) tells browsers
  to upgrade before even hitting the network. After the custom domain is
  stable, submit it at `hstspreload.org`.
- **Custom domain steps (when you deploy the new version):**
  1. Vercel → Add domain → set `A`/`CNAME` as shown (or Cloudflare DNS).
  2. Vercel env vars: `NEXT_PUBLIC_SITE_URL=https://yourdomain`,
     `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
     `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_API_SECRET` (new random 4-digit),
     then **Redeploy** (env loads at build/boot).
  3. Optional Cloudflare in front: SSL mode **Full (strict)**, Always-Use-
     HTTPS ON, WAF ON. Keep `frame-ancestors 'self'` (dashboard preview).
- **Local (encrypted):** `npm run dev:https` serves **real HTTPS on
  `https://localhost:8443`** using `certs/localhost.crt|key` (generate +
  OS-trust once with `npm run gen:cert`). HSTS/COOP are live in dev, the
  certificate page performs a real TLS handshake probe of its own server,
  and `https://localhost:8443/security` works exactly like production.
  Plain `npm run dev` remains on `:3000`.

## 4) Checklist mapping (condensed)
- Auth: PIN + `timingSafeEqual`, 8 tries→15m lock (repeat 1h), global
  40/min bucket, IP from XFF-tail (spoof-resistant). ✅
- Uploads/links/images: allowlist + `javascript:/data:` block + 512KB–8MB
  caps + 1.4MB image cap + SVG `<script/on*=` scan. ✅
- RLS: public `SELECT` visible-only; writes via `service_role` only +
  `SECURITY DEFINER` RPCs with `search_path=public`. ✅
- Rate limits: like 3/3s + 30/min, visit 10/min, content-hash 120/min. ✅
- Audit: append-only (console + `audit.log` in dev), never logs secrets. ✅
- Headers/CSP/HSTS/CORS (revalidate allowlists localhost + site + vercel). ✅

## 6) Hardening round — 2026-10-16 (evening)
- **RPC throttle bypass CLOSED:** `increment_visit / increment_like /
  decrement_like` are now `REVOKE`d for `anon, authenticated` (schema.sql +
  realtime.sql re-run). The public key can SELECT counts but never write —
  every vote/visit funnels through `/api/engagement/*` (service_role +
  per-IP limits). Verified: no client-side `.rpc(` calls remain.
- **CSP tightened:** `script-src` lost its bare `https:` — only `'self'` +
  inline boot scripts run. Any future third-party script must be allowlisted
  by exact host. Verified live on prod (`script-src 'self' 'unsafe-inline'`).
- **New headers:** `Cross-Origin-Opener-Policy: same-origin`,
  `X-Permitted-Cross-Domain-Policies: none` (verified live).
- **`/.well-known/security.txt`** (RFC 9116) live → 200 plain-text.
- **Consistency fix:** admin `PROD_ORIGIN` fallback now uses `siteConfig.url`
  (was a stale hardcoded dev URL).
- Re-verified after changes: `typecheck` ✅ `lint` ✅ `tests 12/12` ✅
  `build` ✅ dev `:3000` 200 ✅ prod `:3001` 200 ✅

## 7) Owner actions left
- [ ] Supabase SQL Editor: run `supabase/schema.sql` (has new trigger §6 +
      indexes §7) then `supabase/realtime.sql` — both safe to re-run.
- [ ] After any `.env` edit: **restart** `next dev` (env loads at boot).
- [ ] On Vercel: set the 5 env vars above + redeploy; verify `https://`
      + HSTS + `https://yourdomain/api/content-hash` → 200.

## 8) Round 2 — 2026-10-19: live Security Certificate + deeper hardening
- **`/security` page (EN/FR)** — 13 live checks graded A+→D: TLS/HTTPS,
  HSTS, CSP, anti-clickjacking, nosniff, Referrer/Permissions-Policy, XSS,
  SSRF guard, path-traversal guard, rate limiting, request timeouts,
  data-at-rest (Supabase holds no passwords/payments; RLS), trusted local
  TLS cert. Reads the live response headers plus a real TLS handshake
  (`tls.connect`) of its own server on loopback.
- **`GET /api/security/status`** — machine-readable proof: TLS probe
  (protocol/cipher/cert), guards, limits, timeout facts. Rate-limited 60/min.
- **`GET /api/security/dns?domain=`** — SPF/DMARC checker (DNS-over-HTTPS
  via `dns.google`, the only allowlisted outbound host). 20/min; 400 invalid.
- **Email hardening records to publish at your DNS provider:**
  | Host | Type | Value |
  |---|---|---|
  | `@` | TXT | `v=spf1 -all` (this domain sends no mail; if a provider does, use that provider's `include:` + `~all`) |
  | `_dmarc` | TXT | `v=DMARC1; p=reject; sp=reject; adkim=s; aspf=s; rua=mailto:dmarc@yourdomain; fo=1` (start `p=none` for a week if unsure) |
  | `<selector>._domainkey` | TXT | `v=DKIM1; k=rsa; p=<2048-bit public key from your mail provider>` |
- **Single source of truth** — `src/lib/security/headers.ts` feeds both
  `next.config.ts` and the page (no drift); `limits.ts` feeds every route.
- **New guards** — `safe-path.ts` (`resolveInside`) contains admin video
  paths + audit-log paths; `outbound.ts` SSRF allowlist (https-only, port
  443, no credentials, no redirects, 512KB cap).
- **Timeouts everywhere** — Supabase 15s, admin POST 20s (deploy 150s),
  weather 8s, prayer 10s, translate 12s, TLS probe 4s, DoH 5s.
- **Local HTTPS** — `npm run dev:https` → `https://localhost:8443`
  (8443 by convention; `--port` still overridable).
- Re-verified after changes: `typecheck` ✅ `lint` ✅ `tests 51/51` ✅ `build` ✅
  and a live smoke on `https://localhost:8443` ✅ — trusted cert, TLS 1.3
  (`TLS_AES_256_GCM_SHA384`), HSTS + CSP + XFO read back from the real
  response, SPF/DMARC lookup OK (`google.com`), invalid domain → 400,
  `POST /api/security/status` → 405.
