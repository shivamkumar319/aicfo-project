-- =============================================
-- AI CFO — Supabase Database Schema
-- Paste this entire file into Supabase SQL Editor
-- and click "Run"
-- =============================================

-- 1. PROFILES TABLE (one row per user)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  biz_name text not null,
  lang text default 'hh',
  updated_at timestamptz default now()
);

-- 2. RECEIVABLES TABLE
create table receivables (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  amount numeric not null,
  date date not null,
  rel text default 'regular',
  pay_hist text default 'ontime',
  freq text default 'repeat',
  avg_days numeric,
  on_time_pct numeric,
  paid_inv integer,
  last_pay date,
  created_at timestamptz default now()
);

-- 3. PAYABLES TABLE
create table payables (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  amount numeric not null,
  date date not null,
  cat text default 'Other',
  rel text default 'longterm',
  created_at timestamptz default now()
);

-- 4. ROW LEVEL SECURITY (users only see their own data)
alter table profiles enable row level security;
alter table receivables enable row level security;
alter table payables enable row level security;

create policy "Users can manage their own profile"
  on profiles for all using (auth.uid() = id);

create policy "Users can manage their own receivables"
  on receivables for all using (auth.uid() = user_id);

create policy "Users can manage their own payables"
  on payables for all using (auth.uid() = user_id);
