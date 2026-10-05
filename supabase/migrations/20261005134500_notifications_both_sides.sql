-- Both people in a connection now get the event, worded by their role:
--   accepted  — they accepted the invite you sent
--   connected — you accepted the invite they sent
-- Declines and withdrawals stay silent on purpose: a decline is a private
-- dismissals row, and the terms promise an undo is never announced.
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
      -- once it is a live connection the "accepted" row says it better
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
     and p.has_invite
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
