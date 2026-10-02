-- Run in Supabase Dashboard -> SQL Editor
create table if not exists public.profiles (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  name       text not null,
  education  text not null,
  city       text not null,
  interests  text not null,
  updated_at timestamptz not null default now()
);

-- RLS on, no policies: the browser can't touch this table directly.
-- Only the FastAPI backend (service_role key) reads/writes it.
alter table public.profiles enable row level security;
