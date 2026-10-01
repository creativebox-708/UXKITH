create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

-- profiles: one per auth user
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  linkedin_sub text unique,
  full_name text not null,
  avatar_url text,
  headline text,
  company text,
  city text,
  linkedin_url text,
  hoping_to_get text check (char_length(hoping_to_get) <= 120),
  has_invite boolean not null default false,
  -- set when the user has answered the invite gate (either way), so /welcome is shown once
  onboarded_at timestamptz,
  agreed_terms_at timestamptz,
  is_here boolean not null default false,
  here_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_has_invite_idx on public.profiles (has_invite) where has_invite;
create index profiles_full_name_trgm_idx on public.profiles using gin (full_name gin_trgm_ops);
create index profiles_city_idx on public.profiles (city);
create index profiles_company_idx on public.profiles (company);

-- interests: "I am interested to meet you"
create table public.interests (
  from_user uuid not null references public.profiles(id) on delete cascade,
  to_user   uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (from_user, to_user),
  check (from_user <> to_user)
);
create index interests_to_user_idx on public.interests (to_user);

-- matches: materialised mutual interest; user_a < user_b
create table public.matches (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references public.profiles(id) on delete cascade,
  user_b uuid not null references public.profiles(id) on delete cascade,
  active boolean not null default true,
  matched_at timestamptz not null default now(),
  unique (user_a, user_b),
  check (user_a < user_b)
);
create index matches_user_a_idx on public.matches (user_a);
create index matches_user_b_idx on public.matches (user_b);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  sender uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index messages_match_idx on public.messages (match_id, created_at);

create table public.dismissals (
  user_id uuid not null references public.profiles(id) on delete cascade,
  dismissed_user uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, dismissed_user)
);

create table public.blocks (
  blocker uuid not null references public.profiles(id) on delete cascade,
  blocked uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker, blocked),
  check (blocker <> blocked)
);
create index blocks_blocked_idx on public.blocks (blocked);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter uuid not null references public.profiles(id) on delete cascade,
  reported uuid not null references public.profiles(id) on delete cascade,
  match_id uuid references public.matches(id) on delete set null,
  reason text,
  created_at timestamptz not null default now()
);

create table public.quiz_scores (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  correct int not null,
  time_ms int not null,
  created_at timestamptz not null default now()
);
