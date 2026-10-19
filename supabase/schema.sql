-- ═══════════════════════════════════════════════════════════════════
-- BUDI Portfolio — schema.sql (FILE 1 of 2 — RUN THIS FIRST)
-- Supabase → SQL Editor → New query → paste ALL → Run
-- Safe to re-run: creates missing tables AND adds missing columns.
-- Then run realtime.sql (FILE 2).
--
-- What this file does:
--  1) services / skills / projects / certs / settings / visits / likes
--  2) adds new badge columns: projects.sponsored,
--     settings.siteVerified, settings.verificationBadges + all rails
--  3) RLS (site reads visible rows, writes via dashboard service_role)
--  4) RPCs: increment_visit / increment_like / decrement_like
--  5) seeds settings id='site' + backfills NULLs on existing rows
--  6) INSTANT contract: updated_at auto-touch trigger on every UPDATE
--     (dashboard writes repaint open tabs in ~1-2s via content-hash),
--     created_at audit column + hot-path indexes (visible, updated_at)
--  8) notifications + push_subscriptions (owner inbox + Web Push devices —
--     RLS locked, service_role API proxies only, never realtime)
-- ═══════════════════════════════════════════════════════════════════

-- ── 1) tables (new DBs) ──────────────────────────────────────────────
create table if not exists services (
  id text primary key,
  title text not null,
  "titleFr" text default '',
  "desc" text default '',
  "descFr" text default '',
  tags text[] default '{}',
  points text[] default '{}',
  "pointsFr" text[] default '{}',
  category text default 'development',
  icon text default '',
  "iconImage" text default '',
  "bestForEn" text default '',
  "bestForFr" text default '',
  "timelineEn" text default '',
  "timelineFr" text default '',
  visible boolean default true,
  updated_at timestamptz default now()
);

create table if not exists skills (
  id text primary key,
  name text not null,
  cat text default 'frontend',
  level int default 50,
  proof text default 'learning',
  logo text default '',
  icon text default '',
  "detailEn" text default '',
  "detailFr" text default '',
  visible boolean default true,
  updated_at timestamptz default now()
);

create table if not exists projects (
  id text primary key,
  title text not null,
  "titleFr" text default '',
  "desc" text default '',
  "descFr" text default '',
  tech text[] default '{}',
  status text default 'completed',
  opensource boolean default false,
  category text default '',
  github text default '',
  period text default '',
  year text default '',
  demo text default '',
  image text default '',
  "roleEn" text default '',
  "roleFr" text default '',
  "timelineEn" text default '',
  "timelineFr" text default '',
  "briefEn" text[] default '{}',
  "briefFr" text[] default '{}',
  sponsored boolean default false,
  visible boolean default true,
  updated_at timestamptz default now()
);

create table if not exists certs (
  id text primary key,
  "titleEn" text not null,
  "titleFr" text default '',
  "issuerEn" text default '',
  "issuerFr" text default '',
  year text default '',
  months int default 6,
  code text default '',
  skills text[] default '{}',
  image text default '',
  verify text default '',
  "verifyLogo" text default '',
  visible boolean default true,
  expiry text default '',
  level text default 'intermediate',
  hours int default 0,
  type text default 'certificate',
  featured boolean default false,
  pdf text default '',
  "issueDate" text default '',
  "linkedSkills" text[] default '{}',
  updated_at timestamptz default now()
);

create table if not exists settings (
  id text primary key,
  "siteName" text default 'BUDI',
  tagline text default '',
  maintenance boolean default false,
  "showLoader" boolean default true,
  "likesEnabled" boolean default true,
  "contactEmail" text default '',
  "heroImage" text default '/images/general/hero.jpg',
  "aboutImage" text default '/images/general/about2.jpg',
  "workStatus" text default 'available',
  "workNote" text default '',
  "workNoteFr" text default '',
  "workUntil" text default '',
  "vodafoneState" text default 'active',
  "vodafoneNumber" text default '01065228072',
  "vodafoneAt" text default '',
  "taptapState" text default 'active',
  "taptapAt" text default '',
  "instapayState" text default 'soon',
  "instapayHandle" text default '',
  "instapayAt" text default '',
  "siteVerified" boolean default true,
  "verificationBadges" jsonb default '[]'::jsonb,
  "catLabels" jsonb default '{}'::jsonb,
  updated_at timestamptz default now()
);

create table if not exists visits (
  id text primary key,
  count int default 0
);

create table if not exists likes (
  id text primary key,
  count int default 0
);

-- Owner inbox (dashboard bell + ReminderEngine + site-error beacon).
-- No public reads: written/read ONLY via service_role API proxies.
-- The type CHECK lives HERE (the first create) — see §8 for the migration
-- that backfills it onto databases created before the constraint existed.
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  type text default 'info' check (type in ('visit', 'error', 'prayer', 'birthday', 'appointment', 'info')),
  title text default '',
  body text default '',
  url text default '/admin',
  read boolean default false,
  created_at timestamptz default now()
);

-- Owner devices for Web Push (VAPID). Secrets by nature: service_role only.
create table if not exists push_subscriptions (
  endpoint text primary key,
  p256dh text default '',
  auth text default '',
  created_at timestamptz default now()
);

-- ── 2) migration (existing DBs: CREATE IF NOT EXISTS won't add
-- ──     columns, so add every column explicitly — safe to re-run) ────
alter table services add column if not exists "titleFr" text default '';
alter table services add column if not exists "desc" text default '';
alter table services add column if not exists "descFr" text default '';
alter table services add column if not exists tags text[] default '{}';
alter table services add column if not exists points text[] default '{}';
alter table services add column if not exists "pointsFr" text[] default '{}';
alter table services add column if not exists category text default 'development';
alter table services add column if not exists icon text default '';
alter table services add column if not exists "iconImage" text default '';
alter table services add column if not exists "bestForEn" text default '';
alter table services add column if not exists "bestForFr" text default '';
alter table services add column if not exists "timelineEn" text default '';
alter table services add column if not exists "timelineFr" text default '';
alter table services add column if not exists visible boolean default true;
alter table services add column if not exists updated_at timestamptz default now();

alter table skills add column if not exists name text default '';
alter table skills add column if not exists cat text default 'frontend';
alter table skills add column if not exists level int default 50;
alter table skills add column if not exists proof text default 'learning';
alter table skills add column if not exists logo text default '';
alter table skills add column if not exists icon text default '';
alter table skills add column if not exists "detailEn" text default '';
alter table skills add column if not exists "detailFr" text default '';
alter table skills add column if not exists visible boolean default true;
alter table skills add column if not exists updated_at timestamptz default now();

alter table projects add column if not exists "titleFr" text default '';
alter table projects add column if not exists "desc" text default '';
alter table projects add column if not exists "descFr" text default '';
alter table projects add column if not exists tech text[] default '{}';
alter table projects add column if not exists status text default 'completed';
alter table projects add column if not exists opensource boolean default false;
alter table projects add column if not exists category text default '';
alter table projects add column if not exists github text default '';
alter table projects add column if not exists period text default '';
alter table projects add column if not exists year text default '';
alter table projects add column if not exists demo text default '';
alter table projects add column if not exists image text default '';
alter table projects add column if not exists "roleEn" text default '';
alter table projects add column if not exists "roleFr" text default '';
alter table projects add column if not exists "timelineEn" text default '';
alter table projects add column if not exists "timelineFr" text default '';
alter table projects add column if not exists "briefEn" text[] default '{}';
alter table projects add column if not exists "briefFr" text[] default '{}';
alter table projects add column if not exists sponsored boolean default false;
alter table projects add column if not exists visible boolean default true;
alter table projects add column if not exists updated_at timestamptz default now();

alter table certs add column if not exists "titleEn" text default '';
alter table certs add column if not exists "titleFr" text default '';
alter table certs add column if not exists "issuerEn" text default '';
alter table certs add column if not exists "issuerFr" text default '';
alter table certs add column if not exists year text default '';
alter table certs add column if not exists months int default 6;
alter table certs add column if not exists code text default '';
alter table certs add column if not exists skills text[] default '{}';
alter table certs add column if not exists image text default '';
alter table certs add column if not exists verify text default '';
alter table certs add column if not exists "verifyLogo" text default '';
alter table certs add column if not exists visible boolean default true;
alter table certs add column if not exists expiry text default '';
alter table certs add column if not exists level text default 'intermediate';
alter table certs add column if not exists hours int default 0;
alter table certs add column if not exists type text default 'certificate';
alter table certs add column if not exists featured boolean default false;
alter table certs add column if not exists pdf text default '';
alter table certs add column if not exists "issueDate" text default '';
alter table certs add column if not exists "linkedSkills" text[] default '{}';
alter table certs add column if not exists updated_at timestamptz default now();

alter table settings add column if not exists "siteName" text default 'BUDI';
alter table settings add column if not exists tagline text default '';
alter table settings add column if not exists maintenance boolean default false;
alter table settings add column if not exists "showLoader" boolean default true;
alter table settings add column if not exists "likesEnabled" boolean default true;
alter table settings add column if not exists "contactEmail" text default '';
alter table settings add column if not exists "heroImage" text default '/images/general/hero.jpg';
alter table settings add column if not exists "aboutImage" text default '/images/general/about2.jpg';
alter table settings add column if not exists "workStatus" text default 'available';
alter table settings add column if not exists "workNote" text default '';
alter table settings add column if not exists "workNoteFr" text default '';
alter table settings add column if not exists "workUntil" text default '';
alter table settings add column if not exists "vodafoneState" text default 'active';
alter table settings add column if not exists "vodafoneNumber" text default '01065228072';
alter table settings add column if not exists "vodafoneAt" text default '';
alter table settings add column if not exists "taptapState" text default 'active';
alter table settings add column if not exists "taptapAt" text default '';
alter table settings add column if not exists "instapayState" text default 'soon';
alter table settings add column if not exists "instapayHandle" text default '';
alter table settings add column if not exists "instapayAt" text default '';
alter table settings add column if not exists "siteVerified" boolean default true;
alter table settings add column if not exists "verificationBadges" jsonb default '[]'::jsonb;
alter table settings add column if not exists "catLabels" jsonb default '{}'::jsonb;
alter table settings add column if not exists updated_at timestamptz default now();

-- ── 3) RLS ───────────────────────────────────────────────────────────
alter table services enable row level security;
alter table skills enable row level security;
alter table projects enable row level security;
alter table certs enable row level security;
alter table settings enable row level security;
alter table visits enable row level security;
alter table likes enable row level security;
alter table notifications enable row level security;
alter table push_subscriptions enable row level security;

drop policy if exists "public read visible" on services;
create policy "public read visible" on services for select using (visible = true);
drop policy if exists "public read visible" on skills;
create policy "public read visible" on skills for select using (visible = true);
drop policy if exists "public read visible" on projects;
create policy "public read visible" on projects for select using (visible = true);
drop policy if exists "public read visible" on certs;
create policy "public read visible" on certs for select using (visible = true);

drop policy if exists "public read settings" on settings;
create policy "public read settings" on settings for select using (true);

drop policy if exists "public read visits" on visits;
create policy "public read visits" on visits for select using (true);
drop policy if exists "public read likes" on likes;
create policy "public read likes" on likes for select using (true);

-- notifications + push_subscriptions: RLS ON with ZERO public policies.
-- anon/authenticated get nothing (not even SELECT); every access flows
-- through service_role route handlers. Never add them to realtime either —
-- anon clients could snoop inbox titles off the publication.

-- ── 4) RPCs ──────────────────────────────────────────────────────────
-- `security definer` + `search_path = ''` (empty, NOT `public`): with an
-- empty search_path every table is schema-qualified, so nothing in the
-- caller's search_path can shadow `visits`/`likes` and hijack the
-- definer's rights. pg_catalog (greatest/char_length) is always implicit.
create or replace function increment_visit(p_id text)
returns int language plpgsql security definer set search_path = ''
as $$ declare v int;
begin
  if char_length(p_id) < 1 or char_length(p_id) > 120 then raise exception 'bad visit id'; end if;
  insert into public.visits (id, count) values (p_id, 1)
    on conflict (id) do update set count = public.visits.count + 1
    returning count into v;
  return v;
end; $$;

create or replace function increment_like(p_id text)
returns int language plpgsql security definer set search_path = ''
as $$ declare v int;
begin
  if char_length(p_id) < 1 or char_length(p_id) > 200 then raise exception 'bad like id'; end if;
  insert into public.likes (id, count) values (p_id, 1)
    on conflict (id) do update set count = public.likes.count + 1
    returning count into v;
  return v;
end; $$;

create or replace function decrement_like(p_id text)
returns int language plpgsql security definer set search_path = ''
as $$ declare v int;
begin
  if char_length(p_id) < 1 or char_length(p_id) > 200 then raise exception 'bad like id'; end if;
  insert into public.likes (id, count) values (p_id, 0)
    on conflict (id) do update set count = greatest(public.likes.count - 1, 0)
    returning count into v;
  return v;
end; $$;

-- Counters are written ONLY through the rate-limited API proxies
-- (/api/engagement/*, service_role). Direct RPC calls with the public anon
-- key are revoked, so bots can't bypass throttling, race counts, or bloat
-- the tables with minted ids. Reads stay public (SELECT policies above).
--
-- CRITICAL — `from public` is the line that actually does the work.
-- PostgreSQL grants EXECUTE to the pseudo-role PUBLIC on every new function
-- by default. Revoking only from `anon`/`authenticated` removes the DIRECT
-- grant but leaves PUBLIC's grant intact — and since every role is a member
-- of PUBLIC, anon keeps its EXECUTE and can still call the RPCs straight
-- from the browser with the public anon key. Both statements are required
-- (see Supabase docs: "revoking execution … 2 steps required").
-- Verify after running:  set local role anon;
--                       select increment_visit('x');  -- must ERROR.
revoke execute on function increment_visit(text) from public;
revoke execute on function increment_like(text) from public;
revoke execute on function decrement_like(text) from public;
revoke execute on function increment_visit(text) from anon, authenticated;
revoke execute on function increment_like(text) from anon, authenticated;
revoke execute on function decrement_like(text) from anon, authenticated;

-- ── 5) seed + backfill NULLs (the fix for ERROR 42703) ───────────────
insert into settings (id, "siteName", tagline, "contactEmail", "workStatus", "vodafoneState", "taptapState", "instapayState", "siteVerified", "verificationBadges")
values ('site', 'BUDI', 'I don''t just build — I engineer systems.', 'budiabdallah922@gmail.com', 'available', 'active', 'active', 'soon', true, '[]'::jsonb)
on conflict (id) do nothing;

update settings set "siteVerified" = true where id = 'site' and "siteVerified" is null;
update settings set "verificationBadges" = '[]'::jsonb where id = 'site' and "verificationBadges" is null;
update settings set "catLabels" = '{}'::jsonb where id = 'site' and "catLabels" is null;
update settings set "contactEmail" = 'budiabdallah922@gmail.com' where id = 'site' and ("contactEmail" is null or "contactEmail" = '');
update settings set "heroImage" = '/images/general/hero.jpg' where id = 'site' and "heroImage" is null;
update settings set "aboutImage" = '/images/general/about2.jpg' where id = 'site' and "aboutImage" is null;
update settings set "vodafoneState" = 'active' where id = 'site' and "vodafoneState" is null;
update settings set "vodafoneNumber" = '01065228072' where id = 'site' and "vodafoneNumber" is null;
update settings set "taptapState" = 'active' where id = 'site' and "taptapState" is null;
update settings set "instapayState" = 'soon' where id = 'site' and "instapayState" is null;
update projects set sponsored = false where sponsored is null;
update certs set level = 'intermediate' where level is null or level = '';
update certs set type = 'certificate' where type is null or type = '';
update certs set hours = 0 where hours is null;
update certs set featured = false where featured is null;
update certs set "linkedSkills" = '{}'::text[] where "linkedSkills" is null;
update certs set visible = true where visible is null;

-- ── 6) INSTANT contract — updated_at auto-touch (re-run safe) ─────────
-- Why: the live site detects dashboard edits via max(updated_at) in
-- /api/content-hash. Without a trigger, an UPDATE that doesn't touch
-- updated_at leaves the fingerprint frozen and open tabs never rebuild.
-- The API also stamps updated_at=now() (_db.ts) — this trigger is the
-- server-side guarantee no write can bypass.
create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin
  NEW.updated_at = now();
  return NEW;
end; $$;

drop trigger if exists trg_touch_updated_at on services;
create trigger trg_touch_updated_at before insert or update on services
  for each row execute function touch_updated_at();
drop trigger if exists trg_touch_updated_at on skills;
create trigger trg_touch_updated_at before insert or update on skills
  for each row execute function touch_updated_at();
drop trigger if exists trg_touch_updated_at on projects;
create trigger trg_touch_updated_at before insert or update on projects
  for each row execute function touch_updated_at();
drop trigger if exists trg_touch_updated_at on certs;
create trigger trg_touch_updated_at before insert or update on certs
  for each row execute function touch_updated_at();
drop trigger if exists trg_touch_updated_at on settings;
create trigger trg_touch_updated_at before insert or update on settings
  for each row execute function touch_updated_at();

-- ── 7) audit column + hot-path indexes (re-run safe) ─────────────────
alter table services add column if not exists created_at timestamptz default now();
alter table skills add column if not exists created_at timestamptz default now();
alter table projects add column if not exists created_at timestamptz default now();
alter table certs add column if not exists created_at timestamptz default now();
alter table settings add column if not exists created_at timestamptz default now();

update services set created_at = coalesce(created_at, updated_at, now()) where created_at is null;
update skills set created_at = coalesce(created_at, updated_at, now()) where created_at is null;
update projects set created_at = coalesce(created_at, updated_at, now()) where created_at is null;
update certs set created_at = coalesce(created_at, updated_at, now()) where created_at is null;
update settings set created_at = coalesce(created_at, updated_at, now()) where created_at is null;

update services set updated_at = now() where updated_at is null;
update skills set updated_at = now() where updated_at is null;
update projects set updated_at = now() where updated_at is null;
update certs set updated_at = now() where updated_at is null;
update settings set updated_at = now() where updated_at is null;

create index if not exists idx_services_visible on services (visible);
create index if not exists idx_services_updated on services (updated_at desc);
create index if not exists idx_skills_visible on skills (visible);
create index if not exists idx_skills_updated on skills (updated_at desc);
create index if not exists idx_projects_visible on projects (visible);
create index if not exists idx_projects_updated on projects (updated_at desc);
create index if not exists idx_certs_visible on certs (visible);
create index if not exists idx_certs_updated on certs (updated_at desc);
create index if not exists idx_settings_updated on settings (updated_at desc);

-- ── 8) notifications inbox + push subscriptions (re-run safe) ──────────
-- Owner-only: RLS enabled with NO public policies — every read/write goes
-- through server routes with the service_role key (admin-guarded reads,
-- throttled internal writes for visits/errors).
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null default 'info'
    check (type in ('visit', 'error', 'prayer', 'birthday', 'appointment', 'info')),
  title text not null default '',
  body text not null default '',
  url text not null default '/admin',
  read boolean default false,
  created_at timestamptz default now()
);

create table if not exists push_subscriptions (
  endpoint text primary key,
  p256dh text not null default '',
  auth text not null default '',
  created_at timestamptz default now()
);

alter table notifications enable row level security;
alter table push_subscriptions enable row level security;

create index if not exists idx_notifications_created on notifications (created_at desc);
create index if not exists idx_notifications_type_created on notifications (type, created_at desc);
create index if not exists idx_notifications_unread on notifications (read, created_at desc) where read = false;

-- Backfill the type CHECK onto databases created by an EARLIER version of this
-- file (where the create above had no CHECK and `create table if not exists`
-- at §8 could never add one). Rows with an off-list type are parked on 'info'
-- rather than deleted — the inbox is history, never throw it away.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.notifications'::regclass and conname = 'notifications_type_check'
  ) then
    update notifications set type = 'info'
      where type is not null and type not in ('visit', 'error', 'prayer', 'birthday', 'appointment', 'info');
    alter table notifications
      add constraint notifications_type_check
      check (type in ('visit', 'error', 'prayer', 'birthday', 'appointment', 'info'));
  end if;
end $$;
