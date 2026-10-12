-- Run this ONCE, before deploying the new code. Safe to re-run (uses IF NOT EXISTS).

-- 1) Remember the exact puzzle each player is on, so a refresh rebuilds the same grid
alter table player_progress
  add column if not exists level_id    int references levels(id) on delete set null,
  add column if not exists seed        int,
  add column if not exists found_words text[] not null default '{}',
  add column if not exists bonus_words text[] not null default '{}';

-- 2) Mark which words may appear on the grid. Obscure-but-valid words stay accepted as bonus words.
--    Existing rows default to true, so your first levels behave exactly as before.
alter table level_words
  add column if not exists on_grid boolean not null default true;
