-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New query)

-- Users table
create table if not exists users (
  id uuid default gen_random_uuid() primary key,
  github_id integer unique not null,
  username text unique not null,
  display_name text,
  avatar_url text,
  email text,
  bio text,
  access_token text,
  total_commits integer default 0,
  tower_tier integer default 0,
  sync_status text default 'IDLE',
  last_synced_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Commit stats table
create table if not exists commit_stats (
  id uuid default gen_random_uuid() primary key,
  user_id uuid unique not null references users(id) on delete cascade,
  total_commits integer default 0,
  total_repos integer default 0,
  total_additions integer default 0,
  total_deletions integer default 0,
  longest_streak integer default 0,
  current_streak integer default 0,
  first_commit_date timestamptz,
  yearly_commits jsonb,
  language_stats jsonb,
  updated_at timestamptz default now()
);

-- User locations table
create table if not exists user_locations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid unique not null references users(id) on delete cascade,
  latitude double precision not null,
  longitude double precision not null,
  geohash text,
  is_sharing boolean default false,
  updated_at timestamptz default now()
);

-- User achievements table
create table if not exists user_achievements (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references users(id) on delete cascade,
  achievement_type text not null,
  tier integer default 1,
  earned_at timestamptz,
  created_at timestamptz default now(),
  unique(user_id, achievement_type)
);

-- Indexes
create index if not exists idx_users_username on users(username);
create index if not exists idx_user_locations_coords on user_locations(latitude, longitude);
create index if not exists idx_user_locations_geohash on user_locations(geohash);
create index if not exists idx_user_achievements_user on user_achievements(user_id);

-- Disable RLS for server-side access (we use service_role key)
alter table users enable row level security;
alter table commit_stats enable row level security;
alter table user_locations enable row level security;
alter table user_achievements enable row level security;

-- Allow full access for service role
create policy "Service role full access" on users for all using (true) with check (true);
create policy "Service role full access" on commit_stats for all using (true) with check (true);
create policy "Service role full access" on user_locations for all using (true) with check (true);
create policy "Service role full access" on user_achievements for all using (true) with check (true);
