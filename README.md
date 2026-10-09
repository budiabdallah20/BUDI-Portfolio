# BUDI Portfolio — Full-Stack Developer Portfolio + BUDI OS Console

Personal portfolio of **Mohamed Abdallah (BUDI)** — Full-Stack Developer from Suez, Egypt.
Bilingual (EN/FR), animated, Supabase-backed, with a private admin console and the
**BUDI OS** multi-account command center (`/admin`).

![CI](https://github.com/budiabdallah20/budi-portfolio/actions/workflows/ci.yml/badge.svg)

## ✨ Features

- **Cinematic portfolio** — loading screen, hero, about, services, projects, skills, certificates, contact, footer
- **Bilingual** EN/FR with persisted language + per-tab sync
- **Dashboard-owned content** — badges, payment rails, verification seals, hero/about photos, all editable from `/admin`, read-only on the site
- **Glass detail modals** for skills, projects and services (same language as the certificates lightbox)
- **BUDI OS hub** — up to 100 isolated dashboard accounts, per-account loader/PIN/theme, last-opened resume, linked external dashboards
- **Supabase** — content tables, counters, realtime refresh, RLS
- **Hardened runtime** — failsafe loaders, chunk-recovery, offline-tolerant likes/weather

## 🧱 Stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · GSAP · Motion · Supabase · shadcn/radix · Sentry

## 🚀 Develop

```bash
npm install
npm run dev        # http://localhost:3000
```

## ✅ Validate (same as CI)

```bash
npm run lint       # eslint, zero warnings
npm run typecheck  # tsc --noEmit
npm run build      # production build
```

## 🔑 Environment

```bash
cp .env.example .env
```

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Optional | Without it the site renders baked-in fallback content |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Optional | Public anon key — RLS enforces read-only |
| `SUPABASE_SERVICE_ROLE_KEY` | Dashboard cloud sync only | **Server-only**, never expose with `NEXT_PUBLIC_` |
| `ADMIN_PIN` | Dashboard cloud writes | Checked server-side in `/api/admin/verify` |
| `NEXT_PUBLIC_SITE_URL` | Production | Canonical URL for SEO/metadata |

## 🗄️ Database

Supabase → SQL Editor → run in order:

1. `supabase/schema.sql` — tables, migration-safe columns, RLS, RPCs, seed (safe to re-run)
2. `supabase/realtime.sql` — realtime publication + unlike RPC (safe to re-run)

Then open `/admin` → **Push EVERYTHING** once to upload the local content.

## 🖥️ Admin — BUDI OS (`/admin`)

```
Global splash → Hub (or last-opened account) → account loader → PIN → console
```

- **BUDI Portfolio** (main) — full console, server-verified PIN, cloud sync
- **Add account** — local isolated console (own DB, loader, 4-digit PIN) or **Linked URL** (e.g. Kayan/Massar dashboards hosted elsewhere — opens in a new tab, login recorded in the hub ledger)
- **Logout** locks to the PIN screen · **Accounts** returns to the hub

## 📁 Project map

```
src/app/            App Router pages + API routes (admin/*, content)
src/components/
  admin/            Dashboard, Login, WorkspaceHub, GlobalSplash, store
  home/             HomeShell, Hero
  sections/         About, Services, Projects, Skills, Certificates, Contact
  layout/           Navbar, Footer, UtilityBar
src/data/           Baked-in fallback content (portfolio, tech logos, verses)
src/i18n/           EN/FR dictionaries
supabase/           schema.sql + realtime.sql
.github/workflows/  CI: lint → typecheck → build
```

## 🚢 Deploy

Vercel (recommended): import the repo, set the env vars above, deploy.
Any static/Node host works with `npm run build && npm run start`.

## 📄 License

All rights reserved © Mohamed Abdallah (BUDI).
