create or replace function public.can_read_match(m uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.matches
    where id = m and auth.uid() in (user_a, user_b)
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
    select 1 from public.matches
    where id = m and active and auth.uid() in (user_a, user_b)
  );
$$;

alter table public.profiles     enable row level security;
alter table public.interests    enable row level security;
alter table public.matches      enable row level security;
alter table public.messages     enable row level security;
alter table public.dismissals   enable row level security;
alter table public.blocks       enable row level security;
alter table public.reports      enable row level security;
alter table public.quiz_scores  enable row level security;

-- -------------------------------------------------------------- profiles

create policy profiles_select on public.profiles
  for select to authenticated
  using (
    id = auth.uid()
    or (has_invite and not public.is_blocked_pair(auth.uid(), id))
  );

create policy profiles_insert_own on public.profiles
  for insert to authenticated
  with check (id = auth.uid());

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy profiles_delete_own on public.profiles
  for delete to authenticated
  using (id = auth.uid());

-- ------------------------------------------------------------- interests

create policy interests_select_mine on public.interests
  for select to authenticated
  using (from_user = auth.uid() or to_user = auth.uid());

create policy interests_insert_own on public.interests
  for insert to authenticated
  with check (
    from_user = auth.uid()
    and to_user <> auth.uid()
    and not public.is_blocked_pair(auth.uid(), to_user)
    and exists (select 1 from public.profiles p where p.id = to_user and p.has_invite)
  );

create policy interests_delete_own on public.interests
  for delete to authenticated
  using (from_user = auth.uid());

-- --------------------------------------------------------------- matches
-- read only for the two people in it; rows are written by triggers only

create policy matches_select_mine on public.matches
  for select to authenticated
  using (auth.uid() in (user_a, user_b));

-- -------------------------------------------------------------- messages

create policy messages_select_member on public.messages
  for select to authenticated
  using (public.can_read_match(match_id));

create policy messages_insert_member on public.messages
  for insert to authenticated
  with check (sender = auth.uid() and public.can_write_match(match_id));

create policy messages_update_read_receipt on public.messages
  for update to authenticated
  using (public.can_read_match(match_id) and sender <> auth.uid())
  with check (public.can_read_match(match_id) and sender <> auth.uid());

-- ------------------------------------------------------------ dismissals

create policy dismissals_all_own on public.dismissals
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------- blocks

create policy blocks_all_own on public.blocks
  for all to authenticated
  using (blocker = auth.uid())
  with check (blocker = auth.uid() and blocked <> auth.uid());

-- --------------------------------------------------------------- reports
-- insert only; reviewed manually by the team via the dashboard

create policy reports_insert_own on public.reports
  for insert to authenticated
  with check (reporter = auth.uid() and reported <> auth.uid());

-- ----------------------------------------------------------- quiz_scores

create policy quiz_scores_select_all on public.quiz_scores
  for select to authenticated
  using (true);

create policy quiz_scores_insert_own on public.quiz_scores
  for insert to authenticated
  with check (user_id = auth.uid());

grant execute on function public.is_blocked_pair(uuid, uuid) to authenticated;
grant execute on function public.can_read_match(uuid) to authenticated;
grant execute on function public.can_write_match(uuid) to authenticated;
