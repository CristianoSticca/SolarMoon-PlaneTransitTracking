-- Migration 002: background push notifications support
-- Run this in Supabase SQL Editor

alter table user_preferences
  add column if not exists last_lat float,
  add column if not exists last_lon float,
  add column if not exists last_seen_at timestamptz,
  add column if not exists background_push_enabled boolean not null default false;

-- Allow service role to read all preferences for cron job
create policy "Service role reads all preferences for cron"
  on user_preferences for select
  using (true);
