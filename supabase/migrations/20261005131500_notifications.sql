alter table public.profiles
  add column if not exists notifications_seen_at timestamptz;

create type public.notification_item as (
  kind text,
  actor_id uuid,
  actor_name text,
  actor_avatar text,
  actor_headline text,
  match_id uuid,
  happened_at timestamptz,
  is_new boolean
);

-- Two kinds of event, both derived from rows we already keep:
--   requested — somebody tagged you and you have not dismissed them
--   accepted  — you tagged first and they tapped it back, so the chat opened
-- A match where they tagged first is not an "accepted" for you: you did the
-- accepting, and you already know.
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
    join public.profiles p on p.id = i.from_user and p.has_invite
    where i.to_user = auth.uid()
      and not public.is_blocked_pair(auth.uid(), i.from_user)
      and not exists (
        select 1 from public.dismissals d
        where d.user_id = auth.uid() and d.dismissed_user = i.from_user
      )

    union all

    select
      'accepted'::text,
      p.id,
      p.full_name,
      p.avatar_url,
      p.headline,
      m.id,
      greatest(mine.created_at, theirs.created_at)
    from public.matches m
    join public.profiles p
      on p.id = case when m.user_a = auth.uid() then m.user_b else m.user_a end
     and p.has_invite
    join public.interests mine
      on mine.from_user = auth.uid() and mine.to_user = p.id
    join public.interests theirs
      on theirs.from_user = p.id and theirs.to_user = auth.uid()
    where m.active
      and auth.uid() in (m.user_a, m.user_b)
      and not public.is_blocked_pair(auth.uid(), p.id)
      and mine.created_at < theirs.created_at
  )
  select
    e.kind, e.actor_id, e.actor_name, e.actor_avatar, e.actor_headline,
    e.match_id, e.happened_at, e.happened_at > seen.ts
  from events e cross join seen
  order by e.happened_at desc
  limit least(greatest(coalesce(p_limit, 20), 1), 50);
$$;

create or replace function public.mark_notifications_seen()
returns void
language sql
volatile
security definer
set search_path = public
as $$
  update public.profiles set notifications_seen_at = now() where id = auth.uid();
$$;

revoke execute on function public.notifications(int) from public, anon;
revoke execute on function public.mark_notifications_seen() from public, anon;
grant execute on function public.notifications(int)          to authenticated;
grant execute on function public.mark_notifications_seen()   to authenticated;
