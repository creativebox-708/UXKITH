-- ---------------------------------------------------------------- helpers

create or replace function public.is_blocked_pair(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select a is not null and b is not null and exists (
    select 1 from public.blocks
    where (blocker = a and blocked = b)
       or (blocker = b and blocked = a)
  );
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- -------------------------------------------------------- new auth user

-- Creates a profiles row from the LinkedIn OIDC claims. Email is deliberately
-- left in auth.users and never copied into profiles. Headline / company / city
-- are not in the OIDC claims, so the user confirms them on /welcome.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  claims jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  name_claim text;
begin
  name_claim := nullif(trim(coalesce(
    claims->>'name',
    concat_ws(' ', claims->>'given_name', claims->>'family_name'),
    claims->>'preferred_username'
  )), '');

  insert into public.profiles (id, linkedin_sub, full_name, avatar_url)
  values (
    new.id,
    nullif(claims->>'sub', ''),
    coalesce(name_claim, 'Config attendee'),
    nullif(coalesce(claims->>'picture', claims->>'avatar_url'), '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- --------------------------------------------------------------- matches

create or replace function public.on_interest_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1 from public.interests
    where from_user = new.to_user and to_user = new.from_user
  ) then
    insert into public.matches (user_a, user_b)
    values (least(new.from_user, new.to_user), greatest(new.from_user, new.to_user))
    on conflict (user_a, user_b) do update set active = true;
  end if;
  return new;
end;
$$;

create trigger interests_after_insert
  after insert on public.interests
  for each row execute function public.on_interest_insert();

create or replace function public.on_interest_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- untag makes the chat read-only; messages are kept
  update public.matches
     set active = false
   where user_a = least(old.from_user, old.to_user)
     and user_b = greatest(old.from_user, old.to_user);
  return old;
end;
$$;

create trigger interests_after_delete
  after delete on public.interests
  for each row execute function public.on_interest_delete();

-- ---------------------------------------------------------------- blocks

create or replace function public.on_block_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.interests
   where (from_user = new.blocker and to_user = new.blocked)
      or (from_user = new.blocked and to_user = new.blocker);

  update public.matches
     set active = false
   where user_a = least(new.blocker, new.blocked)
     and user_b = greatest(new.blocker, new.blocked);

  return new;
end;
$$;

create trigger blocks_after_insert
  after insert on public.blocks
  for each row execute function public.on_block_insert();
