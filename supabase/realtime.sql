-- ═══════════════════════════════════════════════════════════════════
-- BUDI Portfolio — realtime.sql (FILE 2 of 2 — RUN AFTER schema.sql)
-- Supabase → SQL Editor → New query → paste ALL → Run
-- Safe to re-run: duplicate adds are swallowed, functions are OR REPLACE.
--
-- What this file does:
--  1) realtime publication: dashboard writes push to the site live
--  2) re-ensures decrement_like exists (also in schema.sql — harmless)
-- ═══════════════════════════════════════════════════════════════════

-- ── 1) realtime needs full row data ──────────────────────────────────
alter table services replica identity full;
alter table skills replica identity full;
alter table projects replica identity full;
alter table certs replica identity full;
alter table settings replica identity full;

-- ── 2) add tables to realtime (skips ones already added) ─────────────
do $$ begin
  alter publication supabase_realtime add table services;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table skills;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table projects;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table certs;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table settings;
exception when duplicate_object then null;
end $$;

-- ── 3) unlike RPC (floor at zero, never negative) ────────────────────
create or replace function decrement_like(p_id text)
returns int language plpgsql security definer set search_path = public
as $$ declare v int;
begin
  if char_length(p_id) < 1 or char_length(p_id) > 200 then raise exception 'bad like id'; end if;
  insert into likes (id, count) values (p_id, 0)
    on conflict (id) do update set count = greatest(likes.count - 1, 0)
    returning count into v;
  return v;
end; $$;

grant execute on function decrement_like(text) to anon, authenticated;
