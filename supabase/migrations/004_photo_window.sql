-- Migration 004: photo window — filter transits by celestial elevation
-- Run this in Supabase SQL Editor

alter table user_preferences
  add column if not exists min_moon_elevation_deg integer not null default 10,
  add column if not exists max_sun_elevation_deg integer not null default 20;
