-- Manual project ordering for the dashboard's "Display order" field.
-- Additive and idempotent: existing rows default to 0 and keep their current
-- relative order; lower values render first on the public Projects section.
alter table projects add column if not exists "sortOrder" int default 0;

comment on column projects."sortOrder" is
  'Manual display order (lower first). Managed from /admin → Projects.';
