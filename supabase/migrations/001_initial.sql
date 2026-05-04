create table if not exists user_preferences (
  user_id uuid primary key references auth.users on delete cascade,
  language text not null default 'it',
  search_radius_km int not null default 25,
  angular_margin_deg float not null default 0.5,
  notification_lead_min int not null default 3,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  subscription jsonb not null,
  device_label text,
  created_at timestamptz not null default now()
);

alter table user_preferences enable row level security;
alter table push_subscriptions enable row level security;

create policy "Users manage own preferences"
  on user_preferences for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage own subscriptions"
  on push_subscriptions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
