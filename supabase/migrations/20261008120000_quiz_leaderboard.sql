-- The quiz, finally switched on. Purely additive: quiz_scores and its two
-- policies have existed unused since the first migration, and nothing here
-- touches another table, policy or function.
--
-- Scores are public to signed-in attendees by design (it is a scoreboard), but
-- names come from this function rather than a join on the client, so the same
-- block rules that hide people everywhere else hide them here too. Ranks are
-- worked out over everybody first, so hiding someone you blocked leaves their
-- rank as a gap instead of quietly promoting you.

create type public.quiz_entry as (
  rank int,
  user_id uuid,
  full_name text,
  avatar_url text,
  correct int,
  time_ms int,
  is_me boolean
);

create or replace function public.quiz_leaderboard(p_limit int default 50)
returns setof public.quiz_entry
language sql
stable
security definer
set search_path = public
as $$
  with ranked as (
    select q.user_id,
           p.full_name,
           p.avatar_url,
           q.correct,
           q.time_ms,
           rank() over (order by q.correct desc, q.time_ms asc)::int as rank
    from public.quiz_scores q
    join public.profiles p on p.id = q.user_id and p.has_invite
  )
  select r.rank,
         r.user_id,
         r.full_name,
         r.avatar_url,
         r.correct,
         r.time_ms,
         r.user_id = auth.uid()
  from ranked r
  where not public.is_blocked_pair(auth.uid(), r.user_id)
  order by r.rank, r.full_name
  limit greatest(1, least(coalesce(p_limit, 50), 200));
$$;

-- Your own row, whether or not you made the visible part of the board.
create or replace function public.my_quiz_score()
returns setof public.quiz_entry
language sql
stable
security definer
set search_path = public
as $$
  with ranked as (
    select q.user_id,
           p.full_name,
           p.avatar_url,
           q.correct,
           q.time_ms,
           rank() over (order by q.correct desc, q.time_ms asc)::int as rank
    from public.quiz_scores q
    join public.profiles p on p.id = q.user_id and p.has_invite
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
  select count(*)::int
  from public.quiz_scores q
  join public.profiles p on p.id = q.user_id and p.has_invite;
$$;

-- New functions pick up the default PUBLIC execute grant, which the hardening
-- migration closed for everything else. Close it here too.
revoke execute on function public.quiz_leaderboard(int) from public, anon;
revoke execute on function public.my_quiz_score() from public, anon;
revoke execute on function public.quiz_player_count() from public, anon;

grant execute on function public.quiz_leaderboard(int) to authenticated;
grant execute on function public.my_quiz_score() to authenticated;
grant execute on function public.quiz_player_count() to authenticated;
