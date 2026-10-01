-- A block hides the two people from each other everywhere, chat included.
create or replace function public.can_read_match(m uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.matches mt
    where mt.id = m
      and auth.uid() in (mt.user_a, mt.user_b)
      and not public.is_blocked_pair(mt.user_a, mt.user_b)
  );
$$;

create or replace function public.can_write_match(m uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.matches mt
    where mt.id = m
      and mt.active
      and auth.uid() in (mt.user_a, mt.user_b)
      and not public.is_blocked_pair(mt.user_a, mt.user_b)
  );
$$;

-- The one shape every profile card is rendered from.
create type public.profile_card as (
  id uuid,
  full_name text,
  avatar_url text,
  headline text,
  company text,
  city text,
  linkedin_url text,
  hoping_to_get text,
  is_here boolean,
  interest_count int,
  i_am_interested boolean,
  they_are_interested boolean,
  match_id uuid,
  match_active boolean
);

-- Builds cards for the given ids, in the given order, from the caller's point of
-- view. Security definer so the public inbound counter does not need a raw select
-- on interests; the visibility rules of the profiles policy are repeated here.
create or replace function public.cards_for(p_ids uuid[])
returns setof public.profile_card
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.full_name,
    p.avatar_url,
    p.headline,
    p.company,
    p.city,
    p.linkedin_url,
    p.hoping_to_get,
    p.is_here,
    (select count(*)::int from public.interests i where i.to_user = p.id),
    exists (select 1 from public.interests i where i.from_user = auth.uid() and i.to_user = p.id),
    exists (select 1 from public.interests i where i.from_user = p.id and i.to_user = auth.uid()),
    m.id,
    m.active
  from unnest(coalesce(p_ids, '{}'::uuid[])) with ordinality as t(pid, ord)
  join public.profiles p on p.id = t.pid
  left join public.matches m
    on m.user_a = least(auth.uid(), p.id)
   and m.user_b = greatest(auth.uid(), p.id)
  where p.has_invite
    and not public.is_blocked_pair(auth.uid(), p.id)
  order by t.ord;
$$;

create or replace function public.attendee_count()
returns int
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int from public.profiles where has_invite;
$$;

create or replace function public.interest_counts(user_ids uuid[])
returns table (user_id uuid, interest_count int)
language sql
stable
security definer
set search_path = public
as $$
  select u.id, (select count(*)::int from public.interests i where i.to_user = u.id)
  from unnest(coalesce(user_ids, '{}'::uuid[])) as u(id);
$$;

-- Daily-seeded shuffle, lightly biased toward people with fewer inbound
-- interests. Excludes me, blocks both ways, people I already tagged and people
-- I dismissed.
create or replace function public.suggested_profiles(p_limit int default 8)
returns setof public.profile_card
language sql
stable
security definer
set search_path = public
as $$
  with seed as (
    select to_char(current_date, 'YYYYMMDD') || coalesce(auth.uid()::text, '') as s
  ),
  pool as (
    select
      p.id,
      (select count(*) from public.interests i where i.to_user = p.id) as inbound
    from public.profiles p
    where p.has_invite
      and p.id <> auth.uid()
      and not public.is_blocked_pair(auth.uid(), p.id)
      and not exists (
        select 1 from public.interests i
        where i.from_user = auth.uid() and i.to_user = p.id
      )
      and not exists (
        select 1 from public.dismissals d
        where d.user_id = auth.uid() and d.dismissed_user = p.id
      )
  ),
  ranked as (
    select
      pool.id,
      least(pool.inbound, 25) * 30
        + abs(mod(('x' || substr(md5(pool.id::text || seed.s), 1, 8))::bit(32)::int, 1000)) as score
    from pool cross join seed
  )
  select c.* from public.cards_for((
    select coalesce(array_agg(id order by score), '{}'::uuid[])
    from (
      select id, score from ranked
      order by score
      limit least(greatest(coalesce(p_limit, 8), 1), 24)
    ) q
  )) c;
$$;

create or replace function public.browse_profiles(
  p_search  text default null,
  p_role    text default null,
  p_city    text default null,
  p_company text default null,
  p_limit   int  default 24,
  p_offset  int  default 0
)
returns setof public.profile_card
language sql
stable
security definer
set search_path = public
as $$
  select c.* from public.cards_for((
    select coalesce(array_agg(id order by ord), '{}'::uuid[])
    from (
      select
        p.id,
        row_number() over (order by p.is_here desc, p.full_name asc, p.id) as ord
      from public.profiles p
      where p.has_invite
        and p.id <> auth.uid()
        and not public.is_blocked_pair(auth.uid(), p.id)
        and (nullif(p_search, '')  is null or p.full_name ilike '%' || p_search || '%')
        and (nullif(p_role, '')    is null or p.headline  ilike '%' || p_role || '%')
        and (nullif(p_city, '')    is null or p.city    = p_city)
        and (nullif(p_company, '') is null or p.company = p_company)
      order by p.is_here desc, p.full_name asc, p.id
      limit  least(greatest(coalesce(p_limit, 24), 1), 48)
      offset greatest(coalesce(p_offset, 0), 0)
    ) q
  )) c;
$$;

-- Tab 1 of the my-list modal
create or replace function public.my_outgoing()
returns setof public.profile_card
language sql
stable
security definer
set search_path = public
as $$
  select c.* from public.cards_for((
    select coalesce(array_agg(to_user order by created_at desc), '{}'::uuid[])
    from public.interests where from_user = auth.uid()
  )) c;
$$;

-- Tab 2 of the my-list modal, dismissed people filtered out
create or replace function public.my_inbound()
returns setof public.profile_card
language sql
stable
security definer
set search_path = public
as $$
  select c.* from public.cards_for((
    select coalesce(array_agg(i.from_user order by i.created_at desc), '{}'::uuid[])
    from public.interests i
    where i.to_user = auth.uid()
      and not exists (
        select 1 from public.dismissals d
        where d.user_id = auth.uid() and d.dismissed_user = i.from_user
      )
  )) c;
$$;

-- Drives the "N people want to meet you" banner
create or replace function public.inbound_count()
returns int
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int
  from public.interests i
  join public.profiles p on p.id = i.from_user and p.has_invite
  where i.to_user = auth.uid()
    and not public.is_blocked_pair(auth.uid(), i.from_user)
    and not exists (
      select 1 from public.dismissals d
      where d.user_id = auth.uid() and d.dismissed_user = i.from_user
    );
$$;

create or replace function public.match_partner(p_match_id uuid)
returns setof public.profile_card
language sql
stable
security definer
set search_path = public
as $$
  select c.* from public.cards_for((
    select array[case when m.user_a = auth.uid() then m.user_b else m.user_a end]
    from public.matches m
    where m.id = p_match_id and auth.uid() in (m.user_a, m.user_b)
  )) c;
$$;

create or replace function public.filter_options()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'cities', coalesce((
      select jsonb_agg(city) from (
        select city from public.profiles
        where has_invite and nullif(trim(city), '') is not null
        group by city order by count(*) desc, city asc limit 40
      ) x
    ), '[]'::jsonb),
    'companies', coalesce((
      select jsonb_agg(company) from (
        select company from public.profiles
        where has_invite and nullif(trim(company), '') is not null
        group by company order by count(*) desc, company asc limit 60
      ) y
    ), '[]'::jsonb)
  );
$$;

-- Deletes the auth user; profiles and every related row cascade from there.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke execute on function public.cards_for(uuid[]) from public;
revoke execute on function public.delete_my_account() from public;

grant execute on function public.cards_for(uuid[])          to authenticated;
grant execute on function public.attendee_count()           to authenticated;
grant execute on function public.interest_counts(uuid[])     to authenticated;
grant execute on function public.suggested_profiles(int)     to authenticated;
grant execute on function public.browse_profiles(text, text, text, text, int, int) to authenticated;
grant execute on function public.my_outgoing()              to authenticated;
grant execute on function public.my_inbound()               to authenticated;
grant execute on function public.inbound_count()            to authenticated;
grant execute on function public.match_partner(uuid)         to authenticated;
grant execute on function public.filter_options()           to authenticated;
grant execute on function public.delete_my_account()        to authenticated;
