-- ============================================
-- Doorstep database schema
-- Run this in the Supabase SQL editor (once) for
-- a brand-new Supabase project dedicated to Doorstep.
-- Do NOT run this against the nursing-home project's DB.
-- ============================================

-- Profiles: one row per signed-up realtor, extends auth.users
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  business_name text,
  brand_footer text,           -- small text shown on the postcard, e.g. "Autumn Realty"
  created_at timestamptz default now()
);

-- Subscriptions: tracks each user's Stripe plan/status
create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text check (plan in ('monthly', 'annual')),
  status text default 'inactive',   -- inactive | active | past_due | canceled
  current_period_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Postcards: every postcard a realtor creates
create table if not exists postcards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  template text check (template in ('listed', 'sold', 'openhouse', 'networking', 'keepsake')) not null,
  photo_url text,
  message text,
  signed_by text,
  recipient_name text,
  street text,
  apt text,
  city text,
  state text,
  zip text,
  fulfillment_status text default 'draft',  -- draft | queued | mailed | failed
  postgrid_id text,
  created_at timestamptz default now()
);

-- Row Level Security: every user only ever sees their own data
alter table profiles enable row level security;
alter table subscriptions enable row level security;
alter table postcards enable row level security;

create policy "Users manage their own profile"
  on profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users manage their own subscription"
  on subscriptions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage their own postcards"
  on postcards for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Auto-create a profile row whenever someone signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Storage bucket for postcard photos (run separately in Storage tab,
-- or via the Supabase CLI — see README for exact steps).
-- Bucket name: postcard-photos (private)
