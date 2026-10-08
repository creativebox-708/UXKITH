-- The invite question stops being a gate and becomes a badge.
--
-- Until now has_invite decided whether you existed to anyone else: answer Yes
-- and you were listed, answer No (or walk away mid-form) and nobody could find
-- you. That left people who had signed in, agreed to the terms and then
-- abandoned /welcome invisible to everybody, which is how the app came to show
-- fewer designers than had actually joined.
--
-- Now anyone who has signed in is listed, and has_invite only drives a badge
-- that says "invite confirmed". Checked before writing this: nobody had
-- answered No, so no one had been told they were hidden and then exposed.
--
-- Block rules are untouched. Everything hidden by is_blocked_pair stays hidden.

alter type public.profile_card add attribute invite_confirmed boolean;

-- The one function that builds a card. Everything else selects ids and
-- delegates here, so the filter and the new column only change in one place.
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
    m.active,
    p.has_invite
  from unnest(coalesce(p_ids, '{}'::uuid[])) with ordinality as t(pid, ord)
  join public.profiles p on p.id = t.pid
  left join public.matches m
    on m.user_a = least(auth.uid(), p.id)
   and m.user_b = greatest(auth.uid(), p.id)
  where not public.is_blocked_pair(auth.uid(), p.id)
  order by t.ord;
$$;

create or replace function public.attendee_count()
returns int
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int from public.profiles;
$$;

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
    where p.id <> auth.uid()
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

-- Confirmed invitees sort above unconfirmed ones, so the list stays useful
-- without anybody being hidden.
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
        row_number() over (
          order by p.is_here desc, p.has_invite desc, p.full_name asc, p.id
        ) as ord
      from public.profiles p
      where p.id <> auth.uid()
        and not public.is_blocked_pair(auth.uid(), p.id)
        and (nullif(p_search, '')  is null or p.full_name ilike '%' || p_search || '%')
        and (nullif(p_role, '')    is null or p.headline  ilike '%' || p_role || '%')
        and (nullif(p_city, '')    is null or p.city    = p_city)
        and (nullif(p_company, '') is null or p.company = p_company)
      order by p.is_here desc, p.has_invite desc, p.full_name asc, p.id
      limit  least(greatest(coalesce(p_limit, 24), 1), 48)
      offset greatest(coalesce(p_offset, 0), 0)
    ) q
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
        where nullif(trim(city), '') is not null
        group by city order by count(*) desc, city asc limit 40
      ) x
    ), '[]'::jsonb),
    'companies', coalesce((
      select jsonb_agg(company) from (
        select company from public.profiles
        where nullif(trim(company), '') is not null
        group by company order by count(*) desc, company asc limit 60
      ) y
    ), '[]'::jsonb)
  );
$$;

create or replace function public.inbound_count()
returns int
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int
  from public.interests i
  join public.profiles p on p.id = i.from_user
  where i.to_user = auth.uid()
    and not public.is_blocked_pair(auth.uid(), i.from_user)
    and not exists (
      select 1 from public.dismissals d
      where d.user_id = auth.uid() and d.dismissed_user = i.from_user
    )
    and not exists (
      select 1 from public.interests mine
      where mine.from_user = auth.uid() and mine.to_user = i.from_user
    );
$$;

create or replace function public.outgoing_pending_count()
returns int
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int
  from public.interests i
  join public.profiles p on p.id = i.to_user
  where i.from_user = auth.uid()
    and not public.is_blocked_pair(auth.uid(), i.to_user)
    and not exists (
      select 1 from public.interests theirs
      where theirs.from_user = i.to_user and theirs.to_user = auth.uid()
    );
$$;

create or replace function public.notifications(p_limit int default 20)
returns setof public.notification_item
language sql
stable
security definer
set search_path = public
as $$
  with seen as (
    select coalesce(notifications_seen_at, '-infinity'::timestamptz) as ts
    from public.profiles where id = auth.uid()
  ),
  events as (
    select
      'requested'::text as kind,
      p.id              as actor_id,
      p.full_name       as actor_name,
      p.avatar_url      as actor_avatar,
      p.headline        as actor_headline,
      null::uuid        as match_id,
      i.created_at      as happened_at
    from public.interests i
    join public.profiles p on p.id = i.from_user
    where i.to_user = auth.uid()
      and not public.is_blocked_pair(auth.uid(), i.from_user)
      and not exists (
        select 1 from public.dismissals d
        where d.user_id = auth.uid() and d.dismissed_user = i.from_user
      )
      and not exists (
        select 1 from public.matches m
        where m.active
          and m.user_a = least(auth.uid(), i.from_user)
          and m.user_b = greatest(auth.uid(), i.from_user)
      )

    union all

    select
      case when mine.created_at <= theirs.created_at then 'accepted' else 'connected' end,
      p.id,
      p.full_name,
      p.avatar_url,
      p.headline,
      m.id,
      greatest(mine.created_at, theirs.created_at)
    from public.matches m
    join public.profiles p
      on p.id = case when m.user_a = auth.uid() then m.user_b else m.user_a end
    join public.interests mine
      on mine.from_user = auth.uid() and mine.to_user = p.id
    join public.interests theirs
      on theirs.from_user = p.id and theirs.to_user = auth.uid()
    where m.active
      and auth.uid() in (m.user_a, m.user_b)
      and not public.is_blocked_pair(auth.uid(), p.id)
  )
  select
    e.kind, e.actor_id, e.actor_name, e.actor_avatar, e.actor_headline,
    e.match_id, e.happened_at, e.happened_at > seen.ts
  from events e cross join seen
  order by e.happened_at desc
  limit least(greatest(coalesce(p_limit, 20), 1), 50);
$$;

create or replace function public.quiz_leaderboard(p_limit int default 50)
returns setof public.quiz_entry
language sql
stable
security definer
set search_path = public
as $$
  with ranked as (
    select q.user_id, p.full_name, p.avatar_url, q.correct, q.time_ms,
           rank() over (order by q.correct desc, q.time_ms asc)::int as rank
    from public.quiz_scores q
    join public.profiles p on p.id = q.user_id
  )
  select r.rank, r.user_id, r.full_name, r.avatar_url, r.correct, r.time_ms,
         r.user_id = auth.uid()
  from ranked r
  where not public.is_blocked_pair(auth.uid(), r.user_id)
  order by r.rank, r.full_name
  limit greatest(1, least(coalesce(p_limit, 50), 200));
$$;

create or replace function public.my_quiz_score()
returns setof public.quiz_entry
language sql
stable
security definer
set search_path = public
as $$
  with ranked as (
    select q.user_id, p.full_name, p.avatar_url, q.correct, q.time_ms,
           rank() over (order by q.correct desc, q.time_ms asc)::int as rank
    from public.quiz_scores q
    join public.profiles p on p.id = q.user_id
  )
  select r.rank, r.user_id, r.full_name, r.avatar_url, r.correct, r.time_ms, true
  from ranked r
  where r.user_id = auth.uid();
$$;

create or replace function public.quiz_player_count()
returns int
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int from public.quiz_scores;
$$;

-- Every signed-in profile is now visible to every other, blocks aside.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (
    id = auth.uid()
    or not public.is_blocked_pair(auth.uid(), id)
  );

-- You may invite anyone with a profile, confirmed or not.
drop policy if exists interests_insert_own on public.interests;
create policy interests_insert_own on public.interests
  for insert to authenticated
  with check (
    from_user = auth.uid()
    and to_user <> auth.uid()
    and not public.is_blocked_pair(auth.uid(), to_user)
    and exists (select 1 from public.profiles p where p.id = to_user)
  );
